import { alphaVantageService, type StockHistoryItem } from './alphaVantageService.js';

// Technical Indicators Service
// Uses basic algorithms for calculating various technical indicators

interface TechnicalIndicatorResult {
  indicator: string;
  values: number[];
  signal?: 'BUY' | 'SELL' | 'HOLD';
  confidence?: number;
  description?: string;
}

interface IndicatorInputs {
  prices: number[];
  volumes?: number[];
  highs?: number[];
  lows?: number[];
  closes?: number[];
  opens?: number[];
}

class TechnicalIndicatorsService {
  
  // Calculate Simple Moving Average
  async calculateSMA(prices: number[], period: number = 20): Promise<TechnicalIndicatorResult> {
    if (prices.length < period) {
      throw new Error(`Insufficient data points for SMA${period}. Need at least ${period} points.`);
    }
    
    const smaValues: number[] = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((acc, price) => acc + price, 0);
      smaValues.push(sum / period);
    }
    
    // Generate signal based on price vs SMA
    const currentPrice = prices[prices.length - 1];
    const currentSMA = smaValues[smaValues.length - 1];
    const previousSMA = smaValues.length > 1 ? smaValues[smaValues.length - 2] : currentSMA;
    
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;
    
    if (currentPrice !== undefined && currentSMA !== undefined && previousSMA !== undefined && 
        currentPrice > currentSMA && currentSMA > previousSMA) {
      signal = 'BUY';
      confidence = Math.min(95, 60 + Math.abs((currentPrice - currentSMA) / currentSMA) * 100);
    } else if (currentPrice !== undefined && currentSMA !== undefined && previousSMA !== undefined && 
               currentPrice < currentSMA && currentSMA < previousSMA) {
      signal = 'SELL';
      confidence = Math.min(95, 60 + Math.abs((currentSMA - currentPrice) / currentSMA) * 100);
    }
    
