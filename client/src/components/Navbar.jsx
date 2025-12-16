import React, { useState } from "react";
import { assets, menuLinks } from "../assets/assets";
import { Link, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import OwnerOnboardingModal from "./owner/OwnerOnboardingModal";
import { toast } from "react-hot-toast";

const Navbar = () => {
  const { setShowLogin, user, logout, navigate, upgradeToOwner } = useAppContext();

  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [showOwnerOnboarding, setShowOwnerOnboarding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleListYourCarClick = () => {
    // User not logged in: store redirect path and show login modal
    if (!user) {
      const redirectPath = "/owner/add-car";
      sessionStorage.setItem("redirectPath", redirectPath);
      setShowLogin(true);
      return;
    }
    
    // User is already an owner: navigate directly to add-car
    if (user.role === "owner") {
      navigate("/owner/add-car");
      return;
    }
    
    // User logged in but not owner: show onboarding modal
    if (user.role === "user") {
      setShowOwnerOnboarding(true);
      return;
    }
  };

  const handleBecomeOwner = async () => {
    setIsSubmitting(true);
    
    try {
      const result = await upgradeToOwner();
      
      if (result?.success) {
        // Close modal
        setShowOwnerOnboarding(false);
        
        // Show success toast
        toast.success("You're now registered as an owner");
        
        // Navigate to add car page - preserve redirectPath on navigation failure
        try {
          navigate("/owner/add-car");
          sessionStorage.removeItem("redirectPath");
        } catch (error) {
          console.log(`[Navbar] Navigation failed`, {
            path: "/owner/add-car",
            error: error.message,
            timestamp: new Date().toISOString()
          });
          // Keep redirectPath for retry
        }
      }
    } catch (error) {
      // On failure: show toast error, leave modal open
      toast.error(error.message || "Failed to become an owner. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/cars?search=${encodeURIComponent(trimmed)}`);
      setSearchQuery("");
    }
  };

  return (
    <nav
      className={`flex items-center justify-between px-6 md:px-16 lg:px-24 xl:px-32 py-4 text-gray-600 border-b border-borderColor relative transition-all ${
        location.pathname === "/" && "bg-light"
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <Link to="/" aria-label="Car Rental Home">
        <img src={assets.logo} alt="Car Rental Logo" className="h-8" />
      </Link>

      <div
        className={`max-sm:fixed max-sm:h-screen max-sm:w-full max-sm:top-16 max-sm:border-t border-borderColor right-0 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 max-sm:p-4 transition-all duration-300 z-50 ${
          location.pathname === "/" ? "bg-light" : "bg-white"
        } ${open ? "max-sm:translate-x-0" : "max-sm:translate-x-full"}`}
        role="menu"
        aria-label="Navigation menu"
        id="mobile-menu"
      >
        {menuLinks.map((link, index) => (
          <Link 
            key={index} 
            to={link.path}
            aria-current={location.pathname === link.path ? "page" : undefined}
            className="hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
          >
            {link.name}
          </Link>
        ))}

        <form 
          onSubmit={handleSearchSubmit}
          className="hidden lg:flex items-center text-sm gap-2 border border-borderColor px-3 rounded-full max-w-56"
          role="search"
          aria-label="Search cars"
        >
          <label htmlFor="navbar-search" className="sr-only">Search cars by brand, model</label>
          <input
            id="navbar-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearchSubmit(e);
              }
            }}
            className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500"
            placeholder="Search cars by brand, model..."
            aria-label="Search cars by brand, model"
          />
          <button 
            type="submit"
            aria-label="Submit search"
            className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          >
            <img 
              src={assets.search_icon} 
              alt="" 
              className="w-4 h-4"
              aria-hidden="true"
            />
          </button>
        </form>

        <div className="flex max-sm:flex-col items-start sm:items-center gap-6">
          <button 
            onClick={handleListYourCarClick} 
            className="cursor-pointer hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
            aria-label={user?.role === "owner" ? "Go to owner dashboard" : "List your car for rent"}
          >
            {user?.role === "owner" ? "Dashboard" : "List your car"}
          </button>

          <button
            onClick={() => {
              user ? logout() : setShowLogin(true);
            }}
            className="cursor-pointer px-8 py-2 bg-primary hover:bg-primary-dull transition-all text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={user ? "Logout" : "Login"}
          >
            {user ? "Logout" : "Login"}
          </button>
        </div>
      </div>

      <button
        className="sm:hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded p-1"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
      >
        <img 
          src={open ? assets.close_icon : assets.menu_icon} 
          alt="" 
          className="w-6 h-6"
          aria-hidden="true"
        />
      </button>

      <OwnerOnboardingModal
        isOpen={showOwnerOnboarding}
        onClose={() => setShowOwnerOnboarding(false)}
        onBecomeOwner={handleBecomeOwner}
        isSubmitting={isSubmitting}
      />
    </nav>
  );
};

export default Navbar;