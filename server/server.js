import express from 'express';
import cors from 'cors';
import pg from "pg";

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
  console.log('Creating game for player:', playerID);
  res.json({
    success: true,
    message: 'Game created',
    roomCode: 'ABCD', // Placeholder room code
  });
});

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});
