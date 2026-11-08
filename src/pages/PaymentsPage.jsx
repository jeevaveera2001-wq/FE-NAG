import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { SkeletonTableRow, SkeletonCard, PullToRefresh } from '../components/loaders';
import {
  CreditCard,
  FileSpreadsheet,
  RefreshCw,
  QrCode,
  Banknote,
  Layers,
  Calendar,
  CalendarDays,
  Wallet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

// Helper to get formatted IST date string (YYYY-MM-DD)
const getTodayIST = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
};

const getYesterdayIST = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
};

const getMonthStartIST = () => {
  const d = new Date();
  const yearMonth = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
  }).format(d);
  return `${yearMonth}-01`;
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

// Client-side fallback calculator if summary is missing from response
const computeFallbackSummary = (paymentsList) => {
  let totalAmount = 0;
  let directCash = 0, directUpi = 0, directCard = 0, split = 0;
  let splitCash = 0, splitUpi = 0, splitCard = 0;

  for (const p of paymentsList || []) {
    const amount = Number(p.amountPaid ?? p.totalBillAmount ?? 0);
    totalAmount += amount;
    const pm = (p.paymentMethod || '').toLowerCase();
    if (pm.includes('cash')) {
      directCash += amount;
    } else if (pm.includes('upi')) {
      directUpi += amount;
    } else if (pm.includes('card')) {
      directCard += amount;
    } else if (pm.includes('split')) {
      split += amount;
      const sp = p.splitDetails || {};
      const spC = Number(sp.cash || 0);
      const spU = Number(sp.upi || 0);
      const spCd = Number(sp.debitCard || 0) + Number(sp.creditCard || 0);

      splitCash += spC;
      splitUpi += spU;
      splitCard += spCd;
    } else {
      directCash += amount;
    }
  }

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    cash: Math.round(directCash * 100) / 100,
    upi: Math.round(directUpi * 100) / 100,
    card: Math.round(directCard * 100) / 100,
    split: Math.round(split * 100) / 100,
    directCash: Math.round(directCash * 100) / 100,
    directUpi: Math.round(directUpi * 100) / 100,
    directCard: Math.round(directCard * 100) / 100,
    splitCash: Math.round(splitCash * 100) / 100,
    splitUpi: Math.round(splitUpi * 100) / 100,
    splitCard: Math.round(splitCard * 100) / 100,
    netCash: Math.round((directCash + splitCash) * 100) / 100,
    netUpi: Math.round((directUpi + splitUpi) * 100) / 100,
    netCard: Math.round((directCard + splitCard) * 100) / 100,
    totalTransactions: (paymentsList || []).length,
  };
};

