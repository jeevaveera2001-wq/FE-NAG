import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Download,
  Printer,
  TrendingUp,
  Scissors,
  Package,
  Users,
  Percent,
  Ban,
  Receipt,
  DollarSign,
  Filter,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { SkeletonCard, SkeletonTable, PullToRefresh } from '../components/loaders';

export const ReportsPage = () => {
  const [reportTab, setReportTab] = useState('sales'); // 'sales' | 'services' | 'products' | 'attendants' | 'cancelled' | 'inventory'
  const [period, setPeriod] = useState('this_month'); // 'today' | 'this_week' | 'this_month' | 'last_month' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {
        period: period !== 'custom' ? period : undefined,
        startDate: period === 'custom' ? startDate : undefined,
        endDate: period === 'custom' ? endDate : undefined,
      };

      let endpoint = '/reports/sales';
      if (reportTab === 'services') endpoint = '/reports/services';
      if (reportTab === 'products') endpoint = '/reports/products';
      if (reportTab === 'attendants') endpoint = '/reports/attendants';
      if (reportTab === 'cancelled') endpoint = '/reports/cancelled-bills';
      if (reportTab === 'inventory') endpoint = '/reports/inventory';

      const res = await api.get(endpoint, { params });
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportTab, period, startDate, endDate]);

  const handlePrintReport = () => {
    window.print();
  };

  const exportExcel = () => {
    if (!reportData) return;

    let exportRows = [];
    let fileName = `Nagulan_${reportTab}_report.xlsx`;

    if (reportTab === 'sales' && reportData.data?.bills) {
      exportRows = reportData.data.bills.map((b) => ({
        'Bill No': b.billNumber,
        Date: new Date(b.billDate).toLocaleString('en-IN'),
        Customer: b.customer?.name,
        Mobile: b.customer?.mobile,
        'Subtotal (₹)': b.subtotal,
        'Discount (₹)': b.discountTotal,
        'Grand Total (₹)': b.grandTotal,
        'Payment Method': b.paymentMethod,
      }));
    } else if (reportTab === 'services' && reportData.services) {
      exportRows = reportData.services.map((s) => ({
        'Service Name': s.name,
        Category: s.category,
        'Quantity Sold': s.quantity,
        'Revenue Generated (₹)': s.revenue,
      }));
    } else if (reportTab === 'products' && reportData.products) {
      exportRows = reportData.products.map((p) => ({
        'Product Name': p.name,
        Category: p.category,
        'Quantity Sold': p.quantity,
        'Revenue Generated (₹)': p.revenue,
      }));
    } else if (reportTab === 'attendants' && reportData.attendants) {
      exportRows = reportData.attendants.map((a) => ({
        'Attendant ID': a.attendantId,
        Name: a.name,
        'Completed Services': a.servicesCompleted,
        'Total Sales (₹)': a.totalSales,
        'Commission Earned (₹)': a.commissionEarned,
      }));
    } else if (reportTab === 'cancelled' && reportData.bills) {
      exportRows = reportData.bills.map((b) => ({
        'Bill No': b.billNumber,
        Date: new Date(b.billDate).toLocaleString('en-IN'),
        Customer: b.customer?.name,
        'Amount (₹)': b.grandTotal,
        'Cancellation Reason': b.cancellationReason,
        'Cancelled By': b.cancelledBy?.fullName || 'Admin',
      }));
    }

    if (exportRows.length === 0) {
      toast.error('No data available to export');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, fileName);
    toast.success('Report exported to Excel!');
  };

  return (
    <PullToRefresh onRefresh={fetchReport}>
      <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-serif">
            <BarChart3 className="w-6 h-6 text-gold-500" />
            Executive Reports & Analytics Engine
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Audit-grade performance summaries, revenue streams, commissions, and cancellations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 hover:bg-gray-50 dark:hover:bg-charcoal-800 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 text-xs font-bold shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="bg-white dark:bg-charcoal-900 p-2 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm flex items-center gap-1.5 overflow-x-auto no-print">
        {[
          { id: 'sales', label: 'Sales & Revenue', icon: TrendingUp },
          { id: 'services', label: 'Service-Wise Sales', icon: Scissors },
          { id: 'products', label: 'Product-Wise Sales', icon: Package },
          { id: 'attendants', label: 'Attendant Commission', icon: Users },
          { id: 'cancelled', label: 'Cancelled Bills Audit', icon: Ban },
          { id: 'inventory', label: 'Inventory Valuation', icon: DollarSign },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              reportTab === tab.id
                ? 'bg-black text-white dark:bg-gold-500 dark:text-black shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-charcoal-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Date Range Selector */}
      {reportTab !== 'inventory' && (
        <div className="bg-white dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-gray-400 font-semibold shrink-0">Timeframe:</span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'last_month', label: 'Last Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-all shrink-0 ${
                  period === p.id
                    ? 'bg-charcoal-900 text-white dark:bg-white dark:text-black font-bold'
                    : 'bg-gray-100 dark:bg-charcoal-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border dark:border-charcoal-700 bg-white dark:bg-charcoal-950 font-mono text-xs"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg border dark:border-charcoal-700 bg-white dark:bg-charcoal-950 font-mono text-xs"
              />
            </div>
          )}
        </div>
      )}

      {/* Report Tables & Content Rendering */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm p-5 space-y-6">
        {/* Printable Report Header */}
        <div className="border-b border-gray-200 dark:border-charcoal-800 pb-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-gray-900 dark:text-white uppercase tracking-wider">
              NAGULAN Unisex Salon — {reportTab.toUpperCase()} STATEMENT
            </h3>
            <p className="text-xs text-gray-500">
              Franchise Hotline: 97899 61617 • Generated on {new Date().toLocaleString('en-IN')}
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded bg-gray-100 dark:bg-charcoal-800 font-bold uppercase text-gold-600 dark:text-gold-400 font-mono">
            {period.replace('_', ' ')}
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonTable rows={6} cols={8} />
          </div>
        ) : (
          <>
            {/* 1. Sales & Revenue Summary */}
            {reportTab === 'sales' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-charcoal-950 border dark:border-charcoal-800">
                    <span className="text-[11px] text-gray-500 font-semibold uppercase">Total Gross Turnover</span>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1 font-mono">
                      ₹ {Number(reportData?.data?.totalSales || 0).toLocaleString('en-IN')}
                    </h4>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-charcoal-950 border dark:border-charcoal-800">
                    <span className="text-[11px] text-gray-500 font-semibold uppercase">Discounts Granted</span>
                    <h4 className="text-xl font-bold text-red-500 mt-1 font-mono">
                      ₹ {Number(reportData?.data?.totalDiscount || 0).toLocaleString('en-IN')}
                    </h4>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-charcoal-950 border dark:border-charcoal-800">
                    <span className="text-[11px] text-gray-500 font-semibold uppercase">Completed Invoices</span>
                    <h4 className="text-xl font-bold text-gold-500 mt-1 font-mono">
                      {reportData?.data?.totalBills || 0} Bills
                    </h4>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-charcoal-950 text-gray-500 uppercase tracking-wider font-semibold border-b dark:border-charcoal-800">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Bill No</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Attendant</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                        <th className="py-2.5 px-3 text-right">Discount</th>
                        <th className="py-2.5 px-3 text-right">Grand Total</th>
                        <th className="py-2.5 px-3">Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800">
                      {reportData?.data?.bills?.map((b) => (
                        <tr key={b._id}>
                          <td className="py-2.5 px-3 text-gray-500">{new Date(b.billDate).toLocaleDateString('en-IN')}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">{b.billNumber}</td>
                          <td className="py-2.5 px-3 font-semibold">{b.customer?.name}</td>
                          <td className="py-2.5 px-3">{b.attendant?.name || '-'}</td>
                          <td className="py-2.5 px-3 text-right font-mono">₹ {b.subtotal}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-red-500">₹ {b.discountTotal}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 dark:text-white">
                            ₹ {b.grandTotal}
                          </td>
                          <td className="py-2.5 px-3">{b.paymentMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Service Performance Report */}
            {reportTab === 'services' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-charcoal-950 text-gray-500 uppercase tracking-wider font-semibold border-b dark:border-charcoal-800">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Service Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Quantity Booked</th>
                    <th className="py-2.5 px-3 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800">
                  {reportData?.services?.map((s, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 text-gray-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">{s.name}</td>
                      <td className="py-2.5 px-3">{s.category}</td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono">{s.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-gold-600 dark:text-gold-400">
                        ₹ {Number(s.revenue).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 3. Product Sales Report */}
            {reportTab === 'products' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-charcoal-950 text-gray-500 uppercase tracking-wider font-semibold border-b dark:border-charcoal-800">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Quantity Sold</th>
                    <th className="py-2.5 px-3 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800">
                  {reportData?.products?.map((p, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 text-gray-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">{p.name}</td>
                      <td className="py-2.5 px-3">{p.category}</td>
                      <td className="py-2.5 px-3 text-center font-bold font-mono">{p.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-gold-600 dark:text-gold-400">
                        ₹ {Number(p.revenue).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. Attendant Commission Report */}
            {reportTab === 'attendants' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-charcoal-950 text-gray-500 uppercase tracking-wider font-semibold border-b dark:border-charcoal-800">
                    <th className="py-2.5 px-3">Attendant ID</th>
                    <th className="py-2.5 px-3">Stylist Full Name</th>
                    <th className="py-2.5 px-3">Specialization</th>
                    <th className="py-2.5 px-3 text-center">Services Completed</th>
                    <th className="py-2.5 px-3 text-right">Sales Volume</th>
                    <th className="py-2.5 px-3 text-right">Commission Rate</th>
                    <th className="py-2.5 px-3 text-right">Commission Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800">
                  {reportData?.attendants?.map((att, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-mono font-bold">{att.attendantId}</td>
                      <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">{att.name}</td>
                      <td className="py-2.5 px-3">{att.specialization}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold">{att.servicesCompleted}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 dark:text-white">
                        ₹ {Number(att.totalSales).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{att.commissionPercentage}%</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-green-600 dark:text-green-400">
                        ₹ {Number(att.commissionEarned).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 5. Tax / GST Compliance Report */}
            {/* 6. Cancelled Bills Report */}
            {reportTab === 'cancelled' && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-charcoal-950 text-gray-500 uppercase tracking-wider font-semibold border-b dark:border-charcoal-800">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Bill No</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Mandatory Cancellation Reason</th>
                    <th className="py-2.5 px-3">Cancelled By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800">
                  {reportData?.bills?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">No cancelled invoices on record.</td>
                    </tr>
                  ) : (
                    reportData?.bills?.map((b) => (
                      <tr key={b._id}>
                        <td className="py-2.5 px-3 text-gray-500">{new Date(b.billDate).toLocaleDateString('en-IN')}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-red-500">{b.billNumber}</td>
                        <td className="py-2.5 px-3">{b.customer?.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹ {b.grandTotal}</td>
                        <td className="py-2.5 px-3 font-semibold text-red-600 dark:text-red-400">
                          {b.cancellationReason}
                        </td>
                        <td className="py-2.5 px-3 text-gray-500">{b.cancelledBy?.fullName || 'Admin'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* 7. Inventory Valuation */}
            {reportTab === 'inventory' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-charcoal-950 border dark:border-charcoal-800">
                    <span className="text-[11px] text-gray-500 font-semibold uppercase">Total Products in Catalog</span>
                    <h4 className="text-xl font-bold font-mono mt-1">{reportData?.summary?.totalProducts || 0} SKUs</h4>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-charcoal-950 border dark:border-charcoal-800">
                    <span className="text-[11px] text-gray-500 font-semibold uppercase">Total Stock Units</span>
                    <h4 className="text-xl font-bold font-mono mt-1">{reportData?.summary?.totalStockUnits || 0} Units</h4>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-charcoal-950 border dark:border-charcoal-800">
                    <span className="text-[11px] text-gray-500 font-semibold uppercase">Total Stock Asset Valuation</span>
                    <h4 className="text-xl font-bold font-mono mt-1 text-gold-500">
                      ₹ {Number(reportData?.summary?.totalValuation || 0).toLocaleString('en-IN')}
                    </h4>
                  </div>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-charcoal-950 text-gray-500 uppercase tracking-wider font-semibold border-b dark:border-charcoal-800">
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Brand</th>
                      <th className="py-2.5 px-3 text-right">Purchase Price</th>
                      <th className="py-2.5 px-3 text-right">Selling Price</th>
                      <th className="py-2.5 px-3 text-center">Current Stock</th>
                      <th className="py-2.5 px-3 text-right">Asset Value (Cost)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800">
                    {reportData?.products?.map((p) => (
                      <tr key={p._id}>
                        <td className="py-2.5 px-3 font-mono font-bold">{p.sku}</td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900 dark:text-white">{p.name}</td>
                        <td className="py-2.5 px-3">{p.brand}</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹ {p.purchasePrice}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">₹ {p.sellingPrice}</td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{p.currentStock}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 dark:text-white">
                          ₹ {p.currentStock * p.purchasePrice}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
      </div>
    </PullToRefresh>
  );
};

export default ReportsPage;
