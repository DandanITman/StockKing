import React, { useState, useEffect, useCallback } from 'react';
import './StockDetail.css';

interface PriceData {
  price: number;
  volume: number;
  timestamp: string;
}

interface PriceHistory {
  price: number;
  volume: number;
  timestamp: string;
}

interface StockDetailProps {
  symbol: string;
  onClose: () => void;
}

const StockDetail: React.FC<StockDetailProps> = ({ symbol, onClose }) => {
  const [currentPrice, setCurrentPrice] = useState<PriceData | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStockData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch current price
      const priceResponse = await fetch(`http://localhost:3001/api/stocks/price/${symbol}`);
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        setCurrentPrice(priceData.price_data);
      }

      // Fetch price history
      const historyResponse = await fetch(`http://localhost:3001/api/stocks/history/${symbol}?days=30`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setPriceHistory(historyData.history || []);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to load stock data');
      setLoading(false);
      console.error('Error fetching stock data:', err);
    }
  }, [symbol]);

  useEffect(() => {
    fetchStockData();
  }, [fetchStockData]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  if (loading) {
    return (
      <div className="stock-detail-overlay">
        <div className="stock-detail-modal">
          <div className="modal-header">
            <h2>{symbol}</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="loading">Loading stock data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stock-detail-overlay">
        <div className="stock-detail-modal">
          <div className="modal-header">
            <h2>{symbol}</h2>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="error">{error}</div>
          <button onClick={fetchStockData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-detail-overlay">
      <div className="stock-detail-modal">
        <div className="modal-header">
          <h2>{symbol}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="stock-detail-content">
          {currentPrice && (
            <div className="current-price-section">
              <h3>Current Price</h3>
              <div className="price-card">
                <div className="price-main">
                  <span className="price">{formatPrice(currentPrice.price)}</span>
                  <span className="timestamp">
                    Last updated: {new Date(currentPrice.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="volume">
                  Volume: {formatVolume(currentPrice.volume)}
                </div>
              </div>
            </div>
          )}

          <div className="price-history-section">
            <h3>Price History (30 Days)</h3>
            {priceHistory.length === 0 ? (
              <div className="no-data">No historical data available</div>
            ) : (
              <div className="history-list">
                {priceHistory.slice(0, 10).map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="history-date">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                    <div className="history-price">
                      {formatPrice(item.price)}
                    </div>
                    <div className="history-volume">
                      Vol: {formatVolume(item.volume)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="actions-section">
            <button onClick={fetchStockData} className="refresh-btn">
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetail;
