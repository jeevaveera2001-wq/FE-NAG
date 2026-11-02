import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  TrendingUp,
  Receipt,
  CreditCard,
  QrCode,
  Wallet,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Clock,
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

  const { user } = useAuth();
  const { socket } = useSocket();

  const fetchPresentDayData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await api.get('/dashboard/present-day');

      if (res.data.success) {
        setData(res.data.data);
      }
      if (isManual) {
        toast.success("Present day metrics synchronized!");
      }
    } catch (err) {
      console.error('Failed to load present day metrics:', err);
      if (isManual) toast.error('Failed to update live metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPresentDayData();
  }, []);

  // Listen to realtime socket updates
  useEffect(() => {
    if (!socket) return;
    const handleLiveEvent = () => fetchPresentDayData(false);

    socket.on('bill:created', handleLiveEvent);
    socket.on('bill:updated', handleLiveEvent);
    socket.on('bill:cancelled', handleLiveEvent);
    socket.on('stats:updated', handleLiveEvent);

    return () => {
      socket.off('bill:created', handleLiveEvent);
      socket.off('bill:updated', handleLiveEvent);
      socket.off('bill:cancelled', handleLiveEvent);
      socket.off('stats:updated', handleLiveEvent);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-6rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const today = data?.today || { total: 0, bills: 0, cash: 0, upi: 0, card: 0, avgBill: 0 };
  const yesterday = data?.yesterday || { total: 0, bills: 0, cash: 0, upi: 0, card: 0, avgBill: 0 };
  const trends = data?.trends || {};
  const hourlyData = data?.hourlyData || [];
  const paymentData = data?.paymentData || [];

  return (
    <div className="space-y-3 lg:space-y-3.5 lg:h-[calc(100vh-5.5rem)] lg:overflow-hidden flex flex-col justify-between overflow-y-auto">
      {/* Top Header Banner */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 px-4 py-2.5 sm:py-3 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-gold-500" />
              Present Day Live Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
              Live Stream
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Real-time performance for{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>{' '}
            compared against yesterday.
          </p>
        </div>

        <button
          onClick={() => fetchPresentDayData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-800 hover:bg-gray-50 dark:hover:bg-charcoal-700 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          title="Refresh Present Day Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Updating...' : 'Sync Live'}</span>
        </button>
      </div>

      {/* 5 Present Day Core Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3 shrink-0">
        {/* 1. Present Day Total */}
        <div className="bg-white dark:bg-charcoal-900 rounded-xl p-3 sm:p-3.5 border border-gray-200 dark:border-charcoal-800 shadow-xs hover:border-gold-500/50 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block">
                Present Day Total
              </span>
              <h3 className="text-lg sm:text-xl font-black font-sans text-gray-900 dark:text-white mt-0.5">
                ₹ {Number(today.total || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Yesterday: ₹ {Number(yesterday.total || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-600 dark:text-gold-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-charcoal-800 flex items-center justify-between text-xs">
            <span
              className={`flex items-center font-bold text-[10px] ${
                trends.total?.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500'
              }`}
            >
              {trends.total?.isPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              {trends.total?.percentage || '0.0%'}
            </span>
            <span className="text-[9px] text-gray-400">vs Yesterday</span>
          </div>
        </div>

        {/* 2. Present Day Sales Bills */}
        <div className="bg-white dark:bg-charcoal-900 rounded-xl p-3 sm:p-3.5 border border-gray-200 dark:border-charcoal-800 shadow-xs hover:border-gold-500/50 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block">
                Present Day Bills
              </span>
              <h3 className="text-lg sm:text-xl font-black font-sans text-gray-900 dark:text-white mt-0.5">
                {today.bills} <span className="text-xs font-semibold text-gray-400">Bills</span>
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Yesterday: {yesterday.bills} Bills
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-charcoal-800 flex items-center justify-between text-xs">
            <span
              className={`flex items-center font-bold text-[10px] ${
                trends.bills?.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500'
              }`}
            >
              {trends.bills?.isPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              {trends.bills?.percentage || '0.0%'}
            </span>
            <span className="text-[9px] text-gray-400">vs Yesterday</span>
          </div>
        </div>

        {/* 3. Present Day Cash */}
        <div className="bg-white dark:bg-charcoal-900 rounded-xl p-3 sm:p-3.5 border border-gray-200 dark:border-charcoal-800 shadow-xs hover:border-gold-500/50 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block">
                Present Day Cash
              </span>
              <h3 className="text-lg sm:text-xl font-black font-sans text-gray-900 dark:text-white mt-0.5">
                ₹ {Number(today.cash || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Yesterday: ₹ {Number(yesterday.cash || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-charcoal-800 flex items-center justify-between text-xs">
            <span
              className={`flex items-center font-bold text-[10px] ${
                trends.cash?.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500'
              }`}
            >
              {trends.cash?.isPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              {trends.cash?.percentage || '0.0%'}
            </span>
            <span className="text-[9px] text-gray-400">vs Yesterday</span>
          </div>
        </div>

        {/* 4. Present Day UPI */}
        <div className="bg-white dark:bg-charcoal-900 rounded-xl p-3 sm:p-3.5 border border-gray-200 dark:border-charcoal-800 shadow-xs hover:border-gold-500/50 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block">
                Present Day UPI
              </span>
              <h3 className="text-lg sm:text-xl font-black font-sans text-gray-900 dark:text-white mt-0.5">
                ₹ {Number(today.upi || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Yesterday: ₹ {Number(yesterday.upi || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-charcoal-800 flex items-center justify-between text-xs">
            <span
              className={`flex items-center font-bold text-[10px] ${
                trends.upi?.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500'
              }`}
            >
              {trends.upi?.isPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              {trends.upi?.percentage || '0.0%'}
            </span>
            <span className="text-[9px] text-gray-400">vs Yesterday</span>
          </div>
        </div>

        {/* 5. Present Day Card */}
        <div className="bg-white dark:bg-charcoal-900 rounded-xl p-3 sm:p-3.5 border border-gray-200 dark:border-charcoal-800 shadow-xs hover:border-gold-500/50 transition-all flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 block">
                Present Day Card
              </span>
              <h3 className="text-lg sm:text-xl font-black font-sans text-gray-900 dark:text-white mt-0.5">
                ₹ {Number(today.card || 0).toLocaleString('en-IN')}
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Yesterday: ₹ {Number(yesterday.card || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-charcoal-800 flex items-center justify-between text-xs">
            <span
              className={`flex items-center font-bold text-[10px] ${
                trends.card?.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500'
              }`}
            >
              {trends.card?.isPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              {trends.card?.percentage || '0.0%'}
            </span>
            <span className="text-[9px] text-gray-400">vs Yesterday</span>
          </div>
        </div>
      </div>

      {/* Live Charts Compared with Yesterday (Hourly AreaChart + Payment Channels BarChart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* Hourly Sales Live Comparison Chart - 7 cols */}
        <div className="lg:col-span-7 bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gold-500" />
                Hourly Sales Pacing (Today vs Yesterday)
              </h3>
              <p className="text-[10px] text-gray-400">Hour-by-hour revenue pacing</p>
            </div>
            <div className="flex items-center gap-2.5 text-[10px] font-semibold">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-500" />
                <span className="text-gray-800 dark:text-gray-200">Today</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-gray-400">Yesterday</span>
              </div>
            </div>
          </div>

          <div className="h-44 sm:h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
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
                    fontSize: '11px',
                  }}
                  formatter={(val, name) => [`₹ ${Number(val).toLocaleString('en-IN')}`, name === 'todaySales' ? 'Today' : 'Yesterday']}
                  labelFormatter={(lbl) => `Time: ${lbl}`}
                />
                <Area
                  type="monotone"
                  dataKey="todaySales"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#todayGrad)"
                  name="todaySales"
                />
                <Area
                  type="monotone"
                  dataKey="yesterdaySales"
                  stroke="#3B82F6"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#yesterdayGrad)"
                  name="yesterdaySales"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Channels Comparison - 5 cols */}
        <div className="lg:col-span-5 bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-gold-500" />
              Payment Channels (Today vs Yesterday)
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Cash, UPI and Card comparison
            </p>
          </div>

          <div className="h-44 sm:h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
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
                    fontSize: '11px',
                  }}
                  formatter={(val, name) => [`₹ ${Number(val).toLocaleString('en-IN')}`, name === 'today' ? 'Today' : 'Yesterday']}
                />
                <Legend
                  wrapperStyle={{ fontSize: '10px' }}
                  formatter={(val) => (val === 'today' ? "Today" : "Yesterday")}
                />
                <Bar dataKey="today" fill="#D4AF37" radius={[4, 4, 0, 0]} name="today" />
                <Bar dataKey="yesterday" fill="#3B82F6" radius={[4, 4, 0, 0]} name="yesterday" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Side-by-Side Performance Comparison Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 p-3 sm:p-3.5 shadow-xs shrink-0">
        <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gold-500" />
          Direct Daily Variance Analysis (Today vs Yesterday)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-charcoal-950 text-gray-500 uppercase text-[9px] tracking-wider border-b border-gray-200 dark:border-charcoal-800">
              <tr>
                <th className="py-1.5 px-3 font-bold">Metric Dimension</th>
                <th className="py-1.5 px-3 font-bold text-right">Present Day (Today)</th>
                <th className="py-1.5 px-3 font-bold text-right">Previous Day (Yesterday)</th>
                <th className="py-1.5 px-3 font-bold text-right">Net Variance (₹ / Count)</th>
                <th className="py-1.5 px-3 font-bold text-center">Trend Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-800 dark:text-gray-200 text-xs">
              {/* Row 1: Total Revenue */}
              <tr>
                <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-gold-500" />
                  Total Sales Revenue
                </td>
                <td className="py-2 px-3 text-right font-black font-mono">
                  ₹ {Number(today.total).toLocaleString('en-IN')}
                </td>
                <td className="py-2 px-3 text-right text-gray-400 font-mono">
                  ₹ {Number(yesterday.total).toLocaleString('en-IN')}
                </td>
                <td
                  className={`py-2 px-3 text-right font-bold font-mono ${
                    trends.total?.diffAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}
                >
                  {trends.total?.diffAmount >= 0 ? '+' : ''}₹{' '}
                  {Number(trends.total?.diffAmount || 0).toLocaleString('en-IN')}
                </td>
                <td className="py-2 px-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
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
                <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                  <Receipt className="w-3 h-3 text-blue-500" />
                  Total Sales Invoices
                </td>
                <td className="py-2 px-3 text-right font-black font-mono">{today.bills} Bills</td>
                <td className="py-2 px-3 text-right text-gray-400 font-mono">{yesterday.bills} Bills</td>
                <td
                  className={`py-2 px-3 text-right font-bold font-mono ${
                    trends.bills?.diffAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}
                >
                  {trends.bills?.diffAmount >= 0 ? '+' : ''}
                  {trends.bills?.diffAmount || 0} Bills
                </td>
                <td className="py-2 px-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      trends.bills?.isPositive
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {trends.bills?.isPositive ? '↗ High' : '↘ Low'} ({trends.bills?.percentage})
                  </span>
                </td>
              </tr>

              {/* Row 3: Cash Payments */}
              <tr>
                <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                  <Wallet className="w-3 h-3 text-emerald-500" />
                  Cash Collections
                </td>
                <td className="py-2 px-3 text-right font-black font-mono">
                  ₹ {Number(today.cash).toLocaleString('en-IN')}
                </td>
                <td className="py-2 px-3 text-right text-gray-400 font-mono">
                  ₹ {Number(yesterday.cash).toLocaleString('en-IN')}
                </td>
                <td
                  className={`py-2 px-3 text-right font-bold font-mono ${
                    trends.cash?.diffAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}
                >
                  {trends.cash?.diffAmount >= 0 ? '+' : ''}₹{' '}
                  {Number(trends.cash?.diffAmount || 0).toLocaleString('en-IN')}
                </td>
                <td className="py-2 px-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      trends.cash?.isPositive
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {trends.cash?.isPositive ? '↗ High' : '↘ Low'} ({trends.cash?.percentage})
                  </span>
                </td>
              </tr>

              {/* Row 4: UPI Collections */}
              <tr>
                <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                  <QrCode className="w-3 h-3 text-purple-500" />
                  UPI / QR Collections
                </td>
                <td className="py-2 px-3 text-right font-black font-mono">
                  ₹ {Number(today.upi).toLocaleString('en-IN')}
                </td>
                <td className="py-2 px-3 text-right text-gray-400 font-mono">
                  ₹ {Number(yesterday.upi).toLocaleString('en-IN')}
                </td>
                <td
                  className={`py-2 px-3 text-right font-bold font-mono ${
                    trends.upi?.diffAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}
                >
                  {trends.upi?.diffAmount >= 0 ? '+' : ''}₹{' '}
                  {Number(trends.upi?.diffAmount || 0).toLocaleString('en-IN')}
                </td>
                <td className="py-2 px-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      trends.upi?.isPositive
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {trends.upi?.isPositive ? '↗ High' : '↘ Low'} ({trends.upi?.percentage})
                  </span>
                </td>
              </tr>

              {/* Row 5: Card Collections */}
              <tr>
                <td className="py-2 px-3 font-semibold flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3 text-amber-500" />
                  Card Collections
                </td>
                <td className="py-2 px-3 text-right font-black font-mono">
                  ₹ {Number(today.card).toLocaleString('en-IN')}
                </td>
                <td className="py-2 px-3 text-right text-gray-400 font-mono">
                  ₹ {Number(yesterday.card).toLocaleString('en-IN')}
                </td>
                <td
                  className={`py-2 px-3 text-right font-bold font-mono ${
                    trends.card?.diffAmount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}
                >
                  {trends.card?.diffAmount >= 0 ? '+' : ''}₹{' '}
                  {Number(trends.card?.diffAmount || 0).toLocaleString('en-IN')}
                </td>
                <td className="py-2 px-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      trends.card?.isPositive
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {trends.card?.isPositive ? '↗ High' : '↘ Low'} ({trends.card?.percentage})
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PresentDayPage;
