import express from 'express';
import cors from 'cors';
import pg from "pg";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";
dotenv.config();

const app = express();
const PORT = 3001;
const { Pool } = pg;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}
app.get('/', (req, res) => {
  res.send('Server is working');
});
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash]
    );
    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token: token,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT id, name, email, password FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
});
app.post('/api/bingo-square', authenticateToken, async (req, res) => {
  const { boardID, index, content } = req.body;

  if (boardID === undefined || index === undefined) {
    return res.status(400).json({ success: false, message: 'boardID and index are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE squares SET goal = $1 WHERE board_id = $2 AND index = $3 RETURNING id, goal`,
      [content, boardID, index]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Square not found for that board/index' });
    }

    res.json({ success: true, message: 'Bingo square saved', square: result.rows[0] });
  } catch (error) {
    console.error('Error saving bingo square:', error);
    res.status(500).json({ success: false, message: 'Failed to save bingo square' });
  }
});

app.get('/api/board/:boardID', authenticateToken, async (req, res) => {
  const { boardID } = req.params;

  try {
    const boardResult = await pool.query(`SELECT * FROM boards WHERE id = $1`, [boardID]);
    if (boardResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }
    const board = boardResult.rows[0];

    const squaresResult = await pool.query(
      `SELECT id, index, goal FROM squares WHERE board_id = $1 ORDER BY index`,
      [boardID]
    );

    res.json({
      success: true,
      boardID: board.id,
      title: board.title,
      cells: squaresResult.rows.map(sq => ({ squareId: sq.id, index: sq.index, content: sq.goal })),
    });
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch board' });
  }
});

app.post('/api/create-game', authenticateToken, async (req, res) => {
  const { title } = req.body;
  const playerID = req.user.id;
  if (!playerID) {
    return res.status(400).json({ success: false, message: 'playerID is required' });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');


    const boardTitle = title || `${playerID}'s Board`;

    // const boardResult = await client.query(
    //   `INSERT INTO boards (title, host_id, status) VALUES ($1, $2, 'active') RETURNING id`,
    //   [boardTitle, userId]
    // );
    // Keep in mind that for now it does not randomly generate unique ids, and only does a small range 
    // TODO: make the board IDs generate unique ids
    const boardResult = await client.query(
      `INSERT INTO boards (host_id, status) VALUES ($1, 'active') RETURNING id`,
      [playerID]
    );
    const boardId = boardResult.rows[0].id;

    // 25 empty shared squares
    const valuesSql = [];
    const params = [];
    for (let i = 0; i < 25; i++) {
      valuesSql.push(`($${params.length + 1}, $${params.length + 2}, '')`);
      params.push(boardId, i);
    }
    await client.query(
      `INSERT INTO squares (board_id, index, goal) VALUES ${valuesSql.join(', ')}`,
      params
    );

    // Register the creator as a player on this board
    await client.query(
      `INSERT INTO players (user_id, board_id) VALUES ($1, $2)`,
      [playerID, boardId]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      boardID: boardId,
      title: boardTitle, // still returned to the client, just not persisted to the DB yet
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating game:', error);
    res.status(500).json({ success: false, message: 'Failed to create game' });
  } finally {
    client.release();
  }
});

app.post('/api/bingo-square', async (req, res) => {
  const { boardID, index, content } = req.body;

  if (boardID === undefined || index === undefined) {
    return res.status(400).json({ success: false, message: 'boardID and index are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE squares SET goal = $1 WHERE board_id = $2 AND index = $3 RETURNING id, goal`,
      [content, boardID, index]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Square not found for that board/index' });
    }

    res.json({ success: true, message: 'Bingo square saved', square: result.rows[0] });
  } catch (error) {
    console.error('Error saving bingo square:', error);
    res.status(500).json({ success: false, message: 'Failed to save bingo square' });
  }
});

app.get('/api/board/:boardID', async (req, res) => {
  const { boardID } = req.params;

  try {
    const boardResult = await pool.query(`SELECT * FROM boards WHERE id = $1`, [boardID]);
    if (boardResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }
    const board = boardResult.rows[0];

    const squaresResult = await pool.query(
      `SELECT id, index, goal FROM squares WHERE board_id = $1 ORDER BY index`,
      [boardID]
    );

    res.json({
      success: true,
      boardID: board.id,
      title: board.title,
      cells: squaresResult.rows.map(sq => ({ squareId: sq.id, index: sq.index, content: sq.goal })),
    });
  } catch (error) {
    console.error('Error fetching board:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch board' });
  }
});
app.post('/api/squares/toggle-marker', authenticateToken, async (req, res) => {

  try{
  const squareResult = await pool.query(
      "SELECT id, board_id FROM squares WHERE id = $1",
      [squareId]
    );
  if (squareResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Square not found",
    });
  } 
  const square = squareResult.rows[0];
  const boardId = square.board_id;
  
  const existingMarker = await pool.query(
      `SELECT id FROM marker
       WHERE player_id = $1 AND square_id = $2 AND board_id = $3`,
      [playerId, squareId, boardId]
    );

  if (existingMarker.rows.length > 0) {
    await pool.query(
      `DELETE FROM marker WHERE id = $1`,
      [existingMarker.rows[0].id]
    );
    return res.json({
      success: true,
      message: "Marker removed",
    });
  } else {
    await pool.query(
      `INSERT INTO marker (player_id, square_id, board_id) VALUES ($1, $2, $3)`,
      [playerId, squareId, boardId]
    );
    return res.json({
      success: true,
      message: "Marker added",
    });
  }
  } catch (error) { 
    console.error("Toggle marker error:", error);

    res.status(500).json({
      success: false,
      message: "Server error toggling marker",
    });
  }
});
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});