import express from 'express';
import cors from 'cors';
import pg from "pg";
import dotenv from 'dotenv';
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

app.post('/api/bingo-square', async (req, res) => {
  
  const { content } = req.body;
  
  console.log('Bingo square text:', content);

  res.json({
    success: true,
    message: 'Bingo square received',
    content,
  });
});
app.post('/api/create-game', async (req, res) => {
  const { playerID } = req.body;
  try {
  const result = await pool.query('INSERT INTO boards (host_id) VALUES ($1) RETURNING id', [playerID]);
  res.json({
    success: true,
    message: 'Game created',
    boardID: result.rows[0].id,
  });
  }catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create game',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
