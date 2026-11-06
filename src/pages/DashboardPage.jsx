import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import { SkeletonCard, SkeletonChart, PulsingBeacon, PullToRefresh } from '../components/loaders';
import {
  DollarSign,
  Receipt,
  CreditCard,
  Armchair,
  Users,
  UserCheck,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#D4AF37', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { socket } = useSocket();

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/dashboard/metrics');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchMetrics();
    socket.on('stats:updated', handleUpdate);
    socket.on('bill:created', handleUpdate);
    socket.on('bill:updated', handleUpdate);
    socket.on('chair:updated', handleUpdate);

    return () => {
      socket.off('stats:updated', handleUpdate);
      socket.off('bill:created', handleUpdate);
      socket.off('bill:updated', handleUpdate);
      socket.off('chair:updated', handleUpdate);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="space-y-3.5 p-1">
        {/* Top Stat Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2">
            <SkeletonChart title="Sales Trend Pacing" height="h-56" />
          </div>
          <div>
            <SkeletonChart title="Payment Channels" height="h-56" />
          </div>
        </div>

        {/* Bottom Metrics Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};

  return (
    <PullToRefresh onRefresh={fetchMetrics}>
      <div className="space-y-3 lg:space-y-3.5 lg:h-[calc(100vh-5.5rem)] lg:overflow-hidden flex flex-col justify-between overflow-y-auto">
      {/* Low Stock Warning (if any) */}
      {data?.lowStockProducts?.length > 0 && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-bold text-amber-800 dark:text-amber-300">
              Low Stock Warning ({data.lowStockProducts.length} Items):
            </span>
            <span className="text-amber-700 dark:text-amber-400 font-medium truncate max-w-xl">
              {data.lowStockProducts.map((p) => `${p.name} (${p.currentStock})`).join(', ')}
            </span>
          </div>
          <Link
            to="/products"
            className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
          >
            Manage Stock &rarr;
          </Link>
        </div>
      )}

      {/* Row 1: Top 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
        <StatCard
          title="Today's Revenue"
          value={`₹ ${Number(summary.todaySales || 0).toLocaleString('en-IN')}`}
          subtitle={`${summary.todayBills || 0} Bills Today`}
          icon={DollarSign}
          trend={summary.todayTrend?.percentage}
          trendPositive={summary.todayTrend?.isPositive}
          comparisonLabel={summary.todayTrend?.label || 'vs yesterday'}
        />
        <StatCard
          title="Weekly Sales"
          value={`₹ ${Number(summary.weekSales || 0).toLocaleString('en-IN')}`}
          subtitle={`${summary.weekBills || 0} Bills this week`}
          icon={Receipt}
          trend={summary.weekTrend?.percentage}
          trendPositive={summary.weekTrend?.isPositive}
          comparisonLabel={summary.weekTrend?.label || 'vs last week'}
        />
        <StatCard
          title="Monthly Sales"
          value={`₹ ${Number(summary.monthSales || 0).toLocaleString('en-IN')}`}
          subtitle={`${summary.monthBills || 0} Bills this month`}
          icon={TrendingUp}
          trend={summary.monthTrend?.percentage}
          trendPositive={summary.monthTrend?.isPositive}
          comparisonLabel={summary.monthTrend?.label || 'vs last month'}
        />
        <StatCard
          title="Styling Stations"
          value={`${summary.activeChairs || 0} / ${summary.totalChairs || 0}`}
          subtitle={`${(summary.totalChairs || 0) - (summary.activeChairs || 0)} Stations Free`}
          icon={Armchair}
          trend={summary.totalChairs > 0 ? `${Math.round(((summary.activeChairs || 0) / summary.totalChairs) * 100)}%` : null}
          trendPositive={(summary.activeChairs || 0) > 0}
          comparisonLabel="Occupancy Rate"
        />
      </div>

      {/* Row 2: 4 Payment Channels Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
        <div className="bg-white dark:bg-charcoal-900 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-charcoal-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Cash Collections</span>
            <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-mono mt-0.5 block">
              ₹ {Number(summary.cashPayments || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
        </div>
        <div className="bg-white dark:bg-charcoal-900 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-charcoal-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">UPI / QR Payments</span>
            <span className="text-sm sm:text-base font-bold text-purple-600 dark:text-purple-400 font-mono mt-0.5 block">
              ₹ {Number(summary.upiPayments || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
        </div>
        <div className="bg-white dark:bg-charcoal-900 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-charcoal-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Card Payments</span>
            <span className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5 block">
              ₹ {Number(summary.cardPayments || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
        </div>
        <div className="bg-white dark:bg-charcoal-900 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-charcoal-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Total Clients</span>
            <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
              {summary.totalCustomers || 0} Registered
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        </div>
      </div>

      {/* Row 3: Visual Charts Section (Revenue Trend & Payment Share) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">
        {/* Daily Sales Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-gold-500" />
                7-Day Revenue Trend
              </h3>
              <p className="text-[10px] text-gray-400">Daily gross turnover</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 dark:bg-charcoal-800 font-semibold text-gray-500">
              Live
            </span>
          </div>

          <div className="h-44 sm:h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.dailySalesChart || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val) => [`₹ ${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={(lbl) => `Day: ${lbl}`}
                  contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', color: '#FFF', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown Pie */}
        <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-gold-500" />
              Payment Share
            </h3>
            <span className="text-[10px] text-gray-400">By Mode</span>
          </div>

          <div className="h-36 sm:h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.paymentBreakdown?.filter((p) => p.amount > 0) || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="amount"
                  nameKey="method"
                >
                  {(data?.paymentBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`₹ ${Number(val).toLocaleString('en-IN')}`, 'Total']}
                  contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', color: '#FFF', borderRadius: '8px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1.5 border-t border-gray-100 dark:border-charcoal-800">
            {(data?.paymentBreakdown || []).map((p, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-gray-500 truncate">{p.method}:</span>
                <span className="font-bold text-gray-900 dark:text-white font-mono">₹{p.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Top Performing Attendants & Popular Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
        {/* Top Attendants */}
        <div className="bg-white dark:bg-charcoal-900 p-3 sm:p-3.5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-gold-500" />
              Top Stylists & Attendants
            </h3>
            <Link to="/attendants" className="text-[10px] text-gold-600 dark:text-gold-400 font-semibold hover:underline">
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-1.5">
            {data?.topAttendants?.slice(0, 3).map((att, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-charcoal-950/60 border border-gray-100 dark:border-charcoal-800 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-6 h-6 rounded-full bg-charcoal-800 text-gold-400 font-bold text-[10px] flex items-center justify-center shrink-0 border border-gold-500/30">
                    {idx + 1}
                  </div>
                  <div className="truncate">
                    <h4 className="font-bold text-gray-900 dark:text-white truncate">{att.fullName}</h4>
                    <p className="text-[9px] text-gray-400 truncate">
                      {Array.isArray(att.specialization) ? att.specialization.join(', ') : att.specialization || 'Stylist'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-gray-900 dark:text-white font-mono block">
                    ₹ {Number(att.totalSalesGenerated || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] text-green-600 dark:text-green-400 font-semibold">
                    {att.servicesCompleted || 0} services
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Popular Services */}
        <div className="bg-white dark:bg-charcoal-900 p-3 sm:p-3.5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-500" />
              Most Popular Services
            </h3>
            <Link to="/services" className="text-[10px] text-gold-600 dark:text-gold-400 font-semibold hover:underline">
              Menu &rarr;
            </Link>
          </div>

          <div className="space-y-1.5">
            {data?.popularServices?.slice(0, 3).map((srv, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-charcoal-950/60 border border-gray-100 dark:border-charcoal-800 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
                  <span className="font-medium text-gray-800 dark:text-gray-200 truncate">
                    {srv.name}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-gold-600 dark:text-gold-400 px-2 py-0.5 rounded bg-gold-500/10 shrink-0">
                  {srv.count} Bookings
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </PullToRefresh>
  );
};

export default DashboardPage;
