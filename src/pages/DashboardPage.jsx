import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import BillPreviewModal from '../components/BillPreviewModal';
import {
  DollarSign,
  Receipt,
  CreditCard,
  Armchair,
  Users,
  UserCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
  Calendar,
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
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#D4AF37', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];

export const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { user, isSuperAdmin, isAdmin } = useAuth();
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

  // Listen to live WebSocket events
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      fetchMetrics();
    };

    socket.on('bill:created', handleUpdate);
    socket.on('bill:cancelled', handleUpdate);
    socket.on('chair:updated', handleUpdate);
    socket.on('chair:status-changed', handleUpdate);
    socket.on('stats:updated', handleUpdate);

    return () => {
      socket.off('bill:created', handleUpdate);
      socket.off('bill:cancelled', handleUpdate);
      socket.off('chair:updated', handleUpdate);
      socket.off('chair:status-changed', handleUpdate);
      socket.off('stats:updated', handleUpdate);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading Live Salon Dashboard...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      {/* Low Stock Alerts */}
      {data?.lowStockProducts?.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-800 dark:text-amber-300">
              Low Stock Warning ({data.lowStockProducts.length} Items)
            </h4>
            <p className="text-amber-700 dark:text-amber-400/90 mt-0.5">
              The following products have reached or fallen below minimum threshold:{' '}
              <span className="font-semibold">
                {data.lowStockProducts.map((p) => `${p.name} (${p.currentStock} left)`).join(', ')}
              </span>
            </p>
          </div>
          <Link
            to="/products"
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
          >
            Manage Stock &rarr;
          </Link>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatCard
          title="Today's Revenue"
          value={`₹ ${Number(summary.todaySales || 0).toLocaleString('en-IN')}`}
          subtitle={`${summary.todayBills || 0} Bills Generated Today`}
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
          subtitle={`${(summary.totalChairs || 0) - (summary.activeChairs || 0)} Stations Available`}
          icon={Armchair}
          trend={summary.totalChairs > 0 ? `${Math.round(((summary.activeChairs || 0) / summary.totalChairs) * 100)}%` : null}
          trendPositive={(summary.activeChairs || 0) > 0}
          comparisonLabel="Occupancy Rate"
        />
      </div>

      {/* Payment Channels Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Cash Collections</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white mt-1 block">
            ₹ {Number(summary.cashPayments || 0).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">UPI / QR Payments</span>
          <span className="text-lg font-bold text-gold-600 dark:text-gold-400 mt-1 block">
            ₹ {Number(summary.upiPayments || 0).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Card Payments</span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1 block">
            ₹ {Number(summary.cardPayments || 0).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="bg-white dark:bg-charcoal-900 p-4 rounded-xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">Total Clients</span>
          <span className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1 block">
            {summary.totalCustomers || 0} Registered
          </span>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gold-500" />
                7-Day Revenue Trend
              </h3>
              <p className="text-xs text-gray-500">Daily gross turnover and bill count</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-gray-100 dark:bg-charcoal-800 font-medium text-gray-600 dark:text-gray-400">
              Live Aggregate
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.dailySalesChart || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val) => [`₹ ${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={(lbl) => `Day: ${lbl}`}
                  contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', color: '#FFF', borderRadius: '8px' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#D4AF37"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown Pie */}
        <div className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gold-500" />
              Payment Share
            </h3>
            <p className="text-xs text-gray-500">Breakdown by payment mode</p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.paymentBreakdown?.filter((p) => p.amount > 0) || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="amount"
                  nameKey="method"
                >
                  {(data?.paymentBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`₹ ${Number(val).toLocaleString('en-IN')}`, 'Total']}
                  contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', color: '#FFF', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-gray-100 dark:border-charcoal-800">
            {(data?.paymentBreakdown || []).map((p, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-gray-600 dark:text-gray-400 truncate">{p.method}:</span>
                <span className="font-semibold text-gray-900 dark:text-white">₹{p.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendant & Popular Services Performance Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Attendants */}
        <div className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-gold-500" />
              Top Performing Attendants
            </h3>
            <Link to="/attendants" className="text-xs text-gold-600 dark:text-gold-400 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {data?.topAttendants?.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-charcoal-950/60 border border-gray-100 dark:border-charcoal-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-charcoal-800 text-gold-400 font-bold text-xs flex items-center justify-center border border-gold-500/30">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">{att.fullName}</h4>
                    <p className="text-[10px] text-gray-500">{att.specialization?.join(', ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-900 dark:text-white block">
                    ₹ {Number(att.totalSalesGenerated || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">
                    {att.servicesCompleted || 0} services
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Popular Services */}
        <div className="bg-white dark:bg-charcoal-900 p-5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-500" />
              Most Popular Services
            </h3>
            <Link to="/services" className="text-xs text-gold-600 dark:text-gold-400 hover:underline">
              Full Menu
            </Link>
          </div>

          <div className="space-y-3">
            {data?.popularServices?.map((srv, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-charcoal-950/60 border border-gray-100 dark:border-charcoal-800"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-gold-500 shrink-0" />
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                    {srv.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-gold-600 dark:text-gold-400 px-2 py-0.5 rounded bg-gold-500/10">
                  {srv.count} Bookings
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Bills Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-gray-200 dark:border-charcoal-800">
          <div>
            <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-gold-500" />
              Recent Salon Invoices
            </h3>
            <p className="text-xs text-gray-500">Live feed of transactions generated across all chairs</p>
          </div>
          <Link
            to="/sales"
            className="flex items-center gap-1 text-xs font-bold text-gold-600 dark:text-gold-400 hover:underline"
          >
            <span>Sales Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-charcoal-950/60 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Attendant</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-700 dark:text-gray-300">
              {data?.recentBills?.map((bill) => (
                <tr key={bill._id} className="hover:bg-gray-50 dark:hover:bg-charcoal-800/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-white">
                    {bill.billNumber}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900 dark:text-white block">{bill.customer?.name}</span>
                    <span className="text-[10px] text-gray-500">{bill.customer?.mobile}</span>
                  </td>
                  <td className="py-3 px-4">{bill.attendant?.name || 'Stylist'}</td>
                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                    ₹ {Number(bill.grandTotal).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-charcoal-800 text-gray-800 dark:text-gray-300">
                      {bill.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        bill.status === 'Completed'
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                          : bill.status === 'Draft'
                          ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}
                    >
                      {bill.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedBill(bill);
                        setPreviewOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800"
                      title="Preview Bill"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
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
        />
      )}
    </div>
  );
};

export default DashboardPage;
