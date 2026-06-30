import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/common/ToastContainer';
import { authAPI } from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });

  const newPassword = watch('newPassword');

  useEffect(() => {
    const t = searchParams.get('token');
    if (!t) {
      setErrorMsg('No token found in password reset link.');
    } else {
      setToken(t);
    }
  }, [searchParams]);

  const onSubmit = async (data) => {
    if (!token) {
      showToast({ message: 'Missing password reset token', type: 'error' });
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await authAPI.resetPassword({
        token,
        newPassword: data.newPassword
      });
      setSuccess(true);
      showToast({ message: 'Password reset successfully!', type: 'success' });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to reset password. Link may be invalid or expired.';
      setErrorMsg(msg);
      showToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 border border-border rounded-xl shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-text">
            Choose New Password
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Set your new credentials to gain account access.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="text-5xl text-success" role="img" aria-label="Checked">✅</div>
            <h2 className="text-xl font-bold text-text">Password Reset Successfully!</h2>
            <p className="text-success text-sm font-semibold">Redirecting to login page in 2 seconds...</p>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="primary" className="w-full">
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : errorMsg && !token ? (
          <div className="text-center space-y-4">
            <div className="text-5xl text-danger" role="img" aria-label="Alert">⚠️</div>
            <h2 className="text-xl font-bold text-text">Invalid Password Link</h2>
            <p className="text-danger text-sm font-semibold">{errorMsg}</p>
            <div className="pt-4 flex flex-col gap-2">
              <Link to="/forgot-password">
                <Button variant="primary" className="w-full">
                  Request New Password Reset Link
                </Button>
              </Link>
              <Link to="/login" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-md text-sm text-center font-semibold">
                {errorMsg}. Request a new link below if it expired.
              </div>
            )}

            <Input
              label="New Password"
              name="newPassword"
              type="password"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              register={register('newPassword', {
                required: 'New password is required',
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
              error={errors.newPassword}
            />

            <Input
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your new password"
              register={register('confirmPassword', {
                required: 'Please confirm your new password',
                validate: (value) => value === newPassword || 'Passwords do not match'
              })}
              error={errors.confirmPassword}
            />

            <div className="pt-2 flex flex-col gap-3">
              <Button type="submit" variant="primary" className="w-full" loading={loading}>
                Reset Password
              </Button>
              <Link to="/login" className="text-sm font-semibold text-text-secondary hover:text-text transition-colors text-center">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
