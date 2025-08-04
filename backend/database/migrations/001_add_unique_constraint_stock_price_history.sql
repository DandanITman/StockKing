-- Migration: Add unique constraint to stock_price_history table
-- Date: 2025-08-04
-- Description: Adds unique constraint on (symbol, timestamp) to prevent duplicate price entries

-- Add unique constraint to stock_price_history table
ALTER TABLE stock_price_history 
ADD CONSTRAINT unique_symbol_timestamp UNIQUE (symbol, timestamp);
