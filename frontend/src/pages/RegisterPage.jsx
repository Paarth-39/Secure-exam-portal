import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/common/ToastContainer';
import { authAPI } from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function RegisterPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    document.title = 'Register — SecureExam';
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      role: 'STUDENT'
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError(null);
    try {
      await authAPI.register(data);
      showToast({
        message: 'Account created successfully! You can now sign in.',
        type: 'success'
      });
      navigate('/login');
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      setServerError(msg);
      showToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 border border-border rounded-xl shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-text">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Or{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary-hover transition-colors">
              sign in to your account
            </Link>
          </p>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-md text-sm text-center">
            {serverError}
          </div>
        )}

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Full Name"
            name="fullName"
            placeholder="John Doe"
            register={register('fullName', {
              required: 'Full name is required',
              minLength: {
                value: 2,
                message: 'Full name must be at least 2 characters'
              }
            })}
            error={errors.fullName}
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="you@example.com"
            register={register('email', {
              required: 'Email address is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            error={errors.email}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            register={register('password', {
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters'
              },
              validate: {
                hasUppercase: (value) =>
                  /[A-Z]/.test(value) || 'Password must contain at least one uppercase letter',
                hasNumber: (value) =>
                  /[0-9]/.test(value) || 'Password must contain at least one number'
              }
            })}
            error={errors.password}
          />

          <div className="flex flex-col mb-4">
            <label htmlFor="role" className="mb-1.5 text-sm font-semibold text-text">
              Register As
            </label>
            <select
              id="role"
              {...register('role')}
              className="w-full px-3.5 py-2 text-sm bg-surface border border-border rounded-md outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
            </select>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Register Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
