import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { teacherAPI } from '../../services/api';
import { useToast } from '../../components/common/ToastContainer';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

export default function DashboardPage() {
  const { showToast } = useToast();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'My Exams — SecureExam';
  }, []);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await teacherAPI.getMyExams({ limit: 100 });
        setExams(response.data.data || []);
      } catch (error) {
        showToast({ message: 'Failed to load exams data', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [showToast]);

  const handleDeleteExam = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return;
    }

    try {
      await teacherAPI.deleteExam(id);
      setExams(exams.filter((e) => e.id !== id));
      showToast({ message: 'Exam deleted successfully', type: 'success' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete exam';
      showToast({ message: msg, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Calculate Stats
  const totalExams = exams.length;
  const publishedExams = exams.filter((e) => e.status === 'PUBLISHED').length;
  const draftExams = exams.filter((e) => e.status === 'DRAFT').length;
  const totalAttempts = exams.reduce((sum, e) => sum + (e._count?.attempts || 0), 0);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'PUBLISHED':
        return 'success';
      case 'CLOSED':
        return 'default';
      case 'DRAFT':
      default:
        return 'warning';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Teacher Dashboard</h1>
          <p className="text-text-secondary text-sm">Manage your exams, questions blueprints, and track student scores.</p>
        </div>
        <Link to="/teacher/exams/create">
          <Button variant="primary">Create New Exam</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="text-sm font-semibold text-text-secondary">Total Exams</div>
          <div className="text-3xl font-extrabold text-text mt-1">{totalExams}</div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="text-sm font-semibold text-text-secondary">Published Exams</div>
          <div className="text-3xl font-extrabold text-success mt-1">{publishedExams}</div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="text-sm font-semibold text-text-secondary">Draft Exams</div>
          <div className="text-3xl font-extrabold text-warning mt-1">{draftExams}</div>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm">
          <div className="text-sm font-semibold text-text-secondary">Total Submissions</div>
          <div className="text-3xl font-extrabold text-primary mt-1">{totalAttempts}</div>
        </div>
      </div>

      {/* Recent Exams Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-text text-lg">My Exams</h3>
        </div>

        {exams.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon="📝"
              title="No Exams Found"
              description="You have not created any exams yet. Start by creating a new exam blueprint."
              action={{
                text: 'Create New Exam',
                onClick: () => navigate('/teacher/exams/create')
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">Exam Title</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">Subject</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">Status</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-text-secondary uppercase">Questions</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-text-secondary uppercase">Attempts</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-text-secondary uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link to={`/teacher/exams/${exam.id}`} className="font-bold text-text hover:text-primary transition-colors">
                        {exam.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {exam.subject?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusBadgeVariant(exam.status)}>
                        {exam.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-text">
                      {exam._count?.questions || 0}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-semibold text-text">
                      {exam._count?.attempts || 0}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link to={`/teacher/exams/${exam.id}`}>
                        <Button variant="secondary" className="!py-1.5 !px-3 text-xs">
                          {exam.status === 'PUBLISHED' ? 'View Questions' : 'Manage Blueprint'}
                        </Button>
                      </Link>
                      {exam.status === 'DRAFT' ? (
                        <Button
                          onClick={() => handleDeleteExam(exam.id)}
                          variant="danger"
                          className="!py-1.5 !px-3 text-xs"
                        >
                          Delete
                        </Button>
                      ) : (
                        <span className="text-xs text-text-secondary inline-block px-3 py-1.5 font-medium bg-gray-50 border border-border rounded-md select-none">
                          🔒 Locked
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
