import React, { useState, useEffect } from "react";

const OwnerOnboardingModal = ({ isOpen, onClose, onBecomeOwner, isSubmitting }) => {
  const [currentScreen, setCurrentScreen] = useState(1);
  const TOTAL_SCREENS = 2;

  // Reset to screen 1 when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentScreen(1);
      console.log(`[OwnerOnboardingModal] Modal opened`, {
        screen: 1,
        timestamp: new Date().toISOString()
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentScreen < TOTAL_SCREENS) {
      const newScreen = currentScreen + 1;
      setCurrentScreen(newScreen);
      console.log(`[OwnerOnboardingModal] Screen changed`, {
        fromScreen: currentScreen,
        toScreen: newScreen,
        action: "next",
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleBack = () => {
    if (currentScreen > 1) {
      const newScreen = currentScreen - 1;
      setCurrentScreen(newScreen);
      console.log(`[OwnerOnboardingModal] Screen changed`, {
        fromScreen: currentScreen,
        toScreen: newScreen,
        action: "back",
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleBecomeOwnerClick = () => {
    console.log(`[OwnerOnboardingModal] Become owner CTA clicked`, {
      screen: currentScreen,
      timestamp: new Date().toISOString()
    });
    onBecomeOwner();
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
      aria-labelledby="owner-onboarding-title"
      aria-describedby="owner-onboarding-description"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col gap-6 m-auto items-center p-6 w-80 sm:w-[500px] rounded-lg shadow-xl border border-gray-200 bg-white"
      >
        {/* Progress Indicator */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentScreen} of {TOTAL_SCREENS}
            </span>
            <span className="text-sm text-gray-500">
              {currentScreen}/{TOTAL_SCREENS}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentScreen / TOTAL_SCREENS) * 100}%` }}
            />
          </div>
        </div>

        {/* Screen 1: Why become an owner? */}
        {currentScreen === 1 && (
          <div className="flex flex-col gap-4 w-full">
            <h2 id="owner-onboarding-title" className="text-xl font-semibold text-center">Why become an owner?</h2>
            <p id="owner-onboarding-description" className="sr-only">
              Learn about the benefits of becoming a car owner on our platform
            </p>
            <div className="space-y-3 text-gray-600">
              <p>
                Transform your vehicle into a source of income by listing it on our platform. 
                Reach thousands of renters looking for quality cars.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>Set your own rental prices and availability</li>
                <li>Earn passive income from your car when you're not using it</li>
                <li>Full control over booking approvals and cancellations</li>
                <li>Access to comprehensive owner dashboard and analytics</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3 w-full pt-2">
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                aria-disabled={isSubmitting}
                className="w-full px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Continue to next step"
              >
                Next
              </button>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                aria-disabled={isSubmitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Close dialog"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Screen 2: Owner registration benefits + CTA */}
        {currentScreen === 2 && (
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-xl font-semibold text-center">Owner Registration Benefits</h2>
            <div className="space-y-3 text-gray-600">
              <p className="font-medium text-gray-800">
                Start your journey as a car owner today and unlock these exclusive benefits:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-green-500 font-bold text-lg">✓</span>
                  <div>
                    <p className="font-medium">Easy Car Listing</p>
                    <p className="text-sm text-gray-500">Add your car in minutes with our simple upload process</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 font-bold text-lg">✓</span>
                  <div>
                    <p className="font-medium">Real-time Dashboard</p>
                    <p className="text-sm text-gray-500">Monitor bookings, earnings, and manage your fleet all in one place</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 font-bold text-lg">✓</span>
                  <div>
                    <p className="font-medium">Flexible Management</p>
                    <p className="text-sm text-gray-500">Approve, cancel, or modify bookings with full control</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-500 font-bold text-lg">✓</span>
                  <div>
                    <p className="font-medium">Secure Payments</p>
                    <p className="text-sm text-gray-500">Safe and reliable payment processing for all transactions</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 w-full pt-2">
              <button
                onClick={handleBecomeOwnerClick}
                disabled={isSubmitting}
                aria-disabled={isSubmitting}
                aria-busy={isSubmitting}
                className={`w-full px-4 py-2 bg-primary hover:bg-primary-dull rounded-lg text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Upgrading..." : "Become an owner"}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  disabled={isSubmitting}
                  aria-disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Go back to previous step"
                >
                  Back
                </button>
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  aria-disabled={isSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label="Close dialog"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerOnboardingModal;
