import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const LoginRequiredModal = ({ isOpen, onClose }) => {
  const { setShowLogin } = useAppContext();
  const location = useLocation();
  
  if (!isOpen) return null;
  
  const handleLogin = () => {
    // Store current path for redirect after login
    sessionStorage.setItem("redirectPath", location.pathname + location.search);
    
    // Open login modal in login mode
    setShowLogin(true);
    onClose();
  };
  
  const handleCreateAccount = () => {
    // Store current path for redirect after signup
    sessionStorage.setItem("redirectPath", location.pathname + location.search);
    sessionStorage.setItem("loginInitialMode", "register");
    
    // Open login modal in register mode
    setShowLogin(true);
    onClose();
  };
  
  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Focus trap: focus first focusable element
      const firstButton = document.querySelector('[role="dialog"] button');
      if (firstButton) {
        firstButton.focus();
      }
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed top-0 bottom-0 left-0 right-0 z-100 flex items-center text-sm text-gray-600 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-required-title"
      aria-describedby="login-required-description"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col gap-4 m-auto items-start p-6 w-80 sm:w-[400px] rounded-lg shadow-xl border border-gray-200 bg-white"
      >
        <h2 id="login-required-title" className="text-xl font-semibold">Login Required</h2>
        <p id="login-required-description" className="text-gray-600">
          You must log in to book a car. Please log in or create an account.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Open login form"
          >
            Login
          </button>
          <button
            onClick={handleCreateAccount}
            className="w-full px-4 py-2 border border-primary text-primary hover:bg-primary/10 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Open account registration form"
          >
            Create Account
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Close dialog"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredModal;

