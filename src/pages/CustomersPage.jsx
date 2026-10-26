import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import {
  UserSquare2,
  Plus,
  Phone,
  MessageSquare,
  History,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
  Receipt,
  User,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export const CustomersPage = () => {
  const { isReception } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });

  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    gender: 'Unspecified',
    address: '',
    notes: '',
  });

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [customerBills, setCustomerBills] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/customers?page=${page}&limit=15&search=${search}`);
      if (res.data.success) {
        setCustomers(res.data.customers);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [search]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      gender: 'Unspecified',
      address: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      mobile: cust.mobile,
      email: cust.email || '',
      gender: cust.gender || 'Unspecified',
      address: cust.address || '',
      notes: cust.notes || '',
    });
    setModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      toast.error('Customer name and mobile are required');
      return;
    }

    try {
      setIsProcessing(true);
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer._id}`, formData);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', formData);
        toast.success('Customer profile created');
      }
      setModalOpen(false);
      fetchCustomers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setIsProcessing(false);
    }
  };

  const viewCustomerHistory = async (cust) => {
    try {
      setHistoryCustomer(cust);
      setHistoryLoading(true);
      setHistoryModalOpen(true);
      const res = await api.get(`/customers/${cust._id}`);
      if (res.data.success) {
        setCustomerBills(res.data.bills);
      }
    } catch (err) {
      toast.error('Failed to load customer billing history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleWhatsApp = (cust) => {
    const formatted = cust.mobile.length === 10 ? `91${cust.mobile}` : cust.mobile;
    const text = encodeURIComponent(`Hello ${cust.name}, greetings from NAGULAN Unisex Salon! ✨ We look forward to serving you again soon.`);
    window.open(`https://wa.me/${formatted}?text=${text}`, '_blank');
  };

  const exportToExcel = () => {
    if (customers.length === 0) return;
    const data = customers.map((c) => ({
      'Customer Name': c.name,
      Mobile: c.mobile,
      Email: c.email,
      Gender: c.gender,
      'Total Visits': c.totalVisits,
      'Total Spent (₹)': c.totalSpent,
      'Last Visit': c.lastVisit ? new Date(c.lastVisit).toLocaleDateString('en-IN') : 'N/A',
      Notes: c.notes,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');
    XLSX.writeFile(workbook, `Nagulan_Clients_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Clients exported to Excel!');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-serif">
            <UserSquare2 className="w-6 h-6 text-gold-500" />
            Customer Management (CRM)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Client profiles, visit history, total revenue, and direct WhatsApp shortcuts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isReception && (
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
              View Only Access
            </span>
          )}

          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 hover:bg-gray-50 dark:hover:bg-charcoal-800 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span>Export Clients</span>
          </button>

          {!isReception && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold text-xs shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by customer name, mobile number, email, address..."
          onClear={() => setSearch('')}
        />
      </div>

      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Mobile Number</th>
                <th className="py-3.5 px-4">Gender</th>
                <th className="py-3.5 px-4 text-center">Total Visits</th>
                <th className="py-3.5 px-4 text-right">Total Spent</th>
                <th className="py-3.5 px-4">Last Visit</th>
                <th className="py-3.5 px-4 text-right">Quick Contact & Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-700 dark:text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">Loading customer database...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">No customers found.</td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust._id} className="hover:bg-gray-50 dark:hover:bg-charcoal-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 dark:text-white block">{cust.name}</span>
                      {cust.email && <span className="text-[10px] text-gray-400">{cust.email}</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">{cust.mobile}</td>
                    <td className="py-3.5 px-4">{cust.gender}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-charcoal-800 font-bold font-mono">
                        {cust.totalVisits}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gold-600 dark:text-gold-400">
                      ₹ {Number(cust.totalSpent || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {cust.lastVisit ? new Date(cust.lastVisit).toLocaleDateString('en-IN') : 'New'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`tel:${cust.mobile}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg"
                          title="Call Client"
                        >
                          <Phone className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => handleWhatsApp(cust)}
                          className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg"
                          title="Send WhatsApp Message"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => viewCustomerHistory(cust)}
                          className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800 rounded-lg"
                          title="View Invoices"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {!isReception ? (
                          <button
                            onClick={() => openEditModal(cust)}
                            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800 rounded-lg"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic pl-1">View Only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination pagination={pagination} onPageChange={(p) => fetchCustomers(p)} />
      </div>

      {/* Customer Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-charcoal-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Manoj Kumar"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Unspecified">Unspecified</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Notes / Preferences</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="e.g., Prefers Rajesh stylist, ammonia-free hair dyes..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                />
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
                  {isProcessing ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Invoices History Modal */}
      {historyModalOpen && historyCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-charcoal-800">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-gold-500" />
                  Visit & Invoice History: {historyCustomer.name}
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{historyCustomer.mobile}</p>
              </div>
              <button onClick={() => setHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto">
              {historyLoading ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading visit history...</div>
              ) : customerBills.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">No past bills on file for this client.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b dark:border-charcoal-800 text-gray-500">
                      <th className="py-2">Bill No</th>
                      <th className="py-2">Date</th>
                      <th className="py-2">Attendant</th>
                      <th className="py-2 text-right">Amount</th>
                      <th className="py-2">Payment</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-charcoal-800">
                    {customerBills.map((b) => (
                      <tr key={b._id}>
                        <td className="py-2 font-mono font-bold text-gray-900 dark:text-white">{b.billNumber}</td>
                        <td className="py-2 text-gray-500">{new Date(b.billDate).toLocaleDateString('en-IN')}</td>
                        <td className="py-2">{b.attendant?.name || 'Stylist'}</td>
                        <td className="py-2 text-right font-mono font-bold">₹ {b.grandTotal}</td>
                        <td className="py-2">{b.paymentMethod}</td>
                        <td className="py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-600">
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
