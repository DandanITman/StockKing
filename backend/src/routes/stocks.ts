import express from 'express';
import { pool } from '../database/connection.js';
import { stockDataService } from '../services/stockDataService.js';
import { technicalIndicatorsService } from '../services/technicalIndicatorsService.js';

// Define the interface locally since it's not exported from stockDataService
interface PriceHistoryEntry {
  id: number;
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
  created_at: string;
}

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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    console.error('Error fetching stock price:', error);
    res.status(500).json({ error: 'Failed to fetch stock price' });
  }
});

// Get price history for a stock
router.get('/history/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = '30' } = req.query;
    
    const history = await stockDataService.getPriceHistory(symbol, parseInt(days as string));
    res.json({ history });
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    console.error('Error initiating price update:', error);
    res.status(500).json({ error: 'Failed to initiate price update' });
  }
});

// Technical Analysis Endpoints

// Get comprehensive technical analysis for a stock
router.get('/analysis/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const analysis = await technicalIndicatorsService.getComprehensiveAnalysis(symbol.toUpperCase());
    res.json(analysis);
  } catch (error) {
    console.error(`Error getting technical analysis for ${req.params.symbol}:`, error);
    res.status(500).json({ 
      error: 'Failed to get technical analysis',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get specific technical indicator for a stock
router.get('/indicators/:symbol/:indicator', async (req, res) => {
  try {
    const { symbol, indicator } = req.params;
    const { period = '20' } = req.query;
    
    // Get historical data first
    const historyData = await stockDataService.getHistoricalPrices(symbol.toUpperCase());
    if (!historyData || historyData.length === 0) {
      return res.status(404).json({ error: 'No historical data found for symbol' });
    }
    
    const prices = historyData.map((item: PriceHistoryEntry) => item.price);
    const periodNum = parseInt(period as string, 10);
    
    let result;
    
    switch (indicator.toLowerCase()) {
      case 'sma':
        result = await technicalIndicatorsService.calculateSMA(prices, periodNum);
        break;
      case 'ema':
        result = await technicalIndicatorsService.calculateEMA(prices, periodNum);
        break;
      case 'rsi':
        result = await technicalIndicatorsService.calculateRSI(prices, periodNum);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported indicator. Available: sma, ema, rsi' });
    }
    
    res.json({
      symbol: symbol.toUpperCase(),
      indicator: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`Error calculating ${req.params.indicator} for ${req.params.symbol}:`, error);
    res.status(500).json({ 
      error: `Failed to calculate ${req.params.indicator}`,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get trading signals for multiple stocks (top performers)
router.get('/signals/top', async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    
    // Get list of popular stocks to analyze (you could get this from your tracked_stocks table)
    const popularStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'DIS', 'BABA'];
    
    const signals = [];
    
    for (let i = 0; i < Math.min(limitNum, popularStocks.length); i++) {
      try {
        const symbol = popularStocks[i];
        if (symbol) {
          const analysis = await technicalIndicatorsService.getComprehensiveAnalysis(symbol);
          
          signals.push({
            symbol,
            signal: analysis.overallSignal,
            confidence: analysis.confidence,
            indicatorCount: analysis.indicators.length,
            buySignals: analysis.indicators.filter(ind => ind.signal === 'BUY').length,
            sellSignals: analysis.indicators.filter(ind => ind.signal === 'SELL').length,
            timestamp: analysis.timestamp
          });
        }
      } catch (error) {
        console.error(`Error analyzing ${popularStocks[i]}:`, error);
        // Skip this stock and continue with others
      }
    }
    
    // Sort by confidence descending
    signals.sort((a, b) => b.confidence - a.confidence);
    
    res.json({
      signals,
      timestamp: new Date().toISOString(),
      totalAnalyzed: signals.length
    });
    
  } catch (error) {
    console.error('Error getting top signals:', error);
    res.status(500).json({ 
      error: 'Failed to get trading signals',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
