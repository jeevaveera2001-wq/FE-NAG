import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import {
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminManagementPage = () => {
  const { isSuperAdmin } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Add/Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    username: '',
    email: '',
    mobile: '',
    password: '',
    role: 'admin',
    shift: 'Full Day',
    status: 'active',
  });

  // Password Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [targetAdminForPassword, setTargetAdminForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAdmins = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search,
        role: roleFilter !== 'All' ? roleFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      };

      const res = await api.get('/users', { params });
      if (res.data.success) {
        // Exclude the logged-in superadmin from the list of managed users
        const managedUsers = res.data.users.filter((u) => u.role !== 'superadmin');
        setAdmins(managedUsers);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load user accounts:', err);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins(1);
  }, [search, roleFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingAdmin(null);
    setFormData({
      employeeId: `ADM-${String(100 + admins.length + 1)}`,
      fullName: '',
      username: '',
      email: '',
      mobile: '',
      password: 'Admin@123',
      role: 'admin',
      shift: 'Full Day',
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      employeeId: admin.employeeId,
      fullName: admin.fullName,
      username: admin.username,
      email: admin.email,
      mobile: admin.mobile,
      password: '',
      role: admin.role || 'admin',
      shift: admin.shift || 'Full Day',
      status: admin.status,
    });
    setModalOpen(true);
  };

  const handleSaveAdmin = async (e) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      if (editingAdmin) {
        await api.put(`/users/${editingAdmin._id}`, formData);
        toast.success('User account updated');
      } else {
        await api.post('/users', formData);
        toast.success(`${formData.role === 'reception' ? 'Reception' : 'Admin'} account created successfully`);
      }
      setModalOpen(false);
      fetchAdmins(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user account');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsProcessing(true);
      await api.post(`/users/${targetAdminForPassword._id}/reset-password`, { newPassword });
      toast.success(`Password reset for ${targetAdminForPassword.fullName}`);
      setPasswordModalOpen(false);
      setTargetAdminForPassword(null);
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!adminToDelete) return;
    try {
      setIsProcessing(true);
      await api.delete(`/users/${adminToDelete._id}`);
      toast.success('Admin account removed');
      setDeleteModalOpen(false);
      setAdminToDelete(null);
      fetchAdmins(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove admin');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-serif">
            <ShieldAlert className="w-6 h-6 text-gold-500" />
            Admin & Reception Management
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage Admin and Front-Desk Reception credentials, permissions, and roles
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold text-xs shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add User Account</span>
        </button>
      </div>

      <div className="bg-white dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search user by name, username, mobile, employee ID..."
          onClear={() => setSearch('')}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-gray-100 dark:border-charcoal-800">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-gray-500">Role:</span>
            {['All', 'admin', 'reception'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  roleFilter === r
                    ? 'bg-black text-white dark:bg-gold-500 dark:text-black shadow-xs'
                    : 'bg-gray-100 dark:bg-charcoal-800 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {r === 'All' ? 'All Roles' : r}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-gray-500">Status:</span>
            {['All', 'active', 'inactive'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-black text-white dark:bg-gold-500 dark:text-black shadow-xs'
                    : 'bg-gray-100 dark:bg-charcoal-800 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                {st === 'All' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                <th className="py-3.5 px-4">Emp ID</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-700 dark:text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">Loading accounts...</td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">No user accounts found.</td>
                </tr>
              ) : (
                admins.map((ad) => (
                  <tr key={ad._id} className="hover:bg-gray-50 dark:hover:bg-charcoal-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {ad.employeeId}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">{ad.fullName}</td>
                    <td className="py-3.5 px-4 font-mono text-gray-900 dark:text-white">@{ad.username}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          ad.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : ad.role === 'reception'
                            ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20'
                            : 'bg-gold-500/10 text-gold-600 border border-gold-500/20'
                        }`}
                      >
                        {ad.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{ad.email}</td>
                    <td className="py-3.5 px-4 font-mono">{ad.mobile}</td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {ad.lastLogin ? new Date(ad.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          ad.status === 'active'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        {ad.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {ad.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setTargetAdminForPassword(ad);
                            setPasswordModalOpen(true);
                          }}
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800 rounded-lg"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openEditModal(ad)}
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800 rounded-lg"
                          title="Edit User Account"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setAdminToDelete(ad);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-lg"
                          title="Remove User Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination pagination={pagination} onPageChange={(p) => fetchAdmins(p)} />
      </div>

      {/* Admin Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-charcoal-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {editingAdmin ? 'Edit User Account' : 'Create New User Account'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdmin} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Assigned Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-bold"
                  required
                >
                  <option value="admin">Admin (Live Dashboard, Add Products, Services, Chairs, Bills - No Deletion)</option>
                  <option value="reception">Reception (POS Billing, Sales History, View-Only Services, Products, Customers)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={!!editingAdmin}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white disabled:opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  maxLength={10}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono"
                  required
                />
              </div>

              {!editingAdmin && (
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <label className="block font-semibold text-gray-700 dark:text-gray-300">Account Status:</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="px-2.5 py-1 rounded-lg border dark:border-charcoal-700 bg-white dark:bg-charcoal-950 font-bold"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive / Deactivated</option>
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
                  {isProcessing ? 'Saving...' : 'Save Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordModalOpen && targetAdminForPassword && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-charcoal-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                Reset Password: {targetAdminForPassword.fullName}
              </h3>
              <button onClick={() => setPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  New Password (min 6 characters) *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-200 dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-lg bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold shadow-md"
                >
                  {isProcessing ? 'Updating...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && adminToDelete && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setAdminToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Remove Admin Account"
          message={`Are you sure you want to permanently delete Admin "${adminToDelete.fullName}"?`}
          confirmText="Yes, Remove"
          isDanger={true}
          loading={isProcessing}
        />
      )}
    </div>
  );
};

export default AdminManagementPage;
