import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import BillPreviewModal from '../components/BillPreviewModal';
import {
  CalendarDays,
  TrendingUp,
  Receipt,
  CreditCard,
  QrCode,
  Wallet,
  RefreshCw,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';

export const PresentDayPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [settings, setSettings] = useState({});

  const { user } = useAuth();
  const { socket } = useSocket();

  const fetchPresentDayData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const [res, setRes] = await Promise.all([
        api.get('/dashboard/present-day'),
        api.get('/settings'),
      ]);

      if (res.data.success) {
        setData(res.data.data);
      }
      if (setRes.data.success) {
        setSettings(setRes.data.settings);
      }
      if (isManual) {
        toast.success("Present day data updated");
      }
    } catch (err) {
      console.error('Failed to fetch present day metrics:', err);
      if (isManual) toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPresentDayData();

    // Listen to real-time socket events for live instant update
    if (socket) {
      const handleLiveUpdate = () => {
        fetchPresentDayData();
      };

      socket.on('bill:created', handleLiveUpdate);
      socket.on('bill:updated', handleLiveUpdate);
      socket.on('bill:cancelled', handleLiveUpdate);
      socket.on('stats:updated', handleLiveUpdate);

      return () => {
        socket.off('bill:created', handleLiveUpdate);
        socket.off('bill:updated', handleLiveUpdate);
        socket.off('bill:cancelled', handleLiveUpdate);
        socket.off('stats:updated', handleLiveUpdate);
      };
    }
  }, [socket]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-gold-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Loading Present Day Live Records...</span>
      </div>
    );
  }

  const today = data?.today || { total: 0, bills: 0, cash: 0, upi: 0, card: 0, avgBill: 0 };
  const yesterday = data?.yesterday || { total: 0, bills: 0, cash: 0, upi: 0, card: 0, avgBill: 0 };
  const trends = data?.trends || {};
  const hourlyData = data?.hourlyComparison || [];
  const paymentData = data?.paymentComparison || [];
  const todayBills = data?.todayBills || [];

  return (
    <div className="space-y-5 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-charcoal-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black text-gold-500 flex items-center justify-center font-bold">
              <CalendarDays className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold font-serif text-gray-900 dark:text-white">
              Present Day Live Section
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              Live Stream
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time business performance for{' '}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>{' '}
            with live comparison against yesterday.
          </p>
        </div>

        <button
          onClick={() => fetchPresentDayData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:bg-gray-50 dark:hover:bg-charcoal-700 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-xs transition-all disabled:opacity-50"
          title="Refresh Present Day Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Updating...' : 'Sync Live Data'}</span>
        </button>
      </div>

      {/* 5 Present Day Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {/* 1. Present Day Total */}
        <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-charcoal-800 shadow-xs hover:border-gold-500/50 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block">
                Present Day Total
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-sans text-gray-900 dark:text-white mt-1">
                ₹ {Number(today.total || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Yesterday: ₹ {Number(yesterday.total || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-600 dark:text-gold-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-charcoal-800 flex items-center justify-between text-xs">
            <span
              className={`flex items-center font-bold text-[11px] ${
                trends.total?.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500'
              }`}
            >
              {trends.total?.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {trends.total?.percentage || '0.0%'}
            </span>
            <span className="text-[10px] text-gray-400">vs Yesterday</span>
          </div>
        </div>

        {/* 2. Present Day Sales Bills */}
        <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-charcoal-800 shadow-xs hover:border-gold-500/50 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block">
                Present Day Sales Bills
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-sans text-gray-900 dark:text-white mt-1">
                {today.bills} <span className="text-sm font-semibold text-gray-400">Bills</span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Yesterday: {yesterday.bills} Bills
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-charcoal-800 flex items-center justify-between text-xs">
            <span
              className={`flex items-center font-bold text-[11px] ${
                trends.bills?.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500'
              }`}
            >
              {trends.bills?.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {trends.bills?.percentage || '0.0%'}
            </span>
            <span className="text-[10px] text-gray-400">vs Yesterday</span>
          </div>
        </div>

        {/* 3. Present Day Cash */}
        <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-charcoal-800 shadow-xs hover:border-gold-500/50 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block">
                Present Day Cash
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-sans text-gray-900 dark:text-white mt-1">
                ₹ {Number(today.cash || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Yesterday: ₹ {Number(yesterday.cash || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-charcoal-800 flex items-center justify-between text-xs">
            <span
              className={`flex items-center font-bold text-[11px] ${
                trends.cash?.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500'
              }`}
            >
              {trends.cash?.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {trends.cash?.percentage || '0.0%'}
            </span>
            <span className="text-[10px] text-gray-400">vs Yesterday</span>
          </div>
        </div>

        {/* 4. Present Day UPI */}
        <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-charcoal-800 shadow-xs hover:border-gold-500/50 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block">
                Present Day UPI
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-sans text-gold-600 dark:text-gold-400 mt-1">
                ₹ {Number(today.upi || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Yesterday: ₹ {Number(yesterday.upi || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-charcoal-800 flex items-center justify-between text-xs">
            <span
              className={`flex items-center font-bold text-[11px] ${
                trends.upi?.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500'
              }`}
            >
              {trends.upi?.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {trends.upi?.percentage || '0.0%'}
            </span>
            <span className="text-[10px] text-gray-400">vs Yesterday</span>
          </div>
        </div>

        {/* 5. Present Day Card */}
        <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-charcoal-800 shadow-xs hover:border-gold-500/50 transition-all group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block">
                Present Day Card
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-sans text-gray-900 dark:text-white mt-1">
                ₹ {Number(today.card || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Yesterday: ₹ {Number(yesterday.card || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-charcoal-800 flex items-center justify-between text-xs">
            <span
              className={`flex items-center font-bold text-[11px] ${
                trends.card?.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500'
              }`}
            >
              {trends.card?.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {trends.card?.percentage || '0.0%'}
            </span>
            <span className="text-[10px] text-gray-400">vs Yesterday</span>
          </div>
        </div>
      </div>

      {/* Live Charts Compared with Yesterday */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Hourly Sales Live Comparison Chart (Today vs Yesterday) - 7 cols */}
        <div className="lg:col-span-7 bg-white dark:bg-charcoal-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold-500" />
                Hourly Sales Pacing (Today vs Yesterday)
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Hour-by-hour revenue performance comparison across salon operating hours
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gold-500 shadow-xs" />
                <span className="text-gray-800 dark:text-gray-200">Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-500">Yesterday</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="todayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="yesterdayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val, name) => [`₹ ${Number(val).toLocaleString('en-IN')}`, name === 'todaySales' ? 'Today' : 'Yesterday']}
                  labelFormatter={(lbl) => `Time Window: ${lbl}`}
                />
                <Area
                  type="monotone"
                  dataKey="todaySales"
                  stroke="#D4AF37"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#todayGrad)"
                  name="todaySales"
                />
                <Area
                  type="monotone"
                  dataKey="yesterdaySales"
                  stroke="#3B82F6"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#yesterdayGrad)"
                  name="yesterdaySales"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Channels Comparison (Today vs Yesterday) - 5 cols */}
        <div className="lg:col-span-5 bg-white dark:bg-charcoal-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gold-500" />
              Payment Channels (Today vs Yesterday)
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Live collection comparison across Cash, UPI and Cards
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                <XAxis dataKey="method" tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val, name) => [`₹ ${Number(val).toLocaleString('en-IN')}`, name === 'today' ? 'Today' : 'Yesterday']}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(val) => (val === 'today' ? "Today's Collections" : "Yesterday's Collections")}
                />
                <Bar dataKey="today" fill="#D4AF37" radius={[6, 6, 0, 0]} name="today" />
                <Bar dataKey="yesterday" fill="#3B82F6" radius={[6, 6, 0, 0]} name="yesterday" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Side-by-Side Performance Comparison Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 p-4 sm:p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold-500" />
          Direct Daily Variance Analysis (Today vs Yesterday)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-charcoal-950 text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-charcoal-800">
              <tr>
                <th className="py-2.5 px-4 font-bold">Performance Dimension</th>
                <th className="py-2.5 px-4 font-bold text-right">Present Day (Today)</th>
                <th className="py-2.5 px-4 font-bold text-right">Previous Day (Yesterday)</th>
                <th className="py-2.5 px-4 font-bold text-right">Net Variance (₹ / Count)</th>
                <th className="py-2.5 px-4 font-bold text-center">Trend Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-800 dark:text-gray-200">
              {/* Row 1: Total Revenue */}
              <tr>
                <td className="py-3 px-4 font-semibold flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-gold-500" />
                  Total Sales Revenue
                </td>
                <td className="py-3 px-4 text-right font-black font-mono">
                  ₹ {Number(today.total).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-right text-gray-500 font-mono">
                  ₹ {Number(yesterday.total).toLocaleString('en-IN')}
                </td>
                <td
                  className={`py-3 px-4 text-right font-bold font-mono ${
                    trends.total?.diffAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}
                >
                  {trends.total?.diffAmount >= 0 ? '+' : ''}₹{' '}
                  {Number(trends.total?.diffAmount || 0).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      trends.total?.isPositive
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {trends.total?.isPositive ? '↗ High' : '↘ Low'} ({trends.total?.percentage})
                  </span>
                </td>
              </tr>

              {/* Row 2: Invoices / Bills */}
              <tr>
                <td className="py-3 px-4 font-semibold flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5 text-blue-500" />
                  Total Sales Invoices
                </td>
                <td className="py-3 px-4 text-right font-black font-mono">{today.bills} Bills</td>
                <td className="py-3 px-4 text-right text-gray-500 font-mono">{yesterday.bills} Bills</td>
                <td
                  className={`py-3 px-4 text-right font-bold font-mono ${
                    trends.bills?.diffAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}
                >
                  {trends.bills?.diffAmount >= 0 ? '+' : ''}
                  {trends.bills?.diffAmount || 0} Bills
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      trends.bills?.isPositive
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {trends.bills?.isPositive ? '↗ High' : '↘ Low'} ({trends.bills?.percentage})
                  </span>
                </td>
              </tr>

              {/* Row 3: Cash Collections */}
              <tr>
                <td className="py-3 px-4 font-semibold flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                  Cash Intake
                </td>
                <td className="py-3 px-4 text-right font-black font-mono">
                  ₹ {Number(today.cash).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-right text-gray-500 font-mono">
                  ₹ {Number(yesterday.cash).toLocaleString('en-IN')}
                </td>
                <td
                  className={`py-3 px-4 text-right font-bold font-mono ${
                    trends.cash?.diffAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}
                >
                  {trends.cash?.diffAmount >= 0 ? '+' : ''}₹{' '}
                  {Number(trends.cash?.diffAmount || 0).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      trends.cash?.isPositive
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {trends.cash?.isPositive ? '↗ High' : '↘ Low'} ({trends.cash?.percentage})
                  </span>
                </td>
              </tr>

              {/* Row 4: UPI / QR */}
              <tr>
                <td className="py-3 px-4 font-semibold flex items-center gap-2">
                  <QrCode className="w-3.5 h-3.5 text-purple-500" />
                  UPI / QR Payments
                </td>
                <td className="py-3 px-4 text-right font-black font-mono text-gold-600 dark:text-gold-400">
                  ₹ {Number(today.upi).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-right text-gray-500 font-mono">
                  ₹ {Number(yesterday.upi).toLocaleString('en-IN')}
                </td>
                <td
                  className={`py-3 px-4 text-right font-bold font-mono ${
                    trends.upi?.diffAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}
                >
                  {trends.upi?.diffAmount >= 0 ? '+' : ''}₹{' '}
                  {Number(trends.upi?.diffAmount || 0).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      trends.upi?.isPositive
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {trends.upi?.isPositive ? '↗ High' : '↘ Low'} ({trends.upi?.percentage})
                  </span>
                </td>
              </tr>

              {/* Row 5: Card */}
              <tr>
                <td className="py-3 px-4 font-semibold flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                  Card (Debit & Credit)
                </td>
                <td className="py-3 px-4 text-right font-black font-mono">
                  ₹ {Number(today.card).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-right text-gray-500 font-mono">
                  ₹ {Number(yesterday.card).toLocaleString('en-IN')}
                </td>
                <td
                  className={`py-3 px-4 text-right font-bold font-mono ${
                    trends.card?.diffAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}
                >
                  {trends.card?.diffAmount >= 0 ? '+' : ''}₹{' '}
                  {Number(trends.card?.diffAmount || 0).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      trends.card?.isPositive
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {trends.card?.isPositive ? '↗ High' : '↘ Low'} ({trends.card?.percentage})
                  </span>
                </td>
              </tr>

              {/* Row 6: Avg Bill Ticket */}
              <tr>
                <td className="py-3 px-4 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
                  Average Ticket Value
                </td>
                <td className="py-3 px-4 text-right font-black font-mono">
                  ₹ {Number(today.avgBill).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-right text-gray-500 font-mono">
                  ₹ {Number(yesterday.avgBill).toLocaleString('en-IN')}
                </td>
                <td
                  className={`py-3 px-4 text-right font-bold font-mono ${
                    today.avgBill >= yesterday.avgBill ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}
                >
                  {today.avgBill >= yesterday.avgBill ? '+' : ''}₹{' '}
                  {Number(today.avgBill - yesterday.avgBill).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      today.avgBill >= yesterday.avgBill
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {today.avgBill >= yesterday.avgBill ? '↗ High' : '↘ Low'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Present Day Real-Time Bills Generated */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gold-500" />
            Present Day Invoices ({todayBills.length})
          </h3>
          <span className="text-[11px] text-gray-400">
            Real-time feed for today only
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-charcoal-950 text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200 dark:border-charcoal-800">
              <tr>
                <th className="py-2.5 px-4 font-bold">Bill #</th>
                <th className="py-2.5 px-4 font-bold">Time</th>
                <th className="py-2.5 px-4 font-bold">Customer</th>
                <th className="py-2.5 px-4 font-bold">Attendant</th>
                <th className="py-2.5 px-4 font-bold">Items</th>
                <th className="py-2.5 px-4 font-bold text-right">Grand Total</th>
                <th className="py-2.5 px-4 font-bold">Payment Method</th>
                <th className="py-2.5 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-700 dark:text-gray-300">
              {todayBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No bills generated today yet. Once a bill is created, it will immediately appear here live.
                  </td>
                </tr>
              ) : (
                todayBills.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-charcoal-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">
                      {b.billNumber}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(b.billDate).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-gray-900 dark:text-white block">{b.customer?.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{b.customer?.mobile}</span>
                    </td>
                    <td className="py-3 px-4">{b.attendant?.name || 'Stylist'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-charcoal-800 text-[10px] font-semibold">
                        {b.items?.length || 0} items
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-gray-900 dark:text-white">
                      ₹ {Number(b.grandTotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gold-500/10 text-gold-600 dark:text-gold-400 border border-gold-500/20">
                        {b.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedBill(b);
                          setPreviewOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800"
                        title="Quick View Bill"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Preview Modal */}
      {previewOpen && selectedBill && (
        <BillPreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          bill={selectedBill}
          settings={settings}
        />
      )}
    </div>
  );
};

export default PresentDayPage;
