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

app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`);
});