import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { useToast } from '../../components/common/ToastContainer';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

export default function ResultsPage() {
  const { showToast } = useToast();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'My Results — SecureExam';
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await studentAPI.getResults();
        setResults(response.data.data || []);
      } catch (error) {
        showToast({ message: 'Failed to fetch attempt history', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [showToast]);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return 'success';
      case 'TIMED_OUT':
        return 'danger';
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-text">My Exam Results</h1>
        <p className="text-text-secondary text-sm">Review your historically graded submissions and scores.</p>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No Results Found"
          description="No results yet. Start your first exam!"
          action={{
            text: 'Browse Available Exams',
            onClick: () => navigate('/student/exams')
          }}
        />
      ) : (
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">Exam Title</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">Subject</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-text-secondary uppercase">Score</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-text-secondary uppercase">Percentage</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-text-secondary uppercase">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">Submitted Time</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-text-secondary uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.map((res) => {
                  const pct = Math.round((res.score / res.totalMarks) * 100);
                  
                  return (
                    <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/student/results/${res.id}`} className="font-bold text-text hover:text-primary transition-colors">
                          {res.examTitle}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {res.subjectName}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-text">
                        {res.score} / {res.totalMarks}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-extrabold text-primary">
                        {pct}%
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={getStatusBadgeVariant(res.status)}>
                          {res.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {res.submitTime ? new Date(res.submitTime).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/student/results/${res.id}`}>
                          <Button variant="secondary" className="!py-1.5 !px-3 text-xs">
                            View Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
