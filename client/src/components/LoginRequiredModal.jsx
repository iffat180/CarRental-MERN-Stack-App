import React from "react";
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
  
  return (
    <div
      onClick={onClose}
      className="fixed top-0 bottom-0 left-0 right-0 z-100 flex items-center text-sm text-gray-600 bg-black/50"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col gap-4 m-auto items-start p-6 w-80 sm:w-[400px] rounded-lg shadow-xl border border-gray-200 bg-white"
      >
        <h2 className="text-xl font-semibold">Login Required</h2>
        <p className="text-gray-600">
          You must log in to book a car. Please log in or create an account.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg text-white transition-all"
          >
            Login
          </button>
          <button
            onClick={handleCreateAccount}
            className="w-full px-4 py-2 border border-primary text-primary hover:bg-primary/10 rounded-lg transition-all"
          >
            Create Account
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredModal;

