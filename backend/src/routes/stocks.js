import express from 'express';
import { pool } from '../database/connection.js';
const router = express.Router();
// Get all tracked stocks for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const query = `
      SELECT ts.id, ts.symbol, ts.created_at,
             COUNT(sp.id) as price_points
      FROM tracked_stocks ts
      LEFT JOIN stock_price_history sp ON ts.symbol = sp.symbol
      WHERE ts.user_id = $1
      GROUP BY ts.id, ts.symbol, ts.created_at
      ORDER BY ts.created_at DESC
    `;
        const result = await pool.query(query, [userId]);
        res.json({ stocks: result.rows });
    }
    catch (error) {
        console.error('Error fetching tracked stocks:', error);
        res.status(500).json({ error: 'Failed to fetch tracked stocks' });
    }
});
// Add a new stock to track
router.post('/track', async (req, res) => {
    try {
        const { userId, symbol } = req.body;
        if (!userId || !symbol) {
            return res.status(400).json({ error: 'userId and symbol are required' });
        }
        // Check if already tracking
        const existingQuery = 'SELECT id FROM tracked_stocks WHERE user_id = $1 AND symbol = $2';
        const existing = await pool.query(existingQuery, [userId, symbol.toUpperCase()]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Stock is already being tracked' });
        }
        // Add to tracked stocks
        const insertQuery = `
      INSERT INTO tracked_stocks (user_id, symbol)
      VALUES ($1, $2)
      RETURNING id, symbol, created_at
    `;
        const result = await pool.query(insertQuery, [userId, symbol.toUpperCase()]);
        res.status(201).json({ stock: result.rows[0] });
    }
    catch (error) {
        console.error('Error adding tracked stock:', error);
        res.status(500).json({ error: 'Failed to add tracked stock' });
    }
});
// Remove a tracked stock
router.delete('/:stockId', async (req, res) => {
    try {
        const { stockId } = req.params;
        const deleteQuery = 'DELETE FROM tracked_stocks WHERE id = $1 RETURNING symbol';
        const result = await pool.query(deleteQuery, [stockId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tracked stock not found' });
        }
        res.json({ message: 'Stock removed from tracking', symbol: result.rows[0].symbol });
    }
    catch (error) {
        console.error('Error removing tracked stock:', error);
        res.status(500).json({ error: 'Failed to remove tracked stock' });
    }
});
// Get latest price for a stock
router.get('/price/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const query = `
      SELECT price, volume, timestamp
      FROM stock_price_history
      WHERE symbol = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;
        const result = await pool.query(query, [symbol.toUpperCase()]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No price data found for this symbol' });
        }
        res.json({ price_data: result.rows[0] });
    }
    catch (error) {
        console.error('Error fetching stock price:', error);
        res.status(500).json({ error: 'Failed to fetch stock price' });
    }
});
// Get price history for a stock
router.get('/history/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { days = '30' } = req.query;
        const query = `
      SELECT price, volume, timestamp
      FROM stock_price_history
      WHERE symbol = $1 
        AND timestamp >= NOW() - INTERVAL '${parseInt(days)} days'
      ORDER BY timestamp DESC
    `;
        const result = await pool.query(query, [symbol.toUpperCase()]);
        res.json({ history: result.rows });
    }
    catch (error) {
        console.error('Error fetching price history:', error);
        res.status(500).json({ error: 'Failed to fetch price history' });
    }
});
export default router;
//# sourceMappingURL=stocks.js.map