import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Title from "../../components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import LoadingState from "../../components/owner/LoadingState";
import ErrorState from "../../components/owner/ErrorState";
import EmptyState from "../../components/owner/EmptyState";
import TableSkeleton from "../../components/owner/TableSkeleton";
import { assets } from "../../assets/assets";
import { 
  BOOKING_STATUS, 
  STATUS_CONFIG, 
  canTransitionStatus, 
  getStatusOptions, 
  getStatusBadgeClasses 
} from "../../utils/bookingStatus";

// Helper function to format date
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
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

const ManageBookings = () => {
  const { axios, currency } = useAppContext();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // Track which booking action is loading

  const fetchOwnerBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/bookings/owner");
      if (data.success) {
        setBookings(data.bookings);
      } else {
        const errorMessage = data.message || "Failed to fetch bookings";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to fetch bookings";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewBooking = (bookingId) => {
    console.log(`[ManageBookings] View booking clicked`, {
      bookingId,
      timestamp: new Date().toISOString()
    });
    navigate(`/booking-summary/${bookingId}`);
  };

  const handleApprove = async (bookingId) => {
    console.log(`[ManageBookings] Approve clicked`, {
      bookingId,
      action: "approve",
      timestamp: new Date().toISOString()
    });
    
    setActionLoading(bookingId);
    
    try {
      const { data } = await axios.post(`/api/bookings/change-status/${bookingId}`, {
        status: BOOKING_STATUS.CONFIRMED
      });
      
      if (data.success) {
        console.log(`[ManageBookings] Approve API success`, {
          bookingId,
          status: BOOKING_STATUS.CONFIRMED,
          message: data.message,
          timestamp: new Date().toISOString()
        });
        
        toast.success(data.message || "Booking approved successfully");
        fetchOwnerBookings(); // Refresh bookings list
      } else {
        console.log(`[ManageBookings] Approve API failed`, {
          bookingId,
          errorMessage: data.message,
          timestamp: new Date().toISOString()
        });
        
        toast.error(data.message || "Failed to approve booking");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to approve booking";
      
      console.log(`[ManageBookings] Approve API exception`, {
        bookingId,
        errorMessage,
        statusCode: error.response?.status,
        timestamp: new Date().toISOString()
      });
      
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId) => {
    console.log(`[ManageBookings] Reject clicked`, {
      bookingId,
      action: "reject",
      timestamp: new Date().toISOString()
    });
    
    setActionLoading(bookingId);
    
    try {
      const { data } = await axios.post(`/api/bookings/change-status/${bookingId}`, {
        status: BOOKING_STATUS.CANCELLED
      });
      
      if (data.success) {
        console.log(`[ManageBookings] Reject API success`, {
          bookingId,
          status: BOOKING_STATUS.CANCELLED,
          message: data.message,
          timestamp: new Date().toISOString()
        });
        
        toast.success(data.message || "Booking rejected successfully");
        fetchOwnerBookings(); // Refresh bookings list
      } else {
        console.log(`[ManageBookings] Reject API failed`, {
          bookingId,
          errorMessage: data.message,
          timestamp: new Date().toISOString()
        });
        
        toast.error(data.message || "Failed to reject booking");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to reject booking";
      
      console.log(`[ManageBookings] Reject API exception`, {
        bookingId,
        errorMessage,
        statusCode: error.response?.status,
        timestamp: new Date().toISOString()
      });
      
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchOwnerBookings();
  }, []);

  return (
    <div className="px-4 pt-10 md:px-10 w-full">
      <Title
        title="Manage Bookings"
        subTitle="Track all customer bookings, approve or cancel requests, and manage booking statuses."
      />

      {/* Loading State */}
      {isLoading && <TableSkeleton rows={5} />}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorState error={error} onRetry={fetchOwnerBookings} retryLabel="Retry" />
      )}

      {/* Empty State */}
      {!isLoading && !error && bookings.length === 0 && (
        <EmptyState 
          title="No bookings found" 
          message="You don't have any bookings yet. Bookings will appear here once customers make reservations."
        />
      )}

      {/* Bookings List */}
      {!isLoading && !error && bookings.length > 0 && (
        <div className="space-y-4 mt-6 max-w-5xl">
          {bookings.map((booking) => {
            console.log(`[ManageBookings] Rendering booking card`, {
              bookingId: booking._id,
              timestamp: new Date().toISOString()
            });

            const statusConfig = STATUS_CONFIG[booking?.status] || null;
            const statusBadgeClasses = getStatusBadgeClasses(booking?.status);

            console.log(`[ManageBookings] Booking card rendered successfully`, {
              bookingId: booking._id,
              status: booking?.status,
              hasCar: !!booking?.car,
              hasUserDetails: !!booking?.userDetails,
              hasPickupDetails: !!booking?.pickupDetails,
              hasReturnDetails: !!booking?.returnDetails,
              hasNotes: !!booking?.notes,
              timestamp: new Date().toISOString()
            });

            return (
              <div
                key={booking._id}
                className="bg-white border border-borderColor rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header Row: Status & Price */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-borderColor">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClasses}`}>
                      {statusConfig?.label || booking?.status || "Unknown"}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Price</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {currency}
                      {booking?.price || 0}
                    </p>
                  </div>
                </div>

                {/* Renter Identity Section */}
                {booking?.userDetails && (
                  <div className="mb-4 pb-4 border-b border-borderColor">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Renter Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {booking.userDetails?.fullName && (
                        <div>
                          <p className="text-gray-500 text-xs">Full Name</p>
                          <p className="text-gray-800 font-medium">{booking.userDetails.fullName}</p>
                        </div>
                      )}
                      {booking.userDetails?.email && (
                        <div>
                          <p className="text-gray-500 text-xs">Email</p>
                          <p className="text-gray-800 font-medium">{booking.userDetails.email}</p>
                        </div>
                      )}
                      {booking.userDetails?.phone && (
                        <div>
                          <p className="text-gray-500 text-xs">Phone</p>
                          <p className="text-gray-800 font-medium">{booking.userDetails.phone}</p>
                        </div>
                      )}
                      {booking.userDetails?.nationality && (
                        <div>
                          <p className="text-gray-500 text-xs">Nationality</p>
                          <p className="text-gray-800 font-medium">{booking.userDetails.nationality}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* License Details Section */}
                {booking?.userDetails?.licenseNumber && (
                  <div className="mb-4 pb-4 border-b border-borderColor">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Driving License</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      {booking.userDetails?.licenseNumber && (
                        <div>
                          <p className="text-gray-500 text-xs">License Number</p>
                          <p className="text-gray-800 font-medium">{booking.userDetails.licenseNumber}</p>
                        </div>
                      )}
                      {booking.userDetails?.licenseExpiry && (
                        <div>
                          <p className="text-gray-500 text-xs">Expiry Date</p>
                          <p className="text-gray-800 font-medium">{formatDate(booking.userDetails.licenseExpiry)}</p>
                        </div>
                      )}
                      {booking.userDetails?.licenseCountry && (
                        <div>
                          <p className="text-gray-500 text-xs">Country of Issue</p>
                          <p className="text-gray-800 font-medium">{booking.userDetails.licenseCountry}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Date Range Section */}
                <div className="mb-4 pb-4 border-b border-borderColor">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Rental Period</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Pickup Date</p>
                      <p className="text-gray-800 font-medium">
                        {booking?.pickupDate ? formatDate(booking.pickupDate) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Return Date</p>
                      <p className="text-gray-800 font-medium">
                        {booking?.returnDate ? formatDate(booking.returnDate) : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pickup Details Section */}
                {booking?.pickupDetails && (
                  <div className="mb-4 pb-4 border-b border-borderColor">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Pickup Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {booking.pickupDetails?.address && (
                        <div>
                          <p className="text-gray-500 text-xs">Address</p>
                          <p className="text-gray-800 font-medium">{booking.pickupDetails.address}</p>
                        </div>
                      )}
                      {booking.pickupDetails?.time && (
                        <div>
                          <p className="text-gray-500 text-xs">Time</p>
                          <p className="text-gray-800 font-medium">{formatTime(booking.pickupDetails.time)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Return Details Section */}
                {booking?.returnDetails && (
                  <div className="mb-4 pb-4 border-b border-borderColor">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Return Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {booking.returnDetails?.address && (
                        <div>
                          <p className="text-gray-500 text-xs">Address</p>
                          <p className="text-gray-800 font-medium">{booking.returnDetails.address}</p>
                        </div>
                      )}
                      {booking.returnDetails?.time && (
                        <div>
                          <p className="text-gray-500 text-xs">Time</p>
                          <p className="text-gray-800 font-medium">{formatTime(booking.returnDetails.time)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {booking?.notes && (
                  <div className="mb-4 pb-4 border-b border-borderColor">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes</h3>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{booking.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={() => handleViewBooking(booking._id)}
                    className="px-4 py-2 text-sm border border-borderColor rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    View Booking
                  </button>
                  <button
                    onClick={() => handleApprove(booking._id)}
                    disabled={actionLoading === booking._id || booking?.status !== BOOKING_STATUS.PENDING}
                    className={`px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors ${
                      actionLoading === booking._id || booking?.status !== BOOKING_STATUS.PENDING ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {actionLoading === booking._id ? "Approving..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(booking._id)}
                    disabled={actionLoading === booking._id || booking?.status !== BOOKING_STATUS.PENDING}
                    className={`px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors ${
                      actionLoading === booking._id || booking?.status !== BOOKING_STATUS.PENDING ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {actionLoading === booking._id ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageBookings;
