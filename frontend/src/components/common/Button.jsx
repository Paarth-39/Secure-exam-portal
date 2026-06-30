import React from 'react';
import Spinner from './Spinner';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = ''
}) {
  const baseStyle = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-4 py-2 text-sm';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover border border-transparent',
    secondary: 'bg-surface text-text hover:bg-gray-50 border border-border',
    danger: 'bg-red-50 text-danger hover:bg-red-100 border border-red-200 focus:ring-danger'
  };

  const selectedVariant = variants[variant] || variants.primary;
  

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${selectedVariant} ${className}`}
    >
      {loading ? (
        <>
          <Spinner size="sm" className="mr-2 border-white" />
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
}
