import React, { useState, useEffect } from 'react';
import './ProductManagement.css';
import ProductTable from './ProductTable';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import ImportExportButtons from './ImportExportButtons';
import AddProductModal from './AddProductModal';
import HistorySidebar from './HistorySidebar';
import { productsAPI } from '../services/api';

function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, products]);

  const fetchProducts = async (params = {}) => {
    setLoading(true);
    try {
      const response = await productsAPI.getAll({
        page: pagination.page,
        limit: pagination.limit,
        ...params
      });
      setProducts(response.data.products);
      setPagination(response.data.pagination || pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
  };

  const handleProductUpdate = (updatedProduct) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleProductDelete = (productId) => {
    setProducts(products.filter(p => p.id !== productId));
  };

  const handleProductAdd = (newProduct) => {
    setProducts([...products, newProduct]);
    setIsAddModalOpen(false);
    fetchCategories(); // Refresh categories in case new one was added
  };

  const handleImportSuccess = () => {
    fetchProducts();
    fetchCategories();
  };

  const handleViewHistory = (product) => {
    setSelectedProduct(product);
    setIsHistoryOpen(true);
  };

  const handleCloseHistory = () => {
    setIsHistoryOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="product-management">
      <div className="header">
        <div className="header-left">
          <h1>Inventory Management</h1>
          <SearchBar onSearch={handleSearch} />
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryFilter}
          />
          <button
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Add New Product
          </button>
        </div>
        <div className="header-right">
          <ImportExportButtons onImportSuccess={handleImportSuccess} />
        </div>
      </div>

      <div className="content">
        <ProductTable
          products={filteredProducts}
          loading={loading}
          onUpdate={handleProductUpdate}
          onDelete={handleProductDelete}
          onViewHistory={handleViewHistory}
        />
      </div>

      {isAddModalOpen && (
        <AddProductModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleProductAdd}
        />
      )}

      {isHistoryOpen && selectedProduct && (
        <HistorySidebar
          product={selectedProduct}
          onClose={handleCloseHistory}
        />
      )}
    </div>
  );
}

export default ProductManagement;

