import React, { useState, useEffect } from 'react';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { SkeletonTableRow, PullToRefresh } from '../components/loaders';
import {
  FileSpreadsheet,
  ShieldAlert,
  Clock,
  User,
  Activity,
  Globe,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ActivityLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('All');

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        search,
        action: actionFilter !== 'All' ? actionFilter : undefined,
        entityType: entityFilter !== 'All' ? entityFilter : undefined,
      };

      const res = await api.get('/activity-logs', { params });
      if (res.data.success) {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [search, actionFilter, entityFilter]);

  return (
    <PullToRefresh onRefresh={() => fetchLogs(1)}>
      <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-serif">
            <ShieldAlert className="w-6 h-6 text-gold-500" />
            System Audit & Activity Logs (Super Admin Exclusive)
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Immutable audit register tracking every invoice generation, user mutation, stock change and configuration update
          </p>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page)}
          className="p-2 rounded-lg border border-gray-300 dark:border-charcoal-700 hover:bg-gray-50 dark:hover:bg-charcoal-800 text-gray-700 dark:text-gray-300"
          title="Refresh Logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="bg-white dark:bg-charcoal-900 p-4 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm space-y-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by actor name, action, details, IP address..."
          onClear={() => setSearch('')}
        />
      </div>

      <div className="bg-white dark:bg-charcoal-900 rounded-2xl border border-gray-200 dark:border-charcoal-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-charcoal-950/70 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 dark:border-charcoal-800">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Action Details</th>
                <th className="py-3.5 px-4">IP / Host</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-charcoal-800 text-gray-700 dark:text-gray-300 font-mono text-[11px]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={7} />
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 font-sans">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-charcoal-800/40 transition-colors">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-gray-900 dark:text-white">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4 uppercase font-bold text-[10px] text-gold-600 dark:text-gold-400 font-sans">
                      {log.userRole}
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800 dark:text-gray-200">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold">
                      {log.entityType}
                    </td>
                    <td className="py-3 px-4 font-sans text-gray-700 dark:text-gray-300 max-w-sm">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-gray-400 truncate max-w-xs">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination pagination={pagination} onPageChange={(p) => fetchLogs(p)} />
      </div>
      </div>
    </PullToRefresh>
  );
};

export default ActivityLogsPage;
