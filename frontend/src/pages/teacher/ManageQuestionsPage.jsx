import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { teacherAPI } from '../../services/api';
import { useToast } from '../../components/common/ToastContainer';
import Spinner from '../../components/common/Spinner';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

export default function ManageQuestionsPage() {
  const { id: examId } = useParams();
  const { showToast } = useToast();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // Form for adding new question
  const {
    register: registerAdd,
    handleSubmit: handleAddSubmit,
    reset: resetAddForm,
    formState: { errors: addErrors }
  } = useForm({
    defaultValues: {
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      marks: 1
    }
  });

  // Form for editing question
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    setValue: setEditValue,
    formState: { errors: editErrors }
  } = useForm();

  const fetchExamDetails = async () => {
    try {
      const response = await teacherAPI.getExamById(examId);
      setExam(response.data.exam);
    } catch (error) {
      showToast({ message: 'Failed to load exam details', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Manage Questions — SecureExam';
  }, []);

  useEffect(() => {
    fetchExamDetails();
  }, [examId]);

  const handlePublish = async () => {
    if (!window.confirm('Are you sure you want to publish this exam? Once published, questions cannot be added, edited, or deleted.')) {
      return;
    }
    setPublishing(true);
    try {
      await teacherAPI.publishExam(examId);
      showToast({ message: 'Exam published successfully! Students can now take it.', type: 'success' });
      fetchExamDetails();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to publish exam';
      showToast({ message: msg, type: 'error' });
    } finally {
      setPublishing(false);
    }
  };

  const onAddQuestionSubmit = async (data) => {
    setAddingQuestion(true);
    try {
      const payload = {
        examId,
        question: data.question,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        correctOption: data.correctOption,
        marks: parseInt(data.marks, 10)
      };
      await teacherAPI.addQuestion(payload);
      showToast({ message: 'Question added successfully', type: 'success' });
      resetAddForm();
      fetchExamDetails();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to add question';
      showToast({ message: msg, type: 'error' });
    } finally {
      setAddingQuestion(false);
    }
  };

  const startEditing = (q) => {
    setEditingQuestionId(q.id);
    setEditValue('question', q.question);
    setEditValue('optionA', q.optionA);
    setEditValue('optionB', q.optionB);
    setEditValue('optionC', q.optionC);
    setEditValue('optionD', q.optionD);
    setEditValue('correctOption', q.correctOption);
    setEditValue('marks', q.marks);
  };

  const onEditQuestionSubmit = async (data) => {
    try {
      const payload = {
        question: data.question,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        correctOption: data.correctOption,
        marks: parseInt(data.marks, 10)
      };
      await teacherAPI.updateQuestion(editingQuestionId, payload);
      showToast({ message: 'Question updated successfully', type: 'success' });
      setEditingQuestionId(null);
      fetchExamDetails();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update question';
      showToast({ message: msg, type: 'error' });
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }
    try {
      await teacherAPI.deleteQuestion(qId);
      showToast({ message: 'Question deleted successfully', type: 'success' });
      fetchExamDetails();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to delete question';
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

  if (!exam) return null;

  const isDraft = exam.status === 'DRAFT';

  return (
    <div className="space-y-8">
      {/* Exam Header */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text">{exam.title}</h1>
            <Badge variant={exam.status === 'PUBLISHED' ? 'success' : exam.status === 'CLOSED' ? 'default' : 'warning'}>
              {exam.status}
            </Badge>
          </div>
          <p className="text-text-secondary text-sm mt-1">
            Subject: <span className="font-semibold">{exam.subject?.name}</span> | Duration:{' '}
            <span className="font-semibold">{exam.duration} mins</span> | Total Marks:{' '}
            <span className="font-semibold">{exam.totalMarks} marks</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/teacher/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
          {isDraft && (
            <Button onClick={handlePublish} variant="primary" loading={publishing}>
              Publish Exam
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Questions List */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-text">Questions List ({exam.questions?.length || 0})</h2>

          {exam.questions?.length === 0 ? (
            <div className="bg-surface border border-border border-dashed p-8 rounded-xl text-center text-text-secondary">
              No questions added yet. Use the form on the right to add questions.
            </div>
          ) : (
            <div className="space-y-4">
              {exam.questions.map((q, idx) => (
                <div key={q.id} className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
                  {editingQuestionId === q.id ? (
                    /* Inline Edit Form */
                    <form onSubmit={handleEditSubmit(onEditQuestionSubmit)} className="space-y-4">
                      <Input
                        label="Question Text"
                        name="question"
                        register={registerEdit('question', { required: 'Question text is required' })}
                        error={editErrors.question}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Option A"
                          name="optionA"
                          register={registerEdit('optionA', { required: 'Option A is required' })}
                          error={editErrors.optionA}
                        />
                        <Input
                          label="Option B"
                          name="optionB"
                          register={registerEdit('optionB', { required: 'Option B is required' })}
                          error={editErrors.optionB}
                        />
                        <Input
                          label="Option C"
                          name="optionC"
                          register={registerEdit('optionC', { required: 'Option C is required' })}
                          error={editErrors.optionC}
                        />
                        <Input
                          label="Option D"
                          name="optionD"
                          register={registerEdit('optionD', { required: 'Option D is required' })}
                          error={editErrors.optionD}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <label className="text-sm font-semibold text-text mb-1.5">Correct Option</label>
                          <select
                            {...registerEdit('correctOption')}
                            className="px-3 py-2 bg-surface border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="A">Option A</option>
                            <option value="B">Option B</option>
                            <option value="C">Option C</option>
                            <option value="D">Option D</option>
                          </select>
                        </div>

                        <Input
                          label="Marks"
                          name="marks"
                          type="number"
                          register={registerEdit('marks', {
                            required: 'Marks is required',
                            valueAsNumber: true,
                            min: 1
                          })}
                          error={editErrors.marks}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-border">
                        <Button variant="secondary" onClick={() => setEditingQuestionId(null)}>
                          Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  ) : (
                    /* Display Mode */
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-sm font-semibold text-primary mr-2">Q{idx + 1}.</span>
                          <span className="font-bold text-text">{q.question}</span>
                        </div>
                        <Badge variant="accent">{q.marks} {q.marks === 1 ? 'Mark' : 'Marks'}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                        <div
                          className={`p-3 rounded-md border text-sm ${
                            q.correctOption === 'A'
                              ? 'bg-emerald-50 text-success border-emerald-200 font-bold'
                              : 'bg-background border-border text-text-secondary'
                          }`}
                        >
                          <span className="font-bold mr-1">A:</span> {q.optionA}
                        </div>
                        <div
                          className={`p-3 rounded-md border text-sm ${
                            q.correctOption === 'B'
                              ? 'bg-emerald-50 text-success border-emerald-200 font-bold'
                              : 'bg-background border-border text-text-secondary'
                          }`}
                        >
                          <span className="font-bold mr-1">B:</span> {q.optionB}
                        </div>
                        <div
                          className={`p-3 rounded-md border text-sm ${
                            q.correctOption === 'C'
                              ? 'bg-emerald-50 text-success border-emerald-200 font-bold'
                              : 'bg-background border-border text-text-secondary'
                          }`}
                        >
                          <span className="font-bold mr-1">C:</span> {q.optionC}
                        </div>
                        <div
                          className={`p-3 rounded-md border text-sm ${
                            q.correctOption === 'D'
                              ? 'bg-emerald-50 text-success border-emerald-200 font-bold'
                              : 'bg-background border-border text-text-secondary'
                          }`}
                        >
                          <span className="font-bold mr-1">D:</span> {q.optionD}
                        </div>
                      </div>

                      {isDraft && (
                        <div className="flex justify-end gap-2 pt-3 border-t border-border">
                          <Button variant="secondary" onClick={() => startEditing(q)} className="!py-1 !px-3 text-xs">
                            Edit
                          </Button>
                          <Button variant="danger" onClick={() => handleDeleteQuestion(q.id)} className="!py-1 !px-3 text-xs">
                            Delete
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Add Question Form (only if DRAFT) */}
        <div>
          {isDraft ? (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm sticky top-24">
              <h3 className="text-lg font-bold text-text mb-4">Add Question</h3>
              <form onSubmit={handleAddSubmit(onAddQuestionSubmit)} className="space-y-4">
                <Input
                  label="Question Text"
                  name="question"
                  placeholder="What is..."
                  register={registerAdd('question', { required: 'Question text is required' })}
                  error={addErrors.question}
                />

                <Input
                  label="Option A"
                  name="optionA"
                  register={registerAdd('optionA', { required: 'Option A is required' })}
                  error={addErrors.optionA}
                />

                <Input
                  label="Option B"
                  name="optionB"
                  register={registerAdd('optionB', { required: 'Option B is required' })}
                  error={addErrors.optionB}
                />

                <Input
                  label="Option C"
                  name="optionC"
                  register={registerAdd('optionC', { required: 'Option C is required' })}
                  error={addErrors.optionC}
                />

                <Input
                  label="Option D"
                  name="optionD"
                  register={registerAdd('optionD', { required: 'Option D is required' })}
                  error={addErrors.optionD}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label htmlFor="correctOption" className="mb-1.5 text-sm font-semibold text-text">
                      Correct Answer
                    </label>
                    <select
                      id="correctOption"
                      {...registerAdd('correctOption')}
                      className="px-3 py-2 bg-surface border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>

                  <Input
                    label="Marks"
                    name="marks"
                    type="number"
                    register={registerAdd('marks', {
                      required: 'Marks is required',
                      valueAsNumber: true,
                      min: 1
                    })}
                    error={addErrors.marks}
                  />
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primary" className="w-full" loading={addingQuestion}>
                    Add Question
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm text-center space-y-4">
              <div className="text-4xl">🔒</div>
              <h3 className="text-lg font-bold text-text">Exam Blueprint Locked</h3>
              <p className="text-text-secondary text-sm">
                This exam has been published. Modifying or deleting questions is disabled to preserve response integrity.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
