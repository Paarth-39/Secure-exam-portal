import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function UnauthorizedPage() {
  useEffect(() => {
    document.title = 'Unauthorized — SecureExam';
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center bg-surface border border-border p-8 rounded-xl shadow-md space-y-6">
        <div className="text-5xl text-danger" role="img" aria-label="Shield Warning">🛡️</div>
        <h2 className="text-2xl font-bold text-text">Access Denied</h2>
        <p className="text-text-secondary text-sm">
          You do not have the required role privileges to access this system resource.
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
