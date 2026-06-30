import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ message, type = 'success' }) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, removeToast }) {
  const types = {
    success: 'bg-emerald-50 text-success border-emerald-200',
    error: 'bg-red-50 text-danger border-red-200',
    warning: 'bg-amber-50 text-warning border-amber-200'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const selectedType = types[t.type] || types.success;
        const icon = icons[t.type] || icons.success;

        return (
          <div
            key={t.id}
            className={`flex items-start justify-between p-4 border rounded-lg shadow-lg pointer-events-auto transition-all duration-300 animate-in slide-in-from-bottom-5 ${selectedType}`}
            role="alert"
          >
            <div className="flex gap-2.5">
              <span className="text-base select-none">{icon}</span>
              <p className="text-sm font-medium leading-tight">{t.message}</p>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-text-secondary hover:text-text text-sm ml-4 leading-none font-bold"
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}
