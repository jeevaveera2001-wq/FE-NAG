import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import { SkeletonCard, SkeletonTableRow, LoadingButton, PullToRefresh } from '../components/loaders';
import {
  WalletCards,
  Plus,
  Search,
  Calendar,
  CalendarDays,
  TrendingDown,
  CreditCard,
  QrCode,
  Wallet,
  RefreshCw,
  FileSpreadsheet,
  Tag,
  Clock,
  User,
  Edit2,
  Trash2,
  X,
  BarChart3,
  Sparkles,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export const EXPENSE_CATEGORIES = [
  'Salon Supplies',
  'Tea & Refreshments',
  'Electricity & Utilities',
  'Rent & Maintenance',
  'Cleaning & Housekeeping',
  'Staff Welfare & Meals',
  'Equipment & Tools',
  'Marketing & Advertising',
  'Miscellaneous / Other',
];

export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Debit card',
  'Credit card',
  'Bank Transfer',
  'Other',
];

const QUICK_DESCRIPTION_PRESETS = [
  'Tea & refreshments for clients/staff',
  'Daily cleaning & housekeeping items',
  'Salon supplies & cosmetics restock',
  'Electricity / Water utility bill',
  'Staff meal / snack allowance',
  'Laundry / Towel washing charges',
  'Salon maintenance / Repair work',
];

