import React from "react";

const TableSkeleton = ({ rows = 5, columns = 5 }) => {
  return (
    <div className="max-w-3xl w-full rounded-md overflow-hidden border border-borderColor mt-6">
      <div className="animate-pulse">
        {/* Table Header */}
        <div className="h-12 bg-gray-200 rounded mb-2"></div>
        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;

