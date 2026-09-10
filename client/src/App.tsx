import React, { useState } from "react";
import Navbar from "./components/Navbar";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import CarDetails from "./pages/CarDetails";
import Cars from "./pages/Cars";
import MyBookings from "./pages/MyBookings";
import BookingDetails from "./pages/BookingDetails";
import BookingSummary from "./pages/BookingSummary";
import BookingSuccess from "./pages/BookingSuccess";
import Footer from "./components/Footer";
import Layout from "./pages/owner/Layout";
import Dashboard from "./pages/owner/Dashboard";
import AddCar from "./pages/owner/AddCar";
import ManageCars from "./pages/owner/ManageCars";
import ManageBookings from "./pages/owner/ManageBookings";
import Login from "./components/Login";
import LoginRequiredModal from "./components/LoginRequiredModal";
import { Toaster } from "react-hot-toast";
import { useAppContext } from "./context/AppContext";

const App = () => {
  const { showLogin, showLoginRequired, setShowLoginRequired } = useAppContext();
  const isOwnerPath = useLocation().pathname.startsWith("/owner");

  return (
    <>
    <Toaster />
      {/* Skip to main content link for keyboard navigation */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        Skip to main content
      </a>
      
      {showLogin && <Login/>}
      {showLoginRequired && (
        <LoginRequiredModal
          isOpen={showLoginRequired}
          onClose={() => setShowLoginRequired(false)}
        />
      )}

      {!isOwnerPath && <Navbar/>}

      <main id="main-content" role="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/car-details/:id" element={<CarDetails />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/booking-details/:carId" element={<BookingDetails />} />
          <Route path="/booking-summary/:bookingId" element={<BookingSummary />} />
          <Route path="/booking-success/:bookingId" element={<BookingSuccess />} />
          <Route path="/owner" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="add-car" element={<AddCar />} />
            <Route path="manage-cars" element={<ManageCars />} />
            <Route path="manage-bookings" element={<ManageBookings />} />
          </Route>
        </Routes>
      </main>

      {!isOwnerPath && <Footer />}
    </>
  );
};

export default App;
