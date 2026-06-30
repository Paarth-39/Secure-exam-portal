import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { useToast } from '../../components/common/ToastContainer';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';

export default function ResultDetailPage() {
  const { id: attemptId } = useParams();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Result Details — SecureExam';
  }, []);

  useEffect(() => {
    const fetchResultDetail = async () => {
      try {
        const response = await studentAPI.getResultDetail(attemptId);
        setData(response.data);
      } catch (error) {
        showToast({ message: 'Failed to load result details', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchResultDetail();
  }, [attemptId, showToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) return null;

  const { attempt, answers } = data;
  const pct = Math.round((attempt.score / attempt.totalMarks) * 100);

  return (
    <div className="space-y-8">
      {/* Detail Header */}
      <div className="bg-surface border border-border p-6 rounded-xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text">{attempt.examTitle}</h1>
            <Badge variant={attempt.status === 'SUBMITTED' ? 'success' : 'danger'}>
              {attempt.status}
            </Badge>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            Subject: <span className="font-semibold">{attempt.subjectName}</span> | Submitted At:{' '}
            <span className="font-semibold">{new Date(attempt.submitTime).toLocaleString()}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center bg-background px-4 py-2 border border-border rounded-lg">
            <span className="text-xs text-text-secondary font-semibold block">Score Obtained</span>
            <span className="text-xl font-bold text-primary">{attempt.score} / {attempt.totalMarks}</span>
            <span className="text-xs text-text-secondary block font-bold mt-0.5">({pct}%)</span>
          </div>

          <Link to="/student/results">
            <Button variant="secondary">Back to History</Button>
          </Link>
        </div>
      </div>

      {/* Answer Key / Evaluation Review */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-text">Questions Review</h2>

        <div className="space-y-4">
          {answers.map((ans, idx) => (
            <div key={ans.questionId} className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm font-semibold text-primary mr-2">Q{idx + 1}.</span>
                  <span className="font-bold text-text">{ans.question}</span>
                </div>
                <Badge variant={ans.isCorrect ? 'success' : 'danger'}>
                  {ans.isCorrect ? 'Correct' : 'Incorrect'}
                </Badge>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const optText = ans[`option${opt}`];
                  const isSelected = ans.selectedOption === opt;
                  const isCorrect = ans.correctOption === opt;

                  let borderClass = 'border-border bg-background text-text-secondary';
                  let badgeText = '';

                  if (isCorrect) {
                    borderClass = 'border-emerald-200 bg-emerald-50 text-success font-bold';
                    badgeText = ' (Correct Key)';
                  } else if (isSelected && !isCorrect) {
                    borderClass = 'border-red-200 bg-red-50 text-danger';
                    badgeText = ' (Your Answer)';
                  }

                  if (isSelected && isCorrect) {
                    badgeText = ' (Your Answer — Correct)';
                  }

                  return (
                    <div key={opt} className={`p-3 rounded-md border text-sm flex items-center justify-between ${borderClass}`}>
                      <div>
                        <span className="font-bold mr-1">{opt}:</span> {optText}
                      </div>
                      <span className="text-xs font-semibold">{badgeText}</span>
                    </div>
                  );
                })}
              </div>

              <div className="text-xs text-text-secondary pl-6 flex gap-4">
                <span>Marks Weight: <strong className="text-text">{ans.marks}</strong></span>
                <span>Points Earned: <strong className={ans.isCorrect ? 'text-success' : 'text-danger'}>{ans.isCorrect ? ans.marks : 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
