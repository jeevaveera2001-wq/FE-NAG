import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import {
  Scissors,
  Plus,
  Edit2,
  Trash2,
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Hair',
  'Skin',
  'Beauty',
  'Makeup',
  'Facial',
  'Hair Colouring',
  'Hair Treatment',
  'Bridal Packages',
  'Grooming Packages',
];

export const ServicesPage = () => {
  const { isSuperAdmin, isAdmin, isReception } = useAuth();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Hair',
    genderCategory: 'Unisex',
    description: '',
    duration: 30,
    price: 0,
    discountPrice: 0,
    taxPercentage: 18,
    isActive: true,
  });

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchServices = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        genderCategory: selectedGender !== 'All' ? selectedGender : undefined,
        isActive: selectedStatus !== 'All' ? selectedStatus === 'active' : undefined,
      };

      const res = await api.get('/services', { params });
      if (res.data.success) {
        setServices(res.data.services);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices(1);
  }, [search, selectedCategory, selectedGender, selectedStatus]);

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      category: 'Hair',
      genderCategory: 'Unisex',
      description: '',
      duration: 30,
      price: 0,
      discountPrice: 0,
      taxPercentage: 18,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      category: service.category,
      genderCategory: service.genderCategory,
      description: service.description || '',
      duration: service.duration || 30,
      price: service.price,
      discountPrice: service.discountPrice || 0,
      taxPercentage: service.taxPercentage || 18,
      isActive: service.isActive,
    });
    setModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Service name is required');
      return;
    }

    try {
      setIsProcessing(true);
      if (editingService) {
        await api.put(`/services/${editingService._id}`, formData);
        toast.success('Service updated successfully');
      } else {
        await api.post('/services', formData);
        toast.success('Service added to menu');
      }
      setModalOpen(false);
      fetchServices(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save service');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    try {
      setIsProcessing(true);
      await api.delete(`/services/${serviceToDelete._id}`);
      toast.success('Service removed from menu');
      setDeleteModalOpen(false);
      setServiceToDelete(null);
      fetchServices(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove service');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (services.length === 0) return;
    const data = services.map((s) => ({
      'Service Name': s.name,
      Category: s.category,
      Gender: s.genderCategory,
      'Duration (Mins)': s.duration,
      'Price (₹)': s.price,
      'Discount Price (₹)': s.discountPrice,
      'GST %': s.taxPercentage,
      Status: s.isActive ? 'Active' : 'Inactive',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Services Menu');
    XLSX.writeFile(workbook, `Nagulan_Services_Menu_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Menu exported to Excel!');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-serif">
            <Scissors className="w-6 h-6 text-gold-500" />
            Services & Salon Menu
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage treatment packages, hair styling, skin care, bridal and grooming catalog
          </p>
        </div>

        {!isReception && (
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 hover:bg-gray-50 dark:hover:bg-charcoal-800 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Export Menu</span>
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Service</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by service name, category, description..."
          onClear={() => setSearch('')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100 dark:border-charcoal-800 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Gender</label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
            >
              <option value="All">All Genders</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Unisex">Unisex</option>
              <option value="Kids">Kids</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                <th className="py-3.5 px-4">Service Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Target Gender</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4 text-right">Base Price</th>
                <th className="py-3.5 px-4 text-right">Tax (GST)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-700 dark:text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">Loading services...</td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">No services found.</td>
                </tr>
              ) : (
                services.map((srv) => (
                  <tr key={srv._id} className="hover:bg-gray-50 dark:hover:bg-charcoal-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 dark:text-white block">{srv.name}</span>
                      {srv.description && <span className="text-[10px] text-gray-400 line-clamp-1">{srv.description}</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-charcoal-800 text-gray-800 dark:text-gray-200">
                        {srv.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{srv.genderCategory}</td>
                    <td className="py-3.5 px-4 font-mono">{srv.duration} mins</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-900 dark:text-white">
                      ₹ {srv.price}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono">{srv.taxPercentage}%</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          srv.isActive
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {srv.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {srv.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!isReception ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(srv)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800 rounded-lg"
                            title="Edit Service"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isSuperAdmin && (
                            <button
                              onClick={() => {
                                setServiceToDelete(srv);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-lg"
                              title="Remove Service (Super Admin Only)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">View Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination pagination={pagination} onPageChange={(page) => fetchServices(page)} />
      </div>

      {/* Service Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-charcoal-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Scissors className="w-5 h-5 text-gold-500" />
                {editingService ? 'Edit Salon Service' : 'Add New Salon Service'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Keratin Hair Treatment"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-gold-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Gender</label>
                  <select
                    value={formData.genderCategory}
                    onChange={(e) => setFormData({ ...formData, genderCategory: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                  >
                    <option value="Unisex">Unisex</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
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

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Description / Notes</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Optional service highlights and included treatments"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-gold-500"
                />
                <label htmlFor="isActive" className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                  Active in Salon Menu
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-200 dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-lg bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold shadow-md"
                >
                  {isProcessing ? 'Saving...' : editingService ? 'Update Service' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && serviceToDelete && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setServiceToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Remove Salon Service"
          message={`Are you sure you want to remove "${serviceToDelete.name}" from the active menu?`}
          confirmText="Yes, Remove"
          isDanger={true}
          loading={isProcessing}
        />
      )}
    </div>
  );
};

export default ServicesPage;
