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
    const user = await pool.query(
      "SELECT id, name, email, password FROM users WHERE email = $1",
      [email]
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

app.post('/api/create-game', authenticateToken, async (req, res) => {
  const { title } = req.body;
  const playerID = req.user.id;
  const name = req.user.name;

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
      `INSERT INTO boards (host_id, status) VALUES ($1, 'lobby') RETURNING id`,
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
      `INSERT INTO players (user_id, board_id, ready) VALUES ($1, $2, false)`,
      [playerID, boardId]
    );

    // Assign this board as the user's current board
    await client.query(
      `UPDATE users SET board_id = $1 WHERE id = $2`,
      [boardId, playerID]
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

app.get('/api/board/:boardID', authenticateToken, async (req, res) => {
  const { boardID } = req.params;
  const playerID = req.user.id;

  try {
    const boardResult = await pool.query(
      `SELECT * FROM boards WHERE id = $1`,
      [boardID]
    );

    if (boardResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Board not found',
      });
    }

    const board = boardResult.rows[0];

    const squaresResult = await pool.query(
      `
      SELECT 
        squares.id,
        squares.index,
        squares.goal,
        CASE 
          WHEN marker.id IS NULL THEN false
          ELSE true
        END AS marked
      FROM squares
      LEFT JOIN marker
        ON marker.square_id = squares.id
        AND marker.player_id = $2
        AND marker.board_id = $1
      WHERE squares.board_id = $1
      ORDER BY squares.index ASC
      `,
      [boardID, playerID]
    );

    res.json({
      success: true,
      boardID: board.id,
      title: board.title,
      cells: squaresResult.rows.map((sq) => ({
        squareId: sq.id,
        index: sq.index,
        content: sq.goal,
        marked: sq.marked,
      })),
    });
  } catch (error) {
    console.error('Error fetching board:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch board',
    });
  }
});
app.get('/api/board/:boardID/status', authenticateToken, async (req, res) => {
  const { boardID } = req.params;
  const playerID = req.user.id;
  try {
  const result = await pool.query(
    `SELECT status FROM boards WHERE id = $1`,
    [boardID]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Board not found' });
  }
  res.json({ success: true, status: result.rows[0].status });
  } catch (error) {
    console.error('Error fetching board status:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch board status' });
  }
});
app.put('/api/board/:boardID/bingo', authenticateToken, async (req, res) => {
  const { boardID } = req.params;
  const playerID = req.user.id;

  try {
    const client = await pool.connect();
    const squaresCountResult = await client.query(
      `SELECT COUNT(*) FROM squares WHERE board_id = $1`,
      [boardID]
    );
    const squaresCount = parseInt(squaresCountResult.rows[0].count, 10);
    const markerCountResult = await client.query(
      `SELECT COUNT(*) FROM marker WHERE board_id = $1 AND player_id = $2`,
      [boardID, playerID]
    );
    const markerCount = parseInt(markerCountResult.rows[0].count, 10);
    console.log(`Player ${playerID} has marked ${markerCount} out of ${squaresCount} squares on board ${boardID}`);
    if (markerCount < squaresCount) {
      return res.status(400).json({
        success: false,
        message: 'Player has not marked all squares',
      });
    }
    else {
      const endGameResult = await client.query(
        `UPDATE boards SET status = 'ended', winner_id = $1, ended_at = NOW() WHERE id = $2 RETURNING id, status, winner_id, ended_at`,
        [playerID, boardID]
      );
      const winnerID = endGameResult.rows[0].winner_id;
      return res.json({
        success: true,
        message: 'Game ended with a winner',
        winnerID: winnerID,
      });
    }
    if (endGameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Board not found',
      });
    }

    res.json({
      success: true,
      message: winnerID ? 'Game ended with a winner' : 'Game ended because time ran out',
      board: endGameResult.rows[0],
    });
    await client.query('COMMIT');
  }catch (error) {
    await client.query('ROLLBACK');
    console.error('End game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end game',
    });
  }
  finally {
    client.release();
  }
});
app.put('/api/board/:boardID/assign-squares', authenticateToken, async (req, res) => {
  const { boardID } = req.params;
  try {

  const client = await pool.connect();
    const playersResult = await client.query(
    `SELECT user_id FROM players WHERE board_id = $1`,
    [boardID]
  );
  function shuffleArray(array) {
    return [...array].sort(() => Math.random() - 0.5);
  } 
  const squaresResult = await client.query(
    `SELECT id, index FROM squares WHERE board_id = $1`,
    [boardID]
  );
  const squares = squaresResult.rows;
  const players = playersResult.rows.map(row => row.user_id);
  const shuffledSquares = shuffleArray(squares);

  for (let i = 0; i< shuffledSquares.length; i++) {
    const square = shuffledSquares[i];
    const playerID = players[i % players.length];
    await client.query(
      'UPDATE squares SET player_id = $1 WHERE id = $2',
      [playerID, square.id]
    );
  }
  await client.query('COMMIT');
  res.json({
    success: true,
    message: 'Squares assigned and game started',
  });
}catch(error) {
  await client.query('ROLLBACK');
  console.error('Assign squares error:', error);
  res.status(500).json({
    success: false,
    message: 'Failed to assign squares',
  });
}
finally {
  client.release();
}
});
app.post('/api/board/:boardID/square/:index/toggle-marker', authenticateToken, async (req, res) => {
  const { boardID } = req.params;
  const { index } = req.params; 
  const playerID = req.user.id;
  try{
    const client = await pool.connect();
  const squareResult = await client.query(
      "SELECT id FROM squares WHERE board_id = $1 AND index = $2",
      [boardID, index]
    );

  if (squareResult.rows.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Square not found",
    });
  } 

  const squareID = squareResult.rows[0].id;

  const existingMarker = await client.query(
      `SELECT id FROM marker
       WHERE player_id = $1 AND square_id = $2 AND board_id = $3`,
      [playerID, squareID, boardID]
    ); 

  if (existingMarker.rows.length > 0) {
    await client.query(
      `DELETE FROM marker WHERE id = $1`,
      [existingMarker.rows[0].id]
    );
    return res.json({
      success: true,
      message: "Marker removed",
    });
  } else {
    await client.query(
      `INSERT INTO marker (player_id, square_id, board_id) VALUES ($1, $2, $3)`,
      [playerID, squareID, boardID]
    );
    return res.json({
      success: true,
      message: "Marker added",
      marked: true,
    });
  }
  await client.query('COMMIT');
  
  } catch (error) { 
    await client.query('ROLLBACK');
    console.error("Toggle marker error:", error);

    res.status(500).json({
      success: false,
      message: "Server error toggling marker",
      marked: false,
    });
  }
  finally {
    client.release();
  }
});

