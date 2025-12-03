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

const BookingSummary = () => {
  const { bookingId } = useParams();
  const { axios, navigate, currency } = useAppContext();
  
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  
  const MAX_POLLING_ATTEMPTS = 10;
  const POLLING_INTERVAL_MS = 3000; // 3 seconds
  
  // Terminal states that stop polling
  const isTerminalState = (status) => {
    return status === "confirmed" || status === "cancelled";
  };
  
  // Fetch booking data with structured logging
  const fetchBooking = async () => {
    setIsLoading(true);
    setFetchError(null);
    
    try {
      console.log(`[BookingSummary] Fetching booking`, {
        bookingId,
        timestamp: new Date().toISOString()
      });
      
      const { data } = await axios.get(`/api/bookings/${bookingId}`);
      
      if (data.success) {
        console.log(`[BookingSummary] Booking fetched successfully`, {
          bookingId,
          status: data.booking?.status,
          hasCar: !!data.booking?.car,
          hasUserDetails: !!data.booking?.userDetails,
          hasPickupDetails: !!data.booking?.pickupDetails,
          hasReturnDetails: !!data.booking?.returnDetails,
          hasExtras: !!data.booking?.extras,
          timestamp: new Date().toISOString()
        });
        
        setBooking(data.booking);
        setFetchError(null);
      } else {
        const errorMessage = data.message || "Booking not found";
        console.log(`[BookingSummary] Fetch failed - API error`, {
          bookingId,
          errorMessage,
          timestamp: new Date().toISOString()
        });
        
        setFetchError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to load booking details";
      
      console.log(`[BookingSummary] Fetch failed - Exception`, {
        bookingId,
        errorMessage,
        statusCode: error.response?.status,
        timestamp: new Date().toISOString()
      });
      
      setFetchError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch on mount
  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);
  
  // Polling effect for booking status
  useEffect(() => {
    // Only poll if booking exists and is not in terminal state
    if (!booking || isTerminalState(booking.status)) {
      return;
    }
    
    setIsPolling(true);
    let currentAttempts = pollingAttempts;
    
    const pollInterval = setInterval(async () => {
      // Check max attempts before polling
      if (currentAttempts >= MAX_POLLING_ATTEMPTS) {
        console.log(`[BookingSummary] Polling stopped - Max attempts reached`, {
          bookingId,
          attempts: currentAttempts,
          maxAttempts: MAX_POLLING_ATTEMPTS,
          currentStatus: booking.status,
          timestamp: new Date().toISOString()
        });
        setIsPolling(false);
        clearInterval(pollInterval);
        return;
      }
      
      currentAttempts += 1;
      
      try {
        console.log(`[BookingSummary] Polling booking status`, {
          bookingId,
          attempt: currentAttempts,
          maxAttempts: MAX_POLLING_ATTEMPTS,
          currentStatus: booking.status,
          timestamp: new Date().toISOString()
        });
        
        const { data } = await axios.get(`/api/bookings/${bookingId}`);
        
        if (data.success && data.booking) {
          const newStatus = data.booking.status;
          
          console.log(`[BookingSummary] Polling response received`, {
            bookingId,
            attempt: currentAttempts,
            previousStatus: booking.status,
            newStatus,
            isTerminal: isTerminalState(newStatus),
            timestamp: new Date().toISOString()
          });
          
          setBooking(data.booking);
          setPollingAttempts(currentAttempts);
          
          // Stop polling if terminal state reached
          if (isTerminalState(newStatus)) {
            console.log(`[BookingSummary] Polling stopped - Terminal state reached`, {
              bookingId,
              finalStatus: newStatus,
              totalAttempts: currentAttempts,
              timestamp: new Date().toISOString()
            });
            setIsPolling(false);
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.log(`[BookingSummary] Polling failed`, {
          bookingId,
          attempt: currentAttempts,
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        });
        setPollingAttempts(currentAttempts);
      }
    }, POLLING_INTERVAL_MS);
    
    // Cleanup on unmount or when terminal state is reached
    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [booking?.status, bookingId, axios]); // Only depend on status change, not booking object
  
  // Handle confirm booking with structured logging
  const handleConfirm = async () => {
    setIsConfirming(true);
    
    console.log(`[BookingSummary] Confirm booking clicked`, {
      bookingId,
      currentStatus: booking?.status,
      timestamp: new Date().toISOString()
    });
    
    // Booking is already created, just redirect to success page
    // The booking status is already "pending" which is correct
    navigate(`/booking-success/${bookingId}`);
  };
  
  // Handle retry for fetch errors
  const handleRetry = () => {
    console.log(`[BookingSummary] Retry clicked`, {
      bookingId,
      timestamp: new Date().toISOString()
    });
    
    setPollingAttempts(0);
    fetchBooking();
  };
  
  // Loading state
  if (isLoading) {
    return <Loader />;
  }
  
  // Error state with retry button
  if (fetchError && !booking) {
    return (
      <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-16">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Failed to Load Booking</h2>
          <p className="text-gray-500 mb-6">{fetchError}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-primary hover:bg-primary-dull text-white rounded-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // No booking found
  if (!booking) {
    return <Loader />;
  }
  
  const rentalDays = calculateDays(booking.pickupDate, booking.returnDate);
  const totalCost = booking.price || (booking?.car?.pricePerDay || 0) * rentalDays;
  
  // Determine booking status display
  const getStatusDisplay = () => {
    if (!booking?.status) return null;
    
    const status = booking.status;
    if (status === "pending") {
      return (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 font-medium">
            {isPolling ? "Checking status..." : "Booking is pending confirmation"}
          </p>
          {isPolling && (
            <p className="text-sm text-yellow-600 mt-1">
              Polling attempt {pollingAttempts} of {MAX_POLLING_ATTEMPTS}
            </p>
          )}
        </div>
      );
    } else if (status === "confirmed") {
      return (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">✓ Booking confirmed</p>
        </div>
      );
    } else if (status === "cancelled") {
      return (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">✗ Booking cancelled</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-16">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 text-gray-500 cursor-pointer"
      >
        <img src={assets.arrow_icon} alt="" className="rotate-180 opacity-65" />
        Back
      </button>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Booking Summary</h1>
        <p className="text-gray-500 mb-8">Please review your booking details before confirming</p>
        
        {/* Status Display */}
        {getStatusDisplay()}
        
        <div className="space-y-6">
          {/* Car Details */}
          {booking?.car ? (
            <div className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
              <h2 className="text-xl font-semibold mb-4">Car Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <img
                    src={booking.car?.image || ""}
                    alt={`${booking.car?.brand || ""} ${booking.car?.model || ""}`}
                    className="w-full h-auto rounded-lg object-cover"
                    onError={(e) => {
                      e.target.src = ""; // Handle broken images
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-2xl font-bold">
                    {booking.car?.brand || "Unknown Brand"} {booking.car?.model || "Unknown Model"}
                  </h3>
                  <p className="text-gray-500 text-lg mb-4">
                    {booking.car?.year || "N/A"} • {booking.car?.category || "N/A"}
                  </p>
                  <p className="text-lg font-semibold">
                    {currency}
                    {booking.car?.pricePerDay || 0} <span className="text-base font-normal text-gray-500">per day</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
              <h2 className="text-xl font-semibold mb-4">Car Details</h2>
              <p className="text-gray-500">Car information not available</p>
            </div>
          )}
          
          {/* Rental Period */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
            <h2 className="text-xl font-semibold mb-4">Rental Period</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <img src={assets.calendar_icon_colored} alt="" className="w-5 h-5 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Pickup</p>
                    <p className="font-semibold">{booking?.pickupDate ? formatDate(booking.pickupDate) : "N/A"}</p>
                    {booking?.pickupDetails?.time && (
                      <p className="text-gray-600">{formatTime(booking.pickupDetails.time)}</p>
                    )}
                  </div>
                </div>
                {booking?.pickupDetails?.address ? (
                  <div className="flex items-start gap-3">
                    <img src={assets.location_icon_colored} alt="" className="w-5 h-5 mt-1" />
                    <p className="text-gray-600">{booking.pickupDetails.address}</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <img src={assets.location_icon_colored} alt="" className="w-5 h-5 mt-1" />
                    <p className="text-gray-500 text-sm">Pickup address not specified</p>
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <img src={assets.calendar_icon_colored} alt="" className="w-5 h-5 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Return</p>
                    <p className="font-semibold">{booking?.returnDate ? formatDate(booking.returnDate) : "N/A"}</p>
                    {booking?.returnDetails?.time && (
                      <p className="text-gray-600">{formatTime(booking.returnDetails.time)}</p>
                    )}
                  </div>
                </div>
                {booking?.returnDetails?.address ? (
                  <div className="flex items-start gap-3">
                    <img src={assets.location_icon_colored} alt="" className="w-5 h-5 mt-1" />
                    <p className="text-gray-600">{booking.returnDetails.address}</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <img src={assets.location_icon_colored} alt="" className="w-5 h-5 mt-1" />
                    <p className="text-gray-500 text-sm">Return address not specified</p>
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
          {booking?.userDetails ? (
            <div className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
              <h2 className="text-xl font-semibold mb-4">Renter Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {booking.userDetails.fullName && (
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-semibold">{booking.userDetails.fullName}</p>
                  </div>
                )}
                {booking.userDetails.email && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">{booking.userDetails.email}</p>
                  </div>
                )}
                {booking.userDetails.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold">{booking.userDetails.phone}</p>
                  </div>
                )}
                {booking.userDetails.dateOfBirth && (
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-semibold">{formatDate(booking.userDetails.dateOfBirth)}</p>
                  </div>
                )}
                {booking.userDetails.nationality && (
                  <div>
                    <p className="text-sm text-gray-500">Nationality</p>
                    <p className="font-semibold">{booking.userDetails.nationality}</p>
                  </div>
                )}
                
                {booking.userDetails?.licenseNumber && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">License Number</p>
                      <p className="font-semibold">{booking.userDetails.licenseNumber}</p>
                    </div>
                    {booking.userDetails.licenseExpiry && (
                      <div>
                        <p className="text-sm text-gray-500">License Expiry</p>
                        <p className="font-semibold">{formatDate(booking.userDetails.licenseExpiry)}</p>
                      </div>
                    )}
                    {booking.userDetails.licenseCountry && (
                      <div>
                        <p className="text-sm text-gray-500">License Country</p>
                        <p className="font-semibold">{booking.userDetails.licenseCountry}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : null}
          
          {/* Extras */}
          {booking?.extras?.extraDriver && (
            <div className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
              <h2 className="text-xl font-semibold mb-4">Extras</h2>
              <p className="text-gray-600">✓ Extra Driver</p>
            </div>
          )}
          
          {/* Notes */}
          {booking?.notes && (
            <div className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
              <h2 className="text-xl font-semibold mb-4">Notes</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}
          
          {/* Price Summary */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
            <h2 className="text-xl font-semibold mb-4">Price Summary</h2>
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-600">
                {currency}
                {booking?.car?.pricePerDay || 0} × {rentalDays} {rentalDays === 1 ? "day" : "days"}
              </p>
              <p className="text-gray-600">
                {currency}
                {(booking?.car?.pricePerDay || 0) * rentalDays}
              </p>
            </div>
            <div className="border-t border-borderColor pt-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold">Total</p>
                <p className="text-2xl font-bold text-primary">
                  {currency}
                  {totalCost}
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-4 pb-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 border border-borderColor px-6 py-3 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            {fetchError && booking && (
              <button
                onClick={handleRetry}
                className="flex-1 border border-red-300 bg-red-50 text-red-700 px-6 py-3 rounded-lg hover:bg-red-100 transition-all"
              >
                Retry
              </button>
            )}
            <button
              onClick={handleConfirm}
              disabled={isConfirming || booking?.status === "cancelled"}
              className={`flex-1 bg-primary hover:bg-primary-dull transition-all py-3 font-medium text-white rounded-xl ${
                isConfirming || booking?.status === "cancelled" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {isConfirming ? "Confirming..." : booking?.status === "confirmed" ? "View Booking" : "Confirm Booking"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;

