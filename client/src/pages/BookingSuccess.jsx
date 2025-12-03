import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Helper function to format time (HH:MM to 12-hour format)
const formatTime = (time24) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours, 10);
  const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour12}:${minutes} ${ampm}`;
};

// Helper function to calculate days
const calculateDays = (pickupDate, returnDate) => {
  if (!pickupDate || !returnDate) return 0;
  const pickup = new Date(pickupDate);
  const returnD = new Date(returnDate);
  const diffTime = returnD - pickup;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

const BookingSuccess = () => {
  const { bookingId } = useParams();
  const { axios, navigate, currency } = useAppContext();
  
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch booking data
  useEffect(() => {
    const fetchBooking = async () => {
      setIsLoading(true);
      try {
        const { data } = await axios.get(`/api/bookings/${bookingId}`);
        if (data.success) {
          setBooking(data.booking);
        } else {
          toast.error(data.message || "Booking not found");
          navigate("/my-bookings");
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to load booking details";
        toast.error(errorMessage);
        navigate("/my-bookings");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId, axios, navigate]);
  
  if (isLoading || !booking) {
    return <Loader />;
  }
  
  const rentalDays = calculateDays(booking.pickupDate, booking.returnDate);
  const totalCost = booking.price || (booking.car?.pricePerDay || 0) * rentalDays;
  
  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-16">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <img src={assets.check_icon} alt="" className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-gray-500">
            Your booking has been confirmed. Booking ID: <span className="font-semibold">{bookingId}</span>
          </p>
        </div>
        
        <div className="space-y-6 mb-8">
          {/* Car Details */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
            <h2 className="text-xl font-semibold mb-4">Car Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <img
                  src={booking.car?.image}
                  alt={`${booking.car?.brand} ${booking.car?.model}`}
                  className="w-full h-auto rounded-lg object-cover"
                />
              </div>
              <div className="md:col-span-2">
                <h3 className="text-2xl font-bold">
                  {booking.car?.brand} {booking.car?.model}
                </h3>
                <p className="text-gray-500 text-lg mb-4">
                  {booking.car?.year} • {booking.car?.category}
                </p>
              </div>
            </div>
          </div>
          
          {/* Rental Period */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
            <h2 className="text-xl font-semibold mb-4">Rental Period</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <img src={assets.calendar_icon_colored} alt="" className="w-5 h-5 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Pickup</p>
                    <p className="font-semibold">{formatDate(booking.pickupDate)}</p>
                    {booking.pickupDetails?.time && (
                      <p className="text-gray-600">{formatTime(booking.pickupDetails.time)}</p>
                    )}
                  </div>
                </div>
                {booking.pickupDetails?.address && (
                  <div className="flex items-start gap-3">
                    <img src={assets.location_icon_colored} alt="" className="w-5 h-5 mt-1" />
                    <p className="text-gray-600">{booking.pickupDetails.address}</p>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <img src={assets.calendar_icon_colored} alt="" className="w-5 h-5 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Return</p>
                    <p className="font-semibold">{formatDate(booking.returnDate)}</p>
                    {booking.returnDetails?.time && (
                      <p className="text-gray-600">{formatTime(booking.returnDetails.time)}</p>
                    )}
                  </div>
                </div>
                {booking.returnDetails?.address && (
                  <div className="flex items-start gap-3">
                    <img src={assets.location_icon_colored} alt="" className="w-5 h-5 mt-1" />
                    <p className="text-gray-600">{booking.returnDetails.address}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-borderColor">
              <p className="text-gray-600">
                <span className="font-semibold">Duration:</span> {rentalDays} {rentalDays === 1 ? "day" : "days"}
              </p>
            </div>
          </div>
          
          {/* Renter Details */}
          {booking.userDetails && (
            <div className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
              <h2 className="text-xl font-semibold mb-4">Renter Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-semibold">{booking.userDetails.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold">{booking.userDetails.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-semibold">{booking.userDetails.phone}</p>
                </div>
                {booking.userDetails.licenseNumber && (
                  <div>
                    <p className="text-sm text-gray-500">License Number</p>
                    <p className="font-semibold">{booking.userDetails.licenseNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Price Summary */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
            <h2 className="text-xl font-semibold mb-4">Total Amount</h2>
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold">Total Rental Cost</p>
              <p className="text-2xl font-bold text-primary">
                {currency}
                {totalCost}
              </p>
            </div>
          </div>
        </div>
        
        {/* Action Button */}
        <div className="text-center pb-8">
          <button
            onClick={() => navigate("/my-bookings")}
            className="bg-primary hover:bg-primary-dull transition-all px-8 py-3 font-medium text-white rounded-xl"
          >
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;

