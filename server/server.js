import express from 'express';
import cors from 'cors';
import pg from "pg";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
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

app.get('/', (req, res) => {
  res.send('Server is working');
});

// TEMPORARY: resolves a display name to a users.id, creating a guest
// account if one doesn't exist yet. Replace once real auth exists.
async function getOrCreateUserId(client, playerName) {
  const existing = await client.query('SELECT id FROM users WHERE name = $1 LIMIT 1', [playerName]);
  if (existing.rows.length > 0) return existing.rows[0].id;

  const guestEmail = `${playerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}@guest.local`;
  const inserted = await client.query(
    `INSERT INTO users (name, email, password) VALUES ($1, $2, 'guest') RETURNING id`,
    [playerName, guestEmail]
  );
  return inserted.rows[0].id;
}

app.post('/api/create-game', async (req, res) => {
  const { playerID, title } = req.body;

  if (!playerID) {
    return res.status(400).json({ success: false, message: 'playerID is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userId = await getOrCreateUserId(client, playerID);
    const boardTitle = title || `${playerID}'s Board`;

    // const boardResult = await client.query(
    //   `INSERT INTO boards (title, host_id, status) VALUES ($1, $2, 'active') RETURNING id`,
    //   [boardTitle, userId]
    // );
    // Keep in mind that for now it does not randomly generate unique ids, and only does a small range 
    // TODO: make the board IDs generate unique ids
    const boardResult = await client.query(
      `INSERT INTO boards (host_id, status) VALUES ($1, 'active') RETURNING id`,
      [userId]
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
      `INSERT INTO players (player_id, board_id) VALUES ($1, $2)`,
      [userId, boardId]
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

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});