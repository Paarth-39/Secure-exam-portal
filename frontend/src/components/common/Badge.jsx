import React from 'react';

export default function Badge({ children, variant = 'default', className = '' }) {
  const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold';
  
  const variants = {
    default: 'bg-gray-100 text-text-secondary border border-transparent',
    accent: 'bg-violet-100 text-accent border border-transparent',
    success: 'bg-emerald-100 text-success border border-transparent',
    warning: 'bg-amber-100 text-warning border border-transparent',
    danger: 'bg-red-100 text-danger border border-transparent'

  };

  const selectedVariant = variants[variant] || variants.default;

  return (
    <span className = {`${baseStyle} ${selectedVariant} ${className}`}>
      {children}
    </span>
  );
}
