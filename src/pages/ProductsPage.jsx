import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  History,
  FileSpreadsheet,
  X,
  CheckCircle2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export const ProductsPage = () => {
  const { isSuperAdmin, isAdmin, isReception } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    brand: 'General',
    category: 'Hair Care',
    purchasePrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    minStockWarning: 5,
    taxPercentage: 18,
    isActive: true,
  });

  // Stock Adjustment Modal
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockTargetProduct, setStockTargetProduct] = useState(null);
  const [stockAdjustment, setStockAdjustment] = useState({
    type: 'stock-in',
    quantity: 1,
    reason: '',
  });

  // Inventory History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        lowStockOnly: lowStockOnly ? 'true' : undefined,
      };

      const res = await api.get('/products', { params });
      if (res.data.success) {
        setProducts(res.data.products);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [search, selectedCategory, lowStockOnly]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      brand: 'General',
      category: 'Hair Care',
      purchasePrice: 0,
      sellingPrice: 0,
      currentStock: 10,
      minStockWarning: 5,
      taxPercentage: 18,
      isActive: true,
    });
    setProductModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      brand: product.brand,
      category: product.category,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      currentStock: product.currentStock,
      minStockWarning: product.minStockWarning,
      taxPercentage: product.taxPercentage,
      isActive: product.isActive,
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error('Product name and SKU are required');
      return;
    }

    try {
      setIsProcessing(true);
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formData);
        toast.success('Product updated');
      } else {
        await api.post('/products', formData);
        toast.success('Product added to inventory');
      }
      setProductModalOpen(false);
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!stockTargetProduct) return;

    try {
      setIsProcessing(true);
      await api.post(`/products/${stockTargetProduct._id}/adjust-stock`, stockAdjustment);
      toast.success('Stock adjusted successfully');
      setStockModalOpen(false);
      setStockTargetProduct(null);
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Stock adjustment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const openStockHistory = async (product) => {
    try {
      setHistoryLoading(true);
      setHistoryModalOpen(true);
      const res = await api.get(`/products/history?productId=${product._id}`);
      if (res.data.success) {
        setHistoryLogs(res.data.transactions);
      }
    } catch (err) {
      toast.error('Failed to load transaction history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsProcessing(true);
      await api.delete(`/products/${productToDelete._id}`);
      toast.success('Product removed');
      setDeleteModalOpen(false);
      setProductToDelete(null);
      fetchProducts(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove product');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportToExcel = () => {
    if (products.length === 0) return;
    const data = products.map((p) => ({
      SKU: p.sku,
      'Product Name': p.name,
      Brand: p.brand,
      Category: p.category,
      'Purchase Price (₹)': p.purchasePrice,
      'Selling Price (₹)': p.sellingPrice,
      'Current Stock': p.currentStock,
      'Min Stock Warning': p.minStockWarning,
      'GST %': p.taxPercentage,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
    XLSX.writeFile(workbook, `Nagulan_Inventory_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Inventory exported!');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-serif">
            <Package className="w-6 h-6 text-gold-500" />
            Retail Products & Inventory
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage salon retail inventory, stock intake, adjustments and low-stock alerts
          </p>
        </div>

        {!isReception && (
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 hover:bg-gray-50 dark:hover:bg-charcoal-800 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Export Stock</span>
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by SKU, product name, brand, category..."
          onClear={() => setSearch('')}
        />

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-charcoal-800 text-xs">
          <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 cursor-pointer font-medium">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded text-gold-500"
            />
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              Show Low Stock Only
            </span>
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                <th className="py-3.5 px-4">SKU Code</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Brand & Category</th>
                <th className="py-3.5 px-4 text-right">Purchase Price</th>
                <th className="py-3.5 px-4 text-right">Selling Price</th>
                <th className="py-3.5 px-4 text-center">Stock Level</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-700 dark:text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">Loading products...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">No products found.</td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.currentStock <= p.minStockWarning;
                  return (
                    <tr
                      key={p._id}
                      className={`hover:bg-gray-50 dark:hover:bg-charcoal-800/40 transition-colors ${
                        isLow ? 'bg-red-500/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">{p.sku}</td>
                      <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">{p.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-gray-900 dark:text-gray-100 font-semibold block">{p.brand}</span>
                        <span className="text-[10px] text-gray-500">{p.category}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-gray-500">₹ {p.purchasePrice}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900 dark:text-white">
                        ₹ {p.sellingPrice}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                            isLow
                              ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                              : 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30'
                          }`}
                        >
                          {p.currentStock} Units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isReception ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setStockTargetProduct(p);
                                setStockAdjustment({ type: 'stock-in', quantity: 10, reason: 'Stock replenishment' });
                                setStockModalOpen(true);
                              }}
                              className="px-2 py-1 bg-gray-100 dark:bg-charcoal-800 hover:bg-gold-500 hover:text-black rounded text-[11px] font-semibold transition-all"
                              title="Adjust Stock"
                            >
                              Adjust Stock
                            </button>

                            <button
                              onClick={() => openStockHistory(p)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800 rounded-lg"
                              title="View Stock History"
                            >
                              <History className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800 rounded-lg"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {isSuperAdmin && (
                              <button
                                onClick={() => {
                                  setProductToDelete(p);
                                  setDeleteModalOpen(true);
                                }}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-lg"
                                title="Delete Product (Super Admin Only)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openStockHistory(p)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800 rounded-lg"
                              title="View Stock History"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <span className="text-[11px] text-gray-400 italic">View Only</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination pagination={pagination} onPageChange={(page) => fetchProducts(page)} />
      </div>

      {/* Product Create / Edit Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-charcoal-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-gold-500" />
                {editingProduct ? 'Edit Retail Product' : 'Add New Retail Product'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., L'Oreal Serie Expert Shampoo"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    SKU Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Hair Care, Styling"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Purchase Price (₹)</label>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {!editingProduct && (
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Initial Stock</label>
                    <input
                      type="number"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Low Stock Warning</label>
                  <input
                    type="number"
                    value={formData.minStockWarning}
                    onChange={(e) => setFormData({ ...formData, minStockWarning: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">GST Tax %</label>
                  <input
                    type="number"
                    value={formData.taxPercentage}
                    onChange={(e) => setFormData({ ...formData, taxPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-200 dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-lg bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold shadow-md"
                >
                  {isProcessing ? 'Saving...' : editingProduct ? 'Update Product' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {stockModalOpen && stockTargetProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-charcoal-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                Adjust Stock: {stockTargetProduct.name}
              </h3>
              <button onClick={() => setStockModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="mt-4 space-y-3.5 text-xs">
              <div>
                <span className="text-gray-500 block mb-1">
                  Current Stock: <strong className="text-gray-900 dark:text-white font-mono">{stockTargetProduct.currentStock} Units</strong>
                </span>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Adjustment Type</label>
                <select
                  value={stockAdjustment.type}
                  onChange={(e) => setStockAdjustment({ ...stockAdjustment, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                >
                  <option value="stock-in">Stock In (+) - New Shipment Intake</option>
                  <option value="stock-out">Stock Out (-) - Damaged / Expired Removal</option>
                  <option value="adjustment">Stock Adjustment (Exact Count Correction)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                <input
                  type="number"
                  value={stockAdjustment.quantity}
                  onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: Number(e.target.value) })}
                  min={1}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={stockAdjustment.reason}
                  onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
                  placeholder="e.g., Weekly supplier delivery, shelf damage write-off"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-200 dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-lg bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold shadow-md"
                >
                  {isProcessing ? 'Updating...' : 'Confirm Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Transaction History Modal */}
      {historyModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-charcoal-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-gold-500" />
                Stock Transaction Ledger
              </h3>
              <button onClick={() => setHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto">
              {historyLoading ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading ledger...</div>
              ) : historyLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">No transactions recorded yet.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b dark:border-charcoal-800 text-gray-500">
                      <th className="py-2">Date</th>
                      <th className="py-2">Type</th>
                      <th className="py-2 text-right">Qty</th>
                      <th className="py-2 text-right">Stock Level</th>
                      <th className="py-2">Reason</th>
                      <th className="py-2">Actor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-charcoal-800">
                    {historyLogs.map((log) => (
                      <tr key={log._id}>
                        <td className="py-2 text-gray-500">{new Date(log.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="py-2 font-semibold capitalize">{log.type}</td>
                        <td className="py-2 text-right font-mono font-bold">
                          {log.type === 'stock-in' ? `+${log.quantity}` : `-${log.quantity}`}
                        </td>
                        <td className="py-2 text-right font-mono text-gray-400">
                          {log.previousStock} &rarr; {log.newStock}
                        </td>
                        <td className="py-2 text-gray-600 dark:text-gray-300">{log.reason || '-'}</td>
                        <td className="py-2 text-gray-500">{log.createdBy?.fullName || 'System'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && productToDelete && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setProductToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Remove Product"
          message={`Are you sure you want to remove "${productToDelete.name}" (${productToDelete.sku}) from inventory?`}
          confirmText="Yes, Remove"
          isDanger={true}
          loading={isProcessing}
        />
      )}
    </div>
  );
};

export default ProductsPage;