export const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [dateBreakdown, setDateBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });

  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [paymentStatus, setPaymentStatus] = useState('All');

  // Date selection states - defaults to Today
  const todayStr = getTodayIST();
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState('today');

  const { socket } = useSocket();
  const { isSuperAdmin } = useAuth();

  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search: search.trim() || undefined,
        paymentMethod: paymentMethod !== 'All' ? paymentMethod : undefined,
        paymentStatus: paymentStatus !== 'All' ? paymentStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await api.get('/payments', { params });
      if (res.data?.success) {
        const rawPayments = Array.isArray(res.data.payments) ? res.data.payments : [];
        setPayments(rawPayments);
        setPagination(
          res.data.pagination || { page: 1, totalPages: 1, total: rawPayments.length, limit: 15 }
        );
        setSummary(res.data.summary || computeFallbackSummary(rawPayments));
        setDateBreakdown(Array.isArray(res.data.dateBreakdown) ? res.data.dateBreakdown : []);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
      toast.error('Failed to load payment transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
  }, [search, paymentMethod, paymentStatus, startDate, endDate]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;
    const handleLivePayment = () => fetchPayments(pagination.page);

    socket.on('payment:recorded', handleLivePayment);
    socket.on('bill:created', handleLivePayment);
    socket.on('bill:cancelled', handleLivePayment);
    socket.on('stats:updated', handleLivePayment);

    return () => {
      socket.off('payment:recorded', handleLivePayment);
      socket.off('bill:created', handleLivePayment);
      socket.off('bill:cancelled', handleLivePayment);
      socket.off('stats:updated', handleLivePayment);
    };
  }, [socket, pagination.page, search, paymentMethod, paymentStatus, startDate, endDate]);

  // Preset handlers
  const handleSelectPreset = (preset) => {
    if (preset === 'all' && !isSuperAdmin) {
      return;
    }
    setActivePreset(preset);
    if (preset === 'today') {
      const t = getTodayIST();
      setStartDate(t);
      setEndDate(t);
    } else if (preset === 'yesterday') {
      const y = getYesterdayIST();
      setStartDate(y);
      setEndDate(y);
    } else if (preset === 'month') {
      setStartDate(getMonthStartIST());
      setEndDate(getTodayIST());
    } else if (preset === 'all' && isSuperAdmin) {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleParticularDateChange = (dateVal) => {
    setActivePreset('custom');
    setStartDate(dateVal);
    setEndDate(dateVal);
  };

  const exportToExcel = () => {
    if (!payments || payments.length === 0) {
      toast.error('No payments to export');
      return;
    }

    const exportData = payments.map((p) => ({
      'Payment ID': p.paymentId || '-',
      'Bill Number': p.billNumber || '-',
      Date: p.createdAt ? new Date(p.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '-',
      Customer: p.customer?.name || '-',
      Mobile: p.customer?.mobile || '-',
      'Total Amount (₹)': Number(p.totalBillAmount || p.amountPaid || 0).toFixed(2),
      'Amount Paid (₹)': Number(p.amountPaid || 0).toFixed(2),
      'Balance (₹)': Number(p.balanceAmount || 0).toFixed(2),
      'Payment Method': p.paymentMethod || '-',
      'Split Cash (₹)': Number(p.splitDetails?.cash || 0).toFixed(2),
      'Split UPI (₹)': Number(p.splitDetails?.upi || 0).toFixed(2),
      'Split Card (₹)': Number((p.splitDetails?.debitCard || 0) + (p.splitDetails?.creditCard || 0)).toFixed(2),
      'Transaction Ref ID': p.transactionRefId || '-',
      Status: p.paymentStatus || 'Paid',
      'Received By': p.receivedBy?.fullName || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments Ledger');

    const fileNameSuffix = startDate
      ? startDate === endDate
        ? startDate
        : `${startDate}_to_${endDate}`
      : 'All_Time';
    XLSX.writeFile(workbook, `Nagulan_Payments_${fileNameSuffix}.xlsx`);
    toast.success('Payments exported to Excel!');
  };

  const isSingleDate = Boolean(startDate && endDate && startDate === endDate);

  // Safe numerical extractions for UI cards
  const directUpi = Number(summary?.directUpi ?? (summary?.upi || 0));
  const splitUpi = Number(summary?.splitUpi || 0);
  const directCash = Number(summary?.directCash ?? (summary?.cash || 0));
  const splitCash = Number(summary?.splitCash || 0);
  const directCard = Number(summary?.directCard ?? (summary?.card || 0));
  const splitCard = Number(summary?.splitCard || 0);

  // Method payments (mutually exclusive: Cash + UPI + Card + Split === Total)
  const cashAmount = directCash;
  const upiAmount = directUpi;
  const cardAmount = directCard;
  const splitAmount = Number(summary?.split || 0);
  const totalAmount = Number(summary?.totalAmount || (cashAmount + upiAmount + cardAmount + splitAmount));

  // Settlement channel totals (Cash in Drawer vs Online in Bank)
  const netCash = Number(summary?.netCash ?? (directCash + splitCash));
  const netUpi = Number(summary?.netUpi ?? (directUpi + splitUpi));
  const netCard = Number(summary?.netCard ?? (directCard + splitCard));

  const totalTxnCount = summary?.totalTransactions ?? payments.length ?? 0;

  return (
    <PullToRefresh onRefresh={() => fetchPayments(1)}>
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-serif">
              <CreditCard className="w-6 h-6 text-gold-500" />
              Payment Collections & Ledger
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Live audit register & breakdowns of cash, UPI, cards, and split payments
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 hover:bg-gray-50 dark:hover:bg-charcoal-800 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => fetchPayments(pagination.page)}
              className="p-2 rounded-lg border border-gray-300 dark:border-charcoal-700 hover:bg-gray-50 dark:hover:bg-charcoal-800 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Selector & Preset Toolbar */}
        <div className="bg-white dark:bg-charcoal-900 p-3.5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-charcoal-950 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleSelectPreset('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePreset === 'today' && isSingleDate && startDate === todayStr
                    ? 'bg-gold-500 text-black shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('yesterday')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePreset === 'yesterday'
                    ? 'bg-gold-500 text-black shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activePreset === 'month'
                    ? 'bg-gold-500 text-black shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                }`}
              >
                This Month
              </button>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => handleSelectPreset('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activePreset === 'all' && !startDate && !endDate
                      ? 'bg-gold-500 text-black shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white'
                  }`}
                >
                  All Time
                </button>
              )}
            </div>

            {/* Particular Date Picker */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gold-500" />
                Select Date:
              </span>
              <input
                type="date"
                value={isSingleDate ? startDate : ''}
                onChange={(e) => handleParticularDateChange(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-gold-500/50 dark:border-gold-500/40 bg-gold-50/30 dark:bg-charcoal-950 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-gold-500 cursor-pointer"
                title="Choose a specific date"
              />
            </div>
          </div>

          {/* Custom Date Range & Filters Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2.5 border-t border-gray-100 dark:border-charcoal-800 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setActivePreset('custom');
                  setStartDate(e.target.value);
                  if (!endDate) setEndDate(e.target.value);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setActivePreset('custom');
                  setEndDate(e.target.value);
                  if (!startDate) setStartDate(e.target.value);
                }}
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / GPay</option>
                <option value="Debit card">Debit card</option>
                <option value="Credit card">Credit card</option>
                <option value="Split payment">Split payment</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Selected Date Header Badge */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-gold-500" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              {isSingleDate
                ? `Exact Date Report: ${formatDateLabel(startDate)}`
                : startDate && endDate
                ? `Date Range: ${formatDateLabel(startDate)} to ${formatDateLabel(endDate)}`
                : 'All Time Overall Report'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gold-500/15 text-gold-600 dark:text-gold-400 border border-gold-500/20">
              {totalTxnCount} Bills
            </span>
          </div>

          {isSuperAdmin ? (
            (startDate || endDate) && (
              <button
                onClick={() => handleSelectPreset('all')}
                className="text-[11px] font-semibold text-gold-600 dark:text-gold-400 hover:underline cursor-pointer"
              >
                Reset to All Time
              </button>
            )
          ) : (
            (startDate !== todayStr || endDate !== todayStr) && (
              <button
                onClick={() => handleSelectPreset('today')}
                className="text-[11px] font-semibold text-gold-600 dark:text-gold-400 hover:underline cursor-pointer"
              >
                Reset to Today
              </button>
            )
          )}
        </div>

        {/* 5 Main Summary Metric Cards (Total, Cash, UPI/GPay, Card, Split) */}
        {loading && !summary ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {/* 1. Total Payments */}
            <div className="bg-white dark:bg-charcoal-900 p-3.5 rounded-2xl border border-gold-500/40 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-600" />
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                  {isSingleDate ? 'Day Total Payments' : 'Total Payments'}
                </span>
                <Wallet className="w-4 h-4 text-gold-500" />
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-gray-900 dark:text-white">
                ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-between">
                <span>All payment methods</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{totalTxnCount} txn</span>
              </p>
            </div>

            {/* 2. UPI / GPay Total */}
            <div className="bg-white dark:bg-charcoal-900 p-3.5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  UPI / GPay Total
                </span>
                <QrCode className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-gray-900 dark:text-white">
                ₹ {upiAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                Direct UPI bills
                {splitUpi > 0 && <span className="text-purple-600 dark:text-purple-400"> (incl. split: ₹{netUpi.toFixed(0)})</span>}
              </p>
            </div>

            {/* 3. Cash Total */}
            <div className="bg-white dark:bg-charcoal-900 p-3.5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Cash Total
                </span>
                <Banknote className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-gray-900 dark:text-white">
                ₹ {cashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                Direct Cash bills
                {splitCash > 0 && <span className="text-emerald-600 dark:text-emerald-400"> (in drawer: ₹{netCash.toFixed(0)})</span>}
              </p>
            </div>

            {/* 4. Card Total */}
            <div className="bg-white dark:bg-charcoal-900 p-3.5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition-colors">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Card (Debit/Credit)
                </span>
                <CreditCard className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-gray-900 dark:text-white">
                ₹ {cardAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                Direct Card bills
                {splitCard > 0 && <span className="text-blue-600 dark:text-blue-400"> (incl. split: ₹{netCard.toFixed(0)})</span>}
              </p>
            </div>

            {/* 5. Split Payments */}
            <div className="bg-white dark:bg-charcoal-900 p-3.5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-colors col-span-2 sm:col-span-1">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Split Payments
                </span>
                <Layers className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-gray-900 dark:text-white">
                ₹ {splitAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                {splitAmount > 0
                  ? `Cash: ₹${splitCash.toFixed(0)} • UPI: ₹${splitUpi.toFixed(0)}`
                  : 'Multi-mode transactions'}
              </p>
            </div>
          </div>
        )}

        {/* Settlement Channels Summary (Drawer Cash vs Digital Bank Account) */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-charcoal-900/90 dark:to-charcoal-950 p-3 rounded-xl border border-gray-200 dark:border-charcoal-800 text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold">
            <span className="text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Settlement Inflow:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <Banknote className="w-3.5 h-3.5" />
              <span>Total Cash in Drawer: ₹ {netCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-gray-400 font-sans font-normal">(₹{cashAmount} direct + ₹{splitCash} split)</span>
            </span>
            <span className="text-gray-300 dark:text-charcoal-700">|</span>
            <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-bold">
              <QrCode className="w-3.5 h-3.5" />
              <span>Total UPI in Bank: ₹ {netUpi.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-gray-400 font-sans font-normal">(₹{upiAmount} direct + ₹{splitUpi} split)</span>
            </span>
            {netCard > 0 && (
              <>
                <span className="text-gray-300 dark:text-charcoal-700">|</span>
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Card in Bank: ₹ {netCard.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </span>
              </>
            )}
            <span className="text-gray-300 dark:text-charcoal-700">|</span>
            <span className="flex items-center gap-1.5 text-gold-600 dark:text-gold-400 font-extrabold">
              <Wallet className="w-3.5 h-3.5" />
              <span>Grand Total: ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </span>
          </div>
        </div>

        {/* Date-wise Breakdown Table ("Particular Dates of Payments in Total for Selected Dates") */}
        {dateBreakdown && dateBreakdown.length > 0 && (
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm overflow-hidden">
            <div className="p-3.5 border-b border-gray-200 dark:border-charcoal-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold-500" />
                  Date-wise Total Breakdown ({dateBreakdown.length} {dateBreakdown.length === 1 ? 'Date' : 'Dates'})
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Exact total payments, UPI, cash, card, and split for each particular date
                </p>
              </div>

              {!isSingleDate && (
                <span className="text-[10px] text-gray-400">Click a date to isolate</span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800 text-[10px]">
                    <th className="py-2.5 px-3.5">Date</th>
                    <th className="py-2.5 px-3.5 text-right">Total Payments</th>
                    <th className="py-2.5 px-3.5 text-right">UPI / GPay</th>
                    <th className="py-2.5 px-3.5 text-right">Cash</th>
                    <th className="py-2.5 px-3.5 text-right">Card</th>
                    <th className="py-2.5 px-3.5 text-right">Split</th>
                    <th className="py-2.5 px-3.5 text-center">Bills</th>
                    <th className="py-2.5 px-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-700 dark:text-gray-300">
                  {dateBreakdown.map((d) => {
                    const isSelected = startDate === d.date && endDate === d.date;
                    return (
                      <tr
                        key={d.date}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-gold-500/10 dark:bg-gold-500/5'
                            : 'hover:bg-gray-50 dark:hover:bg-charcoal-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-3.5 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{formatDateLabel(d.date)}</span>
                            {d.date === todayStr && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                                Today
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-extrabold text-gold-600 dark:text-gold-400 whitespace-nowrap">
                          ₹ {Number(d.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                          ₹ {Number(d.upi || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          ₹ {Number(d.cash || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          ₹ {Number(d.card || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          ₹ {Number(d.split || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3.5 text-center font-semibold text-gray-600 dark:text-gray-400">
                          {d.count || 0}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleParticularDateChange(d.date)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-gold-500 text-black shadow-xs'
                                : 'border border-gray-300 dark:border-charcoal-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'View Day'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Transactions Register */}
        <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm overflow-hidden space-y-3 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Payment Transactions Register
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                Detailed transaction records matching your current active filters
              </p>
            </div>

            <div className="w-full sm:w-72">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search bill, payment ID, customer..."
                onClear={() => setSearch('')}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-charcoal-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                  <th className="py-3 px-3.5">Payment ID</th>
                  <th className="py-3 px-3.5">Bill No</th>
                  <th className="py-3 px-3.5">Date & Time</th>
                  <th className="py-3 px-3.5">Customer</th>
                  <th className="py-3 px-3.5 text-right">Bill Total</th>
                  <th className="py-3 px-3.5 text-right">Amount Paid</th>
                  <th className="py-3 px-3.5 text-right">Balance</th>
                  <th className="py-3 px-3.5">Method</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Received By</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-700 dark:text-gray-300">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonTableRow key={i} cols={10} />
                  ))
                ) : !payments || payments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400">
                      No payment records found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const isSplit = (p.paymentMethod || '').toLowerCase().includes('split');
                    const sp = p.splitDetails || {};
                    return (
                      <tr key={p._id || p.paymentId} className="hover:bg-gray-50 dark:hover:bg-charcoal-800/40 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          {p.paymentId || '-'}
                        </td>
                        <td className="py-3 px-3.5 font-mono text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {p.billNumber || '-'}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-gray-500">
                          {p.createdAt
                            ? new Date(p.createdAt).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="font-semibold text-gray-900 dark:text-white block">{p.customer?.name || 'Walk-in'}</span>
                          <span className="text-[10px] text-gray-500">{p.customer?.mobile || '-'}</span>
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-semibold">
                          ₹ {Number(p.totalBillAmount ?? p.amountPaid ?? 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-green-600 dark:text-green-400">
                          ₹ {Number(p.amountPaid ?? 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                          ₹ {Number(p.balanceAmount ?? 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-charcoal-800 text-gray-800 dark:text-gray-300">
                            {p.paymentMethod || 'Unknown'}
                          </span>
                          {isSplit && (
                            <div className="text-[9px] text-gray-500 font-mono mt-0.5">
                              {Number(sp.cash || 0) > 0 && <span>Cash: ₹{sp.cash} </span>}
                              {Number(sp.upi || 0) > 0 && <span>UPI: ₹{sp.upi} </span>}
                              {Number((sp.debitCard || 0) + (sp.creditCard || 0)) > 0 && (
                                <span>Card: ₹{(Number(sp.debitCard) || 0) + (Number(sp.creditCard) || 0)}</span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.paymentStatus === 'Paid'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                                : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                            }`}
                          >
                            {p.paymentStatus || 'Paid'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-gray-500">{p.receivedBy?.fullName || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination pagination={pagination} onPageChange={(page) => fetchPayments(page)} />
        </div>
      </div>
    </PullToRefresh>
  );
};

export default PaymentsPage;
