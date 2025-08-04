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
declare class AlphaVantageService {
    private apiKey;
    private baseUrl;
    constructor();
    getCurrentPrice(symbol: string): Promise<StockPrice | null>;
    getHistoricalData(symbol: string, days?: number): Promise<StockHistoryItem[]>;
    searchSymbol(keywords: string): Promise<Array<{
        symbol: string;
        name: string;
    }>>;
    validateSymbol(symbol: string): Promise<boolean>;
}
export declare const alphaVantageService: AlphaVantageService;
export type { StockPrice, StockHistoryItem };
//# sourceMappingURL=alphaVantageService.d.ts.map