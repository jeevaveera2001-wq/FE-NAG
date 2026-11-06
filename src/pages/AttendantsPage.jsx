import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import BillPreviewModal from '../components/BillPreviewModal';
import { SkeletonTableRow, SkeletonCard, LoadingButton, PulsingBeacon } from '../components/loaders';
import {
  Users,
  ArrowRight,
  Sparkles,
  CalendarDays,
  RefreshCw,
  Eye,
  Layers,
  QrCode,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  UserCheck,
  X,
  FileSpreadsheet,
  Calculator,
  TrendingUp,
  Percent,
  Wallet,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';

export const AttendantsPage = () => {
  const { isSuperAdmin, isAdmin } = useAuth();

  const [attendants, setAttendants] = useState([]);
  const [chairs, setChairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Salary Calculator adjustments state (Bonus & Deductions per attendant ID)
  const [salaryAdjustments, setSalaryAdjustments] = useState({});

  // Active Tab: 'roster' | 'salary'
  const [activeTab, setActiveTab] = useState('roster');
  // Attendant Financial Dashboard State
  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const getThisMonthStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedAttendantId, setSelectedAttendantId] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedMonth, setSelectedMonth] = useState(getThisMonthStr());
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [previewBill, setPreviewBill] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchAttendantDashboard = async (attId, dateVal, monthVal) => {
    const idToUse = attId || selectedAttendantId;
    if (!idToUse) return;

    const dateToUse = dateVal || selectedDate;
    const monthToUse = monthVal || selectedMonth;

    try {
      setDashboardLoading(true);
      const res = await api.get(`/attendants/${idToUse}/dashboard?date=${dateToUse}&month=${monthToUse}`);
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load attendant dashboard:', err);
      toast.error('Failed to load stylist financial performance');
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (attendants.length > 0 && !selectedAttendantId) {
      setSelectedAttendantId(attendants[0]._id);
    }
  }, [attendants, selectedAttendantId]);

  useEffect(() => {
    if (activeTab === 'dashboard' && selectedAttendantId) {
      fetchAttendantDashboard(selectedAttendantId, selectedDate, selectedMonth);
    }
  }, [activeTab, selectedAttendantId, selectedDate, selectedMonth]);


  // Attendant Add/Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAttendant, setEditingAttendant] = useState(null);
  const [formData, setFormData] = useState({
    attendantId: '',
    fullName: '',
    mobile: '',
    email: '',
    address: '',
    specialization: 'Hair Cut, Beard Styling',
    assignedChair: '',
    shiftTiming: '9:00 AM - 6:00 PM',
    commissionPercentage: 10,
    baseSalary: 12000,
    status: 'active',
  });

  // Attendance Marking Modal
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedAttendantForAttendance, setSelectedAttendantForAttendance] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    status: 'Present',
    notes: '',
  });

  // Pay Slip Modal
  const [paySlipModalOpen, setPaySlipModalOpen] = useState(false);
  const [selectedAttendantForPaySlip, setSelectedAttendantForPaySlip] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attendantToDelete, setAttendantToDelete] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchAttendants = async (page = 1) => {
    try {
      setLoading(true);
      const [attRes, chrRes] = await Promise.all([
        api.get(`/attendants?page=${page}&limit=50&search=${search}&status=${statusFilter}`),
        api.get('/chairs'),
      ]);
      if (attRes.data.success) {
        setAttendants(attRes.data.attendants);
        setPagination(attRes.data.pagination);
      }
      if (chrRes.data.success) setChairs(chrRes.data.chairs);
    } catch (err) {
      console.error('Failed to load attendants:', err);
      toast.error('Failed to load attendants');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendants(1);
  }, [search, statusFilter]);

  const openCreateModal = () => {
    setEditingAttendant(null);
    setFormData({
      attendantId: `ATT-${String(100 + attendants.length + 1)}`,
      fullName: '',
      mobile: '',
      email: '',
      address: '',
      specialization: 'Hair Cut, Beard Styling',
      assignedChair: '',
      shiftTiming: '9:00 AM - 6:00 PM',
      commissionPercentage: 10,
      baseSalary: 12000,
      status: 'active',
    });
    setModalOpen(true);
  };

  const openEditModal = (att) => {
    setEditingAttendant(att);
    setFormData({
      attendantId: att.attendantId,
      fullName: att.fullName,
      mobile: att.mobile,
      email: att.email || '',
      address: att.address || '',
      specialization: Array.isArray(att.specialization) ? att.specialization.join(', ') : att.specialization,
      assignedChair: att.assignedChair?._id || '',
      shiftTiming: att.shiftTiming || '9:00 AM - 6:00 PM',
      commissionPercentage: att.commissionPercentage !== undefined ? att.commissionPercentage : 10,
      baseSalary: att.baseSalary !== undefined ? att.baseSalary : 0,
      status: att.status,
    });
    setModalOpen(true);
  };

  const handleSaveAttendant = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.mobile.trim() || !formData.attendantId.trim()) {
      toast.error('Name, mobile, and Attendant ID are required');
      return;
    }

    try {
      setIsProcessing(true);
      const payload = {
        ...formData,
        specialization: formData.specialization.split(',').map((s) => s.trim()).filter(Boolean),
        assignedChair: formData.assignedChair || null,
        baseSalary: Number(formData.baseSalary) || 0,
        commissionPercentage: Number(formData.commissionPercentage) || 0,
      };

      if (editingAttendant) {
        await api.put(`/attendants/${editingAttendant._id}`, payload);
        toast.success('Attendant updated successfully');
      } else {
        await api.post('/attendants', payload);
        toast.success('Attendant added to salon staff');
      }
      setModalOpen(false);
      fetchAttendants(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendant');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!selectedAttendantForAttendance) return;

    try {
      setIsProcessing(true);
      await api.post('/attendants/attendance', {
        attendantId: selectedAttendantForAttendance._id,
        ...attendanceForm,
      });
      toast.success(`Attendance logged for ${selectedAttendantForAttendance.fullName}`);
      setAttendanceModalOpen(false);
      setSelectedAttendantForAttendance(null);
    } catch (err) {
      toast.error('Failed to log attendance');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!attendantToDelete) return;
    try {
      setIsProcessing(true);
      await api.delete(`/attendants/${attendantToDelete._id}`);
      toast.success('Attendant removed');
      setDeleteModalOpen(false);
      setAttendantToDelete(null);
      fetchAttendants(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove attendant');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper for salary adjustments
  const handleAdjustmentChange = (attId, field, value) => {
    setSalaryAdjustments((prev) => ({
      ...prev,
      [attId]: {
        ...prev[attId],
        [field]: Number(value) || 0,
      },
    }));
  };

  // Total Summary Calculations
  const totalRevenueGenerated = attendants.reduce((sum, a) => sum + (Number(a.totalSalesGenerated) || 0), 0);
  const totalCommissionPayable = attendants.reduce((sum, a) => {
    const revenue = Number(a.totalSalesGenerated) || 0;
    const rate = Number(a.commissionPercentage) || 0;
    return sum + (revenue * rate) / 100;
  }, 0);
  const totalBaseSalaries = attendants.reduce((sum, a) => sum + (Number(a.baseSalary) || 0), 0);
  const totalPayrollPayable = totalBaseSalaries + totalCommissionPayable;

  // Export Roster Excel
  const exportToExcel = () => {
    if (attendants.length === 0) return;
    const data = attendants.map((a) => {
      const revenue = Number(a.totalSalesGenerated) || 0;
      const rate = Number(a.commissionPercentage) || 0;
      const commission = (revenue * rate) / 100;
      const baseSalary = Number(a.baseSalary) || 0;
      const netSalary = baseSalary + commission;

      return {
        'Attendant ID': a.attendantId,
        'Full Name': a.fullName,
        Mobile: a.mobile,
        Specialization: Array.isArray(a.specialization) ? a.specialization.join(', ') : a.specialization,
        'Station / Chair': a.assignedChair?.name || a.assignedChair?.chairNumber || 'Floating',
        'Shift Timing': a.shiftTiming,
        'Commission Rate (%)': `${rate}%`,
        'Completed Services': a.servicesCompleted || 0,
        'Total Revenue Generated (₹)': revenue,
        'Commission Earned (₹)': Math.round(commission),
        'Base Salary (₹)': baseSalary,
        'Estimated Net Payable (₹)': Math.round(netSalary),
        Status: a.status,
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Salary & Commission');
    XLSX.writeFile(workbook, `Nagulan_Staff_Salary_Commission_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Salary & Commission Sheet exported!');
  };

  const openPaySlip = (att) => {
    setSelectedAttendantForPaySlip(att);
    setPaySlipModalOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-serif">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-gold-500" />
            Attendants, Commission & Salary
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage stylist rosters, calculate service commissions, and compute payroll salaries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 hover:bg-gray-50 dark:hover:bg-charcoal-800 text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span>Export Payroll Sheet</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold text-xs shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Attendant</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Revenue Generated
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-bold font-mono text-gray-900 dark:text-white mt-2">
            ₹ {totalRevenueGenerated.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-gray-400">Total salon service sales</span>
        </div>

        <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Commission Earned
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gold-500/10 text-gold-500 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-bold font-mono text-gold-600 dark:text-gold-400 mt-2">
            ₹ {Math.round(totalCommissionPayable).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-gray-400">Calculated across all staff</span>
        </div>

        <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Base Salaries
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-bold font-mono text-gray-900 dark:text-white mt-2">
            ₹ {totalBaseSalaries.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-gray-400">Fixed monthly baseline</span>
        </div>

        <div className="bg-white dark:bg-charcoal-900 p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Estimated Total Payroll
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-2">
            ₹ {Math.round(totalPayrollPayable).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-gray-400">Base Salary + Commission</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-charcoal-800 pb-2">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'roster'
              ? 'bg-black text-white dark:bg-gold-500 dark:text-black shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-charcoal-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff & Stylists Roster</span>
        </button>

        <button
          onClick={() => setActiveTab('salary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'salary'
              ? 'bg-black text-white dark:bg-gold-500 dark:text-black shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-charcoal-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Revenue, Commission & Salary Breakdown</span>
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'dashboard'
              ? 'bg-black text-white dark:bg-gold-500 dark:text-black shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-charcoal-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-purple-500" />
          <span>Stylist Performance & Financial Dashboard</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-charcoal-900 p-3 sm:p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by ID, name, mobile, specialization..."
          onClear={() => setSearch('')}
        />
      </div>

      {/* VIEW 1: Standard Staff Roster */}
      {activeTab === 'roster' && (
        <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                  <th className="py-3 px-3.5">Attendant ID</th>
                  <th className="py-3 px-3.5">Full Name</th>
                  <th className="py-3 px-3.5">Specialization</th>
                  <th className="py-3 px-3.5">Station / Chair</th>
                  <th className="py-3 px-3.5">Shift Timing</th>
                  <th className="py-3 px-3.5 text-right">Commission %</th>
                  <th className="py-3 px-3.5 text-right">Completed Services</th>
                  <th className="py-3 px-3.5 text-right">Total Revenue</th>
                  <th className="py-3 px-3.5 text-right text-gold-500 font-bold">Commission (₹)</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-700 dark:text-gray-300">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonTableRow key={i} cols={11} />
                  ))
                ) : attendants.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-gray-400">No attendants found.</td>
                  </tr>
                ) : (
                  attendants.map((att) => {
                    const revenue = Number(att.totalSalesGenerated) || 0;
                    const rate = Number(att.commissionPercentage) || 0;
                    const commission = (revenue * rate) / 100;

                    return (
                      <tr key={att._id} className="hover:bg-gray-50 dark:hover:bg-charcoal-800/40 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          {att.attendantId}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="font-bold text-gray-900 dark:text-white block">{att.fullName}</span>
                          <span className="text-[10px] text-gray-500 font-mono">{att.mobile}</span>
                        </td>
                        <td className="py-3 px-3.5 max-w-xs truncate">
                          {Array.isArray(att.specialization) ? att.specialization.join(', ') : att.specialization}
                        </td>
                        <td className="py-3 px-3.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-charcoal-800 text-gray-800 dark:text-gray-300">
                            {att.assignedChair?.name || att.assignedChair?.chairNumber || 'Floating'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-gray-500">{att.shiftTiming}</td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-gold-600 dark:text-gold-400">
                          {att.commissionPercentage}%
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-semibold">
                          {att.servicesCompleted || 0}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-gray-900 dark:text-white">
                          ₹ {revenue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-bold text-gold-600 dark:text-gold-400">
                          ₹ {Math.round(commission).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              att.status === 'active'
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : 'bg-red-500/10 text-red-500'
                            }`}
                          >
                            {att.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedAttendantForAttendance(att);
                                setAttendanceModalOpen(true);
                              }}
                              className="px-2 py-1 bg-gray-100 dark:bg-charcoal-800 hover:bg-gold-500 hover:text-black rounded text-[10px] font-semibold transition-all"
                              title="Mark Attendance"
                            >
                              Attendance
                            </button>

                            <button
                              onClick={() => openPaySlip(att)}
                              className="px-2 py-1 bg-gold-500/10 text-gold-500 hover:bg-gold-500 hover:text-black rounded text-[10px] font-semibold transition-all"
                              title="View Pay Slip"
                            >
                              Slip
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAttendantId(att._id);
                                setActiveTab('dashboard');
                              }}
                              className="px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white rounded text-[10px] font-semibold transition-all flex items-center gap-1"
                              title="View Stylist Financial & Payment Dashboard"
                            >
                              <TrendingUp className="w-3 h-3" />
                              Dashboard
                            </button>

                            <button
                              onClick={() => openEditModal(att)}
                              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800 rounded-lg"
                              title="Edit Attendant"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {isSuperAdmin && (
                              <button
                                onClick={() => {
                                  setAttendantToDelete(att);
                                  setDeleteModalOpen(true);
                                }}
                                className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-500/10 rounded-lg"
                                title="Remove Attendant (Super Admin Only)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Separate Table for Revenue, Commission & Salary Calculation */}
      {activeTab === 'salary' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-gold-500" />
                Staff Salary & Commission Calculation Matrix
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Formula: <span className="font-mono text-gold-600 dark:text-gold-400 font-bold">Net Salary = Base Salary + (Gross Revenue × Commission %) + Bonus/Tips − Deductions</span>
              </p>
            </div>

            <button
              onClick={exportToExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 text-xs font-bold shadow transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Salary Sheet</span>
            </button>
          </div>

          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                    <th className="py-3 px-3.5">Stylist ID & Name</th>
                    <th className="py-3 px-3.5">Station / Chair</th>
                    <th className="py-3 px-3.5 text-right">Services Done</th>
                    <th className="py-3 px-3.5 text-right">Gross Revenue (₹)</th>
                    <th className="py-3 px-3.5 text-right">Comm. Rate</th>
                    <th className="py-3 px-3.5 text-right text-gold-600 dark:text-gold-400 font-bold">Comm. Earned (₹)</th>
                    <th className="py-3 px-3.5 text-right">Base Salary (₹)</th>
                    <th className="py-3 px-3.5 text-right">Bonus/Tips (₹)</th>
                    <th className="py-3 px-3.5 text-right text-red-500">Deductions (₹)</th>
                    <th className="py-3 px-3.5 text-right text-green-600 dark:text-green-400 font-bold">Net Payable (₹)</th>
                    <th className="py-3 px-3.5 text-right">Pay Slip</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-700 dark:text-gray-300">
                  {attendants.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-gray-400">No staff records found.</td>
                    </tr>
                  ) : (
                    attendants.map((att) => {
                      const revenue = Number(att.totalSalesGenerated) || 0;
                      const rate = Number(att.commissionPercentage) || 0;
                      const commission = (revenue * rate) / 100;
                      const baseSalary = Number(att.baseSalary) || 0;
                      const bonus = Number(salaryAdjustments[att._id]?.bonus) || 0;
                      const deductions = Number(salaryAdjustments[att._id]?.deductions) || 0;
                      const netPayable = baseSalary + commission + bonus - deductions;

                      return (
                        <tr key={att._id} className="hover:bg-gray-50 dark:hover:bg-charcoal-800/40 transition-colors">
                          <td className="py-3 px-3.5">
                            <span className="font-bold text-gray-900 dark:text-white block">{att.fullName}</span>
                            <span className="text-[10px] text-gray-500 font-mono">{att.attendantId}</span>
                          </td>
                          <td className="py-3 px-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-charcoal-800 text-gray-800 dark:text-gray-300">
                              {att.assignedChair?.name || att.assignedChair?.chairNumber || 'Floating'}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-semibold">
                            {att.servicesCompleted || 0}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-gray-900 dark:text-white">
                            ₹ {revenue.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-semibold text-gold-600 dark:text-gold-400">
                            {rate}%
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-gold-600 dark:text-gold-400">
                            ₹ {Math.round(commission).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-semibold">
                            ₹ {baseSalary.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={salaryAdjustments[att._id]?.bonus ?? ''}
                              onChange={(e) => handleAdjustmentChange(att._id, 'bonus', e.target.value)}
                              className="w-20 px-2 py-1 text-right text-xs rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 font-mono text-gray-900 dark:text-white focus:ring-1 focus:ring-gold-500"
                            />
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={salaryAdjustments[att._id]?.deductions ?? ''}
                              onChange={(e) => handleAdjustmentChange(att._id, 'deductions', e.target.value)}
                              className="w-20 px-2 py-1 text-right text-xs rounded-lg border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 font-mono text-red-500 focus:ring-1 focus:ring-red-500"
                            />
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-black text-sm text-green-600 dark:text-green-400 whitespace-nowrap">
                            ₹ {Math.round(netPayable).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3.5 text-right">

                            <button
                              onClick={() => {
                                setSelectedAttendantId(att._id);
                                setActiveTab('dashboard');
                              }}
                              className="mr-1.5 px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white rounded-lg text-[10px] font-bold transition-all inline-flex items-center gap-1"
                              title="View Attendant Financial Dashboard"
                            >
                              <TrendingUp className="w-3 h-3" />
                              Dashboard
                            </button>
                            <button
                              onClick={() => openPaySlip(att)}
                              className="px-2.5 py-1 bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 rounded-lg text-[10px] font-bold shadow-sm transition-all"
                            >
                              Pay Slip
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* VIEW 3: Dedicated Attendant Financial & Performance Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          {/* Dashboard Control Toolbar */}
          <div className="bg-white dark:bg-charcoal-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Choose Stylist / Attendant
                </label>
                <div className="relative">
                  <select
                    value={selectedAttendantId}
                    onChange={(e) => setSelectedAttendantId(e.target.value)}
                    className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-gray-50 dark:bg-charcoal-950 text-gray-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-purple-500 shadow-sm"
                  >
                    {attendants.map((att) => (
                      <option key={att._id} value={att._id}>
                        {att.fullName} ({att.attendantId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => fetchAttendantDashboard(selectedAttendantId, selectedDate, selectedMonth)}
                disabled={dashboardLoading}
                className="self-end px-3 py-2 rounded-xl border border-gray-200 dark:border-charcoal-800 hover:bg-gray-100 dark:hover:bg-charcoal-800 text-gray-600 dark:text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Refresh Metrics"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${dashboardLoading ? 'animate-spin text-purple-500' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Date and Month Controls */}
            <div className="flex flex-wrap items-center gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100 dark:border-charcoal-800">
              {/* Day Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-charcoal-950 p-1.5 rounded-xl border border-gray-200 dark:border-charcoal-800">
                <span className="text-[10px] font-bold uppercase text-gray-500 px-1">Day:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-gray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-xs font-semibold text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => setSelectedDate(getTodayStr())}
                  className="px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white rounded-lg text-[10px] font-bold transition-all"
                >
                  Today
                </button>
              </div>

              {/* Month Filter */}
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-charcoal-950 p-1.5 rounded-xl border border-gray-200 dark:border-charcoal-800">
                <span className="text-[10px] font-bold uppercase text-gray-500 px-1">Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-gray-200 dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-xs font-semibold text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => setSelectedMonth(getThisMonthStr())}
                  className="px-2 py-1 bg-gold-500/10 text-gold-600 dark:text-gold-400 hover:bg-gold-500 hover:text-black rounded-lg text-[10px] font-bold transition-all"
                >
                  This Month
                </button>
              </div>
            </div>
          </div>

          {/* Attendant Profile Strip */}
          {dashboardData?.attendant && (
            <div className="bg-gradient-to-r from-purple-900/10 via-purple-600/5 to-transparent dark:from-purple-950/40 dark:via-charcoal-900 dark:to-charcoal-900 p-4 rounded-2xl border border-purple-200 dark:border-purple-900/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-bold text-lg flex items-center justify-center shadow-md">
                  {dashboardData.attendant.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                      {dashboardData.attendant.fullName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                      {dashboardData.attendant.attendantId}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      dashboardData.attendant.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-charcoal-800 dark:text-gray-400'
                    }`}>
                      {dashboardData.attendant.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap items-center gap-2">
                    <span>📱 {dashboardData.attendant.mobile}</span>
                    <span>•</span>
                    <span>
                      🪑 {dashboardData.attendant.assignedChair?.name || dashboardData.attendant.assignedChair?.chairNumber || 'Floating Station'}
                    </span>
                    {Array.isArray(dashboardData.attendant.specialization) && (
                      <>
                        <span>•</span>
                        <span>✂️ {dashboardData.attendant.specialization.join(', ')}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="bg-white dark:bg-charcoal-950 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-charcoal-800">
                  <span className="block text-[10px] font-sans text-gray-400 uppercase font-semibold">Base Salary</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    ₹ {Number(dashboardData.attendant.baseSalary || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-white dark:bg-charcoal-950 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-charcoal-800">
                  <span className="block text-[10px] font-sans text-gray-400 uppercase font-semibold">Commission Rate</span>
                  <span className="font-bold text-gold-600 dark:text-gold-400">
                    {dashboardData.attendant.commissionPercentage || 10}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: DAY-WISE BREAKDOWN (Only bills allocated to this attendant) */}
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-200 dark:border-charcoal-800 gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-purple-500" />
                  Day-Wise Payment & Revenue Breakdown: {selectedDate}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Strictly calculated from bills allocated to {dashboardData?.attendant?.fullName || 'this attendant'}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  {dashboardData?.day?.billsCount || 0} Bills Completed
                </span>
              </div>
            </div>

            {/* Day KPI Cards (Day Total, UPI, Cash, Card, Split) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Day Total */}
              <div className="bg-emerald-500/5 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Day Total Sales</span>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                  ₹ {Number(dashboardData?.day?.total || 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-gray-400">
                  Commission: ₹ {Number(dashboardData?.day?.commission || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Day UPI */}
              <div className="bg-purple-500/5 dark:bg-purple-950/20 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/40">
                <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Day UPI</span>
                  <QrCode className="w-4 h-4" />
                </div>
                <p className="text-lg font-black font-mono text-purple-700 dark:text-purple-300 mt-1">
                  ₹ {Number(dashboardData?.day?.upi || 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-gray-400">
                  Direct: ₹{dashboardData?.day?.directUpi || 0} | Split: ₹{dashboardData?.day?.splitUpi || 0}
                </span>
              </div>

              {/* Day Cash */}
              <div className="bg-blue-500/5 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/40">
                <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Day Cash</span>
                  <Wallet className="w-4 h-4" />
                </div>
                <p className="text-lg font-black font-mono text-blue-700 dark:text-blue-300 mt-1">
                  ₹ {Number(dashboardData?.day?.cash || 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-gray-400">
                  Direct: ₹{dashboardData?.day?.directCash || 0} | Split: ₹{dashboardData?.day?.splitCash || 0}
                </span>
              </div>

              {/* Day Card */}
              <div className="bg-amber-500/5 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/40">
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Day Card</span>
                  <CreditCard className="w-4 h-4" />
                </div>
                <p className="text-lg font-black font-mono text-amber-700 dark:text-amber-300 mt-1">
                  ₹ {Number(dashboardData?.day?.card || 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-gray-400">
                  Direct: ₹{dashboardData?.day?.directCard || 0} | Split: ₹{dashboardData?.day?.splitCard || 0}
                </span>
              </div>

              {/* Day Split Payments */}
              <div className="bg-cyan-500/5 dark:bg-cyan-950/20 p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-800/40 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Day Split Payments</span>
                  <Layers className="w-4 h-4" />
                </div>
                <p className="text-lg font-black font-mono text-cyan-700 dark:text-cyan-300 mt-1">
                  ₹ {Number(dashboardData?.day?.split || 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-gray-400">
                  Split across multiple modes
                </span>
              </div>
            </div>

            {/* Allocated Bills Ledger Table for Selected Date */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                <span>Completed Bills for {dashboardData?.attendant?.fullName} on {selectedDate}:</span>
                <span className="text-[11px] font-normal text-gray-400">
                  {dashboardData?.day?.bills?.length || 0} invoices
                </span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-charcoal-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Time</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Station</th>
                      <th className="py-2.5 px-3">Payment Method</th>
                      <th className="py-2.5 px-3 text-right">Grand Total</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800">
                    {dashboardData?.day?.bills?.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-6 text-gray-400">
                          No bills completed by this attendant on {selectedDate}.
                        </td>
                      </tr>
                    ) : (
                      dashboardData?.day?.bills?.map((b) => (
                        <tr key={b._id} className="hover:bg-gray-50/70 dark:hover:bg-charcoal-800/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                            {b.billNumber}
                          </td>
                          <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">
                            {b.billDate ? new Date(b.billDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-gray-900 dark:text-white">{b.customerName}</div>
                            {b.customerMobile && <div className="text-[10px] text-gray-400 font-mono">{b.customerMobile}</div>}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">
                            {b.chairName}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.paymentMethod === 'Cash'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                : b.paymentMethod === 'UPI'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                                : b.paymentMethod === 'Split payment'
                                ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            }`}>
                              {b.paymentMethod}
                            </span>
                            {b.paymentMethod === 'Split payment' && b.splitPaymentDetails && (
                              <div className="text-[9px] text-gray-400 mt-0.5 font-mono">
                                {b.splitPaymentDetails.cash > 0 && `Cash: ₹${b.splitPaymentDetails.cash} `}
                                {b.splitPaymentDetails.upi > 0 && `UPI: ₹${b.splitPaymentDetails.upi} `}
                                {(b.splitPaymentDetails.debitCard > 0 || b.splitPaymentDetails.creditCard > 0) &&
                                  `Card: ₹${(b.splitPaymentDetails.debitCard || 0) + (b.splitPaymentDetails.creditCard || 0)}`}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 dark:text-white">
                            ₹ {Number(b.grandTotal || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => {
                                setPreviewBill(b);
                                setPreviewOpen(true);
                              }}
                              className="p-1 rounded text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-charcoal-800"
                              title="View Bill Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION 2: OVERALL MONTH-WISE BREAKDOWN (Only bills allocated to this attendant) */}
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-gray-200 dark:border-charcoal-800 gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-gold-500" />
                  Overall Month-Wise Breakdown: {selectedMonth}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Full month performance & commission ledger for {dashboardData?.attendant?.fullName}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  {dashboardData?.month?.billsCount || 0} Total Month Bills
                </span>
              </div>
            </div>

            {/* Month KPI Cards (Month Total, UPI, Cash, Card, Split, Commission, Net Salary) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Month Total */}
              <div className="bg-emerald-500/5 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Month Total
                </span>
                <p className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                  ₹ {Number(dashboardData?.month?.total || 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-gray-400">{dashboardData?.month?.billsCount || 0} Bills</span>
              </div>

              {/* Month UPI */}
              <div className="bg-purple-500/5 dark:bg-purple-950/20 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/40">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Month UPI
                </span>
                <p className="text-lg font-black font-mono text-purple-700 dark:text-purple-300 mt-1">
                  ₹ {Number(dashboardData?.month?.upi || 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-gray-400">
                  Direct: ₹{dashboardData?.month?.directUpi || 0} | Split: ₹{dashboardData?.month?.splitUpi || 0}
                </span>
              </div>

              {/* Month Cash */}
              <div className="bg-blue-500/5 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/40">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Month Cash
                </span>
                <p className="text-lg font-black font-mono text-blue-700 dark:text-blue-300 mt-1">
                  ₹ {Number(dashboardData?.month?.cash || 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-gray-400">
                  Direct: ₹{dashboardData?.month?.directCash || 0} | Split: ₹{dashboardData?.month?.splitCash || 0}
                </span>
              </div>

              {/* Month Card */}
              <div className="bg-amber-500/5 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/40">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Month Card
                </span>
                <p className="text-lg font-black font-mono text-amber-700 dark:text-amber-300 mt-1">
                  ₹ {Number(dashboardData?.month?.card || 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-gray-400">
                  Direct: ₹{dashboardData?.month?.directCard || 0} | Split: ₹{dashboardData?.month?.splitCard || 0}
                </span>
              </div>

              {/* Month Split */}
              <div className="bg-cyan-500/5 dark:bg-cyan-950/20 p-3.5 rounded-xl border border-cyan-200 dark:border-cyan-800/40">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Month Split
                </span>
                <p className="text-lg font-black font-mono text-cyan-700 dark:text-cyan-300 mt-1">
                  ₹ {Number(dashboardData?.month?.split || 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-gray-400">Combined methods</span>
              </div>

              {/* Commission Earned */}
              <div className="bg-gold-500/10 dark:bg-gold-500/20 p-3.5 rounded-xl border border-gold-300 dark:border-gold-800/40">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gold-600 dark:text-gold-400">
                  Commission Earned
                </span>
                <p className="text-lg font-black font-mono text-gold-600 dark:text-gold-400 mt-1">
                  ₹ {Number(dashboardData?.month?.commissionEarned || 0).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-gray-400">
                  Rate: {dashboardData?.month?.commissionRate || 10}%
                </span>
              </div>
            </div>

            {/* Estimated Total Month Payout Highlight Banner */}
            <div className="p-3.5 bg-gray-50 dark:bg-charcoal-950 rounded-xl border border-gray-200 dark:border-charcoal-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-500" />
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Estimated Take-Home for {selectedMonth}:
                </span>
                <span className="font-mono text-gray-500">
                  Base (₹{Number(dashboardData?.month?.baseSalary || 0).toLocaleString('en-IN')}) + Commission (₹{Number(dashboardData?.month?.commissionEarned || 0).toLocaleString('en-IN')})
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold font-mono text-purple-600 dark:text-purple-400">
                  = ₹ {Number(dashboardData?.month?.estimatedNetSalary || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Day-by-Day Monthly Trend Chart */}
            {dashboardData?.month?.dailyBreakdown?.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">
                  Day-by-Day Revenue & Payment Methods Trend:
                </h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[...(dashboardData.month.dailyBreakdown || [])].reverse()}
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
                      <Bar dataKey="card" name="Card" fill="#F59E0B" stackId="a" />
                      <Bar dataKey="split" name="Split" fill="#06B6D4" stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Month Day-by-Day Ledger Table */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                Month Day-by-Day Breakdown Ledger:
              </h4>

              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-charcoal-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-center">Bills Count</th>
                      <th className="py-2.5 px-3 text-right">Cash (₹)</th>
                      <th className="py-2.5 px-3 text-right">UPI (₹)</th>
                      <th className="py-2.5 px-3 text-right">Card (₹)</th>
                      <th className="py-2.5 px-3 text-right">Split (₹)</th>
                      <th className="py-2.5 px-3 text-right">Day Total (₹)</th>
                      <th className="py-2.5 px-3 text-right">Commission (₹)</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800">
                    {dashboardData?.month?.dailyBreakdown?.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center py-6 text-gray-400">
                          No bills completed by this attendant in {selectedMonth}.
                        </td>
                      </tr>
                    ) : (
                      dashboardData?.month?.dailyBreakdown?.map((d) => (
                        <tr key={d.date} className="hover:bg-gray-50/70 dark:hover:bg-charcoal-800/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-gray-900 dark:text-white">
                            {d.date}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            {d.billsCount}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-600 dark:text-blue-400">
                            {Number(d.cash || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-purple-600 dark:text-purple-400">
                            {Number(d.upi || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                            {Number(d.card || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-cyan-600 dark:text-cyan-400">
                            {Number(d.split || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ₹ {Number(d.total || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-gold-600 dark:text-gold-400">
                            ₹ {Number(d.commission || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => setSelectedDate(d.date)}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 dark:bg-charcoal-800 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900/40 dark:hover:text-purple-300 transition-all"
                              title="Inspect this day's bills above"
                            >
                              Inspect Day
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Attendant Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-charcoal-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-gold-500" />
                {editingAttendant ? 'Edit Attendant & Salary Profile' : 'Add New Attendant'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendant} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Attendant ID *</label>
                  <input
                    type="text"
                    value={formData.attendantId}
                    onChange={(e) => setFormData({ ...formData, attendantId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    maxLength={10}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Assigned Chair</label>
                  <select
                    value={formData.assignedChair}
                    onChange={(e) => setFormData({ ...formData, assignedChair: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                  >
                    <option value="">-- Floating --</option>
                    {chairs.map((c) => (
                      <option key={c._id} value={c._id}>{c.chairNumber} - {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Commission %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commissionPercentage}
                    onChange={(e) => setFormData({ ...formData, commissionPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Base Salary (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Specialization (Comma separated)</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g., Hair Cut, Beard Trim, Gold Facial, Hair Colouring"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-200 dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-lg bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold shadow-md"
                >
                  {isProcessing ? 'Saving...' : 'Save Attendant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendant Pay Slip Modal */}
      {paySlipModalOpen && selectedAttendantForPaySlip && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-charcoal-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2 font-serif">
                <FileSpreadsheet className="w-5 h-5 text-gold-500" />
                Monthly Staff Pay Slip
              </h3>
              <button onClick={() => setPaySlipModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pay Slip Details */}
            <div className="bg-gray-50 dark:bg-charcoal-950 p-4 rounded-xl space-y-2.5 text-xs font-mono border border-gray-200 dark:border-charcoal-800">
              <div className="text-center pb-2 border-b border-gray-200 dark:border-charcoal-800">
                <span className="font-bold text-sm text-gray-900 dark:text-white font-serif block">NAGULAN UNISEX SALON</span>
                <span className="text-[10px] text-gray-500">Staff Salary & Commission Slip</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Attendant ID:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedAttendantForPaySlip.attendantId}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Stylist Name:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedAttendantForPaySlip.fullName}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Completed Services:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedAttendantForPaySlip.servicesCompleted || 0}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Service Revenue Generated:</span>
                <span className="font-bold text-gray-900 dark:text-white">₹ {(Number(selectedAttendantForPaySlip.totalSalesGenerated) || 0).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Commission Rate:</span>
                <span className="font-bold text-gold-600 dark:text-gold-400">{selectedAttendantForPaySlip.commissionPercentage || 0}%</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-charcoal-800">
                <span className="text-gray-600 dark:text-gray-400">Commission Earned:</span>
                <span className="font-bold text-gold-600 dark:text-gold-400">
                  ₹ {Math.round(((Number(selectedAttendantForPaySlip.totalSalesGenerated) || 0) * (Number(selectedAttendantForPaySlip.commissionPercentage) || 0)) / 100).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Base Fixed Salary:</span>
                <span className="font-bold text-gray-900 dark:text-white">₹ {(Number(selectedAttendantForPaySlip.baseSalary) || 0).toLocaleString('en-IN')}</span>
              </div>

              {Number(salaryAdjustments[selectedAttendantForPaySlip._id]?.bonus) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Bonus / Tips:</span>
                  <span className="font-bold">+ ₹ {Number(salaryAdjustments[selectedAttendantForPaySlip._id]?.bonus).toLocaleString('en-IN')}</span>
                </div>
              )}

              {Number(salaryAdjustments[selectedAttendantForPaySlip._id]?.deductions) > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Deductions:</span>
                  <span className="font-bold">− ₹ {Number(salaryAdjustments[selectedAttendantForPaySlip._id]?.deductions).toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between pt-2.5 border-t-2 border-gray-300 dark:border-charcoal-700 text-sm font-bold text-gray-900 dark:text-white">
                <span>Net Payable Salary:</span>
                <span className="text-green-600 dark:text-green-400">
                  ₹ {Math.round(
                    (Number(selectedAttendantForPaySlip.baseSalary) || 0) +
                    (((Number(selectedAttendantForPaySlip.totalSalesGenerated) || 0) * (Number(selectedAttendantForPaySlip.commissionPercentage) || 0)) / 100) +
                    (Number(salaryAdjustments[selectedAttendantForPaySlip._id]?.bonus) || 0) -
                    (Number(salaryAdjustments[selectedAttendantForPaySlip._id]?.deductions) || 0)
                  ).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPaySlipModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 text-xs font-bold shadow transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Pay Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Logging Modal */}
      {attendanceModalOpen && selectedAttendantForAttendance && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-charcoal-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-charcoal-800 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-charcoal-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">
                Log Attendance: {selectedAttendantForAttendance.fullName}
              </h3>
              <button onClick={() => setAttendanceModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMarkAttendance} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Attendance Status</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white font-bold"
                >
                  <option value="Present">Present (Full Day)</option>
                  <option value="Half-day">Half Day</option>
                  <option value="Leave">Leave / Casual Off</option>
                  <option value="Absent">Absent (Unannounced)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <input
                  type="text"
                  value={attendanceForm.notes}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                  placeholder="Optional check-in comments"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-charcoal-700 bg-white dark:bg-charcoal-950 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-200 dark:border-charcoal-800">
                <button
                  type="button"
                  onClick={() => setAttendanceModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-charcoal-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-lg bg-black text-white dark:bg-gold-500 dark:text-black hover:bg-charcoal-800 dark:hover:bg-gold-400 font-bold shadow-md"
                >
                  {isProcessing ? 'Saving...' : 'Record Attendance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Bill Preview Modal */}
      {previewOpen && previewBill && (
        <BillPreviewModal
          isOpen={previewOpen}
          onClose={() => {
            setPreviewOpen(false);
            setPreviewBill(null);
          }}
          bill={previewBill}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && attendantToDelete && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setAttendantToDelete(null);
          }}
          onConfirm={handleDelete}
          title="Remove Attendant"
          message={`Are you sure you want to remove attendant "${attendantToDelete.fullName}"?`}
          confirmText="Yes, Remove"
          isDanger={true}
          loading={isProcessing}
        />
      )}
    </div>
  );
};

export default AttendantsPage;
