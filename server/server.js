import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import http from 'http';
import { Server } from 'socket.io';
dotenv.config();

const app = express();
const { Pool } = pg;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://bingoalss.vercel.app',
      process.env.FRONTEND_URL
    ],
    credentials: true
  }
});
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

    socket.on('join-board', (boardID) => {
    socket.join(`board-${boardID}`);
    console.log(`Socket ${socket.id} joined board-${boardID}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://bingoalss.vercel.app',
    process.env.FRONTEND_URL
  ],
  credentials: true
}));

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
};

if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(poolConfig);
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
      
    );
    res.json({
      success: true,
      message: "Registration successful",
      token: token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
      },
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
app.get('/api/boards', authenticateToken, async (req, res) => {
  const playerID = req.user.id;
  try {
    const result = await pool.query(
      `SELECT boards.id FROM boards JOIN players ON boards.id = players.board_id WHERE players.user_id = $1 ORDER BY boards.created_at DESC `,
      [playerID]
    );
    res.json({ success: true, boards: result.rows });
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch boards' });
  }
});
app.post('/api/board/:boardID/square/:index/bingo-square', authenticateToken, async (req, res) => {
  const {content } = req.body;
  const playerID = req.user.id;
  const boardID = req.params.boardID;
  const index = req.params.index;
  let client;
  try {
    client = await pool.connect();
    const squarePlayerResult = await client.query(
      `SELECT player_id FROM squares WHERE index = $1 AND board_id = $2`,
      [index, boardID]
    );
    if (squarePlayerResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Square not assigned to player' });
    }
    const squarePlayerID = squarePlayerResult.rows[0].player_id;
    if (squarePlayerID !== playerID) {
      return res.status(403).json({ success: false, message: 'You are not the assigned player for this square' });
    }
    const result = await client.query(
      `UPDATE squares SET goal = $1 WHERE board_id = $2 AND index = $3 RETURNING id, goal`,
      [content, boardID, index]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Square not found for that board/index' });
    }

    
    res.json({ success: true, message: 'Bingo square saved', square: result.rows[0] });
    client.query('COMMIT');
  } catch (error) {
    client.query('ROLLBACK');
    console.error('Error saving bingo square:', error);
    res.status(500).json({ success: false, message: 'Failed to save bingo square' });
  }
  finally {
    client.release();
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
    // const valuesSql = [];
    // const params = [];
    // for (let i = 0; i < 25; i++) {
    //   valuesSql.push(`($${params.length + 1}, $${params.length + 2}, '')`);
    //   params.push(boardId, i);
    // }
    // await client.query(
    //   `INSERT INTO squares (board_id, index, goal) VALUES ${valuesSql.join(', ')}`,
    //   params
    // );

    // Register the creator as a player on this board
    await client.query(
      `INSERT INTO players (user_id, board_id, ready) VALUES ($1, $2, false)`,
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
app.post('/api/board/:boardID/join', authenticateToken, async (req, res) => {
  const { boardID } = req.params;
  const playerID = req.user.id;
  try {
    const boardResult = await pool.query(
      `SELECT * FROM boards WHERE id = $1`,
      [boardID]
    );
    if (boardResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }
    const status = boardResult.rows[0].status;
    if (status !== 'lobby') {
      return res.status(400).json({ success: false, message: 'Cannot join a game that has already started' });
    }
    const result = await pool.query(
      `INSERT INTO players (user_id, board_id, ready) VALUES ($1, $2, false) ON CONFLICT (user_id, board_id) DO NOTHING RETURNING *`,
      [playerID, boardID]
    );
    io.to(`board-${boardID}`).emit('players-updated', {
      boardID,
      player: result.rows[0]
    });
    res.json({ success: true, message: 'Successfully joined board', player: result.rows[0] });
  } catch (error) {
    console.error('Error joining board:', error);
    res.status(500).json({ success: false, message: 'Failed to join board' });
  }
});

app.put('/api/board/:boardID/finish-creation', authenticateToken, async (req, res) => {
  const {boardID} = req.params;
  const playerID = req.user.id;
  try{
    const result = await pool.query(
      `UPDATE boards SET status = 'playing' WHERE id = $1`,
      [boardID]
    )
    io.to(`board-${boardID}`).emit('board-updated', {
      boardID,
    });
    return res.json({
        success: true,
        message: 'Board changed to playing',
        status: 'playing'
      });
  }
  catch(error){
    console.error('Error fetching board:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch board',
    });
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
    const playerResult = await pool.query(
      `SELECT * FROM players WHERE board_id = $1 AND user_id = $2`,
      [boardID, playerID]
    );
    if (playerResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a player on this board',
      });
    }
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
  const playerResult = await pool.query(
    `SELECT * FROM players WHERE board_id = $1 AND user_id = $2`,
    [boardID, playerID]
  );
  if (playerResult.rows.length === 0) {
    return res.status(403).json({ success: false, message: 'You are not a player on this board' });
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
    let client;
  try {
    client = await pool.connect();
    client.query('BEGIN');
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
    
      const endGameResult = await client.query(
        `UPDATE boards SET status = 'ended', winner_id = $1, ended_at = NOW() WHERE id = $2 RETURNING id, status, winner_id, ended_at`,
        [playerID, boardID]
      );
      if (endGameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Board not found',
      });
    }
      const winnerID = endGameResult.rows[0].winner_id;
    
    
    await client.query('COMMIT');
    io.to(`board-${boardID}`).emit('board-updated', { boardID });
  
    return res.json({
      success: true,
      message: winnerID ? 'Game ended with a winner' : 'Game ended because time ran out',
      board: endGameResult.rows[0],
      status: endGameResult.rows[0].status,
    });
    
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
app.post('/api/board/:boardID/square/:index/toggle-marker', authenticateToken, async (req, res) => {
  const { boardID } = req.params;
  const { index } = req.params; 
  const playerID = req.user.id;
  let client;
  try{
    client = await pool.connect();
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

app.get('/api/board/:boardID/getReady', authenticateToken, async (req, res) => {
    const playerID = req.user.id;
    const {boardID} = req.params;
    try{
        const readyStatus = await pool.query(
            'SELECT ready FROM players WHERE user_id = $1 AND board_id = $2',
            [playerID, boardID]
        );

        if (readyStatus.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Player not found on this board' });
        }

       res.json({ success: true, message: 'Ready status updated', ready: readyStatus.rows[0].ready });


    } catch (error) {
    console.error('Error with getting ready', error);
    res.status(500).json({ success: false, message: 'Failed to get ready status' });
  }
});

app.post('/api/board/:boardID/changeReady', authenticateToken, async (req, res) => {
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
    io.to(`board-${boardID}`).emit('players-updated', {
       boardID,
       
      });

    res.json({ success: true, message: 'Ready status updated', ready: result.rows[0].ready });
  } catch (error) {
    console.error('Error with ready button', error);
    res.status(500).json({ success: false, message: 'Failed to update ready status' });
  }
});

app.post('/api/board/:boardID/start', authenticateToken, async (req, res) => {
  const userID = req.user.id;
  const { boardID } = req.params;
  const playerID = req.user.id;
  let client;

  function shuffleArray(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // 1. Check board exists and current user is host
    const boardResult = await client.query(
      `SELECT id, host_id, status FROM boards WHERE id = $1`,
      [boardID]
    );

    if (boardResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Board not found',
      });
    }
    if (boardResult.rows[0].host_id !== playerID) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'You are not the host of this board',
      });
    }

    const board = boardResult.rows[0];

    if (Number(userID) !== Number(board.host_id)) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Player is not the host',
      });
    }

    // Optional: prevent starting twice
    if (board.status === 'playing' || board.status === 'ended') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Game has already started or ended',
      });
    }

    // 2. Check all players are ready
    const playersResult = await client.query(
      `SELECT user_id, ready FROM players WHERE board_id = $1`,
      [boardID]
    );

    const players = playersResult.rows;

    if (players.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No players found on this board',
      });
    }

    const someoneNotReady = players.some((p) => p.ready === false);

    if (someoneNotReady) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Not all players are ready',
      });
    }

    // 3. Check existing squares
    let squaresResult = await client.query(
      `SELECT id, index FROM squares WHERE board_id = $1 ORDER BY index ASC`,
      [boardID]
    );

    let squares = squaresResult.rows;

    // 4. If no squares exist, create 25 now
    if (squares.length === 0) {
      const valuesSql = [];
      const params = [];

      for (let i = 0; i < 25; i++) {
        valuesSql.push(`($${params.length + 1}, $${params.length + 2}, '')`);
        params.push(boardID, i);
      }

      await client.query(
        `INSERT INTO squares (board_id, index, goal)
         VALUES ${valuesSql.join(', ')}`,
        params
      );

      // Re-fetch the newly created squares
      squaresResult = await client.query(
        `SELECT id, index FROM squares WHERE board_id = $1 ORDER BY index ASC`,
        [boardID]
      );

      squares = squaresResult.rows;
    }

    // 5. If something is wrong, stop
    if (squares.length !== 25) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Expected 25 squares, found ${squares.length}`,
      });
    }

    // 6. Shuffle and assign squares to players equally
    const shuffledSquares = shuffleArray(squares);
    const shuffledPlayers = shuffleArray(players);

    for (let i = 0; i < shuffledSquares.length; i++) {
      const square = shuffledSquares[i];
      const player = shuffledPlayers[i % shuffledPlayers.length];

      await client.query(
        `UPDATE squares SET player_id = $1 WHERE id = $2`,
        [player.user_id, square.id]
      );
    }

    // 7. Change board status
    await client.query(
      `UPDATE boards SET status = 'creation' WHERE id = $1`,
      [boardID]
    );

    await client.query('COMMIT');
    io.to(`board-${boardID}`).emit('board-updated', {
      boardID,
    });
    return res.json({
      success: true,
      message: 'Game started, 25 squares created if needed, and squares assigned',
      status: 'creation',
    });
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK');
    }

    console.error('Error with the start button:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to start game',
      error: error.message,
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.post('/api/board/:boardID/kickPlayer/:currentPlayer', authenticateToken, async (req, res) => {
  const playerID = req.user.id;
  const { boardID, currentPlayer } = req.params;
  try {
    const host = await pool.query(`SELECT host_id FROM boards WHERE id = $1`, [boardID]);

    if (host.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    const host_id = host.rows[0].host_id;

    if (playerID != host_id) {
      return res.status(403).json({ success: false, message: 'Player is not the host' });
    }

    if (String(currentPlayer) === String(host_id)) {
      return res.status(400).json({ success: false, message: 'Host cannot kick themselves' });
    }

    const result = await pool.query(
      `DELETE FROM players WHERE user_id = $1 AND board_id = $2 RETURNING *`,
      [currentPlayer, boardID]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Player not found on this board' });
    }

    io.to(`board-${boardID}`).emit('players-updated', { boardID });

    res.json({ success: true, message: 'Player successfully kicked' });
  } catch (error) {
    console.error('Error kicking player', error);
    res.status(500).json({ success: false, message: 'Failed to kick player' });
  }
});

server.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});