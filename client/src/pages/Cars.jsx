import React, { useEffect, useMemo, useState } from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CarCard from "../components/CarCard";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Cars = () => {
  const [searchParams] = useSearchParams();
  const pickupLocation = searchParams.get("pickupLocation");
  const pickupDate = searchParams.get("pickupDate");
  const returnDate = searchParams.get("returnDate");
  const isSearchData = Boolean(pickupLocation && pickupDate && returnDate);

  const { cars, axios } = useAppContext();

  // Base list (either all cars or available cars for a date/location)
  const [baseCars, setBaseCars] = useState([]);
  // What we actually render after filtering by the search box
  const [filteredCars, setFilteredCars] = useState([]);
  const [input, setInput] = useState("");

  // 1) When the page opens with search params, fetch availability
  useEffect(() => {
    const searchCarAvailability = async () => {
      try {
        const { data } = await axios.post("/api/bookings/check-availability", {
          location: pickupLocation,
          pickupDate,
          returnDate,
        });
        if (data.success) {
          setBaseCars(data.availableCars);
          if (data.availableCars.length === 0) toast("No cars available");
        } else {
          toast.error(data.message || "Failed to check availability");
          setBaseCars([]); // fail safe
        }
      } catch (err) {
        toast.error(err.message);
        setBaseCars([]);
      }
    };

    if (isSearchData) {
      searchCarAvailability();
    }
  }, [isSearchData, pickupLocation, pickupDate, returnDate, axios]);

  // 2) If there are NO search params, the base list is simply all cars from context
  useEffect(() => {
    if (!isSearchData) setBaseCars(cars);
  }, [isSearchData, cars]);

  // 3) Filter whenever the input or base list changes
  useEffect(() => {
    const q = input.trim().toLowerCase();

    if (!q) {
      setFilteredCars(baseCars);
      return;
    }

    const next = baseCars.filter((car) => {
      // be defensive — some fields could be undefined
      const brand = (car.brand || "").toLowerCase();
      const model = (car.model || "").toLowerCase();
      const category = (car.category || "").toLowerCase();
      const transmission = (car.transmission || "").toLowerCase();
      return (
        brand.includes(q) ||
        model.includes(q) ||
        category.includes(q) ||
        transmission.includes(q)
      );
    });

    setFilteredCars(next);
  }, [input, baseCars]);

  return (
    <div className="flex flex-col items-center py-20 bg-light max-md:px-4">
      <Title
        title="Available Cars"
        subTitle="Browse our selection of premium vehicles available for your next adventure"
      />

      <div className="flex items-center bg-white px-4 mt-6 max-w-140 w-full h-12 rounded-full shadow">
        <img src={assets.search_icon} alt="" className="w-4.5 h-4.5 mr-2" />
        <input
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="text"
          placeholder="Search by make, model or features"
          className="w-full h-full outline-none text-gray-500"
        />
        <img src={assets.filter_icon} alt="" className="w-4.5 h-4.5 ml-2" />
      </div>

      <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-10 w-full">
        <p className="text-gray-500 xl:px-20 max-w-7xl mx-auto">
          Showing {filteredCars.length} Cars
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4 xl:px-20 max-w-7xl mx-auto">
          {filteredCars.map((car) => (
            <div key={car._id}>
              <CarCard car={car} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cars;
