import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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