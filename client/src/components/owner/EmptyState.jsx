import React from "react";

const EmptyState = ({ 
  title = "No data found", 
  message, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-center">
        <p className="text-gray-500 text-lg mb-2">{title}</p>
        {message && <p className="text-gray-400 mb-4">{message}</p>}
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dull"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;