export const ExpensesPage = () => {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const { socket } = useSocket();

  // Active Tab: 'daily' | 'overall' | 'ledger'
  const [activeTab, setActiveTab] = useState('daily');

  // Helper date generators
  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const getThisMonthStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Dashboard Filters State
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedMonth, setSelectedMonth] = useState(getThisMonthStr());
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Full Ledger State
  const [ledgerExpenses, setLedgerExpenses] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerPagination, setLedgerPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });
  const [ledgerFilteredTotal, setLedgerFilteredTotal] = useState(0);

  // Ledger Filter Inputs
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Tea & Refreshments',
    paymentMethod: 'Cash',
    date: getTodayStr(),
    receiptNumber: '',
    notes: '',
  });

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Dashboard Metrics
  const fetchDashboard = async (dateVal, monthVal) => {
    try {
      setDashboardLoading(true);
      const d = dateVal || selectedDate;
      const m = monthVal || selectedMonth;
      const res = await api.get(`/expenses/dashboard?date=${d}&month=${m}`);
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load expense dashboard:', err);
      toast.error('Failed to load expense dashboard data');
    } finally {
      setDashboardLoading(false);
    }
  };

  // Fetch Full Ledger Data
  const fetchLedger = async (page = 1) => {
    try {
      setLedgerLoading(true);
      const params = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        paymentMethod: paymentMethodFilter !== 'All' ? paymentMethodFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await api.get('/expenses', { params });
      if (res.data.success) {
        setLedgerExpenses(res.data.expenses);
        setLedgerPagination(res.data.pagination);
        setLedgerFilteredTotal(res.data.filteredTotalAmount || 0);
      }
    } catch (err) {
      console.error('Failed to load ledger expenses:', err);
      toast.error('Failed to load expenses list');
    } finally {
      setLedgerLoading(false);
    }
  };

  // Initial & Reactive Fetching
  useEffect(() => {
    if (activeTab === 'daily' || activeTab === 'overall') {
      fetchDashboard(selectedDate, selectedMonth);
    } else if (activeTab === 'ledger') {
      fetchLedger(1);
    }
  }, [activeTab, selectedDate, selectedMonth]);

  useEffect(() => {
    if (activeTab === 'ledger') {
      const timer = setTimeout(() => {
        fetchLedger(1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search, categoryFilter, paymentMethodFilter, startDate, endDate]);

  // Socket.io Realtime Listener
  useEffect(() => {
    if (!socket) return;
    const handleExpenseEvent = () => {
      if (activeTab === 'daily' || activeTab === 'overall') {
        fetchDashboard(selectedDate, selectedMonth);
      } else {
        fetchLedger(ledgerPagination.page);
      }
    };

    socket.on('expense:created', handleExpenseEvent);
    socket.on('expense:updated', handleExpenseEvent);
    socket.on('expense:deleted', handleExpenseEvent);

    return () => {
      socket.off('expense:created', handleExpenseEvent);
      socket.off('expense:updated', handleExpenseEvent);
      socket.off('expense:deleted', handleExpenseEvent);
    };
  }, [socket, activeTab, selectedDate, selectedMonth, ledgerPagination.page]);

  // Open Add Modal
  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      description: '',
      amount: '',
      category: 'Tea & Refreshments',
      paymentMethod: 'Cash',
      date: selectedDate || getTodayStr(),
      receiptNumber: '',
      notes: '',
    });
    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (exp) => {
    setEditingExpense(exp);
    const expDateStr = exp.date ? new Date(exp.date).toISOString().slice(0, 10) : getTodayStr();
    setFormData({
      description: exp.description || '',
      amount: exp.amount || '',
      category: exp.category || 'General',
      paymentMethod: exp.paymentMethod || 'Cash',
      date: expDateStr,
      receiptNumber: exp.receiptNumber || '',
      notes: exp.notes || '',
    });
    setModalOpen(true);
  };

  // Save (Create or Update) Expense
  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      toast.error('Expense description is required');
      return;
    }

    const numAmount = Number(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid expense amount greater than 0');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        description: formData.description.trim(),
        amount: numAmount,
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        date: formData.date,
        receiptNumber: formData.receiptNumber.trim(),
        notes: formData.notes.trim(),
      };

      if (editingExpense) {
        const res = await api.put(`/expenses/${editingExpense._id}`, payload);
        if (res.data.success) {
          toast.success('Expense updated successfully');
        }
      } else {
        const res = await api.post('/expenses', payload);
        if (res.data.success) {
          toast.success('Expense recorded successfully');
        }
      }

      setModalOpen(false);
      fetchDashboard(selectedDate, selectedMonth);
      if (activeTab === 'ledger') fetchLedger(ledgerPagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      setIsDeleting(true);
      const res = await api.delete(`/expenses/${expenseToDelete._id}`);
      if (res.data.success) {
        toast.success('Expense deleted successfully');
        setDeleteModalOpen(false);
        setExpenseToDelete(null);
        fetchDashboard(selectedDate, selectedMonth);
        if (activeTab === 'ledger') fetchLedger(ledgerPagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (ledgerExpenses.length === 0) {
      toast.error('No expenses to export');
      return;
    }

    const exportData = ledgerExpenses.map((exp) => ({
      Date: new Date(exp.date).toLocaleDateString('en-IN'),
      Description: exp.description,
      Category: exp.category,
      'Amount (₹)': exp.amount,
      'Payment Method': exp.paymentMethod,
      'Recorded By': exp.recordedByName || 'Staff',
      'Receipt / Voucher #': exp.receiptNumber || '-',
      Notes: exp.notes || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Salon Expenses');
    XLSX.writeFile(workbook, `Nagulan_Salon_Expenses_${getTodayStr()}.xlsx`);
    toast.success('Expenses exported to Excel successfully');
  };

  // Quick Date Helpers
  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleSetLastMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl mx-auto pb-12">
      {/* Top Header & Quick Add */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-charcoal-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <WalletCards className="w-4 h-4" />
            </div>
            <span>Salon Expenses & Outflows</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Track daily salon overheads, tea/refreshments, utility bills, inventory purchases & operational costs.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-charcoal-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'daily'
              ? 'bg-black text-white dark:bg-gold-500 dark:text-black shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-charcoal-800'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Daily Expenses Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('overall')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'overall'
              ? 'bg-black text-white dark:bg-gold-500 dark:text-black shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-charcoal-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Overall & Monthly Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-black text-white dark:bg-gold-500 dark:text-black shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-charcoal-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Full Expense Ledger ({ledgerPagination.total || 0})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY EXPENSES DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Day Toolbar */}
          <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                Viewing Daily Outflows for:
              </span>
              <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                {selectedDate}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-gray-50 dark:bg-charcoal-950 text-xs font-semibold text-gray-900 dark:text-white"
              />
              <button
                onClick={() => setSelectedDate(getTodayStr())}
                className="px-2.5 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleSetYesterday}
                className="px-2.5 py-1.5 bg-gray-100 dark:bg-charcoal-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 rounded-xl text-[11px] font-semibold transition-all cursor-pointer"
              >
                Yesterday
              </button>
              <button
                onClick={() => fetchDashboard(selectedDate, selectedMonth)}
                disabled={dashboardLoading}
                className="p-1.5 rounded-xl border border-gray-200 dark:border-charcoal-800 hover:bg-gray-100 dark:hover:bg-charcoal-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dashboardLoading ? 'animate-spin text-red-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Day 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Day Total */}
            <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-sm">
              <div className="flex items-center justify-between text-red-600 dark:text-red-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Day Total Outflow</span>
                <TrendingDown className="w-4 h-4" />
              </div>
              <p className="text-lg sm:text-2xl font-black font-mono text-gray-900 dark:text-white mt-1.5">
                ₹ {Number(dashboardData?.day?.total || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-gray-400 font-medium">
                {dashboardData?.day?.count || 0} expenses recorded on {selectedDate}
              </span>
            </div>

            {/* Day Cash */}
            <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Cash Paid</span>
                <Wallet className="w-4 h-4" />
              </div>
              <p className="text-lg sm:text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1.5">
                ₹ {Number(dashboardData?.day?.cash || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-gray-400">Direct cash withdrawals</span>
            </div>

            {/* Day UPI */}
            <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
              <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">UPI / QR Paid</span>
                <QrCode className="w-4 h-4" />
              </div>
              <p className="text-lg sm:text-2xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1.5">
                ₹ {Number(dashboardData?.day?.upi || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-gray-400">GPay, PhonePe, Paytm</span>
            </div>

            {/* Day Card */}
            <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Card / Bank</span>
                <CreditCard className="w-4 h-4" />
              </div>
              <p className="text-lg sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1.5">
                ₹ {Number(dashboardData?.day?.card || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-gray-400">Cards & Bank transfers</span>
            </div>
          </div>

          {/* Day Categories Progress Meter (if any) */}
          {dashboardData?.day?.categories?.length > 0 && (
            <div className="bg-white dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
              <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center justify-between">
                <span>Category Breakdown ({selectedDate}):</span>
                <span className="text-[11px] text-gray-400 font-normal">
                  {dashboardData.day.categories.length} categories
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {dashboardData.day.categories.map((c) => (
                  <div
                    key={c.category}
                    className="p-2.5 rounded-xl bg-gray-50 dark:bg-charcoal-950 border border-gray-200 dark:border-charcoal-800 flex items-center justify-between"
                  >
                    <div>
                      <span className="block text-xs font-bold text-gray-900 dark:text-white">
                        {c.category}
                      </span>
                      <span className="text-[10px] text-gray-400">{c.percentage}% of day total</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
                      ₹ {c.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Recorded Expenses Table */}
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b border-gray-200 dark:border-charcoal-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <WalletCards className="w-4 h-4 text-red-500" />
                  Expenses Incurred on {selectedDate}
                </h3>
              </div>
              <span className="text-xs font-bold font-mono text-gray-500">
                {dashboardData?.day?.expenses?.length || 0} entries
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                    <th className="py-3 px-3.5">Description</th>
                    <th className="py-3 px-3.5">Category</th>
                    <th className="py-3 px-3.5">Payment Mode</th>
                    <th className="py-3 px-3.5">Recorded By</th>
                    <th className="py-3 px-3.5">Time</th>
                    <th className="py-3 px-3.5 text-right">Amount</th>
                    <th className="py-3 px-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800">
                  {dashboardData?.day?.expenses?.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-400">
                        <div className="max-w-xs mx-auto space-y-2">
                          <p>No expenses recorded on {selectedDate}.</p>
                          <button
                            onClick={openAddModal}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Record First Expense Today
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    dashboardData?.day?.expenses?.map((exp) => (
                      <tr key={exp._id} className="hover:bg-gray-50/70 dark:hover:bg-charcoal-800/40">
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-gray-900 dark:text-white">{exp.description}</div>
                          {exp.notes && <div className="text-[10px] text-gray-400 line-clamp-1">{exp.notes}</div>}
                          {exp.receiptNumber && (
                            <div className="text-[9px] text-gray-400 font-mono">Ref/Rcpt: {exp.receiptNumber}</div>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-charcoal-800 text-gray-700 dark:text-gray-300">
                            <Tag className="w-3 h-3 text-red-500" />
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              exp.paymentMethod === 'Cash'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                : exp.paymentMethod === 'UPI'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}
                          >
                            {exp.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span>{exp.recordedByName || 'Staff'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-gray-500 whitespace-nowrap">
                          {exp.createdAt ? new Date(exp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                          ₹ {Number(exp.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(exp)}
                              className="p-1 rounded text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800 cursor-pointer"
                              title="Edit Expense"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setExpenseToDelete(exp);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OVERALL & MONTHLY DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'overall' && (
        <div className="space-y-4">
          {/* Month Toolbar */}
          <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gold-500" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                Monthly Performance & Analytics for:
              </span>
              <span className="font-mono text-xs font-bold text-gold-600 dark:text-gold-400">
                {selectedMonth}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-gray-50 dark:bg-charcoal-950 text-xs font-semibold text-gray-900 dark:text-white"
              />
              <button
                onClick={() => setSelectedMonth(getThisMonthStr())}
                className="px-2.5 py-1.5 bg-gold-500/10 text-gold-600 dark:text-gold-400 hover:bg-gold-500 hover:text-black rounded-xl text-[11px] font-bold transition-all cursor-pointer"
              >
                This Month
              </button>
              <button
                onClick={handleSetLastMonth}
                className="px-2.5 py-1.5 bg-gray-100 dark:bg-charcoal-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 rounded-xl text-[11px] font-semibold transition-all cursor-pointer"
              >
                Last Month
              </button>
              <button
                onClick={() => fetchDashboard(selectedDate, selectedMonth)}
                disabled={dashboardLoading}
                className="p-1.5 rounded-xl border border-gray-200 dark:border-charcoal-800 hover:bg-gray-100 dark:hover:bg-charcoal-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dashboardLoading ? 'animate-spin text-gold-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Month 4 KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Month Total */}
            <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-sm">
              <div className="flex items-center justify-between text-red-600 dark:text-red-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Month Total Outflow</span>
                <TrendingDown className="w-4 h-4" />
              </div>
              <p className="text-lg sm:text-2xl font-black font-mono text-gray-900 dark:text-white mt-1.5">
                ₹ {Number(dashboardData?.month?.total || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-gray-400 font-medium">
                {dashboardData?.month?.count || 0} expenses in {selectedMonth}
              </span>
            </div>

            {/* Month Cash */}
            <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Month Cash Outflow</span>
                <Wallet className="w-4 h-4" />
              </div>
              <p className="text-lg sm:text-2xl font-black font-mono text-blue-600 dark:text-blue-400 mt-1.5">
                ₹ {Number(dashboardData?.month?.cash || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-gray-400">Cash expenses</span>
            </div>

            {/* Month UPI */}
            <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
              <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Month UPI Outflow</span>
                <QrCode className="w-4 h-4" />
              </div>
              <p className="text-lg sm:text-2xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1.5">
                ₹ {Number(dashboardData?.month?.upi || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-gray-400">UPI / QR payments</span>
            </div>

            {/* All Time Overheads */}
            <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
              <div className="flex items-center justify-between text-gold-600 dark:text-gold-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">All-Time Recorded</span>
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-lg sm:text-2xl font-black font-mono text-gold-600 dark:text-gold-400 mt-1.5">
                ₹ {Number(dashboardData?.allTime?.total || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-gray-400">
                {dashboardData?.allTime?.count || 0} total lifetime expenses
              </span>
            </div>
          </div>

          {/* Month Trend Chart (Recharts) */}
          <div className="bg-white dark:bg-charcoal-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
            <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
              <span>Day-by-Day Expense Outflow Trend: {selectedMonth}</span>
              <span className="text-[11px] text-gray-400 font-normal">Breakdown by payment method</span>
            </h3>

            {dashboardData?.month?.dailyTrend?.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-xs">
                No expense data recorded in {selectedMonth} to display trend chart.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...(dashboardData?.month?.dailyTrend || [])].reverse()}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10 }}
                      tickFormatter={(d) => d.slice(8, 10)}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181B',
                        borderColor: '#3F3F46',
                        borderRadius: '0.75rem',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                      formatter={(value) => [`₹ ${Number(value).toLocaleString('en-IN')}`]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="cash" name="Cash" fill="#3B82F6" stackId="a" />
                    <Bar dataKey="upi" name="UPI" fill="#8B5CF6" stackId="a" />
                    <Bar dataKey="card" name="Card/Bank" fill="#F59E0B" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Month Categories Breakdown Ledger */}
          <div className="bg-white dark:bg-charcoal-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm space-y-4">
            <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white flex items-center justify-between">
              <span>Monthly Category Distribution ({selectedMonth})</span>
              <span className="text-xs font-mono font-bold text-red-500">
                Total: ₹ {Number(dashboardData?.month?.total || 0).toLocaleString('en-IN')}
              </span>
            </h3>

            {dashboardData?.month?.categories?.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-xs">No categories recorded in {selectedMonth}.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dashboardData?.month?.categories?.map((c) => (
                  <div
                    key={c.category}
                    className="p-3.5 rounded-xl bg-gray-50 dark:bg-charcoal-950 border border-gray-200 dark:border-charcoal-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{c.category}</span>
                      <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                        ₹ {c.amount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-charcoal-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, c.percentage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>Share of monthly total</span>
                      <span className="font-bold text-gray-600 dark:text-gray-300">{c.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FULL EXPENSE LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search description, notes, ref..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-gray-50 dark:bg-charcoal-950 text-xs text-gray-900 dark:text-white"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-gray-50 dark:bg-charcoal-950 text-xs font-semibold text-gray-900 dark:text-white"
              >
                <option value="All">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Payment Mode Filter */}
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-gray-50 dark:bg-charcoal-950 text-xs font-semibold text-gray-900 dark:text-white"
              >
                <option value="All">All Payment Modes</option>
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>

              {/* Export to Excel */}
              <button
                onClick={exportToExcel}
                className="px-3 py-2 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export to Excel</span>
              </button>
            </div>

            {/* Date Range Filters */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-gray-400 text-[11px] font-semibold">Date Range:</span>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-gray-50 dark:bg-charcoal-950 text-xs"
                />
                <span className="text-gray-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-gray-50 dark:bg-charcoal-950 text-xs"
                />
              </div>

              {(search || categoryFilter !== 'All' || paymentMethodFilter !== 'All' || startDate || endDate) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('All');
                    setPaymentMethodFilter('All');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-xs text-red-500 hover:underline font-semibold ml-auto"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Filtered Total Summary Bar */}
          <div className="bg-gray-50 dark:bg-charcoal-900/60 p-3 rounded-xl border border-gray-200 dark:border-charcoal-800 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Showing <strong className="text-gray-900 dark:text-white">{ledgerExpenses.length}</strong> of{' '}
              <strong className="text-gray-900 dark:text-white">{ledgerPagination.total}</strong> matching records
            </span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Sum of Filtered Expenses:{' '}
              <strong className="font-mono text-red-600 dark:text-red-400 text-sm">
                ₹ {ledgerFilteredTotal.toLocaleString('en-IN')}
              </strong>
            </span>
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                    <th className="py-3 px-3.5">Date</th>
                    <th className="py-3 px-3.5">Description</th>
                    <th className="py-3 px-3.5">Category</th>
                    <th className="py-3 px-3.5">Payment Mode</th>
                    <th className="py-3 px-3.5">Recorded By</th>
                    <th className="py-3 px-3.5 text-right">Amount</th>
                    <th className="py-3 px-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800">
                  {ledgerLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <SkeletonTableRow key={i} cols={7} />
                    ))
                  ) : ledgerExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-400">
                        No expenses matching the filters.
                      </td>
                    </tr>
                  ) : (
                    ledgerExpenses.map((exp) => (
                      <tr key={exp._id} className="hover:bg-gray-50/70 dark:hover:bg-charcoal-800/40">
                        <td className="py-3 px-3.5 whitespace-nowrap font-mono text-gray-600 dark:text-gray-400">
                          {new Date(exp.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-gray-900 dark:text-white">{exp.description}</div>
                          {exp.notes && <div className="text-[10px] text-gray-400 line-clamp-1">{exp.notes}</div>}
                          {exp.receiptNumber && (
                            <div className="text-[9px] text-gray-400 font-mono">Ref/Rcpt: {exp.receiptNumber}</div>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-charcoal-800 text-gray-700 dark:text-gray-300">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              exp.paymentMethod === 'Cash'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                : exp.paymentMethod === 'UPI'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}
                          >
                            {exp.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span>{exp.recordedByName || 'Staff'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                          ₹ {Number(exp.amount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(exp)}
                              className="p-1 rounded text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800 cursor-pointer"
                              title="Edit Expense"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setExpenseToDelete(exp);
                                setDeleteModalOpen(true);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                              title="Delete Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              pagination={ledgerPagination}
              onPageChange={(p) => fetchLedger(p)}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT EXPENSE MODAL */}
      {/* ========================================================================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-charcoal-800">
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <WalletCards className="w-5 h-5 text-red-500" />
                <span>{editingExpense ? 'Edit Expense Record' : 'Record New Expense'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
              {/* Description & Amount */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Expense Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Tea and snacks for customers..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                  required
                />
              </div>

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_DESCRIPTION_PRESETS.map((desc) => (
                  <button
                    key={desc}
                    type="button"
                    onClick={() => setFormData({ ...formData, description: desc })}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-charcoal-800 text-gray-600 dark:text-gray-300 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                  >
                    + {desc}
                  </button>
                ))}
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      placeholder="e.g., 250"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Date of Expense <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Category & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Expense Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                  >
                    {PAYMENT_METHODS.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Receipt / Voucher Number */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Receipt / Bill / Voucher # (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., BILL-9921 or EB-OCT-2026"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Add any extra details or vendor info..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-charcoal-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <LoadingButton
                  type="submit"
                  loading={isSubmitting}
                  loadingText={editingExpense ? 'Saving Changes...' : 'Recording Expense...'}
                  variant="primary"
                  size="md"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteModalOpen && expenseToDelete && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setExpenseToDelete(null);
          }}
          onConfirm={handleDeleteExpense}
          title="Delete Expense Record"
          message={`Are you sure you want to delete the expense "${expenseToDelete.description}" of ₹${expenseToDelete.amount}?`}
          confirmText="Yes, Delete"
          isDanger={true}
          loading={isDeleting}
        />
      )}
    </div>
  );
};

export default ExpensesPage;
