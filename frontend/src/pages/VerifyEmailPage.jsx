import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../components/common/ToastContainer';
import { authAPI } from '../services/api';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const verificationStarted = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setVerifying(false);
      setErrorMsg('No token found in verification link.');
      return;
    }

    // Prevent double invocation in React StrictMode
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    const performVerification = async () => {
      try {
        await authAPI.verifyEmail({ token });
        setSuccess(true);
        showToast({ message: 'Email verified successfully!', type: 'success' });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        const msg = error.response?.data?.message || 'Verification failed or link expired.';
        setErrorMsg(msg);
        showToast({ message: msg, type: 'error' });
      } finally {
        setVerifying(false);
      }
    };

    performVerification();
  }, [searchParams, navigate, showToast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 border border-border rounded-xl shadow-md text-center">
        {verifying ? (
          <div className="space-y-4">
            <Spinner size="lg" />
            <h2 className="text-xl font-bold text-text">Verifying Your Email</h2>
            <p className="text-text-secondary text-sm">Please wait while we verify your account credentials.</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="text-5xl text-success" role="img" aria-label="Checked">✅</div>
            <h2 className="text-2xl font-bold text-text">Email Verified!</h2>
            <p className="text-success text-sm font-semibold">Redirecting to login page in 3 seconds...</p>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="primary" className="w-full">
                  Login Now
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-5xl text-danger" role="img" aria-label="Alert">⚠️</div>
            <h2 className="text-2xl font-bold text-text">Verification Failed</h2>
            <p className="text-danger text-sm font-semibold">{errorMsg}</p>
            <p className="text-text-secondary text-sm">
              Your link might be invalid, broken, or has expired after 24 hours.
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <Link to="/register">
                <Button variant="primary" className="w-full">
                  Request New Verification Link
                </Button>
              </Link>
              <Link to="/login" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
