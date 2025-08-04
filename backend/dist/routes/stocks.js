import express from 'express';
import { pool } from '../database/connection.js';
import { stockDataService } from '../services/stockDataService.js';
const router = express.Router();
// Get all tracked stocks for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const query = `
      SELECT ts.id, ts.symbol, ts.created_at,
             COUNT(sp.id) as price_points,
             MAX(sp.timestamp) as last_updated
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
        const upperSymbol = symbol.toUpperCase();
        // Validate the stock symbol with the API
        const isValid = await stockDataService.validateStock(upperSymbol);
        if (!isValid) {
            return res.status(400).json({ error: 'Invalid stock symbol' });
        }
        // Check if already tracking
        const existingQuery = 'SELECT id FROM tracked_stocks WHERE user_id = $1 AND symbol = $2';
        const existing = await pool.query(existingQuery, [userId, upperSymbol]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Stock is already being tracked' });
        }
        // Add to tracked stocks
        const insertQuery = `
      INSERT INTO tracked_stocks (user_id, symbol)
      VALUES ($1, $2)
      RETURNING id, symbol, created_at
    `;
        const result = await pool.query(insertQuery, [userId, upperSymbol]);
        // Fetch and store initial price data
        await stockDataService.updateStockPrice(upperSymbol);
        // Populate some historical data
        await stockDataService.populateHistoricalData(upperSymbol, 30);
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
        const priceData = await stockDataService.getLatestPrice(symbol);
        if (!priceData) {
            return res.status(404).json({ error: 'No price data found for this symbol' });
        }
        res.json({ price_data: priceData });
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
        const history = await stockDataService.getPriceHistory(symbol, parseInt(days));
        res.json({ history });
    }
    catch (error) {
        console.error('Error fetching price history:', error);
        res.status(500).json({ error: 'Failed to fetch price history' });
    }
});
// Search for stocks
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;
        const results = await stockDataService.searchStock(query);
        res.json({ results });
    }
    catch (error) {
        console.error('Error searching stocks:', error);
        res.status(500).json({ error: 'Failed to search stocks' });
    }
});
// Get stock statistics
router.get('/stats/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const stats = await stockDataService.getStockStats(symbol);
        if (!stats) {
            return res.status(404).json({ error: 'No statistics found for this symbol' });
        }
        res.json({ stats });
    }
    catch (error) {
        console.error('Error fetching stock stats:', error);
        res.status(500).json({ error: 'Failed to fetch stock statistics' });
    }
});
// Update prices for all tracked stocks (admin endpoint)
router.post('/update-all', async (req, res) => {
    try {
        // This could be protected with admin authentication
        stockDataService.updateAllTrackedStocks(); // Run in background
        res.json({ message: 'Price update initiated for all tracked stocks' });
    }
    catch (error) {
        console.error('Error initiating price update:', error);
        res.status(500).json({ error: 'Failed to initiate price update' });
    }
});
export default router;
//# sourceMappingURL=stocks.js.map