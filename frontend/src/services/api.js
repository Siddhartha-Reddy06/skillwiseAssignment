import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const productsAPI = {
  getAll: (params = {}) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  search: (name) => api.get('/products/search', { params: { name } }),
  getHistory: (id) => api.get(`/products/${id}/history`),
  getCategories: () => api.get('/products/categories/list'),
  import: (file) => {
    const formData = new FormData();
    formData.append('csvFile', file);
    return api.post('/products/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  export: () => api.get('/products/export', { responseType: 'blob' }),
};

export default api;

