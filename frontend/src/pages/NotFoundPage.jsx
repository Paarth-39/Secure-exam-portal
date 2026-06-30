import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page Not Found — SecureExam';
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center bg-surface border border-border p-8 rounded-xl shadow-md space-y-6">
        <div className="text-5xl" role="img" aria-label="Compass">🧭</div>
        <h2 className="text-2xl font-bold text-text">Page Not Found</h2>
        <p className="text-text-secondary text-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="pt-4 flex flex-col gap-2">
          <Link to="/">
            <Button variant="primary" className="w-full">
              Back to Home Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