app.get('/api/board/:boardID/players', async (req, res) => {
  const { boardID } = req.params;

  try {
    const result = await pool.query(
      `SELECT users.id, name, ready
       FROM players 
       JOIN users
       ON players.user_id = users.id
       WHERE players.board_id = $1`,
      [boardID]
    );

    res.json({
      success: true,
      players: result.rows.map(r => ({ id: r.id, name: r.name, ready: r.ready })),
    });
  } catch (error) {
    console.error('Error fetching players', error);
    res.status(500).json({ success: false, message: 'Failed to fetch players' });
  }
});

app.post('/api/board/:boardID/ready', authenticateToken, async (req, res) => {
    const playerID = req.user.id;
    const {board_id} = req.params;

  console.log('Checking ready for:', { playerID, board_id });
  try {
    const current = await pool.query(
      `SELECT ready FROM players WHERE user_id = $1 AND board_id = $2`,
      [playerID, board_id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Player not found on this board' });
    }

    const newReadyState = !current.rows[0].ready;

    const result = await pool.query(
      `UPDATE players SET ready = $1 WHERE user_id = $2 AND board_id = $3 RETURNING ready`,
      [newReadyState, playerID, board_id]
    );

    res.json({ success: true, message: 'Ready status updated', ready: result.rows[0].ready });
  } catch (error) {
    console.error('Error with ready button', error);
    res.status(500).json({ success: false, message: 'Failed to update ready status' });
  }
});

app.post('/api/board/:boardID/ready', authenticateToken, async (req, res) => {
    const playerID = req.user.id;
    const {boardID} = req.params;
  try {
    const current = await pool.query(
      `SELECT ready FROM players WHERE user_id = $1 AND board_id = $2`,
      [playerID, boardID]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Player not found on this board' });
    }

    const newReadyState = !current.rows[0].ready;

    const result = await pool.query(
      `UPDATE players SET ready = $1 WHERE user_id = $2 AND board_id = $3 RETURNING ready`,
      [newReadyState, playerID, boardID]
    );

    res.json({ success: true, message: 'Ready status updated', ready: result.rows[0].ready });
  } catch (error) {
    console.error('Error with ready button', error);
    res.status(500).json({ success: false, message: 'Failed to update ready status' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});