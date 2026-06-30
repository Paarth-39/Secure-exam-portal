import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useToast } from '../components/common/ToastContainer';
import { authAPI } from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function ForgotPasswordPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword(data);
      setSubmitted(true);
      showToast({
        message: 'Password reset link request submitted successfully.',
        type: 'success'
      });
    } catch (error) {
      // In case of error (except validation) we still show success banner
      // to avoid leaking registered user emails (silent check-safe pattern)
      setSubmitted(true);
      showToast({
        message: 'Password reset link request submitted.',
        type: 'success'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 border border-border rounded-xl shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-text">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Enter your email address and we will send you a link to reset your password.
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 text-success p-4 rounded-md text-sm font-semibold text-center">
              If that email exists, a reset link has been sent.
            </div>
            <p className="text-xs text-text-secondary">
              Please check your inbox (including spam folder) for further instructions.
            </p>
            <div className="pt-2">
              <Link to="/login" className="w-full inline-block">
                <Button variant="secondary" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
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

            <div>
              <Button type="submit" variant="primary" className="w-full" loading={loading}>
                Send Reset Link
              </Button>
            </div>

            <div className="text-center">
              <Link to="/login" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
                Cancel and back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
