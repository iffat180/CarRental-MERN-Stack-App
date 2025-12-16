import React, { useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

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

const Hero = () => {
  const [pickupLocation, setPickupLocation] = useState("");
  const [cities, setCities] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [dateErrors, setDateErrors] = useState({
    pickupDate: "",
    returnDate: "",
    general: "",
  });

  const { pickupDate, setPickupDate, returnDate, setReturnDate, navigate, axios } =
    useAppContext();

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

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Validate dates
    const validation = validateDates(pickupDate, returnDate);
    
    if (!validation.isValid) {
      setDateErrors(validation.errors);
      return;
    }
    
    // Clear errors if valid
    setDateErrors({ pickupDate: "", returnDate: "", general: "" });
    
    navigate(
      "/cars?pickupLocation=" +
        pickupLocation +
        "&pickupDate=" +
        pickupDate +
        "&returnDate=" +
        returnDate
    );
  };

  // Fetch cities on component mount
  useEffect(() => {
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const { data } = await axios.get("/api/user/cities");
        if (data.success) {
          setCities(data.cities);
        }
      } catch (error) {
        console.error("Failed to fetch cities:", error);
        // Fallback to empty array if fetch fails
        setCities([]);
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, [axios]);

  return (
    <section className="h-screen flex flex-col items-center justify-center gap-14 bg-light text-center" aria-labelledby="hero-title">
      <h1 id="hero-title" className="text-4xl md:text-5xl font-semibold">
        Luxury Cars On Rent
      </h1>

      <form
        onSubmit={handleSearch}
        className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-lg md:rounded-full w-full max-w-80 md:max-w-200 bg-white shadow-[0px_8px_20px_rgba(0,0,0,0.1)]"
        aria-label="Search for available cars"
        noValidate
      >
        <fieldset className="flex flex-col md:flex-row items-start md:items-center gap-10 min-md:ml-8 border-0 p-0 m-0">
          <legend className="sr-only">Search criteria</legend>
          <div className="flex flex-col items-start gap-2">
            <label htmlFor="hero-pickup-location" className="sr-only">Pickup Location</label>
            <select
              id="hero-pickup-location"
              required
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              disabled={isLoadingCities}
              aria-required="true"
              aria-busy={isLoadingCities}
              aria-label="Select pickup location"
              className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            >
              <option value="">Pickup Location</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <p className="px-1 text-sm text-gray-500" aria-live="polite">
              {pickupLocation ? pickupLocation : "Please select location"}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2">
            <label htmlFor="hero-pickup-date">Pick-up Date <span className="text-red-500" aria-label="required">*</span></label>
            <input
              value={pickupDate}
              onChange={handlePickupDateChange}
              type="date"
              id="hero-pickup-date"
              min={new Date().toISOString().split("T")[0]}
              className={`text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded ${
                dateErrors.pickupDate ? "border-red-500" : ""
              }`}
              required
              aria-required="true"
              aria-invalid={dateErrors.pickupDate ? "true" : "false"}
              aria-describedby={dateErrors.pickupDate ? "pickup-date-error" : undefined}
            />
            {dateErrors.pickupDate && (
              <p id="pickup-date-error" className="text-red-500 text-xs" role="alert">
                {dateErrors.pickupDate}
              </p>
            )}
          </div>

          <div className="flex flex-col items-start gap-2">
            <label htmlFor="hero-return-date">Return Date <span className="text-red-500" aria-label="required">*</span></label>
            <input
              value={returnDate}
              onChange={handleReturnDateChange}
              type="date"
              id="hero-return-date"
              min={pickupDate || new Date().toISOString().split("T")[0]}
              className={`text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded ${
                dateErrors.returnDate ? "border-red-500" : ""
              }`}
              required
              aria-required="true"
              aria-invalid={dateErrors.returnDate ? "true" : "false"}
              aria-describedby={dateErrors.returnDate ? "return-date-error" : dateErrors.general ? "date-general-error" : undefined}
            />
            {dateErrors.returnDate && (
              <p id="return-date-error" className="text-red-500 text-xs" role="alert">
                {dateErrors.returnDate}
              </p>
            )}
          </div>
        </fieldset>
        <div className="flex flex-col items-center gap-2">
          <button
            type="submit"
            disabled={
              !pickupDate ||
              !returnDate ||
              !pickupLocation ||
              !validateDates(pickupDate, returnDate).isValid
            }
            aria-disabled={
              !pickupDate ||
              !returnDate ||
              !pickupLocation ||
              !validateDates(pickupDate, returnDate).isValid
            }
            className={`flex items-center justify-center gap-1 px-9 py-3 max-sm:mt-4 bg-primary hover:bg-primary-dull text-white rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              !pickupDate ||
              !returnDate ||
              !pickupLocation ||
              !validateDates(pickupDate, returnDate).isValid
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
          >
            <img
              src={assets.search_icon}
              alt=""
              className="brightness-300"
              aria-hidden="true"
            />
            Search
          </button>
          {dateErrors.general && (
            <p id="date-general-error" className="text-red-500 text-xs" role="alert">
              {dateErrors.general}
            </p>
          )}
        </div>
      </form>

      <img src={assets.main_car} alt="Luxury car available for rent" className="max-h-74" />
    </section>
  );
};

export default Hero;
