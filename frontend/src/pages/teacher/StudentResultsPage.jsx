import React, { useEffect, useState } from 'react';
import { teacherAPI } from '../../services/api';
import { useToast } from '../../components/common/ToastContainer';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';

export default function StudentResultsPage() {
  const { showToast } = useToast();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  useEffect(() => {
    document.title = 'Student Results — SecureExam';
  }, []);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await teacherAPI.getMyExams({ limit: 100 });
        const list = response.data.data || [];
        setExams(list);
        if (list.length > 0) {
          // Select first exam by default
          setSelectedExamId(list[0].id);
        }
      } catch (error) {
        showToast({ message: 'Failed to load exams list', type: 'error' });
      } finally {
        setLoadingExams(false);
      }
    };
    fetchExams();
  }, [showToast]);

  useEffect(() => {
    if (!selectedExamId) return;

    const fetchAttempts = async () => {
      setLoadingAttempts(true);
      try {
        const response = await teacherAPI.getExamResults(selectedExamId, { limit: 1000 });
        setAttempts(response.data.data || []);
      } catch (error) {
        showToast({ message: 'Failed to load student attempts for this exam', type: 'error' });
      } finally {
        setLoadingAttempts(false);
      }
    };

    fetchAttempts();
  }, [selectedExamId, showToast]);

  const handleExportCSV = () => {
    if (attempts.length === 0) return;

    const examTitle = exams.find((e) => e.id === selectedExamId)?.title || 'Exam';
    const csvHeaders = ['Student Name', 'Student Email', 'Score', 'Total Marks', 'Percentage', 'Status', 'Submit Time'];
    
    const csvRows = attempts.map((a) => {
      const exam = exams.find((e) => e.id === selectedExamId);
      const totalMarks = exam?.totalMarks || 100;
      const pct = a.score !== null ? Math.round((a.score / totalMarks) * 100) : 0;
      const formattedDate = a.submitTime ? new Date(a.submitTime).toLocaleString() : 'N/A';

      return [
        `"${a.studentName.replace(/"/g, '""')}"`,
        `"${a.studentEmail.replace(/"/g, '""')}"`,
        a.score !== null ? a.score : 'N/A',
        totalMarks,
        `${pct}%`,
        a.status,
        `"${formattedDate}"`
      ];
    });

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${examTitle.replace(/\s+/g, '_')}_Results.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({ message: 'Exported CSV successfully', type: 'success' });
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'SUBMITTED':
        return 'success';
      case 'TIMED_OUT':
        return 'danger';
      case 'IN_PROGRESS':
      default:
        return 'accent';
    }
  };

  if (loadingExams) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text">Student Grades & Results</h1>
          <p className="text-text-secondary text-sm">Select an exam blueprint to view candidate submissions.</p>
        </div>

        {attempts.length > 0 && (
          <Button onClick={handleExportCSV} variant="secondary">
            Export Grades (CSV)
          </Button>
        )}
      </div>

      {/* Select Exam Dropdown */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col max-w-md">
          <label htmlFor="examSelect" className="mb-1.5 text-sm font-semibold text-text">
            Select Exam Blueprint
          </label>
          <select
            id="examSelect"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-surface border border-border rounded-md outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {exams.length === 0 ? (
              <option value="">-- No Exams Created Yet --</option>
            ) : (
              exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.status})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Results View */}
      {selectedExamId && (
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          {loadingAttempts ? (
            <div className="p-12 flex justify-center">
              <Spinner size="lg" />
            </div>
          ) : attempts.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon="📊"
                title="No Submissions Found"
                description="No candidates have attempted this examination blueprint yet."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">Candidate Name</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-text-secondary uppercase">Email</th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-text-secondary uppercase">Score Obtained</th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-text-secondary uppercase">Total Marks</th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-text-secondary uppercase">Percentage</th>
                    <th className="px-6 py-3.5 text-center text-xs font-semibold text-text-secondary uppercase">Attempt Status</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-text-secondary uppercase">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attempts.map((attempt) => {
                    const totalMarks = selectedExam?.totalMarks || 100;
                    const pct = attempt.score !== null ? Math.round((attempt.score / totalMarks) * 100) : 0;
                    return (
                      <tr key={attempt.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-text">{attempt.studentName}</td>
                        <td className="px-6 py-4 text-sm text-text-secondary">{attempt.studentEmail}</td>
                        <td className="px-6 py-4 text-center text-sm font-semibold text-text">
                          {attempt.score !== null ? attempt.score : '—'}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-text-secondary">{totalMarks}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-primary">
                          {attempt.score !== null ? `${pct}%` : '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={getStatusBadgeVariant(attempt.status)}>
                            {attempt.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-text-secondary">
                          {attempt.submitTime ? new Date(attempt.submitTime).toLocaleString() : 'In Progress'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
