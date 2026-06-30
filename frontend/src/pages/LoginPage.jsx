import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/ToastContainer';
import { authAPI } from '../services/api';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError(null);
    try {
      const response = await authAPI.login(data);
      const { accessToken, user } = response.data;
      
      login(accessToken);
      showToast({ message: `Welcome back, ${user.fullName}!`, type: 'success' });
      
      // Redirect based on role
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'TEACHER') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setServerError(msg);
      showToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect browser to Google authentication pathway
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 border border-border rounded-xl shadow-md">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-text">
            Sign in to <span className="text-primary">SecureExam</span>
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Or{' '}
            <Link to="/register" className="font-semibold text-primary hover:text-primary-hover transition-colors">
              create a new account
            </Link>
          </p>
        </div>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-md text-sm text-center">
            {serverError}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
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
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-text">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                name="password"
                type="password"
                placeholder="••••••••"
                register={register('password', {
                  required: 'Password is required'
                })}
                error={errors.password}
              />
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full" loading={loading}>
            Sign In
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-surface text-text-secondary">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-border rounded-md shadow-sm bg-surface text-sm font-semibold text-text hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v2.7h5.38C16.88,15.6,15,17.1,12,17.1c-3.3,0-6-2.7-6-6s2.7-6,6-6c1.5,0,2.88,0.55,3.94,1.47l2.03-2.03C16.21,2.95,14.22,2.1,12,2.1c-4.97,0-9,4.03-9,9s4.03,9,9,9c5.2,0,8.65-3.66,8.65-8.8C20.65,11.9,20.53,11.45,21.35,11.1z" fill="#4F46E5"/>
            </g>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
