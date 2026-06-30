import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  // Listen for Escape key to close the modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-text">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-text-secondary hover:text-text transition-colors p-1.5 hover:bg-background rounded-md text-xl leading-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[75vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
