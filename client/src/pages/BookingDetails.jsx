import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";
import { getLocationsForCity } from "../utils/locationData";

// Generate time options for dropdown (8:00 AM to 10:00 PM in 30-minute intervals)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 8; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time24 = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? "PM" : "AM";
      const display = minute === 0 
        ? `${hour12}:00 ${ampm}` 
        : `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
      options.push({ value: time24, label: display });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateTime = (time) => {
  return /^\d{2}:\d{2}$/.test(time);
};

const validateDate = (dateString, mustBeFuture = false, mustBePast = false) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (mustBeFuture) {
    return date > today;
  }
  if (mustBePast) {
    return date < today;
  }
  return true;
};

const BookingDetails = () => {
  const { carId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const pickupDateParam = searchParams.get("pickupDate");
  const returnDateParam = searchParams.get("returnDate");
  
  const { cars, axios, user, navigate, currency, pickupDate: contextPickupDate, returnDate: contextReturnDate } = useAppContext();
  
  const [car, setCar] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationOptions, setLocationOptions] = useState([]);
  
  // Use params if available, otherwise fallback to context
  const pickupDate = pickupDateParam || contextPickupDate;
  const returnDate = returnDateParam || contextReturnDate;
  
  // Form state
  const [formData, setFormData] = useState({
    userDetails: {
      fullName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      nationality: "",
      licenseNumber: "",
      licenseExpiry: "",
      licenseCountry: "",
    },
    pickupDetails: {
      address: "",
      time: "",
    },
    returnDetails: {
      address: "",
      time: "",
    },
    extras: {
      extraDriver: false,
    },
    notes: "",
  });
  
  // Validation errors
  const [errors, setErrors] = useState({});
  
  // Fetch car data
  useEffect(() => {
    const fetchCar = async () => {
      setIsLoading(true);
      
      // First, check if car exists in context
      const carFromContext = cars.find((c) => c._id === carId);
      
      if (carFromContext) {
        setCar(carFromContext);
        // Set location options based on car location
        const locations = getLocationsForCity(carFromContext.location);
        setLocationOptions(locations);
        setIsLoading(false);
        return;
      }
      
      // If not found in context, fetch from API
      try {
        const { data } = await axios.get(`/api/user/cars/${carId}`);
        if (data.success) {
          setCar(data.car);
          // Set location options based on car location
          const locations = getLocationsForCity(data.car.location);
          setLocationOptions(locations);
        } else {
          toast.error(data.message || "Car not found");
          navigate("/cars");
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || "Failed to load car details";
        toast.error(errorMessage);
        navigate("/cars");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (carId) {
      fetchCar();
    }
  }, [carId, cars, axios, navigate]);
  
  // Prefill form data from user profile or existing booking
  useEffect(() => {
    const bookingId = location.state?.bookingId || sessionStorage.getItem("editBookingId");
    
    if (bookingId) {
      // Fetch existing booking to prefill form
      const fetchBooking = async () => {
        try {
          const { data } = await axios.get(`/api/bookings/${bookingId}`);
          if (data.success && data.booking) {
            const booking = data.booking;
            
            // Prefill form with booking data
            setFormData((prev) => ({
              ...prev,
              userDetails: {
                fullName: booking.userDetails?.fullName || user?.name || "",
                email: booking.userDetails?.email || user?.email || "",
                phone: booking.userDetails?.phone || "",
                dateOfBirth: booking.userDetails?.dateOfBirth ? booking.userDetails.dateOfBirth.split("T")[0] : "",
                nationality: booking.userDetails?.nationality || "",
                licenseNumber: booking.userDetails?.licenseNumber || "",
                licenseExpiry: booking.userDetails?.licenseExpiry ? booking.userDetails.licenseExpiry.split("T")[0] : "",
                licenseCountry: booking.userDetails?.licenseCountry || "",
              },
              pickupDetails: {
                address: booking.pickupDetails?.address || "",
                time: booking.pickupDetails?.time || "",
              },
              returnDetails: {
                address: booking.returnDetails?.address || "",
                time: booking.returnDetails?.time || "",
              },
              extras: {
                extraDriver: booking.extras?.extraDriver || false,
              },
              notes: booking.notes || "",
            }));
            
            // Clear edit booking ID from sessionStorage after use
            sessionStorage.removeItem("editBookingId");
          }
        } catch (error) {
          console.error("Failed to fetch booking for prefill:", error);
          // Continue with user profile prefill if booking fetch fails
        }
      };
      
      fetchBooking();
    }
    
    // Prefill from user profile if no booking ID or as fallback
    if (user) {
      setFormData((prev) => ({
        ...prev,
        userDetails: {
          ...prev.userDetails,
          fullName: prev.userDetails.fullName || user.name || "",
          email: prev.userDetails.email || user.email || "",
        },
      }));
    }
  }, [user, location.state, axios]);
  
  // Validate dates are present
  useEffect(() => {
    if (!pickupDate || !returnDate) {
      toast.error("Please select pickup and return dates");
      navigate(-1);
    }
  }, [pickupDate, returnDate, navigate]);
  
  // Handle form field changes
  const handleFieldChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    
    // Clear error for this field
    const errorKey = section === "userDetails" || section === "pickupDetails" || section === "returnDetails"
      ? `${section}.${field}`
      : field;
    
    if (errors[errorKey]) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: "",
      }));
    }
  };
  
  // Handle notes change (separate because it's not nested)
  const handleNotesChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      notes: value,
    }));
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Validate userDetails
    if (!formData.userDetails.fullName.trim()) {
      newErrors["userDetails.fullName"] = "Full name is required";
    }
    if (!formData.userDetails.email || !validateEmail(formData.userDetails.email)) {
      newErrors["userDetails.email"] = "Valid email is required";
    }
    if (!formData.userDetails.phone.trim()) {
      newErrors["userDetails.phone"] = "Phone number is required";
    }
    if (!formData.userDetails.dateOfBirth) {
      newErrors["userDetails.dateOfBirth"] = "Date of birth is required";
    } else if (!validateDate(formData.userDetails.dateOfBirth, false, true)) {
      newErrors["userDetails.dateOfBirth"] = "Date of birth must be in the past";
    }
    if (!formData.userDetails.nationality.trim()) {
      newErrors["userDetails.nationality"] = "Nationality is required";
    }
    if (!formData.userDetails.licenseNumber.trim()) {
      newErrors["userDetails.licenseNumber"] = "License number is required";
    }
    if (!formData.userDetails.licenseExpiry) {
      newErrors["userDetails.licenseExpiry"] = "License expiry date is required";
    } else if (!validateDate(formData.userDetails.licenseExpiry, true, false)) {
      newErrors["userDetails.licenseExpiry"] = "License expiry date must be in the future";
    }
    if (!formData.userDetails.licenseCountry.trim()) {
      newErrors["userDetails.licenseCountry"] = "License country is required";
    }
    
    // Validate pickupDetails
    if (!formData.pickupDetails.address.trim()) {
      newErrors["pickupDetails.address"] = "Pickup address is required";
    }
    if (!formData.pickupDetails.time || !validateTime(formData.pickupDetails.time)) {
      newErrors["pickupDetails.time"] = "Pickup time is required";
    }
    
    // Validate returnDetails
    if (!formData.returnDetails.address.trim()) {
      newErrors["returnDetails.address"] = "Return address is required";
    }
    if (!formData.returnDetails.time || !validateTime(formData.returnDetails.time)) {
      newErrors["returnDetails.time"] = "Return time is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data } = await axios.post("/api/bookings/create-details", {
        car: carId,
        pickupDate,
        returnDate,
        userDetails: formData.userDetails,
        pickupDetails: formData.pickupDetails,
        returnDetails: formData.returnDetails,
        extras: formData.extras,
        notes: formData.notes || "",
      });
      
      if (data.success) {
        toast.success("Booking details submitted successfully");
        navigate(`/booking-summary/${data.bookingId}`);
      } else {
        toast.error(data.message || "Failed to create booking");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to create booking. Please try again.";
      toast.error(errorMessage);
      
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach((err) => {
          backendErrors[err.path] = err.msg;
        });
        setErrors(backendErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading || !car) {
    return <Loader />;
  }
  
  if (!pickupDate || !returnDate) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-16">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 text-gray-500 cursor-pointer hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
        aria-label="Go back to previous page"
      >
        <img src={assets.arrow_icon} alt="" className="rotate-180 opacity-65" aria-hidden="true" />
        Back
      </button>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
        <p className="text-gray-500 mb-8">
          {car.brand} {car.model} • {pickupDate} to {returnDate}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          {/* User Identity Section */}
          <fieldset className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
            <legend className="text-xl font-semibold mb-4">User Identity</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="fullName" className="text-sm text-gray-600">
                  Full Name <span className="text-red-500" aria-label="required">*</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.userDetails.fullName}
                  onChange={(e) => handleFieldChange("userDetails", "fullName", e.target.value)}
                  className={`border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    errors["userDetails.fullName"] ? "border-red-500" : "border-borderColor"
                  }`}
                  required
                  aria-required="true"
                  aria-invalid={errors["userDetails.fullName"] ? "true" : "false"}
                  aria-describedby={errors["userDetails.fullName"] ? "fullName-error" : undefined}
                />
                {errors["userDetails.fullName"] && (
                  <p id="fullName-error" className="text-red-500 text-xs" role="alert">
                    {errors["userDetails.fullName"]}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm text-gray-600">
                  Email <span className="text-red-500" aria-label="required">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.userDetails.email}
                  onChange={(e) => handleFieldChange("userDetails", "email", e.target.value)}
                  disabled={!!user?.email}
                  className={`border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    errors["userDetails.email"] ? "border-red-500" : "border-borderColor"
                  } ${user?.email ? "bg-gray-100" : ""}`}
                  required
                  aria-required="true"
                  aria-invalid={errors["userDetails.email"] ? "true" : "false"}
                  aria-describedby={errors["userDetails.email"] ? "email-error" : undefined}
                />
                {errors["userDetails.email"] && (
                  <p id="email-error" className="text-red-500 text-xs" role="alert">
                    {errors["userDetails.email"]}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="text-sm text-gray-600">
                  Phone Number <span className="text-red-500" aria-label="required">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.userDetails.phone}
                  onChange={(e) => handleFieldChange("userDetails", "phone", e.target.value)}
                  className={`border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    errors["userDetails.phone"] ? "border-red-500" : "border-borderColor"
                  }`}
                  required
                  aria-required="true"
                  aria-invalid={errors["userDetails.phone"] ? "true" : "false"}
                  aria-describedby={errors["userDetails.phone"] ? "phone-error" : undefined}
                />
                {errors["userDetails.phone"] && (
                  <p id="phone-error" className="text-red-500 text-xs" role="alert">
                    {errors["userDetails.phone"]}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="dateOfBirth" className="text-sm text-gray-600">
                  Date of Birth <span className="text-red-500" aria-label="required">*</span>
                </label>
                <input
                  id="dateOfBirth"
                  type="date"
                  value={formData.userDetails.dateOfBirth}
                  onChange={(e) => handleFieldChange("userDetails", "dateOfBirth", e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className={`border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    errors["userDetails.dateOfBirth"] ? "border-red-500" : "border-borderColor"
                  }`}
                  required
                  aria-required="true"
                  aria-invalid={errors["userDetails.dateOfBirth"] ? "true" : "false"}
                  aria-describedby={errors["userDetails.dateOfBirth"] ? "dateOfBirth-error" : undefined}
                />
                {errors["userDetails.dateOfBirth"] && (
                  <p id="dateOfBirth-error" className="text-red-500 text-xs" role="alert">
                    {errors["userDetails.dateOfBirth"]}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="nationality" className="text-sm text-gray-600">
                  Nationality <span className="text-red-500" aria-label="required">*</span>
                </label>
                <input
                  id="nationality"
                  type="text"
                  value={formData.userDetails.nationality}
                  onChange={(e) => handleFieldChange("userDetails", "nationality", e.target.value)}
                  className={`border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    errors["userDetails.nationality"] ? "border-red-500" : "border-borderColor"
                  }`}
                  required
                  aria-required="true"
                  aria-invalid={errors["userDetails.nationality"] ? "true" : "false"}
                  aria-describedby={errors["userDetails.nationality"] ? "nationality-error" : undefined}
                />
                {errors["userDetails.nationality"] && (
                  <p id="nationality-error" className="text-red-500 text-xs" role="alert">
                    {errors["userDetails.nationality"]}
                  </p>
                )}
              </div>
            </div>
          </fieldset>
          
          {/* Driving License Section */}
          <fieldset className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
            <legend className="text-xl font-semibold mb-4">Driving License</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="licenseNumber" className="text-sm text-gray-600">
                  License Number <span className="text-red-500" aria-label="required">*</span>
                </label>
                <input
                  id="licenseNumber"
                  type="text"
                  value={formData.userDetails.licenseNumber}
                  onChange={(e) => handleFieldChange("userDetails", "licenseNumber", e.target.value)}
                  className={`border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    errors["userDetails.licenseNumber"] ? "border-red-500" : "border-borderColor"
                  }`}
                  required
                  aria-required="true"
                  aria-invalid={errors["userDetails.licenseNumber"] ? "true" : "false"}
                  aria-describedby={errors["userDetails.licenseNumber"] ? "licenseNumber-error" : undefined}
                />
                {errors["userDetails.licenseNumber"] && (
                  <p id="licenseNumber-error" className="text-red-500 text-xs" role="alert">
                    {errors["userDetails.licenseNumber"]}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="licenseExpiry" className="text-sm text-gray-600">
                  License Expiry Date <span className="text-red-500" aria-label="required">*</span>
                </label>
                <input
                  id="licenseExpiry"
                  type="date"
                  value={formData.userDetails.licenseExpiry}
                  onChange={(e) => handleFieldChange("userDetails", "licenseExpiry", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className={`border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    errors["userDetails.licenseExpiry"] ? "border-red-500" : "border-borderColor"
                  }`}
                  required
                  aria-required="true"
                  aria-invalid={errors["userDetails.licenseExpiry"] ? "true" : "false"}
                  aria-describedby={errors["userDetails.licenseExpiry"] ? "licenseExpiry-error" : undefined}
                />
                {errors["userDetails.licenseExpiry"] && (
                  <p id="licenseExpiry-error" className="text-red-500 text-xs" role="alert">
                    {errors["userDetails.licenseExpiry"]}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                <label htmlFor="licenseCountry" className="text-sm text-gray-600">
                  Country of Issue <span className="text-red-500" aria-label="required">*</span>
                </label>
                <input
                  id="licenseCountry"
                  type="text"
                  value={formData.userDetails.licenseCountry}
                  onChange={(e) => handleFieldChange("userDetails", "licenseCountry", e.target.value)}
                  className={`border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    errors["userDetails.licenseCountry"] ? "border-red-500" : "border-borderColor"
                  }`}
                  required
                  aria-required="true"
                  aria-invalid={errors["userDetails.licenseCountry"] ? "true" : "false"}
                  aria-describedby={errors["userDetails.licenseCountry"] ? "licenseCountry-error" : undefined}
                />
                {errors["userDetails.licenseCountry"] && (
                  <p id="licenseCountry-error" className="text-red-500 text-xs" role="alert">
                    {errors["userDetails.licenseCountry"]}
                  </p>
                )}
              </div>
            </div>
          </fieldset>
          
          {/* Pickup/Dropoff Details Section */}
          <fieldset className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
            <legend className="text-xl font-semibold mb-4">Pickup & Dropoff Details</legend>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Pickup</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="pickupAddress" className="text-sm text-gray-600">
                      Pickup Location <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    <select
                      id="pickupAddress"
                      value={formData.pickupDetails.address}
                      onChange={(e) => handleFieldChange("pickupDetails", "address", e.target.value)}
                      className={`border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        errors["pickupDetails.address"] ? "border-red-500" : "border-borderColor"
                      }`}
                      required
                      aria-required="true"
                      aria-invalid={errors["pickupDetails.address"] ? "true" : "false"}
                      aria-describedby={errors["pickupDetails.address"] ? "pickupAddress-error" : undefined}
                    >
                      <option value="">Select pickup location</option>
                      {locationOptions.map((location, index) => (
                        <option key={index} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    {errors["pickupDetails.address"] && (
                      <p id="pickupAddress-error" className="text-red-500 text-xs" role="alert">
                        {errors["pickupDetails.address"]}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label htmlFor="pickupTime" className="text-sm text-gray-600">
                      Pickup Time <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    <select
                      id="pickupTime"
                      value={formData.pickupDetails.time}
                      onChange={(e) => handleFieldChange("pickupDetails", "time", e.target.value)}
                      className={`border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        errors["pickupDetails.time"] ? "border-red-500" : "border-borderColor"
                      }`}
                      required
                      aria-required="true"
                      aria-invalid={errors["pickupDetails.time"] ? "true" : "false"}
                      aria-describedby={errors["pickupDetails.time"] ? "pickupTime-error" : undefined}
                    >
                      <option value="">Select time</option>
                      {TIME_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors["pickupDetails.time"] && (
                      <p id="pickupTime-error" className="text-red-500 text-xs" role="alert">
                        {errors["pickupDetails.time"]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Return</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="returnAddress" className="text-sm text-gray-600">
                      Return Location <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    <select
                      id="returnAddress"
                      value={formData.returnDetails.address}
                      onChange={(e) => handleFieldChange("returnDetails", "address", e.target.value)}
                      className={`border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        errors["returnDetails.address"] ? "border-red-500" : "border-borderColor"
                      }`}
                      required
                      aria-required="true"
                      aria-invalid={errors["returnDetails.address"] ? "true" : "false"}
                      aria-describedby={errors["returnDetails.address"] ? "returnAddress-error" : undefined}
                    >
                      <option value="">Select return location</option>
                      {locationOptions.map((location, index) => (
                        <option key={index} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                    {errors["returnDetails.address"] && (
                      <p id="returnAddress-error" className="text-red-500 text-xs" role="alert">
                        {errors["returnDetails.address"]}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label htmlFor="returnTime" className="text-sm text-gray-600">
                      Return Time <span className="text-red-500" aria-label="required">*</span>
                    </label>
                    <select
                      id="returnTime"
                      value={formData.returnDetails.time}
                      onChange={(e) => handleFieldChange("returnDetails", "time", e.target.value)}
                      className={`border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        errors["returnDetails.time"] ? "border-red-500" : "border-borderColor"
                      }`}
                      required
                      aria-required="true"
                      aria-invalid={errors["returnDetails.time"] ? "true" : "false"}
                      aria-describedby={errors["returnDetails.time"] ? "returnTime-error" : undefined}
                    >
                      <option value="">Select time</option>
                      {TIME_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors["returnDetails.time"] && (
                      <p id="returnTime-error" className="text-red-500 text-xs" role="alert">
                        {errors["returnDetails.time"]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
          
          {/* Extras Section */}
          <fieldset className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
            <legend className="text-xl font-semibold mb-4">Extras</legend>
            <div className="flex items-center gap-3">
              <input
                id="extraDriver"
                type="checkbox"
                checked={formData.extras.extraDriver}
                onChange={(e) => handleFieldChange("extras", "extraDriver", e.target.checked)}
                className="w-4 h-4 text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Add extra driver to booking"
              />
              <label htmlFor="extraDriver" className="text-sm text-gray-600">Extra Driver</label>
            </div>
          </fieldset>
          
          {/* Notes Section */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <label htmlFor="notes" className="sr-only">Additional notes or special requests</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={4}
              className="w-full border border-borderColor px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              placeholder="Any additional notes or special requests..."
              aria-label="Additional notes or special requests"
            />
          </div>
          
          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 border border-borderColor px-6 py-3 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Cancel and go back"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              aria-disabled={isSubmitting}
              aria-busy={isSubmitting}
              className={`flex-1 bg-primary hover:bg-primary-dull transition-all py-3 font-medium text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {isSubmitting ? "Submitting..." : "Continue to Summary"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingDetails;

