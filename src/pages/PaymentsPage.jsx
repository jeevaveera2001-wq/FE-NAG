import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { SkeletonTableRow, PullToRefresh } from '../components/loaders';
import { CreditCard, Download, FileSpreadsheet, RefreshCw, DollarSign, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export const PaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });

  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search,
        paymentMethod: paymentMethod !== 'All' ? paymentMethod : undefined,
        paymentStatus: paymentStatus !== 'All' ? paymentStatus : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await api.get('/payments', { params });
      if (res.data.success) {
        setPayments(res.data.payments);
        setPagination(res.data.pagination);
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

  const exportToExcel = () => {
    if (payments.length === 0) {
      toast.error('No payments to export');
      return;
    }

    const exportData = payments.map((p) => ({
      'Payment ID': p.paymentId,
      'Bill Number': p.billNumber,
      Date: new Date(p.createdAt).toLocaleString('en-IN'),
      Customer: p.customer?.name,
      Mobile: p.customer?.mobile,
      'Total Amount (₹)': p.totalBillAmount,
      'Amount Paid (₹)': p.amountPaid,
      'Balance (₹)': p.balanceAmount,
      'Payment Method': p.paymentMethod,
      'Transaction Ref ID': p.transactionRefId || '-',
      Status: p.paymentStatus,
      'Received By': p.receivedBy?.fullName || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments Ledger');
    XLSX.writeFile(workbook, `Nagulan_Payments_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Payments exported to Excel!');
  };

  return (
    <PullToRefresh onRefresh={() => fetchPayments(1)}>
      <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-serif">
            <CreditCard className="w-6 h-6 text-gold-500" />
            Payment Collections & Ledger
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Audit register of cash, UPI, cards, and split payments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 hover:bg-gray-50 dark:hover:bg-charcoal-800 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => fetchPayments(pagination.page)}
            className="p-2 rounded-lg border border-gray-300 dark:border-charcoal-700 hover:bg-gray-50 dark:hover:bg-charcoal-800 text-gray-700 dark:text-gray-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by Payment ID, Bill No, customer, reference ID..."
          onClear={() => setSearch('')}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-gray-100 dark:border-charcoal-800 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
            >
              <option value="All">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Debit card">Debit card</option>
              <option value="Credit card">Credit card</option>
              <option value="Split payment">Split payment</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Status</label>
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

      {/* Payments Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                <th className="py-3.5 px-4">Payment ID</th>
                <th className="py-3.5 px-4">Bill No</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4 text-right">Bill Total</th>
                <th className="py-3.5 px-4 text-right">Amount Paid</th>
                <th className="py-3.5 px-4 text-right">Balance</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Received By</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-700 dark:text-gray-300">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={10} />
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    No payment records found.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-charcoal-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {p.paymentId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      {p.billNumber}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-500">
                      {new Date(p.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-900 dark:text-white block">{p.customer?.name}</span>
                      <span className="text-[10px] text-gray-500">{p.customer?.mobile}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold">
                      ₹ {Number(p.totalBillAmount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-green-600 dark:text-green-400">
                      ₹ {Number(p.amountPaid).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                      ₹ {Number(p.balanceAmount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-charcoal-800 text-gray-800 dark:text-gray-300">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          p.paymentStatus === 'Paid'
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                            : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                        }`}
                      >
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{p.receivedBy?.fullName || '-'}</td>
                  </tr>
                ))
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
