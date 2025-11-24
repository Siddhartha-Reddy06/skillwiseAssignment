import React, { useState, useEffect } from 'react';
import './HistorySidebar.css';
import { productsAPI } from '../services/api';

function HistorySidebar({ product, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [product.id]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await productsAPI.getHistory(product.id);
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      alert('Failed to fetch inventory history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="sidebar-overlay" onClick={onClose}>
      <div className="sidebar-content" onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-header">
          <h2>Inventory History</h2>
          <button className="sidebar-close" onClick={onClose}>×</button>
        </div>
        <div className="sidebar-body">
          <div className="product-info">
            <h3>{product.name}</h3>
            <p>Current Stock: <strong>{product.stock}</strong></p>
          </div>
          {loading ? (
            <div className="history-loading">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="history-empty">No inventory history available.</div>
          ) : (
            <div className="history-list">
              {history.map((entry) => (
                <div key={entry.id} className="history-item">
                  <div className="history-date">{formatDate(entry.change_date)}</div>
                  <div className="history-change">
                    <span className="old-quantity">{entry.old_quantity}</span>
                    <span className="arrow">→</span>
                    <span className="new-quantity">{entry.new_quantity}</span>
                  </div>
                  <div className="history-difference">
                    {entry.new_quantity > entry.old_quantity ? (
                      <span className="diff-positive">
                        +{entry.new_quantity - entry.old_quantity}
                      </span>
                    ) : (
                      <span className="diff-negative">
                        {entry.new_quantity - entry.old_quantity}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistorySidebar;

