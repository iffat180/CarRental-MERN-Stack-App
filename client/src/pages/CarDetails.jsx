import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

// Date validation utility function
const validateDates = (pickupDate, returnDate) => {
  const errors = { pickupDate: "", returnDate: "", general: "" };
  
  if (!pickupDate || !returnDate) {
    return { isValid: false, errors };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const pickup = new Date(pickupDate);
  pickup.setHours(0, 0, 0, 0);
  
  const returnD = new Date(returnDate);
  returnD.setHours(0, 0, 0, 0);
  
  // Check if pickup date is in the past
  if (pickup < today) {
    errors.pickupDate = "Pickup date cannot be in the past";
  }
  
  // Check if return date is after pickup date
  if (returnD <= pickup) {
    errors.returnDate = "Return date must be after pickup date";
    errors.general = "Minimum rental period is 1 day";
  } else {
    // Check minimum rental period (1 day)
    const days = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24));
    if (days < 1) {
      errors.general = "Minimum rental period is 1 day";
    }
  }
  
  return {
    isValid: !errors.pickupDate && !errors.returnDate && !errors.general,
    errors,
  };
};

const CarDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const { cars, pickupDate, setPickupDate, returnDate, setReturnDate, user, setShowLoginRequired } =
    useAppContext();
  const navigate = useNavigate(); 
  const [car, setCar] = useState(null);
  const [dateErrors, setDateErrors] = useState({
    pickupDate: "",
    returnDate: "",
    general: "",
  });
  const currency = import.meta.env.VITE_CURRENCY;
  
  // Restore dates from query params on mount (only if not already set in context)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const pickupDateParam = searchParams.get("pickupDate");
    const returnDateParam = searchParams.get("returnDate");
    
    // Only set from URL params if context dates are empty (preserve valid context defaults)
    if (pickupDateParam && !pickupDate) {
      setPickupDate(pickupDateParam);
    }
    if (returnDateParam && !returnDate) {
      setReturnDate(returnDateParam);
    }
    
    // Validate dates if both are present (use URL params if available, otherwise context)
    const effectivePickupDate = pickupDateParam || pickupDate;
    const effectiveReturnDate = returnDateParam || returnDate;
    
    if (effectivePickupDate && effectiveReturnDate) {
      const validation = validateDates(effectivePickupDate, effectiveReturnDate);
      setDateErrors(validation.errors);
    }
  }, [id, location.search, setPickupDate, setReturnDate, pickupDate, returnDate]);

  // Real-time validation handlers
  const handlePickupDateChange = (e) => {
    const value = e.target.value;
    setPickupDate(value);
    
    // Validate when both dates are present
    if (value && returnDate) {
      const validation = validateDates(value, returnDate);
      setDateErrors(validation.errors);
    } else {
      setDateErrors({ pickupDate: "", returnDate: "", general: "" });
    }
  };

  const handleReturnDateChange = (e) => {
    const value = e.target.value;
    setReturnDate(value);
    
    // Validate when both dates are present
    if (pickupDate && value) {
      const validation = validateDates(pickupDate, value);
      setDateErrors(validation.errors);
    } else {
      setDateErrors({ pickupDate: "", returnDate: "", general: "" });
    }
  };

  const handleBookNow = () => {
    // Validate dates first
    const validation = validateDates(pickupDate, returnDate);
    
    if (!validation.isValid) {
      setDateErrors(validation.errors);
      toast.error("Please correct the date errors before booking");
      return;
    }
    
    // Clear errors if valid
    setDateErrors({ pickupDate: "", returnDate: "", general: "" });
    
    // Check if user is logged in
    if (!user) {
      // Store current path with query params for redirect after login
      const queryParams = new URLSearchParams({
        pickupDate,
        returnDate,
      });
      const currentPath = `/car-details/${id}?${queryParams.toString()}`;
      sessionStorage.setItem("redirectPath", currentPath);
      
      // Show LoginRequiredModal if not logged in
      setShowLoginRequired(true);
      return;
    }
    
    // If logged in, redirect to booking details page with query params
    const queryParams = new URLSearchParams({
      pickupDate,
      returnDate,
    });
    navigate(`/booking-details/${id}?${queryParams.toString()}`);
  };

  useEffect(() => {
    setCar(cars.find((c) => c._id == id));
  }, [cars, id]);

  return car ? (
    <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-16">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 text-gray-500 cursor-pointer"
      >
        <img src={assets.arrow_icon} alt="" className="rotate-180 opacity-65" />
        Back to all cars
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left: Car Image & Details */}
        <div className="lg:col-span-2">
          <img
            src={car.image}
            alt=""
            className="w-full h-auto md:max-h-100 object-cover rounded-xl mb-6 shadow-md"
          />
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">
                {car.brand} {car.model}
              </h1>
              <p className="text-gray-500 text-lg">
                {car.category} • {car.year}
              </p>
            </div>

            {/* Capacity Specs - MPG, Trunk, Tags for AI reasoning and trip suitability */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
              {/* MPG - fuel efficiency for trip cost estimation */}
              {car.mpg && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">MPG</p>
                  <p className="text-lg font-semibold">{car.mpg}</p>
                </div>
              )}

              {/* Trunk capacity in liters - luggage space for trip suitability */}
              {car.trunk_capacity && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Trunk (L)</p>
                  <p className="text-lg font-semibold">{car.trunk_capacity}</p>
                </div>
              )}

              {/* Seating capacity already shown elsewhere, but keeping for consistency */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Seats</p>
                <p className="text-lg font-semibold">{car.seating_capacity}</p>
              </div>
            </div>

            {/* Tags - semantic attributes for future AI similarity matching */}
            {(car.tags && car.tags.length > 0) && (
              <div className="pt-2">
                <p className="text-sm text-gray-500 mb-2">Features & Tags</p>
                <div className="flex flex-wrap gap-2">
                  {(car.tags || []).map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <hr className="border-borderColor my-6" />

          {/* Description */}
          <div>
            <h1 className="text-xl font-medium mb-3">Description</h1>
            <p className="text-gray-500">{car.description}</p>
          </div>

          {/* Features */}
          <div>
            <h1 className="text-xl font-medium mb-3">Features</h1>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "360 Camera",
                "Bluetooth",
                "GPS",
                "Heated Seats",
                "Rear View Mirror",
              ].map((item) => (
                <li key={item} className="flex items-center text-gray-500">
                  <img src={assets.check_icon} className="h-4 mr-2" alt="" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Booking Form */}
        <div className="shadow-lg h-max sticky top-18 rounded-xl p-6 space-y-6 text-gray-500">
          <p className="flex items-center justify-between text-2xl text-gray-800 font-semibold">
            {currency}
            {car.pricePerDay}
            <span className="text-base text-gray-400 font-normal">per day</span>
          </p>

          <hr className="border-borderColor my-6" />

          <div className="flex flex-col gap-2">
            <label htmlFor="pickup-date">Pickup Date</label>
            <input
              value={pickupDate}
              onChange={handlePickupDateChange}
              type="date"
              className={`border px-3 py-2 rounded-lg ${
                dateErrors.pickupDate ? "border-red-500" : "border-borderColor"
              }`}
              required
              id="pickup-date"
              min={new Date().toISOString().split("T")[0]}
            />
            {dateErrors.pickupDate && (
              <p className="text-red-500 text-xs">{dateErrors.pickupDate}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="return-date">Return Date</label>
            <input
              value={returnDate}
              onChange={handleReturnDateChange}
              type="date"
              className={`border px-3 py-2 rounded-lg ${
                dateErrors.returnDate ? "border-red-500" : "border-borderColor"
              }`}
              required
              id="return-date"
              min={pickupDate || new Date().toISOString().split("T")[0]}
            />
            {dateErrors.returnDate && (
              <p className="text-red-500 text-xs">{dateErrors.returnDate}</p>
            )}
          </div>
          {dateErrors.general && (
            <p className="text-red-500 text-sm">{dateErrors.general}</p>
          )}
          <button
            type="button"
            onClick={handleBookNow}
            disabled={!pickupDate || !returnDate || !validateDates(pickupDate, returnDate).isValid}
            className={`w-full bg-primary hover:bg-primary-dull transition-all py-3 font-medium text-white rounded-xl ${
              !pickupDate || !returnDate || !validateDates(pickupDate, returnDate).isValid
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
          >
            Book Now
          </button>

          <p className="text-center text-sm">
            No credit card required to reserve
          </p>
        </div>
      </div>
    </div>
  ) : (
    <Loader />
  );
};

export default CarDetails;
