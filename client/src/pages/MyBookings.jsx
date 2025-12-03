import React, { useEffect, useState } from "react";
import {assets } from "../assets/assets";
import Title from "../components/Title";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

// Helper function to format time (HH:MM to 12-hour format)
const formatTime = (time24) => {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours, 10);
  const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour12}:${minutes} ${ampm}`;
};

const MyBookings = () => {

  const { axios, user, currency} = useAppContext();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);

  const fetchMyBookings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data } = await axios.get(`/api/bookings/user`);

      if (data.success) {
        setBookings(data.bookings);
        setRetryCount(0); // Reset retry count on success
      } else {
        const errorMessage = data.message || "Failed to fetch bookings";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch bookings";
      setError(errorMessage);
      toast.error(errorMessage);
      setRetryCount(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    fetchMyBookings();
  };

  const handleCancelBooking = async (bookingId) => {
    // Show confirmation dialog
    const confirmed = window.confirm("Are you sure you want to cancel this booking? This action cannot be undone.");
    if (!confirmed) return;

    setCancellingBookingId(bookingId);

    try {
      const { data } = await axios.post(`/api/bookings/${bookingId}/cancel`);

      if (data.success) {
        toast.success("Booking cancelled");
        fetchMyBookings(); // Refresh bookings list
      } else {
        toast.error(data.message || "Failed to cancel booking");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to cancel booking";
      toast.error(errorMessage);
    } finally {
      setCancellingBookingId(null);
    }
  };

  const handleEditBooking = (booking) => {
    if (!booking.car?._id) {
      toast.error("Car information not available");
      return;
    }

    const pickupDate = booking.pickupDate.split("T")[0];
    const returnDate = booking.returnDate.split("T")[0];
    const carId = booking.car._id;
    const bookingId = booking._id;

    navigate(
      `/booking-details/${carId}?pickupDate=${pickupDate}&returnDate=${returnDate}`,
      { state: { bookingId } }
    );
  };

  useEffect(() => {
    user && fetchMyBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-32 2xl:px-48 mt-16 text-sm max-w-7xl">
      <Title
        title="My Bookings"
        subTitle="View and manage your all car bookings"
        align="left"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-gray-500">Loading your bookings...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-2">Error loading bookings</p>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dull"
            >
              {retryCount > 0 ? `Retry (Attempt ${retryCount + 1})` : "Retry"}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && bookings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-2">No bookings found</p>
            <p className="text-gray-400 mb-4">
              You haven't made any bookings yet. Start exploring our cars!
            </p>
            <button
              onClick={() => navigate("/cars")}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dull"
            >
              Browse Cars
            </button>
          </div>
        </div>
      )}

      {/* Bookings List */}
      {!isLoading && !error && bookings.length > 0 && (
        <div>
          {bookings.filter(b => b && b._id).map((booking, index) => (
          <div
            key={booking._id}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 border border-borderColor rounded-lg mt-5 first:mt-12"
          >
            {/* Car Image + Info */}
            {booking.car ? (
              <div className="md:col-span-1">
                <div className="rounded-md overflow-hidden mb-3">
                  <img
                    src={booking.car?.image}
                    alt=""
                    className="w-full h-auto aspect-video object-cover"
                  />
                </div>
                <p className="text-lg font-medium mt-2">
                  {booking.car?.brand} {booking.car?.model}
                </p>
                <p className="text-gray-500">
                  {booking.car?.year} • {booking.car?.category} •{" "}
                  {booking.car?.location}
                </p>
              </div>
            ) : (
              <div className="md:col-span-1">
                <div className="rounded-md overflow-hidden mb-3 bg-gray-100 flex items-center justify-center h-32">
                  <p className="text-gray-400 text-sm text-center px-4">Car information unavailable</p>
                </div>
                <p className="text-lg font-medium mt-2 text-gray-400">Car Details Not Available</p>
                <p className="text-gray-400 text-sm">Car information could not be loaded</p>
              </div>
            )}

            {/* Booking Info */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <p className="px-3 py-1.5 bg-light rounded">
                  Booking #{index + 1}
                </p>
                <p
                  className={`px-3 py-1 text-xs rounded-full ${
                    booking.status === "confirmed"
                      ? "bg-green-400/15 text-green-600"
                      : "bg-red-400/15 text-red-600"
                  }`}
                >
                  {booking.status}
                </p>
              </div>

              {/* Rental Period */}
              <div className="flex items-start gap-2 mt-3">
                <img
                  src={assets.calendar_icon_colored}
                  alt=""
                  className="w-4 h-4 mt-1"
                />
                <div>
                  <p className="text-gray-500">Rental Period</p>
                  <p>
                    {booking.pickupDate.split("T")[0]} To{" "}
                    {booking.returnDate.split("T")[0]}
                  </p>
                  {booking.pickupDetails?.time && booking.returnDetails?.time && (
                    <p className="text-sm text-gray-400">
                      {formatTime(booking.pickupDetails.time)} - {formatTime(booking.returnDetails.time)}
                    </p>
                  )}
                </div>
              </div>

              {/* Pick-up Location */}
              {booking.pickupDetails?.address ? (
                <div className="flex items-start gap-2 mt-3">
                  <img
                    src={assets.location_icon_colored}
                    alt=""
                    className="w-4 h-4 mt-1"
                  />
                  <div>
                    <p className="text-gray-500">Pick-up Location</p>
                    <p>{booking.pickupDetails.address}</p>
                    {booking.pickupDetails.time && (
                      <p className="text-sm text-gray-400">{formatTime(booking.pickupDetails.time)}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 mt-3">
                  <img
                    src={assets.location_icon_colored}
                    alt=""
                    className="w-4 h-4 mt-1"
                  />
                  <div>
                    <p className="text-gray-500">Pick-up Location</p>
                    <p>{booking.car?.location || "Location not available"}</p>
                  </div>
                </div>
              )}

              {/* Return Location */}
              {booking.returnDetails?.address && (
                <div className="flex items-start gap-2 mt-3">
                  <img
                    src={assets.location_icon_colored}
                    alt=""
                    className="w-4 h-4 mt-1"
                  />
                  <div>
                    <p className="text-gray-500">Return Location</p>
                    <p>{booking.returnDetails.address}</p>
                    {booking.returnDetails.time && (
                      <p className="text-sm text-gray-400">{formatTime(booking.returnDetails.time)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Price & Actions */}
            <div className="md:col-span-1 flex flex-col justify-between gap-6">
              <div className="text-sm text-gray-500 text-right">
                <p>Total Price</p>
                <h1 className="text-2xl font-semibold text-primary">
                  {currency}
                  {booking.price}
                </h1>
                <p>Booked on {booking.createdAt.split("T")[0]}</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mt-4">
                {(booking.status === "pending" || booking.status === "confirmed") && (
                  <>
                    <button
                      onClick={() => handleEditBooking(booking)}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Edit Booking
                    </button>
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      disabled={cancellingBookingId === booking._id}
                      className={`px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors ${
                        cancellingBookingId === booking._id ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {cancellingBookingId === booking._id ? "Cancelling..." : "Cancel Booking"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
