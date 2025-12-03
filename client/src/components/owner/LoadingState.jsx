import React from "react";

const LoadingState = ({ message = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;