    return {
      indicator: `SMA${period}`,
      values: smaValues,
      signal,
      confidence: Math.round(confidence),
      description: `Simple Moving Average over ${period} periods`
    };
  }
  
  // Calculate Exponential Moving Average
  async calculateEMA(prices: number[], period: number = 12): Promise<TechnicalIndicatorResult> {
    if (prices.length < period) {
      throw new Error(`Insufficient data points for EMA${period}. Need at least ${period} points.`);
    }
    
    const multiplier = 2 / (period + 1);
    const emaValues: number[] = [];
    
    // Start with SMA for the first EMA value
    const firstSMA = prices.slice(0, period).reduce((acc, price) => acc + price, 0) / period;
    emaValues.push(firstSMA);
    
    // Calculate EMA for remaining periods
    for (let i = period; i < prices.length; i++) {
      const prevEMA = emaValues[emaValues.length - 1];
      const currentPrice = prices[i];
      if (prevEMA !== undefined && currentPrice !== undefined) {
        const ema = (currentPrice * multiplier) + (prevEMA * (1 - multiplier));
        emaValues.push(ema);
      }
    }
    
    // Generate signal
    const currentPrice = prices[prices.length - 1];
    const currentEMA = emaValues[emaValues.length - 1];
    const previousEMA = emaValues.length > 1 ? emaValues[emaValues.length - 2] : currentEMA;
    
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;
    
    if (currentPrice !== undefined && currentEMA !== undefined && previousEMA !== undefined &&
        currentPrice > currentEMA && currentEMA > previousEMA) {
      signal = 'BUY';
      confidence = Math.min(95, 65 + Math.abs((currentPrice - currentEMA) / currentEMA) * 100);
    } else if (currentPrice !== undefined && currentEMA !== undefined && previousEMA !== undefined &&
               currentPrice < currentEMA && currentEMA < previousEMA) {
      signal = 'SELL';
      confidence = Math.min(95, 65 + Math.abs((currentEMA - currentPrice) / currentEMA) * 100);
    }
    
    return {
      indicator: `EMA${period}`,
      values: emaValues,
      signal,
      confidence: Math.round(confidence),
      description: `Exponential Moving Average over ${period} periods`
    };
  }
  
  // Calculate RSI (Relative Strength Index)
  async calculateRSI(prices: number[], period: number = 14): Promise<TechnicalIndicatorResult> {
    if (prices.length < period + 1) {
      throw new Error(`Insufficient data points for RSI. Need at least ${period + 1} points.`);
    }
    
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate gains and losses
    for (let i = 1; i < prices.length; i++) {
      const prev = prices[i - 1];
      const curr = prices[i];
      if (prev !== undefined && curr !== undefined) {
        const change = curr - prev;
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
      }
    }
    
    const rsiValues: number[] = [];
    
    // Calculate initial average gain and loss
    let avgGain = gains.slice(0, period).reduce((acc, gain) => acc + gain, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((acc, loss) => acc + loss, 0) / period;
    
    // Calculate RSI values
    for (let i = period; i < gains.length; i++) {
      if (avgLoss === 0) {
        rsiValues.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        rsiValues.push(rsi);
      }
      
      // Update averages for next iteration
      const gainValue = gains[i];
      const lossValue = losses[i];
      if (gainValue !== undefined && lossValue !== undefined) {
        avgGain = ((avgGain * (period - 1)) + gainValue) / period;
        avgLoss = ((avgLoss * (period - 1)) + lossValue) / period;
      }
    }
    
    // Generate signal based on RSI levels
    const currentRSI = rsiValues[rsiValues.length - 1];
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;
    
    if (currentRSI !== undefined) {
      if (currentRSI < 30) {
        signal = 'BUY';
        confidence = Math.min(95, 70 + (30 - currentRSI));
      } else if (currentRSI > 70) {
        signal = 'SELL';
        confidence = Math.min(95, 70 + (currentRSI - 70));
      }
    }
    
    return {
      indicator: 'RSI',
      values: rsiValues,
      signal,
      confidence: Math.round(confidence),
      description: `Relative Strength Index over ${period} periods`
    };
  }
  
  // Get comprehensive analysis for a stock
  async getComprehensiveAnalysis(symbol: string): Promise<{
    symbol: string;
    indicators: TechnicalIndicatorResult[];
    overallSignal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    timestamp: string;
  }> {
    try {
      // Get historical data
      const historyData = await alphaVantageService.getHistoricalData(symbol, 100);
      
      if (!historyData || historyData.length < 50) {
        throw new Error('Insufficient historical data for technical analysis');
      }
      
      // Extract price arrays
      const prices = historyData.map(item => item.close);
      
      // Calculate indicators
      const indicators: TechnicalIndicatorResult[] = [];
      
      indicators.push(await this.calculateSMA(prices, 20));
      indicators.push(await this.calculateSMA(prices, 50));
      indicators.push(await this.calculateEMA(prices, 12));
      indicators.push(await this.calculateRSI(prices, 14));
      
      // Calculate overall signal based on all indicators
      const buySignals = indicators.filter(ind => ind.signal === 'BUY');
      const sellSignals = indicators.filter(ind => ind.signal === 'SELL');
      
      let overallSignal: 'BUY' | 'SELL' | 'HOLD';
      let confidence: number;
      
      if (buySignals.length > sellSignals.length && buySignals.length >= 2) {
        overallSignal = 'BUY';
        confidence = Math.round(buySignals.reduce((acc, ind) => acc + (ind.confidence || 50), 0) / buySignals.length);
      } else if (sellSignals.length > buySignals.length && sellSignals.length >= 2) {
        overallSignal = 'SELL';
        confidence = Math.round(sellSignals.reduce((acc, ind) => acc + (ind.confidence || 50), 0) / sellSignals.length);
      } else {
        overallSignal = 'HOLD';
        confidence = 50;
      }
      
      return {
        symbol,
        indicators,
        overallSignal,
        confidence,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`Error in comprehensive analysis for ${symbol}:`, error);
      throw error;
    }
  }
}

export const technicalIndicatorsService = new TechnicalIndicatorsService();
export type { TechnicalIndicatorResult, IndicatorInputs };
