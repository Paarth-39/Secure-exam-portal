import React from 'react';

export default function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  const selectedSize = sizes[size] || sizes.md;

  return (
    <div className="flex items-center justify-center">
      <div
        className={`animate-spin rounded-full border-t-primary border-r-transparent border-b-primary border-l-transparent ${selectedSize} ${className}`}
        role="status"
        aria-label="loading"
      />
    </div>
  );
}
