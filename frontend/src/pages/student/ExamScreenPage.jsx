import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentAPI } from '../../services/api';
import { useToast } from '../../components/common/ToastContainer';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

export default function ExamScreenPage() {
  const { id: examId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [examTitle, setExamTitle] = useState('Loading Exam');
  const [endTime, setEndTime] = useState(null);

  // Exam sitting states
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Tab switch monitoring states
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const isExpiredRef = useRef(false);

  useEffect(() => {
    document.title = 'Exam Sitting — SecureExam';
  }, []);

  // Fetch / Initialize Exam Attempt on mount
  useEffect(() => {
    const initExam = async () => {
      try {
        const response = await studentAPI.startExam({ examId });
        const data = response.data;
        setAttemptId(data.attemptId);
        setQuestions(data.questions || []);
        setExamTitle(data.examTitle);
        setEndTime(data.endTime);
        document.title = `Exam — ${data.examTitle} — SecureExam`;

        // Calculate initial remaining seconds
        const rem = Math.max(0, Math.floor((new Date(data.endTime).getTime() - Date.now()) / 1000));
        setTimeLeft(rem);
      } catch (error) {
        const msg = error.response?.data?.message || 'Failed to start exam. Make sure it is active.';
        showToast({ message: msg, type: 'error' });
        navigate('/student/exams');
      } finally {
        setLoading(false);
      }
    };
    initExam();
  }, [examId, navigate, showToast]);

  // Tab switch visibility change detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab was switched or window minimized
        showToast({
          message: 'Warning: Leaving the exam tab is strictly monitored!',
          type: 'warning'
        });
        
        setTabSwitchCount((prev) => {
          const nextVal = prev + 1;
          if (nextVal >= 3) {
            setShowWarningModal(true);
          }
          return nextVal;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [showToast]);

  // Countdown timer effect
  useEffect(() => {
    if (loading || !endTime) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isExpiredRef.current) {
            isExpiredRef.current = true;
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, endTime]);

  const handleOptionSelect = (questionId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: option
    }));
  };

  const executeSubmission = async (statusOverride = null) => {
    setSubmitting(true);
    try {
      // Map answers state object to array format
      const mappedAnswers = Object.entries(answers).map(([qId, opt]) => ({
        questionId: qId,
        selectedOption: opt
      }));

      const response = await studentAPI.submitExam({
        attemptId,
        answers: mappedAnswers
      });

      const resData = response.data;
      showToast({
        message: `Exam submitted successfully! Score: ${resData.score}/${resData.totalMarks}`,
        type: 'success'
      });
      navigate('/student/results');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to submit exam. Please try again.';
      showToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleAutoSubmit = () => {
    showToast({ message: 'Exam duration expired! Automatically submitting your answers...', type: 'warning' });
    executeSubmission('TIMED_OUT');
  };

  const handleManualSubmit = () => {
    executeSubmission();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Timer & Header */}
      <div className="bg-surface border border-border p-6 rounded-xl shadow-sm flex justify-between items-center sticky top-16 z-30">
        <div>
          <h2 className="text-xl font-bold text-text">{examTitle}</h2>
          <p className="text-xs text-text-secondary">
            Question {currentIdx + 1} of {questions.length}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-text-secondary font-semibold block">Time Remaining</span>
            <span className={`text-2xl font-mono font-extrabold ${timeLeft < 60 ? 'text-danger animate-pulse' : 'text-text'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <Button onClick={() => setShowSubmitModal(true)} variant="primary">
            Submit Exam
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 bg-surface border border-border rounded-xl p-6 shadow-sm h-fit">
          <h3 className="text-sm font-bold text-text mb-4">Question Navigator</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined;
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-full py-2.5 text-xs font-bold rounded-md border transition-all ${
                    isCurrent
                      ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                      : isAnswered
                      ? 'border-emerald-200 bg-emerald-50 text-success'
                      : 'border-border bg-background text-text-secondary hover:bg-gray-50'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-2 border-t border-border pt-4 text-xs text-text-secondary">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/10 border border-primary"></div>
              <span>Current Question</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-background border border-border"></div>
              <span>Unanswered</span>
            </div>
          </div>
        </div>

        {/* Question Panel */}
        <div className="lg:col-span-3 bg-surface border border-border rounded-xl p-8 shadow-sm space-y-6">
          {currentQuestion ? (
            <>
              <div className="flex justify-between items-start">
                <span className="text-lg font-bold text-text">{currentQuestion.question}</span>
                <span className="text-xs font-semibold px-2 py-1 bg-gray-100 text-text rounded-md">
                  {currentQuestion.marks} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                </span>
              </div>

              {/* Options */}
              <div className="flex flex-col gap-3">
                {['A', 'B', 'C', 'D'].map((opt) => {
                  const optText = currentQuestion[`option${opt}`];
                  const isSelected = answers[currentQuestion.id] === opt;

                  return (
                    <label
                      key={opt}
                      onClick={() => handleOptionSelect(currentQuestion.id, opt)}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all select-none ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary font-semibold'
                          : 'border-border bg-background text-text-secondary hover:bg-gray-50/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question_${currentQuestion.id}`}
                        checked={isSelected}
                        onChange={() => {}}
                        className="hidden"
                      />
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 text-xs font-bold ${
                        isSelected ? 'border-primary bg-primary text-white' : 'border-border bg-surface'
                      }`}>
                        {opt}
                      </span>
                      <span>{optText}</span>
                    </label>
                  );
                })}
              </div>

              {/* Prev / Next controls */}
              <div className="flex justify-between pt-6 border-t border-border">
                <Button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(idx => idx - 1)}
                  variant="secondary"
                >
                  Previous
                </Button>
                <Button
                  disabled={currentIdx === questions.length - 1}
                  onClick={() => setCurrentIdx(idx => idx + 1)}
                  variant="secondary"
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center text-text-secondary py-12">Question not available.</div>
          )}
        </div>
      </div>

      {/* Manual Submit Confirmation Modal */}
      <Modal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Examination">
        <div className="space-y-4 text-center">
          <p className="text-sm text-text-secondary">
            Are you sure you want to finalize and submit your examination paper?
          </p>
          <div className="bg-background p-3 rounded-md border border-border text-xs text-left">
            Total Questions: <strong>{questions.length}</strong><br />
            Answered Questions: <strong>{Object.keys(answers).length}</strong><br />
            Unanswered: <strong>{questions.length - Object.keys(answers).length}</strong>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleManualSubmit} loading={submitting}>
              Confirm Submission
            </Button>
          </div>
        </div>
      </Modal>

      {/* Tab Switch Security Alert Warning Modal */}
      <Modal isOpen={showWarningModal} onClose={() => setShowWarningModal(false)} title="Security Breach Warning">
        <div className="space-y-4 text-center">
          <div className="text-5xl text-danger" role="img" aria-label="Warning">⚠️</div>
          <h4 className="text-lg font-bold text-danger">Tab Switches Detected</h4>
          <p className="text-sm text-text-secondary">
            You have switched tabs <strong>{tabSwitchCount}</strong> times. Leaving the examination screen violates strict system integrity policies.
          </p>
          <p className="text-xs text-text-secondary font-semibold">
            Further tab switches may lead to automatic exam termination or score forfeiture by your institution.
          </p>
          <div className="pt-2">
            <Button variant="primary" onClick={() => setShowWarningModal(false)} className="w-full">
              I Understand, Resume Test
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
