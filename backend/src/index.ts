import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'StockKing API is running' });
});

app.get('/api/stocks', (req, res) => {
  // Placeholder for stock data endpoint
  res.json({ message: 'Stock data endpoint - to be implemented' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
