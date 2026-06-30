import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/ToastContainer';
import Spinner from '../components/common/Spinner';

// Helper function to decode JWT payload using atob
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export default function GoogleSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const accessToken = searchParams.get('accessToken');

    if (!accessToken) {
      showToast({ message: 'Google Authentication failed: Missing token', type: 'error' });
      navigate('/login');
      return;
    }

    try {
      // Login with Context
      login(accessToken);
      const user = decodeToken(accessToken);

      showToast({ message: 'Logged in successfully with Google!', type: 'success' });

      // Redirect based on role
      if (user && user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user && user.role === 'TEACHER') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      showToast({ message: 'Failed to process Google authentication details', type: 'error' });
      navigate('/login');
    }
  }, [searchParams, login, navigate, showToast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <Spinner size="lg" />
        <h2 className="text-xl font-bold text-text">Completing Sign In</h2>
        <p className="text-text-secondary text-sm">Please wait while we finalize your Google connection.</p>
      </div>
    </div>
  );
}
