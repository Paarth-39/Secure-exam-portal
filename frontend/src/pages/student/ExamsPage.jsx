import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { useToast } from '../../components/common/ToastContainer';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

export default function ExamsPage() {
  const { showToast } = useToast();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    document.title = 'Available Exams — SecureExam';
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const response = await studentAPI.getExams({ page, limit });
      setExams(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotal(response.data.total || 0);
    } catch (error) {
      showToast({ message: 'Failed to fetch available exams', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [page]);

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
        <h1 className="text-3xl font-bold text-text">Available Exams</h1>
        <p className="text-text-secondary text-sm">Select an active exam blueprint to take.</p>
      </div>

      {/* List */}
      {exams.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No Exams Available"
          description="No exams available right now. Check back later."
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exams.map((ex) => (
              <div key={ex.id} className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-text">{ex.title}</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 bg-primary/10 text-primary rounded-full">
                      {ex.subject?.name}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-2">
                    Window Ends: {new Date(ex.endTime).toLocaleString()}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-text-secondary">
                    <div>
                      <span className="font-semibold text-text">Duration:</span> {ex.duration} mins
                    </div>
                    <div>
                      <span className="font-semibold text-text">Total Marks:</span> {ex.totalMarks} marks
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to={`/student/exam/${ex.id}`} className="w-full block">
                    <Button variant="primary" className="w-full">
                      Enter Exam instructions
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-surface border border-border p-4 rounded-xl shadow-sm">
              <span className="text-xs text-text-secondary">
                Showing {exams.length} of {total} exams
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
          )}
        </div>
      )}
    </div>
  );
}
