import React from 'react';

export default function Input({
  label,
  name,
  type = 'text',
  placeholder = '',
  register = {},
  error = null,
  className = '',
  ...rest
}) {
  return (
    <div className={`flex flex-col w-full mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="mb-1.5 text-sm font-semibold text-text">
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        {...register}
        {...rest}
        className={`w-full px-3.5 py-2 text-sm bg-surface border rounded-md transition-all outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
          error ? 'border-danger' : 'border-border'
        }`}
      />
      {error && (
        <span className="mt-1 text-xs text-danger font-medium">
          {error.message || error}
        </span>
      )}
    </div>
  );
}
