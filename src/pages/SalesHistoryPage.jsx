import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import BillPreviewModal from '../components/BillPreviewModal';
import CancelBillModal from '../components/CancelBillModal';
import {
  History,
  FileSpreadsheet,
  Download,
  Printer,
  Eye,
  Ban,
  Share2,
  Filter,
  RefreshCw,
  Receipt,
  FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export const SalesHistoryPage = () => {
  const { user, isSuperAdmin, isAdmin, isReception } = useAuth();

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });

  // Filters State
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [status, setStatus] = useState('All');

  // Modals
  const [selectedBill, setSelectedBill] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingBill, setCancellingBill] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBills = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 15,
        search,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        paymentMethod: paymentMethod !== 'All' ? paymentMethod : undefined,
        paymentStatus: paymentStatus !== 'All' ? paymentStatus : undefined,
        status: status !== 'All' ? status : undefined,
      };

      const res = await api.get('/bills', { params });
      if (res.data.success) {
        setBills(res.data.bills);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load bills:', err);
      toast.error('Failed to load sales records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills(1);
  }, [search, startDate, endDate, paymentMethod, paymentStatus, status]);

  // Cancel Bill Handler
  const handleCancelBill = async (reason) => {
    if (!cancellingBill) return;
    try {
      setCancelLoading(true);
      const res = await api.post(`/bills/${cancellingBill._id}/cancel`, { reason });
      if (res.data.success) {
        toast.success(`Bill #${cancellingBill.billNumber} cancelled successfully`);
        setCancelModalOpen(false);
        setCancellingBill(null);
        fetchBills(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancelLoading(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    if (bills.length === 0) {
      toast.error('No bills to export');
      return;
    }

    const exportData = bills.map((b) => ({
      'Bill Number': b.billNumber,
      Date: new Date(b.billDate).toLocaleString('en-IN'),
      Customer: b.customer?.name,
      Mobile: b.customer?.mobile,
      Attendant: b.attendant?.name,
      Chair: b.chair?.name || b.chair?.chairNumber,
      'Subtotal (₹)': b.subtotal,
      'Discount (₹)': b.discountTotal,
      'Tax (₹)': b.taxTotal,
      'Grand Total (₹)': b.grandTotal,
      'Amount Paid (₹)': b.amountReceived,
      'Balance (₹)': b.balanceAmount,
      'Payment Method': b.paymentMethod,
      'Payment Status': b.paymentStatus,
      'Bill Status': b.status,
      'Billed By': b.createdByName,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales History');
    XLSX.writeFile(workbook, `Nagulan_Sales_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Sales ledger exported to Excel!');
  };

  // Export to CSV
  const exportToCSV = () => {
    if (bills.length === 0) {
      toast.error('No bills to export');
      return;
    }

    const headers = ['Bill No,Date,Customer,Mobile,Attendant,Total,Payment,Status\n'];
    const rows = bills.map(
      (b) =>
        `"${b.billNumber}","${new Date(b.billDate).toLocaleDateString('en-IN')}","${b.customer?.name}","${
          b.customer?.mobile
        }","${b.attendant?.name || ''}","${b.grandTotal}","${b.paymentMethod}","${b.status}"`
    );

    const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Nagulan_Sales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sales CSV downloaded!');
  };

  const handleClearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setPaymentMethod('All');
    setPaymentStatus('All');
    setStatus('All');
  };

  return (
    <div className="space-y-5">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-serif">
            <History className="w-6 h-6 text-gold-500" />
            Sales History & Invoices
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Complete transaction ledger with multi-filter queries and printable receipts
          </p>
        </div>

        {!isReception && (
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 hover:bg-gray-50 dark:hover:bg-charcoal-800 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Excel</span>
            </button>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 hover:bg-gray-50 dark:hover:bg-charcoal-800 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => fetchBills(pagination.page)}
              className="p-2 rounded-lg border border-gray-300 dark:border-charcoal-700 hover:bg-gray-50 dark:hover:bg-charcoal-800 text-gray-700 dark:text-gray-300"
              title="Refresh List"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Advanced Search & Multi-Filter Bar */}
      <div className="bg-white dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by Bill No, customer name, mobile, stylist..."
          onClear={handleClearFilters}
        />

        {/* Secondary Filter Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-2 border-t border-gray-100 dark:border-charcoal-800 text-xs">
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
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Payment Method</label>
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
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Payment Status</label>
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

          <div>
            <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Bill Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
            >
              <option value="All">All Bills</option>
              <option value="Completed">Completed</option>
              <option value="Draft">Draft</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                <th className="py-3.5 px-4">Bill No</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Attendant</th>
                <th className="py-3.5 px-4">Station</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4 text-right">Grand Total</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Bill Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-700 dark:text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading sales records...</span>
                    </div>
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    No transactions match the selected criteria.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr
                    key={bill._id}
                    className={`hover:bg-gray-50 dark:hover:bg-charcoal-800/40 transition-colors ${
                      bill.status === 'Cancelled' ? 'opacity-60 bg-red-500/5' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {bill.billNumber}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-gray-500">
                      {new Date(bill.billDate).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-gray-900 dark:text-white block">{bill.customer?.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{bill.customer?.mobile}</span>
                    </td>
                    <td className="py-3.5 px-4">{bill.attendant?.name || 'Stylist'}</td>
                    <td className="py-3.5 px-4">{bill.chair?.name || bill.chair?.chairNumber || 'Main'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-charcoal-800 text-[10px] font-semibold">
                        {bill.items?.length || 0} items
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-gray-900 dark:text-white font-mono">
                      ₹ {Number(bill.grandTotal).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100 block">
                          {bill.paymentMethod}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            bill.paymentStatus === 'Paid'
                              ? 'text-green-600 dark:text-green-400'
                              : bill.paymentStatus === 'Partial'
                              ? 'text-amber-500'
                              : 'text-red-500'
                          }`}
                        >
                          {bill.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedBill(bill);
                            setPreviewOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800"
                          title="Preview & Print"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => window.open(`/api/bills/${bill._id}/pdf`, '_blank')}
                          className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800"
                          title="Download PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Cancel bill (Super Admin Only - Admins strictly prohibited from deleting/cancelling sales) */}
                        {isSuperAdmin && bill.status !== 'Cancelled' && (
                          <button
                            onClick={() => {
                              setCancellingBill(bill);
                              setCancelModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-500/10"
                            title="Cancel Bill (Super Admin Only)"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <Pagination pagination={pagination} onPageChange={(p) => fetchBills(p)} />
      </div>

      {/* Bill Preview Modal */}
      {previewOpen && selectedBill && (
        <BillPreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          bill={selectedBill}
        />
      )}

      {/* Mandatory Cancel Reason Modal */}
      {cancelModalOpen && cancellingBill && (
        <CancelBillModal
          isOpen={cancelModalOpen}
          onClose={() => {
            setCancelModalOpen(false);
            setCancellingBill(null);
          }}
          onConfirm={handleCancelBill}
          billNumber={cancellingBill.billNumber}
          loading={cancelLoading}
        />
      )}
    </div>
  );
};

export default SalesHistoryPage;
