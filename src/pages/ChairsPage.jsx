import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import ConfirmModal from '../components/ConfirmModal';
import {
  Armchair,
  Plus,
  Edit2,
  Trash2,
  Clock,
  User,
  Phone,
  CheckCircle2,
  X,
  Radio,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ChairsPage = () => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const { socket } = useSocket();

  const [chairs, setChairs] = useState([]);
  const [attendants, setAttendants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Chair Add/Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChair, setEditingChair] = useState(null);
  const [formData, setFormData] = useState({
    chairNumber: '',
    name: '',
    floor: 'Main Floor',
    section: 'General Styling',
    assignedAttendant: '',
    notes: '',
    status: 'Available',
  });

  // Live Status Change Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetChair, setTargetChair] = useState(null);
  const [statusFormData, setStatusFormData] = useState({
    status: 'Available',
    currentCustomer: '',
    currentCustomerMobile: '',
    assignedAttendant: '',
    notes: '',
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [chairToDelete, setChairToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchChairs = async () => {
    try {
      setLoading(true);
      const [chrRes, attRes] = await Promise.all([
        api.get(`/chairs?search=${search}&status=${statusFilter}`),
        api.get('/attendants?status=active'),
      ]);
      if (chrRes.data.success) setChairs(chrRes.data.chairs);
      if (attRes.data.success) setAttendants(attRes.data.attendants);
    } catch (err) {
      console.error('Failed to load chairs:', err);
      toast.error('Failed to load chairs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChairs();
  }, [search, statusFilter]);

  // Real-time WebSocket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleChairUpdate = () => {
      fetchChairs();
    };

    socket.on('chair:created', handleChairUpdate);
    socket.on('chair:updated', handleChairUpdate);
    socket.on('chair:status-changed', handleChairUpdate);
    socket.on('chair:deleted', handleChairUpdate);

    return () => {
      socket.off('chair:created', handleChairUpdate);
      socket.off('chair:updated', handleChairUpdate);
      socket.off('chair:status-changed', handleChairUpdate);
      socket.off('chair:deleted', handleChairUpdate);
    };
  }, [socket]);

  const openCreateModal = () => {
    setEditingChair(null);
    setFormData({
      chairNumber: `C-${String(chairs.length + 1).padStart(2, '0')}`,
      name: `Styling Station ${chairs.length + 1}`,
      floor: 'Ground Floor',
      section: 'Main Styling Area',
      assignedAttendant: '',
      notes: '',
      status: 'Available',
    });
    setModalOpen(true);
  };

  const openEditModal = (chair) => {
    setEditingChair(chair);
    setFormData({
      chairNumber: chair.chairNumber,
      name: chair.name,
      floor: chair.floor,
      section: chair.section,
      assignedAttendant: chair.assignedAttendant?._id || '',
      notes: chair.notes || '',
      status: chair.status,
    });
    setModalOpen(true);
  };

  const openStatusModal = (chair) => {
    setTargetChair(chair);
    setStatusFormData({
      status: chair.status,
      currentCustomer: chair.currentCustomer || '',
      currentCustomerMobile: chair.currentCustomerMobile || '',
      assignedAttendant: chair.assignedAttendant?._id || '',
      notes: chair.notes || '',
    });
    setStatusModalOpen(true);
  };

  const handleSaveChair = async (e) => {
    e.preventDefault();
    if (!formData.chairNumber.trim() || !formData.name.trim()) {
      toast.error('Chair number and name are required');
      return;
    }

    try {
      setIsProcessing(true);
      if (editingChair) {
        await api.put(`/chairs/${editingChair._id}`, formData);
        toast.success('Chair configuration updated');
      } else {
        await api.post('/chairs', formData);
        toast.success('Chair added to salon layout');
      }
      setModalOpen(false);
      fetchChairs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save chair');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!targetChair) return;

    try {
      setIsProcessing(true);
      await api.patch(`/chairs/${targetChair._id}/status`, statusFormData);
      toast.success(`Chair ${targetChair.chairNumber} status set to ${statusFormData.status}`);
      setStatusModalOpen(false);
      setTargetChair(null);
      fetchChairs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update chair status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!chairToDelete) return;
    try {
      setIsProcessing(true);
      await api.delete(`/chairs/${chairToDelete._id}`);
      toast.success('Chair removed');
      setDeleteModalOpen(false);
      setChairToDelete(null);
      fetchChairs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove chair');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30';
      case 'Occupied':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'Reserved':
        return 'bg-gold-500/10 text-gold-600 dark:text-gold-400 border-gold-500/30';
      case 'Maintenance':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-serif">
            <Armchair className="w-6 h-6 text-gold-500" />
            Chairs & Styling Stations
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time station occupancy, customer check-in and attendant assignment
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold text-xs shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Chair</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by chair number, customer name, floor..."
          onClear={() => setSearch('')}
        />

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-400 font-semibold shrink-0">Filter Status:</span>
          {['All', 'Available', 'Occupied', 'Reserved', 'Maintenance'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-medium transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-black text-white dark:bg-gold-500 dark:text-black font-bold shadow-sm'
                  : 'bg-gray-100 dark:bg-charcoal-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Chairs Visual Grid Map */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs text-gray-400">Loading stations...</div>
        ) : chairs.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-gray-400">No chairs found.</div>
        ) : (
          chairs.map((chair) => (
            <div
              key={chair._id}
              className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 p-5 shadow-sm hover:border-gold-500/50 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-charcoal-800 text-gold-400 font-bold font-mono text-sm flex items-center justify-center border border-gold-500/30">
                      {chair.chairNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">{chair.name}</h4>
                      <p className="text-[10px] text-gray-500">{chair.floor} • {chair.section}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(chair.status)}`}>
                    {chair.status}
                  </span>
                </div>

                {/* Occupancy Info */}
                <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-charcoal-950/70 border border-gray-100 dark:border-charcoal-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Customer:
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {chair.currentCustomer || <em className="text-gray-400 font-normal">None (Free)</em>}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> Attendant:
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {chair.assignedAttendant?.fullName || 'Unassigned'}
                    </span>
                  </div>

                  {chair.startTime && (
                    <div className="flex items-center justify-between text-[10px] text-blue-600 dark:text-blue-400 pt-1 border-t dark:border-charcoal-800">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> In Session Since:
                      </span>
                      <span className="font-mono">
                        {new Date(chair.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 dark:border-charcoal-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => openStatusModal(chair)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-black text-white dark:bg-gold-500 dark:text-black text-xs font-bold hover:bg-charcoal-800 dark:hover:bg-gold-400 transition-all text-center shadow-sm"
                >
                  Change Status
                </button>

                <button
                  onClick={() => openEditModal(chair)}
                  className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800 rounded-lg"
                  title="Configure Chair"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setChairToDelete(chair);
                      setDeleteModalOpen(true);
                    }}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-lg"
                    title="Remove Chair (Super Admin Only)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chair Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-charcoal-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {editingChair ? 'Edit Styling Station' : 'Add New Styling Station'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChair} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Chair No / Code *</label>
                  <input
                    type="text"
                    value={formData.chairNumber}
                    onChange={(e) => setFormData({ ...formData, chairNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Chair Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Floor</label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Default Attendant</label>
                <select
                  value={formData.assignedAttendant}
                  onChange={(e) => setFormData({ ...formData, assignedAttendant: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                >
                  <option value="">-- No Default Attendant --</option>
                  {attendants.map((a) => (
                    <option key={a._id} value={a._id}>{a.fullName} ({a.attendantId})</option>
                  ))}
                </select>
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
                  {isProcessing ? 'Saving...' : 'Save Chair'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Live Status Change Modal */}
      {statusModalOpen && targetChair && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-charcoal-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                Update Status: Chair {targetChair.chairNumber}
              </h3>
              <button onClick={() => setStatusModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={statusFormData.status}
                  onChange={(e) => setStatusFormData({ ...statusFormData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-bold"
                >
                  <option value="Available">Available (Vacant & Ready)</option>
                  <option value="Occupied">Occupied (Service in progress)</option>
                  <option value="Reserved">Reserved (Appointment booked)</option>
                  <option value="Maintenance">Maintenance (Cleaning / Repair)</option>
                </select>
              </div>

              {statusFormData.status === 'Occupied' && (
                <>
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={statusFormData.currentCustomer}
                      onChange={(e) => setStatusFormData({ ...statusFormData, currentCustomer: e.target.value })}
                      placeholder="e.g., Suresh Babu"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Customer Mobile</label>
                    <input
                      type="tel"
                      value={statusFormData.currentCustomerMobile}
                      onChange={(e) => setStatusFormData({ ...statusFormData, currentCustomerMobile: e.target.value })}
                      placeholder="10-digit mobile"
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Assigned Stylist</label>
                <select
                  value={statusFormData.assignedAttendant}
                  onChange={(e) => setStatusFormData({ ...statusFormData, assignedAttendant: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                >
                  <option value="">-- No Stylist Assigned --</option>
                  {attendants.map((a) => (
                    <option key={a._id} value={a._id}>{a.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-200 dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-lg bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold shadow-md"
                >
                  {isProcessing ? 'Updating...' : 'Update Live Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && chairToDelete && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setChairToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Remove Styling Station"
          message={`Are you sure you want to delete chair "${chairToDelete.chairNumber} - ${chairToDelete.name}"?`}
          confirmText="Yes, Remove"
          isDanger={true}
          loading={isProcessing}
        />
      )}
    </div>
  );
};

export default ChairsPage;
