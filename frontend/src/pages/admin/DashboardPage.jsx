import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/ToastContainer';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';

export default function DashboardPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    blockedUsers: 0,
    totalLogs: 0,
    totalSubjects: 0
  });

  useEffect(() => {
    document.title = 'Dashboard — SecureExam';
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, blockedRes, logsRes, subjectsRes] = await Promise.all([
          adminAPI.getUsers({ limit: 1 }),
          adminAPI.getUsers({ isActive: false, limit: 1 }),
          adminAPI.getLogs({ limit: 1 }),
          adminAPI.getSubjects()
        ]);

        setStats({
          totalUsers: usersRes.data.total || 0,
          blockedUsers: blockedRes.data.total || 0,
          totalLogs: logsRes.data.total || 0,
          totalSubjects: subjectsRes.data.length || 0
        });
      } catch (error) {
        showToast({ message: 'Failed to load dashboard statistics', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-text">Administrator Console</h1>
        <p className="text-text-secondary text-sm">Monitor system users, configure subjects, and browse audit logs.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="text-sm font-semibold text-text-secondary">Total Users</div>
          <div className="text-3xl font-extrabold text-text mt-1">{stats.totalUsers}</div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="text-sm font-semibold text-text-secondary">Blocked Users</div>
          <div className="text-3xl font-extrabold text-danger mt-1">{stats.blockedUsers}</div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="text-sm font-semibold text-text-secondary">Total Audit Actions</div>
          <div className="text-3xl font-extrabold text-accent mt-1">{stats.totalLogs}</div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="text-sm font-semibold text-text-secondary">Configured Subjects</div>
          <div className="text-3xl font-extrabold text-success mt-1">{stats.totalSubjects}</div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
        <h3 className="text-lg font-bold text-text">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/admin/users">
            <Button variant="primary" className="w-full justify-center">
              Manage System Users
            </Button>
          </Link>
          <Link to="/admin/logs">
            <Button variant="secondary" className="w-full justify-center">
              View Audit Logs
            </Button>
          </Link>
          <Link to="/admin/subjects">
            <Button variant="secondary" className="w-full justify-center">
              Configure Subject List
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
