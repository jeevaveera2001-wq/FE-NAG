import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import BillPreviewModal from '../components/BillPreviewModal';
import CancelBillModal from '../components/CancelBillModal';
import { SkeletonTableRow, PullToRefresh, InfiniteScrollLoader, LoadingButton } from '../components/loaders';
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
  const [loadingMore, setLoadingMore] = useState(false);
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

  // Status Change Modal with Mandatory Admin Notes
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalBill, setStatusModalBill] = useState(null);
  const [targetStatus, setTargetStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusChangeLoading, setStatusChangeLoading] = useState(false);

  // Attendants list for dropdown modification
  const [attendants, setAttendants] = useState([]);

  useEffect(() => {
    const loadAttendants = async () => {
      try {
        const res = await api.get('/attendants');
        if (res.data.success) {
          setAttendants(res.data.attendants || []);
        }
      } catch (err) {
        console.error('Failed to load attendants list:', err);
      }
    };
    loadAttendants();
  }, []);

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

  const loadMoreBills = async () => {
    if (loadingMore || pagination.page >= (pagination.totalPages || pagination.pages || 1)) return;
    try {
      setLoadingMore(true);
      const nextPage = pagination.page + 1;
      const params = {
        page: nextPage,
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
        setBills((prev) => [...prev, ...(res.data.bills || [])]);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load more bills:', err);
    } finally {
      setLoadingMore(false);
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

  // Modify Bill Fields Handler (Attendant & Payment dropdowns for Super Admin & Admin)
  const handleUpdateBillField = async (billId, updateData, successMsg) => {
    try {
      const res = await api.put(`/bills/${billId}`, updateData);
      if (res.data.success) {
        toast.success(successMsg || 'Bill updated successfully');
        setBills((prev) =>
          prev.map((b) => (b._id === billId ? { ...b, ...res.data.bill } : b))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update bill');
    }
  };

  const handleAttendantChange = (bill, attendantId) => {
    const att = attendants.find((a) => a._id === attendantId);
    if (!att) return;
    handleUpdateBillField(
      bill._id,
      {
        attendant: { attendantId: att._id, name: att.fullName },
        reason: `Attendant modified to ${att.fullName} by ${user?.fullName || user?.role}`,
      },
      `Attendant updated to ${att.fullName}`
    );
  };

  const handlePaymentMethodChange = (bill, newMethod) => {
    if (bill.paymentMethod === newMethod) return;
    handleUpdateBillField(
      bill._id,
      {
        paymentMethod: newMethod,
        reason: `Payment method modified to ${newMethod} by ${user?.fullName || user?.role}`,
      },
      `Payment method updated to ${newMethod}`
    );
  };

  const handleStatusDropdownSelect = (bill, newStatus) => {
    if (bill.status === newStatus) return;
    if (newStatus === 'Cancelled') {
      setCancellingBill(bill);
      setCancelModalOpen(true);
      return;
    }
    // Open status change modal with notes
    setStatusModalBill(bill);
    setTargetStatus(newStatus);
    setStatusNotes('');
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async (e) => {
    if (e) e.preventDefault();
    if (!statusNotes.trim()) {
      toast.error('Please enter a note / reason for changing the bill status');
      return;
    }
    if (!statusModalBill || !targetStatus) return;

    try {
      setStatusChangeLoading(true);
      const res = await api.put(`/bills/${statusModalBill._id}`, {
        status: targetStatus,
        reason: statusNotes.trim(),
        notes: statusNotes.trim(),
      });
      if (res.data.success) {
        toast.success(`Bill #${statusModalBill.billNumber} status updated to ${targetStatus}`);
        setBills((prev) =>
          prev.map((b) => (b._id === statusModalBill._id ? { ...b, ...res.data.bill } : b))
        );
        setStatusModalOpen(false);
        setStatusModalBill(null);
        setTargetStatus('');
        setStatusNotes('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update bill status');
    } finally {
      setStatusChangeLoading(false);
    }
  };

  const handlePaymentStatusChange = (bill, newStatus) => {
    if (bill.paymentStatus === newStatus) return;
    handleUpdateBillField(
      bill._id,
      {
        paymentStatus: newStatus,
        reason: `Payment status modified to ${newStatus} by ${user?.fullName || user?.role}`,
      },
      `Payment status updated to ${newStatus}`
    );
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
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={10} />
                ))
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
                    <td className="py-3.5 px-4">
                      {(isSuperAdmin || isAdmin) && bill.status !== 'Cancelled' ? (
                        <select
                          value={bill.attendant?.attendantId || ''}
                          onChange={(e) => handleAttendantChange(bill, e.target.value)}
                          className="text-xs bg-white dark:bg-charcoal-900 border border-gray-300 dark:border-charcoal-700 rounded-lg px-2 py-1 font-medium text-gray-900 dark:text-gray-100 hover:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none cursor-pointer max-w-[145px] truncate shadow-xs transition-colors"
                          title="Change Attendant"
                        >
                          <option value="" disabled>-- Select Stylist --</option>
                          {bill.attendant?.attendantId && !attendants.some((a) => a._id === bill.attendant.attendantId) && (
                            <option value={bill.attendant.attendantId}>
                              {bill.attendant.name || 'Current Stylist'}
                            </option>
                          )}
                          {attendants.map((att) => (
                            <option key={att._id} value={att._id}>
                              {att.fullName} {att.attendantId ? `(${att.attendantId})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {bill.attendant?.name || 'Stylist'}
                        </span>
                      )}
                    </td>
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
                      {(isSuperAdmin || isAdmin) && bill.status !== 'Cancelled' ? (
                        <div className="space-y-1.5 min-w-[125px]">
                          <select
                            value={bill.paymentMethod || 'Cash'}
                            onChange={(e) => handlePaymentMethodChange(bill, e.target.value)}
                            className="w-full text-xs font-semibold bg-white dark:bg-charcoal-900 border border-gray-300 dark:border-charcoal-700 rounded-lg px-2 py-1 text-gray-900 dark:text-gray-100 hover:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none cursor-pointer shadow-xs transition-colors"
                            title="Modify Payment Method"
                          >
                            {['Cash', 'UPI', 'Debit card', 'Credit card', 'Split payment', 'Other'].map((method) => (
                              <option key={method} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                          <select
                            value={bill.paymentStatus || 'Paid'}
                            onChange={(e) => handlePaymentStatusChange(bill, e.target.value)}
                            className={`w-full text-[10px] font-bold bg-white dark:bg-charcoal-900 border border-gray-200 dark:border-charcoal-700 rounded px-1.5 py-0.5 cursor-pointer transition-colors ${
                              bill.paymentStatus === 'Paid'
                                ? 'text-green-600 dark:text-green-400'
                                : bill.paymentStatus === 'Partial'
                                ? 'text-amber-500'
                                : 'text-red-500'
                            }`}
                            title="Modify Payment Status"
                          >
                            {['Paid', 'Partial', 'Unpaid'].map((st) => (
                              <option key={st} value={st} className="text-gray-900 dark:text-white bg-white dark:bg-charcoal-900">
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
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
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {(isSuperAdmin || isAdmin) && bill.status !== 'Cancelled' ? (
                        <div className="min-w-[115px]">
                          <select
                            value={bill.status}
                            onChange={(e) => handleStatusDropdownSelect(bill, e.target.value)}
                            className={`w-full text-xs font-bold rounded-lg px-2 py-1 cursor-pointer border transition-colors shadow-xs ${
                              bill.status === 'Completed'
                                ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800 hover:border-green-500'
                                : 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800 hover:border-yellow-500'
                            }`}
                            title="Modify Bill Status (Requires Admin Note)"
                          >
                            <option value="Completed" className="text-green-700 bg-white dark:bg-charcoal-900 font-bold">
                              Completed
                            </option>
                            <option value="Draft" className="text-yellow-700 bg-white dark:bg-charcoal-900 font-bold">
                              Draft
                            </option>
                            <option value="Cancelled" className="text-red-600 bg-white dark:bg-charcoal-900 font-bold">
                              Cancelled
                            </option>
                          </select>
                        </div>
                      ) : (
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
                      )}
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

                        {/* Cancel bill (Super Admin & Admin) */}
                        {(isSuperAdmin || isAdmin) && bill.status !== 'Cancelled' && (
                          <button
                            onClick={() => {
                              setCancellingBill(bill);
                              setCancelModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-500/10 transition-colors"
                            title="Cancel Bill"
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

        {/* Infinite Scroll Loader for seamless scrolling */}
        <InfiniteScrollLoader
          hasMore={pagination.page < (pagination.totalPages || pagination.pages || 1)}
          loading={loadingMore}
          onLoadMore={loadMoreBills}
          totalCount={pagination.total}
          currentCount={bills.length}
        />

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

      {/* Bill Status Change Modal with Mandatory Admin Notes */}
      {statusModalOpen && statusModalBill && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-charcoal-800">
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <span>Update Bill Status</span>
                <span className="font-mono text-purple-600 dark:text-purple-400 text-sm">
                  #{statusModalBill.billNumber}
                </span>
              </h3>
              <button
                onClick={() => {
                  setStatusModalOpen(false);
                  setStatusModalBill(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                ✕
              </button>
            </div>

            {/* Status Flow Badge */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-charcoal-950 rounded-xl border border-gray-200 dark:border-charcoal-800 text-xs">
              <div className="text-center">
                <span className="block text-[10px] uppercase font-bold text-gray-400">Current Status</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  statusModalBill.status === 'Draft'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                }`}>
                  {statusModalBill.status}
                </span>
              </div>
              <span className="text-gray-400 font-bold">➔</span>
              <div className="text-center">
                <span className="block text-[10px] uppercase font-bold text-gray-400">New Target Status</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  targetStatus === 'Completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                }`}>
                  {targetStatus}
                </span>
              </div>
            </div>

            {/* Explanatory notice */}
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {targetStatus === 'Completed'
                ? 'Converting this draft to Completed will calculate this bill in sales totals, revenue reports, and allocated attendant commissions.'
                : 'Moving this bill back to Draft will exclude it from completed sales and attendant metrics.'}
            </p>

            {/* Mandatory Notes Field */}
            <form onSubmit={handleConfirmStatusChange} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Administrative Reason / Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="e.g., Reception mistakenly put draft instead of print bill..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 resize-none"
                  required
                />
              </div>

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Reception mistakenly saved as draft instead of print bill',
                  'Customer payment completed, converted from draft',
                  'Verified and approved by admin',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setStatusNotes(suggestion)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-gray-100 dark:bg-charcoal-800 text-gray-600 dark:text-gray-300 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900/40 dark:hover:text-purple-300 transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => {
                    setStatusModalOpen(false);
                    setStatusModalBill(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 transition-all"
                >
                  Cancel
                </button>
                <LoadingButton
                  type="submit"
                  disabled={!statusNotes.trim()}
                  loading={statusChangeLoading}
                  loadingText="Updating Status..."
                  variant="primary"
                  size="md"
                >
                  Confirm Status Change
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
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
