import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/ToastContainer';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import EmptyState from '../../components/common/EmptyState';

export default function SubjectsPage() {
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingSubject, setAddingSubject] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    document.title = 'Subjects — SecureExam';
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: ''
    }
  });

  const fetchSubjects = async () => {
    try {
      const response = await adminAPI.getSubjects();
      setSubjects(response.data || []);
    } catch (error) {
      showToast({ message: 'Failed to fetch subjects list', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [showToast]);

  const onSubmit = async (data) => {
    setAddingSubject(true);
    try {
      await adminAPI.createSubject({ name: data.name });
      showToast({ message: 'Subject created successfully', type: 'success' });
      reset();
      setShowAddForm(false);
      fetchSubjects();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create subject. Subject may already exist.';
      showToast({ message: msg, type: 'error' });
    } finally {
      setAddingSubject(false);
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">Subject Configuration</h1>
          <p className="text-text-secondary text-sm">Configure standard subjects available for creating exam blueprints.</p>
        </div>

        {!showAddForm && (
          <Button onClick={() => setShowAddForm(true)} variant="primary">
            Add Subject
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Section: Subject list */}
        <div className="md:col-span-2 bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-background">
            <h3 className="font-bold text-text">Subjects List</h3>
          </div>

          {subjects.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon="📚"
                title="No Subjects Configured"
                description="Add standard subject topics to let teachers set exams."
                action={{
                  text: 'Add Subject',
                  onClick: () => setShowAddForm(true)
                }}
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {subjects.map((sub) => (
                <li key={sub.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors flex justify-between items-center">
                  <span className="font-bold text-text">{sub.name}</span>
                  <span className="text-xs text-text-secondary">ID: {sub.id}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right Section: Add Form */}
        {showAddForm && (
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-text">Add Subject</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Subject Name"
                name="name"
                placeholder="e.g. Physics"
                register={register('name', {
                  required: 'Subject name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
                error={errors.name}
              />

              <div className="flex gap-2 justify-end pt-2 border-t border-border">
                <Button variant="secondary" onClick={() => { setShowAddForm(false); reset(); }}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={addingSubject}>
                  Save Subject
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
