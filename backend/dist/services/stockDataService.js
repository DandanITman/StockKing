import { pool } from '../database/connection.js';
import { alphaVantageService } from './alphaVantageService.js';
class StockDataService {
    // Store current price in database and return it
    async updateStockPrice(symbol) {
        try {
            const currentPrice = await alphaVantageService.getCurrentPrice(symbol);
            if (!currentPrice) {
                return null;
            }
            // Store in database
            await pool.query(`INSERT INTO stock_price_history (symbol, price, volume, timestamp)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (symbol, timestamp) DO UPDATE SET
         price = EXCLUDED.price, volume = EXCLUDED.volume`, [currentPrice.symbol, currentPrice.price, currentPrice.volume, currentPrice.timestamp]);
            return currentPrice;
        }
        catch (error) {
            console.error(`Error updating stock price for ${symbol}:`, error);
            return null;
        }
    }
    // Get latest price from database, fetch from API if not recent
    async getLatestPrice(symbol) {
        try {
            // Check database first for recent data (within last hour)
            const dbResult = await pool.query(`SELECT symbol, price, volume, timestamp, created_at
         FROM stock_price_history
         WHERE symbol = $1 AND created_at > NOW() - INTERVAL '1 hour'
         ORDER BY timestamp DESC, created_at DESC
         LIMIT 1`, [symbol.toUpperCase()]);
            if (dbResult.rows.length > 0) {
                const row = dbResult.rows[0];
                // Convert database result to StockPrice format
                const apiPrice = await alphaVantageService.getCurrentPrice(symbol);
                return apiPrice || {
                    symbol: row.symbol,
                    price: parseFloat(row.price),
                    volume: row.volume,
                    timestamp: row.timestamp,
                    open: 0,
                    high: 0,
                    low: 0,
                    previousClose: 0,
                    change: 0,
                    changePercent: 0,
                };
            }
            // If no recent data, fetch from API
            return await this.updateStockPrice(symbol);
        }
        catch (error) {
            console.error(`Error getting latest price for ${symbol}:`, error);
            return null;
        }
    }
    // Get price history from database
    async getPriceHistory(symbol, days = 30) {
        try {
            const result = await pool.query(`SELECT id, symbol, price, volume, timestamp, created_at
         FROM stock_price_history
         WHERE symbol = $1 AND timestamp >= NOW() - INTERVAL '${days} days'
         ORDER BY timestamp DESC`, [symbol.toUpperCase()]);
            return result.rows.map(row => ({
                id: row.id,
                symbol: row.symbol,
                price: parseFloat(row.price),
                volume: row.volume,
                timestamp: row.timestamp,
                created_at: row.created_at,
            }));
        }
        catch (error) {
            console.error(`Error getting price history for ${symbol}:`, error);
            return [];
        }
    }
    // Populate historical data for a symbol
    async populateHistoricalData(symbol, days = 30) {
        try {
            const historicalData = await alphaVantageService.getHistoricalData(symbol, days);
            if (historicalData.length === 0) {
                return false;
            }
            // Insert historical data into database
            for (const item of historicalData) {
                await pool.query(`INSERT INTO stock_price_history (symbol, price, volume, timestamp)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (symbol, timestamp) DO NOTHING`, [symbol.toUpperCase(), item.close, item.volume, item.date]);
            }
            console.log(`Populated ${historicalData.length} historical records for ${symbol}`);
            return true;
        }
        catch (error) {
            console.error(`Error populating historical data for ${symbol}:`, error);
            return false;
        }
    }
    // Update prices for all tracked stocks
    async updateAllTrackedStocks() {
        try {
            const result = await pool.query('SELECT DISTINCT symbol FROM tracked_stocks');
            const symbols = result.rows.map(row => row.symbol);
            console.log(`Updating prices for ${symbols.length} tracked stocks...`);
            for (const symbol of symbols) {
                await this.updateStockPrice(symbol);
                // Add delay to respect API rate limits (Alpha Vantage: 5 calls per minute for free tier)
                await new Promise(resolve => setTimeout(resolve, 12000)); // 12 seconds between calls
            }
            console.log('Finished updating all tracked stocks');
        }
        catch (error) {
            console.error('Error updating all tracked stocks:', error);
        }
    }
    // Validate and search for stocks
    async searchStock(query) {
        return await alphaVantageService.searchSymbol(query);
    }
    async validateStock(symbol) {
        return await alphaVantageService.validateSymbol(symbol);
    }
    // Get stock statistics
    async getStockStats(symbol) {
        try {
            const result = await pool.query(`SELECT 
           COUNT(*) as data_points,
           MIN(price) as min_price,
           MAX(price) as max_price,
           AVG(price) as avg_price,
           MIN(timestamp) as earliest_date,
           MAX(timestamp) as latest_date
         FROM stock_price_history
         WHERE symbol = $1`, [symbol.toUpperCase()]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error(`Error getting stock stats for ${symbol}:`, error);
            return null;
        }
    }
}
export const stockDataService = new StockDataService();
//# sourceMappingURL=stockDataService.js.map