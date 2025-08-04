import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
class AlphaVantageService {
    apiKey;
    baseUrl = 'https://www.alphavantage.co/query';
    constructor() {
        this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
        if (!this.apiKey) {
            throw new Error('ALPHA_VANTAGE_API_KEY is required');
        }
    }
    async getCurrentPrice(symbol) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    function: 'GLOBAL_QUOTE',
                    symbol: symbol.toUpperCase(),
                    apikey: this.apiKey,
                },
                timeout: 10000,
            });
            const quote = response.data['Global Quote'];
            if (!quote || !quote['01. symbol']) {
                console.error(`No data found for symbol: ${symbol}`);
                return null;
            }
            return {
                symbol: quote['01. symbol'],
                price: parseFloat(quote['05. price']),
                volume: parseInt(quote['06. volume']),
                timestamp: quote['07. latest trading day'],
                open: parseFloat(quote['02. open']),
                high: parseFloat(quote['03. high']),
                low: parseFloat(quote['04. low']),
                previousClose: parseFloat(quote['08. previous close']),
                change: parseFloat(quote['09. change']),
                changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            };
        }
        catch (error) {
            console.error(`Error fetching current price for ${symbol}:`, error);
            return null;
        }
    }
    async getHistoricalData(symbol, days = 30) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    function: 'TIME_SERIES_DAILY',
                    symbol: symbol.toUpperCase(),
                    apikey: this.apiKey,
                },
                timeout: 15000,
            });
            const timeSeries = response.data['Time Series (Daily)'];
            if (!timeSeries) {
                console.error(`No historical data found for symbol: ${symbol}`);
                return [];
            }
            const history = [];
            const dates = Object.keys(timeSeries).sort((a, b) => b.localeCompare(a)); // Most recent first
            for (let i = 0; i < Math.min(dates.length, days); i++) {
                const date = dates[i];
                if (!date || !timeSeries[date])
                    continue;
                const data = timeSeries[date];
                history.push({
                    date: date,
                    open: parseFloat(data['1. open']),
                    high: parseFloat(data['2. high']),
                    low: parseFloat(data['3. low']),
                    close: parseFloat(data['4. close']),
                    volume: parseInt(data['5. volume']),
                });
            }
            return history;
        }
        catch (error) {
            console.error(`Error fetching historical data for ${symbol}:`, error);
            return [];
        }
    }
    async searchSymbol(keywords) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    function: 'SYMBOL_SEARCH',
                    keywords: keywords,
                    apikey: this.apiKey,
                },
                timeout: 10000,
            });
            const matches = response.data['bestMatches'] || [];
            return matches.slice(0, 10).map((match) => ({
                symbol: match['1. symbol'],
                name: match['2. name'],
            }));
        }
        catch (error) {
            console.error(`Error searching for symbol ${keywords}:`, error);
            return [];
        }
    }
    async validateSymbol(symbol) {
        const price = await this.getCurrentPrice(symbol);
        return price !== null;
    }
}
export const alphaVantageService = new AlphaVantageService();
//# sourceMappingURL=alphaVantageService.js.map