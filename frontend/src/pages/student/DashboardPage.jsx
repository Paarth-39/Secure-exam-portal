import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { useToast } from '../../components/common/ToastContainer';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';

export default function DashboardPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    available: 0,
    attempts: 0
  });

  useEffect(() => {
    document.title = 'Dashboard — SecureExam';
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [examsRes, resultsRes] = await Promise.all([
          studentAPI.getExams({ limit: 1 }),
          studentAPI.getResults()
        ]);
        setStats({
          available: examsRes.data.total || 0,
          attempts: resultsRes.data.data?.length || 0
        });
      } catch (error) {
        showToast({ message: 'Failed to load dashboard metrics', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
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
        <h1 className="text-3xl font-bold text-text font-sans">Welcome to SecureExam</h1>
        <p className="text-text-secondary text-sm">Browse available tests, sit timed examinations, and view your graded results.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold text-text-secondary">Available Examinations</div>
            <div className="text-4xl font-extrabold text-primary mt-2">{stats.available}</div>
          </div>
          <Link to="/student/exams" className="mt-4 block">
            <Button variant="primary" className="w-full">
              Browse Available Exams
            </Button>
          </Link>
        </div>

        <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold text-text-secondary">Attempt History</div>
            <div className="text-4xl font-extrabold text-success mt-2">{stats.attempts}</div>
          </div>
          <Link to="/student/results" className="mt-4 block">
            <Button variant="secondary" className="w-full">
              View Graded Results
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
