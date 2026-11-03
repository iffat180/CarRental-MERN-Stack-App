import React from "react";
import { useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";

const LoginRequiredModal = ({ isOpen, onClose }) => {
  const { setShowLogin } = useAppContext();
  const location = useLocation();

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-80 items-start gap-4 p-6 sm:w-[400px]">
        <DialogTitle className="text-xl font-semibold">Login Required</DialogTitle>
        <DialogDescription className="text-gray-600">
          You must log in to book a car. Please log in or create an account.
        </DialogDescription>
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Login
          </button>
          <button
            onClick={handleCreateAccount}
            className="w-full px-4 py-2 border border-primary text-primary hover:bg-primary/10 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Create Account
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginRequiredModal;
