import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './database/connection.js';
// Import routes
import stocksRouter from './routes/stocks.js';
import signalsRouter from './routes/signals.js';
import usersRouter from './routes/users.js';
// Load environment variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
// Middleware
app.use(cors());
app.use(express.json());
// Health check endpoints
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'StockKing API is running', timestamp: new Date().toISOString() });
});
// Database health check
app.get('/api/health/db', async (req, res) => {
    const isConnected = await testConnection();
    res.json({
        status: isConnected ? 'OK' : 'ERROR',
        database: isConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});
// API routes
app.use('/api/stocks', stocksRouter);
app.use('/api/signals', signalsRouter);
app.use('/api/users', usersRouter);
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
app.listen(PORT, () => {
    console.log(`🚀 StockKing Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔍 Database check: http://localhost:${PORT}/api/health/db`);
});
//# sourceMappingURL=index.js.map