import express from 'express';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

// test route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// example route
app.get('/api/board', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM board');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));