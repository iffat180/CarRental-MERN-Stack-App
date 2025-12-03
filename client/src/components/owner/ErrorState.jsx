import React from "react";

const ErrorState = ({ error, onRetry, retryLabel = "Retry" }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-center">
        <p className="text-red-500 text-lg mb-2">Error loading data</p>
        <p className="text-gray-500 mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dull"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorState;

