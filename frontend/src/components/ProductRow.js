import React, { useState } from 'react';
import './ProductRow.css';
import { productsAPI } from '../services/api';

function ProductRow({ product, onUpdate, onDelete, onViewHistory }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState({ ...product });
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProduct({ ...product });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProduct({ ...product });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await productsAPI.update(product.id, editedProduct);
      onUpdate(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating product:', error);
      alert(
        error.response?.data?.error || 'Failed to update product. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setEditedProduct({
      ...editedProduct,
      [field]: value,
    });
  };

  const getStockStatus = (stock) => {
    if (stock === 0) {
      return { text: 'Out of Stock', class: 'status-out-of-stock' };
    }
    return { text: 'In Stock', class: 'status-in-stock' };
  };

  const status = getStockStatus(product.stock);

  if (isEditing) {
    return (
      <tr className="editing-row">
        <td>{product.id}</td>
        <td>
          <input
            type="text"
            value={editedProduct.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="edit-input"
          />
        </td>
        <td>
          <input
            type="text"
            value={editedProduct.unit || ''}
            onChange={(e) => handleChange('unit', e.target.value)}
            className="edit-input"
          />
        </td>
        <td>
          <input
            type="text"
            value={editedProduct.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
            className="edit-input"
          />
        </td>
        <td>
          <input
            type="text"
            value={editedProduct.brand || ''}
            onChange={(e) => handleChange('brand', e.target.value)}
            className="edit-input"
          />
        </td>
        <td>
          <input
            type="number"
            value={editedProduct.stock || 0}
            onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
            className="edit-input"
            min="0"
          />
        </td>
        <td>
          <input
            type="text"
            value={editedProduct.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
            className="edit-input"
          />
        </td>
        <td>
          <div className="actions-cell">
            <button
              className="action-btn action-btn-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="action-btn action-btn-cancel"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{product.id}</td>
      <td>{product.name}</td>
      <td>{product.unit || '-'}</td>
      <td>{product.category || '-'}</td>
      <td>{product.brand || '-'}</td>
      <td>{product.stock}</td>
      <td>
        <span className={`status-badge ${status.class}`}>{status.text}</span>
      </td>
      <td>
        <div className="actions-cell">
          <button
            className="action-btn action-btn-edit"
            onClick={handleEdit}
          >
            Edit
          </button>
          <button
            className="action-btn action-btn-delete"
            onClick={() => onDelete(product.id)}
          >
            Delete
          </button>
          <button
            className="action-btn action-btn-history"
            onClick={() => onViewHistory(product)}
          >
            History
          </button>
        </div>
      </td>
    </tr>
  );
}

export default ProductRow;

