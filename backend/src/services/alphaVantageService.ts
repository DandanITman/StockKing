import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface AlphaVantageQuote {
  'Global Quote': {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '07. latest trading day': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
}

interface AlphaVantageTimeSeries {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Time Zone': string;
  };
  'Time Series (Daily)': {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
}

interface StockPrice {
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  change: number;
  changePercent: number;
}

interface StockHistoryItem {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class AlphaVantageService {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';

  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ALPHA_VANTAGE_API_KEY is required');
    }
  }

  async getCurrentPrice(symbol: string): Promise<StockPrice | null> {
    try {
      const response = await axios.get<AlphaVantageQuote>(this.baseUrl, {
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
    } catch (error) {
      console.error(`Error fetching current price for ${symbol}:`, error);
      return null;
    }
  }

  async getHistoricalData(symbol: string, days: number = 30): Promise<StockHistoryItem[]> {
    try {
      const response = await axios.get<AlphaVantageTimeSeries>(this.baseUrl, {
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

      const history: StockHistoryItem[] = [];
      const dates = Object.keys(timeSeries).sort((a, b) => b.localeCompare(a)); // Most recent first

      for (let i = 0; i < Math.min(dates.length, days); i++) {
        const date = dates[i];
        if (!date || !timeSeries[date]) continue;
        
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
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  async searchSymbol(keywords: string): Promise<Array<{symbol: string, name: string}>> {
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
      return matches.slice(0, 10).map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
      }));
    } catch (error) {
      console.error(`Error searching for symbol ${keywords}:`, error);
      return [];
    }
  }

  async validateSymbol(symbol: string): Promise<boolean> {
    const price = await this.getCurrentPrice(symbol);
    return price !== null;
  }
}

export const alphaVantageService = new AlphaVantageService();
export type { StockPrice, StockHistoryItem };
