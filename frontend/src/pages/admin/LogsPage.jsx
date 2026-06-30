import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/ToastContainer';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

const ACTIONS = [
  'REGISTER',
  'EMAIL_VERIFIED',
  'LOGIN',
  'LOGIN_GOOGLE',
  'LOGOUT',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_RESET_COMPLETED',
  'EXAM_STARTED',
  'EXAM_SUBMITTED',
  'EXAM_TIMED_OUT',
  'EXAM_CREATED',
  'EXAM_PUBLISHED',
  'EXAM_DELETED',
  'USER_BLOCKED',
  'USER_UNBLOCKED',
  'ROLE_CHANGED',
  'USER_DELETED'
];

export default function LogsPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    document.title = 'Audit Logs — SecureExam';
  }, []);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        action: actionFilter || undefined,
        from: fromDate ? new Date(fromDate).toISOString() : undefined,
        to: toDate ? new Date(toDate).toISOString() : undefined
      };
      const response = await adminAPI.getLogs(params);
      setLogs(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      showToast({ message: 'Failed to fetch audit logs', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, fromDate, toDate]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-text">System Audit Logs</h1>
        <p className="text-text-secondary text-sm">Read-only historical audit records for all user actions.</p>
      </div>

      {/* Filters panel */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="text-xs font-semibold text-text mb-1 block">Filter Action</label>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Actions</option>
            {ACTIONS.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-text mb-1 block">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-text mb-1 block">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">No log events found matching current criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">User Details</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">Action</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">IP Address</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">Device Agent</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-text-secondary uppercase">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-text">{log.userFullName}</span>
                        <span className="text-xs text-text-secondary">{log.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs font-semibold px-2 py-1 bg-gray-100 text-text rounded-md select-all font-mono">
                        {log.action}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-text">
                      {log.ipAddress}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate" title={log.device}>
                      {log.device}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-text-secondary">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-background">
              <span className="text-xs text-text-secondary">
                Showing {logs.length} of {total} events
              </span>
              <div className="flex gap-2">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  variant="secondary"
                  className="!py-1 !px-3 text-xs"
                >
                  Previous
                </Button>
                <span className="text-xs text-text font-bold self-center px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  variant="secondary"
                  className="!py-1 !px-3 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
