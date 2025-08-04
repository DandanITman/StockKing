import express from 'express';
import { pool } from '../database/connection.js';

const router = express.Router();

// Get all signals for a user's tracked stocks
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = '50' } = req.query;
    
    const query = `
      SELECT ss.id, ss.signal_type, ss.confidence, ss.price_at_signal,
             ss.indicator_data, ss.created_at, ts.symbol
      FROM stock_signals ss
      JOIN tracked_stocks ts ON ss.stock_id = ts.id
      WHERE ts.user_id = $1
      ORDER BY ss.created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [userId, parseInt(limit as string)]);
    res.json({ signals: result.rows });
  } catch (error) {
    console.error('Error fetching signals:', error);
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
});

// Get signals for a specific stock
router.get('/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = '20' } = req.query;
    
    const query = `
      SELECT ss.id, ss.signal_type, ss.confidence, ss.price_at_signal,
             ss.indicator_data, ss.created_at
      FROM stock_signals ss
      JOIN tracked_stocks ts ON ss.stock_id = ts.id
      WHERE ts.symbol = $1
      ORDER BY ss.created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [symbol.toUpperCase(), parseInt(limit as string)]);
    res.json({ signals: result.rows });
  } catch (error) {
    console.error('Error fetching stock signals:', error);
    res.status(500).json({ error: 'Failed to fetch stock signals' });
  }
});

// Create a new signal (typically called by AI service)
router.post('/', async (req, res) => {
  try {
    const { stockId, signalType, confidence, priceAtSignal, indicatorData } = req.body;
    
    if (!stockId || !signalType || confidence === undefined || !priceAtSignal) {
      return res.status(400).json({ 
        error: 'stockId, signalType, confidence, and priceAtSignal are required' 
      });
    }

    const insertQuery = `
      INSERT INTO stock_signals (stock_id, signal_type, confidence, price_at_signal, indicator_data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, signal_type, confidence, price_at_signal, created_at
    `;
    
    const result = await pool.query(insertQuery, [
      stockId, 
      signalType, 
      confidence, 
      priceAtSignal,
      indicatorData ? JSON.stringify(indicatorData) : null
    ]);
    
    res.status(201).json({ signal: result.rows[0] });
  } catch (error) {
    console.error('Error creating signal:', error);
    res.status(500).json({ error: 'Failed to create signal' });
  }
});

// Get signal statistics
router.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT 
        ss.signal_type,
        COUNT(*) as count,
        AVG(ss.confidence) as avg_confidence,
        MAX(ss.created_at) as last_signal
      FROM stock_signals ss
      JOIN tracked_stocks ts ON ss.stock_id = ts.id
      WHERE ts.user_id = $1
      GROUP BY ss.signal_type
      ORDER BY count DESC
    `;
    
    const result = await pool.query(query, [userId]);
    res.json({ stats: result.rows });
  } catch (error) {
    console.error('Error fetching signal stats:', error);
    res.status(500).json({ error: 'Failed to fetch signal statistics' });
  }
});

export default router;
