-- StockKing Database Schema
-- PostgreSQL Database Setup

-- Create the main database (run this manually in PostgreSQL)
-- CREATE DATABASE stockking;

-- Connect to the stockking database and run the following:

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracked stocks table
CREATE TABLE IF NOT EXISTS tracked_stocks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, symbol)
);

-- Stock signals table (buy/sell recommendations)
CREATE TABLE IF NOT EXISTS stock_signals (
    id SERIAL PRIMARY KEY,
    stock_id INTEGER REFERENCES tracked_stocks(id) ON DELETE CASCADE,
    signal_type VARCHAR(10) NOT NULL CHECK (signal_type IN ('buy', 'sell')),
    confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
    indicators_used TEXT[], -- Array of indicators that generated this signal
    signal_source VARCHAR(20) NOT NULL CHECK (signal_source IN ('technical', 'ai')),
    price_at_signal DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Stock price history table (for caching and analysis)
CREATE TABLE IF NOT EXISTS stock_price_history (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    volume BIGINT,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, timestamp)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    trading_mode VARCHAR(20) DEFAULT 'intraday' CHECK (trading_mode IN ('intraday', 'swing')),
    max_stocks INTEGER DEFAULT 100 CHECK (max_stocks <= 100),
    risk_tolerance VARCHAR(20) DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
    preferred_indicators TEXT[], -- Array of preferred technical indicators
    ai_enabled BOOLEAN DEFAULT true,
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracked_stocks_user_id ON tracked_stocks(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_stocks_symbol ON tracked_stocks(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_signals_stock_id ON stock_signals(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_signals_created_at ON stock_signals(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_price_history_symbol ON stock_price_history(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_price_history_timestamp ON stock_price_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_stock_price_history_symbol_time ON stock_price_history(symbol, timestamp);

-- Create trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
