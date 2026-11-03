import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { assets } from "../assets/assets";
import Loader from "../components/Loader";
import FormField from "../components/FormField";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";
import { getLocationsForCity } from "../utils/locationData";
import {
  bookingDetailsSchema,
  bookingToFormValues,
  emptyBookingForm,
  toLocalISODate,
  type BookingDetailsForm,
} from "../schemas/bookingDetails";
import type { Car } from "../types";

// Generate time options for dropdown (8:00 AM to 10:00 PM in 30-minute intervals)
const generateTimeOptions = () => {
  const options: { value: string; label: string }[] = [];
  for (let hour = 8; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time24 = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? "PM" : "AM";
      const display =
        minute === 0
          ? `${hour12}:00 ${ampm}`
          : `${hour12}:${minute.toString().padStart(2, "0")} ${ampm}`;
      options.push({ value: time24, label: display });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

const BookingDetails = () => {
  const { carId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const pickupDateParam = searchParams.get("pickupDate");
  const returnDateParam = searchParams.get("returnDate");

  const {
    cars,
    carsLoading,
    axios,
    user,
    navigate,
    pickupDate: contextPickupDate,
    returnDate: contextReturnDate,
  } = useAppContext();

  const [car, setCar] = useState<Car | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationOptions, setLocationOptions] = useState<any[]>([]);

  // Use params if available, otherwise fallback to context
  const pickupDate = pickupDateParam || contextPickupDate;
  const returnDate = returnDateParam || contextReturnDate;

  // The form: React Hook Form keeps the values and the errors, and the zod schema
  // (schemas/bookingDetails.ts) decides what is valid.
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BookingDetailsForm>({
    resolver: zodResolver(bookingDetailsSchema),
    defaultValues: emptyBookingForm,
  });

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
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || error.message || "Failed to load car details";
        toast.error(errorMessage);
        navigate("/cars");
      } finally {
        setIsLoading(false);
      }
    };

    // On a fresh page load the cars list is still arriving. Wait for it, otherwise we
    // would not find the car there and make a second request for nothing.
    if (carId && !carsLoading) {
      fetchCar();
    }
  }, [carId, cars, carsLoading, axios, navigate]);

  // Prefill form data from an existing booking (when editing) or the user profile
  useEffect(() => {
    const bookingId = location.state?.bookingId || sessionStorage.getItem("editBookingId");

    if (bookingId) {
      const fetchBooking = async () => {
        try {
          const { data } = await axios.get(`/api/bookings/${bookingId}`);
          if (data.success && data.booking) {
            reset(bookingToFormValues(data.booking, user));
            // Clear edit booking ID from sessionStorage after use
            sessionStorage.removeItem("editBookingId");
          }
        } catch (error: any) {
          console.error("Failed to fetch booking for prefill:", error);
          // Continue with user profile prefill if booking fetch fails
        }
      };

      fetchBooking();
    }

    // Prefill name and email from the profile without overwriting what is typed
    if (user) {
      if (!getValues("userDetails.fullName")) setValue("userDetails.fullName", user.name || "");
      if (!getValues("userDetails.email")) setValue("userDetails.email", user.email || "");
    }
  }, [user, location.state, axios, reset, getValues, setValue]);

  // Validate dates are present
  useEffect(() => {
    if (!pickupDate || !returnDate) {
      toast.error("Please select pickup and return dates");
      navigate(-1);
    }
  }, [pickupDate, returnDate, navigate]);

  // Runs only when the schema accepts the form
  const onValid = async (values: BookingDetailsForm) => {
    try {
      const { data } = await axios.post("/api/bookings/create-details", {
        car: carId,
        pickupDate,
        returnDate,
        userDetails: values.userDetails,
        pickupDetails: values.pickupDetails,
        returnDetails: values.returnDetails,
        extras: values.extras,
        notes: values.notes || "",
      });

      if (data.success) {
        toast.success("Booking details submitted successfully");
        navigate(`/booking-summary/${data.bookingId}`);
      } else {
        toast.error(data.message || "Failed to create booking");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create booking. Please try again.";
      toast.error(errorMessage);

      // Show the server's field errors next to the fields (paths like "userDetails.phone")
      error.response?.data?.errors?.forEach((err: { path: any; msg: string }) => {
        setError(err.path, { type: "server", message: err.msg });
      });
    }
  };

  const onInvalid = () => toast.error("Please correct the errors in the form");

  if (isLoading || !car) {
    return <Loader />;
  }

  if (!pickupDate || !returnDate) {
    return null; // Will redirect in useEffect
  }

  const today = toLocalISODate(new Date());
  const user$ = errors.userDetails;
  const pickup$ = errors.pickupDetails;
  const return$ = errors.returnDetails;

  return (
    <div className="a4-page">
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

        <form onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-8" noValidate>
          {/* User Identity Section */}
          <fieldset className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
            <legend className="text-xl font-semibold mb-4">User Identity</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField id="fullName" label="Full Name" required error={user$?.fullName?.message}>
                {(a) => <input type="text" {...a} {...register("userDetails.fullName")} />}
              </FormField>

              <FormField id="email" label="Email" required error={user$?.email?.message}>
                {(a) => (
                  <input
                    type="email"
                    {...a}
                    {...register("userDetails.email")}
                    // read-only, not disabled: a disabled field would not be submitted
                    readOnly={!!user?.email}
                    aria-readonly={user?.email ? "true" : undefined}
                    className={`${a.className} ${user?.email ? "bg-gray-100" : ""}`}
                  />
                )}
              </FormField>

              <FormField id="phone" label="Phone Number" required error={user$?.phone?.message}>
                {(a) => <input type="tel" {...a} {...register("userDetails.phone")} />}
              </FormField>

              <FormField
                id="dateOfBirth"
                label="Date of Birth"
                required
                error={user$?.dateOfBirth?.message}
              >
                {(a) => (
                  <input type="date" max={today} {...a} {...register("userDetails.dateOfBirth")} />
                )}
              </FormField>

              <FormField
                id="nationality"
                label="Nationality"
                required
                error={user$?.nationality?.message}
              >
                {(a) => <input type="text" {...a} {...register("userDetails.nationality")} />}
              </FormField>
            </div>
          </fieldset>

          {/* Driving License Section */}
          <fieldset className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
            <legend className="text-xl font-semibold mb-4">Driving License</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                id="licenseNumber"
                label="License Number"
                required
                error={user$?.licenseNumber?.message}
              >
                {(a) => <input type="text" {...a} {...register("userDetails.licenseNumber")} />}
              </FormField>

              <FormField
                id="licenseExpiry"
                label="License Expiry Date"
                required
                error={user$?.licenseExpiry?.message}
              >
                {(a) => (
                  <input
                    type="date"
                    min={today}
                    {...a}
                    {...register("userDetails.licenseExpiry")}
                  />
                )}
              </FormField>

              <FormField
                id="licenseCountry"
                label="Country of Issue"
                required
                error={user$?.licenseCountry?.message}
              >
                {(a) => <input type="text" {...a} {...register("userDetails.licenseCountry")} />}
              </FormField>
            </div>
          </fieldset>

          {/* Pickup/Dropoff Details Section */}
          <fieldset className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
            <legend className="text-xl font-semibold mb-4">Pickup & Dropoff Details</legend>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Pickup</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="pickupAddress"
                    label="Pickup Location"
                    required
                    error={pickup$?.address?.message}
                  >
                    {(a) => (
                      <select {...a} {...register("pickupDetails.address")}>
                        <option value="">Select pickup location</option>
                        {locationOptions.map((place, index) => (
                          <option key={index} value={place}>
                            {place}
                          </option>
                        ))}
                      </select>
                    )}
                  </FormField>

                  <FormField
                    id="pickupTime"
                    label="Pickup Time"
                    required
                    error={pickup$?.time?.message}
                  >
                    {(a) => (
                      <select {...a} {...register("pickupDetails.time")}>
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </FormField>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Return</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="returnAddress"
                    label="Return Location"
                    required
                    error={return$?.address?.message}
                  >
                    {(a) => (
                      <select {...a} {...register("returnDetails.address")}>
                        <option value="">Select return location</option>
                        {locationOptions.map((place, index) => (
                          <option key={index} value={place}>
                            {place}
                          </option>
                        ))}
                      </select>
                    )}
                  </FormField>

                  <FormField
                    id="returnTime"
                    label="Return Time"
                    required
                    error={return$?.time?.message}
                  >
                    {(a) => (
                      <select {...a} {...register("returnDetails.time")}>
                        <option value="">Select time</option>
                        {TIME_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </FormField>
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
                {...register("extras.extraDriver")}
                className="w-4 h-4 text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Add extra driver to booking"
              />
              <label htmlFor="extraDriver" className="text-sm text-gray-600">
                Extra Driver
              </label>
            </div>
          </fieldset>

          {/* Notes Section */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-borderColor">
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <label htmlFor="notes" className="sr-only">
              Additional notes or special requests
            </label>
            <textarea
              id="notes"
              {...register("notes")}
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
