import React from 'react';
import Button from './Button';


export default function EmptyState({
  icon = '📝',
  title = 'No Data Found',
  description = 'There are no items matching this view or list.',
  action = null, // e.g. { text: "Create Exam", onClick: handleCreate }
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 bg-surface border border-dashed border-border rounded-xl ${className}`}>
      {/* Icon display */}
      <div className="text-5xl mb-4 select-none" role="img" aria-label="Icon">
        {icon}
      </div>

      {/* Message */}
      <h3 className="text-lg font-bold text-text mb-1">{title}</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">{description}</p>

      {/* Optional CTA */}
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.text}
        </Button>
      )}
    </div>
  );
}
