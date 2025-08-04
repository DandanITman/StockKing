import { type StockPrice } from './alphaVantageService.js';
interface TrackedStock {
    id: number;
    symbol: string;
    user_id: number;
    created_at: string;
}
interface PriceHistoryEntry {
    id: number;
    symbol: string;
    price: number;
    volume: number;
    timestamp: string;
    created_at: string;
}
declare class StockDataService {
    updateStockPrice(symbol: string): Promise<StockPrice | null>;
    getLatestPrice(symbol: string): Promise<StockPrice | null>;
    getPriceHistory(symbol: string, days?: number): Promise<PriceHistoryEntry[]>;
    populateHistoricalData(symbol: string, days?: number): Promise<boolean>;
    updateAllTrackedStocks(): Promise<void>;
    searchStock(query: string): Promise<Array<{
        symbol: string;
        name: string;
    }>>;
    validateStock(symbol: string): Promise<boolean>;
    getStockStats(symbol: string): Promise<any>;
}
export declare const stockDataService: StockDataService;
export type { TrackedStock, PriceHistoryEntry };
//# sourceMappingURL=stockDataService.d.ts.map