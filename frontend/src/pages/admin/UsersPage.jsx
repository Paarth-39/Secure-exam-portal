import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/ToastContainer';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    document.title = 'User Management — SecureExam';
  }, []);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on search
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        role: roleFilter || undefined,
        isActive: statusFilter !== '' ? statusFilter === 'true' : undefined,
        search: debouncedSearch || undefined
      };
      const response = await adminAPI.getUsers(params);
      setUsers(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      showToast({ message: 'Failed to fetch users list', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch, roleFilter, statusFilter]);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      fetchUsers(); // reset select element dropdown
      return;
    }

    try {
      await adminAPI.changeRole({ userId, role: newRole });
      showToast({ message: 'User role updated successfully', type: 'success' });
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to change role';
      showToast({ message: msg, type: 'error' });
      fetchUsers();
    }
  };

  const handleBlockToggle = async (userId, currentActive) => {
    const willBlock = currentActive; // if currently active, we will block it
    const actionText = willBlock ? 'block' : 'unblock';

    if (!window.confirm(`Are you sure you want to ${actionText} this user?`)) {
      return;
    }

    try {
      await adminAPI.blockUser({ userId, block: willBlock });
      showToast({ message: `User ${actionText}ed successfully`, type: 'success' });
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message || `Failed to ${actionText} user`;
      showToast({ message: msg, type: 'error' });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? All related data (exams, attempts, logs) will be removed. This action is irreversible.')) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      showToast({ message: 'User deleted successfully', type: 'success' });
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete user';
      showToast({ message: msg, type: 'error' });
    }
  };

  const getRoleBadgeVariant = (role) => {
    if (role === 'ADMIN') return 'danger';
    if (role === 'TEACHER') return 'accent';
    return 'success';
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-text">User Administration</h1>
        <p className="text-text-secondary text-sm">Manage student, teacher, and administrator accounts.</p>
      </div>

      {/* Filter panel */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="text-xs font-semibold text-text mb-1 block">Search User</label>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="w-full md:w-48">
          <label className="text-xs font-semibold text-text mb-1 block">Filter Role</label>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        <div className="w-full md:w-48">
          <label className="text-xs font-semibold text-text mb-1 block">Filter Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Blocked</option>
          </select>
        </div>
      </div>

      {/* User list */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">User Details</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">Role</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">Joined Date</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-text-secondary uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.userId;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-text">{u.fullName} {isSelf && <span className="text-xs text-primary font-semibold">(You)</span>}</span>
                          <span className="text-xs text-text-secondary">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getRoleBadgeVariant(u.role)}>{u.role}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={u.isActive ? 'success' : 'danger'}>
                          {u.isActive ? 'Active' : 'Blocked'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {/* Change Role Dropdown */}
                        <select
                          disabled={isSelf}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="mr-2 px-2 py-1.5 bg-surface border border-border rounded-md text-xs outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                        >
                          <option value="STUDENT">STUDENT</option>
                          <option value="TEACHER">TEACHER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>

                        {/* Block/Unblock toggle */}
                        <Button
                          disabled={isSelf}
                          onClick={() => handleBlockToggle(u.id, u.isActive)}
                          variant="secondary"
                          className="!py-1.5 !px-3 text-xs"
                        >
                          {u.isActive ? 'Block' : 'Unblock'}
                        </Button>

                        {/* Delete User */}
                        <Button
                          disabled={isSelf}
                          onClick={() => handleDeleteUser(u.id)}
                          variant="danger"
                          className="!py-1.5 !px-3 text-xs"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-border flex justify-between items-center bg-background">
              <span className="text-xs text-text-secondary">
                Showing {users.length} of {total} users
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
