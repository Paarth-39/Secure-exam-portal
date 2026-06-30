import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function ExamInstructionsPage() {
  const { id: examId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Exam Instructions — SecureExam';
  }, []);

  const handleStart = () => {
    navigate(`/student/exam/${examId}/take`);
  };

  return (
    <div className="max-w-2xl mx-auto bg-surface border border-border rounded-xl shadow-md p-8 space-y-6">
      <div className="text-center">
        <span className="text-5xl" role="img" aria-label="Shield">🛡️</span>
        <h1 className="text-2xl font-bold text-text mt-4">Secure Examination Instructions</h1>
        <p className="text-text-secondary text-sm">Please read the following guidelines carefully before starting.</p>
      </div>

      <div className="border-t border-b border-border py-4 space-y-3.5 text-sm text-text-secondary">
        <div className="flex gap-3">
          <span className="text-primary font-bold">1.</span>
          <p>This is a strictly timed examination. Once started, the timer cannot be paused under any circumstances.</p>
        </div>
        <div className="flex gap-3">
          <span className="text-primary font-bold">2.</span>
          <p>
            <strong>Tab Switching Constraint:</strong> Switching tabs, minimizing the browser window, or navigating away from the exam screen is monitored. Leaving the screen more than 3 times will trigger institutional security warning alerts.
          </p>
        </div>
        <div className="flex gap-3">
          <span className="text-primary font-bold">3.</span>
          <p>Ensure you have a stable network connection. Your answers are auto-saved in real-time as you progress.</p>
        </div>
        <div className="flex gap-3">
          <span className="text-primary font-bold">4.</span>
          <p>If the timer expires, the exam will automatically submit the answers recorded up to that point.</p>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Link to="/student/exams">
          <Button variant="secondary">Cancel</Button>
        </Link>
        <Button onClick={handleStart} variant="primary">
          I Agree, Start Exam
        </Button>
      </div>
    </div>
  );
}
