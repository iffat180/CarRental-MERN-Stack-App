import React from "react";

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "danger" // "danger" or "primary"
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed top-0 bottom-0 left-0 right-0 z-100 flex items-center text-sm text-gray-600 bg-black/50"
      onClick={onClose}
    >
      <div 
        className="flex flex-col gap-4 m-auto items-start p-6 w-80 sm:w-[400px] rounded-lg shadow-xl border border-gray-200 bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-gray-600">{message}</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg text-white ${
              confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary hover:bg-primary-dull"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

