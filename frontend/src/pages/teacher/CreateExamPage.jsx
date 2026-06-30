import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { adminAPI, teacherAPI } from '../../services/api';
import { useToast } from '../../components/common/ToastContainer';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';

export default function CreateExamPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'My Exams — SecureExam';
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: '',
      subjectId: '',
      duration: '',
      totalMarks: '',
      startTime: '',
      endTime: ''
    }
  });

  const startTime = watch('startTime');

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await teacherAPI.getSubjects();
        setSubjects(response.data || []);
      } catch (error) {
        showToast({ message: 'Failed to load subjects', type: 'error' });
      } finally {
        setSubjectsLoading(false);
      }
    };
    fetchSubjects();
  }, [showToast]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Format payload dates to ISO strings for API compatibility
      const payload = {
        title: data.title,
        subjectId: parseInt(data.subjectId, 10),
        duration: parseInt(data.duration, 10),
        totalMarks: parseInt(data.totalMarks, 10),
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString()
      };

      const response = await teacherAPI.createExam(payload);
      const exam = response.data.exam;
      showToast({ message: 'Exam created successfully! Please add questions.', type: 'success' });
      navigate(`/teacher/exams/${exam.id}`);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create exam';
      showToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (subjectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-surface border border-border rounded-xl shadow-md p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text">Create Exam Blueprint</h1>
        <p className="text-text-secondary text-sm">Specify the constraints and scheduling window for the new exam.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Exam Title"
          name="title"
          placeholder="e.g. Mathematics Midterm"
          register={register('title', {
            required: 'Exam title is required',
            minLength: { value: 3, message: 'Title must be at least 3 characters' }
          })}
          error={errors.title}
        />

        <div className="flex flex-col mb-4">
          <label htmlFor="subjectId" className="mb-1.5 text-sm font-semibold text-text">
            Subject
          </label>
          <select
            id="subjectId"
            {...register('subjectId', { required: 'Please select a subject' })}
            className={`w-full px-3.5 py-2 text-sm bg-surface border rounded-md outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.subjectId ? 'border-danger' : 'border-border'
            }`}
          >
            <option value="">-- Select Subject --</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
          {errors.subjectId && (
            <span className="mt-1 text-xs text-danger font-medium">{errors.subjectId.message}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Duration (minutes)"
            name="duration"
            type="number"
            placeholder="60"
            register={register('duration', {
              required: 'Duration is required',
              valueAsNumber: true,
              min: { value: 5, message: 'Minimum duration is 5 minutes' },
              max: { value: 300, message: 'Maximum duration is 300 minutes' }
            })}
            error={errors.duration}
          />

          <Input
            label="Total Marks"
            name="totalMarks"
            type="number"
            placeholder="100"
            register={register('totalMarks', {
              required: 'Total marks is required',
              valueAsNumber: true,
              min: { value: 1, message: 'Total marks must be positive' }
            })}
            error={errors.totalMarks}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Window Time"
            name="startTime"
            type="datetime-local"
            register={register('startTime', { required: 'Start time is required' })}
            error={errors.startTime}
          />

          <Input
            label="End Window Time"
            name="endTime"
            type="datetime-local"
            register={register('endTime', {
              required: 'End time is required',
              validate: (value) =>
                !startTime || new Date(value) > new Date(startTime) || 'End time must be after start time'
            })}
            error={errors.endTime}
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
          <Link to="/teacher/dashboard">
            <Button variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit" variant="primary" loading={loading}>
            Create & Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
