import React from "react";
import Title from "./Title";
import { useNavigate } from "react-router-dom";
import CarCard from "./CarCard";
import { assets } from "../assets/assets";
import { use } from "react";
import { useAppContext } from "../context/AppContext";

const FeaturedSection = () => {
  const navigate = useNavigate();
  const {cars} = useAppContext();

  return (
    <div className="flex flex-col items-center py-24 px-6 md:px-16 lg:px-24 xl:px-32">
      <div>
        <Title
          title="Featured Vehicles"
          subTitle="Explore our selection of premium vehicles available for your next adventure."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-18">
        {cars.slice(0,6).map((car) => (
          <div key={car._id}>
            <CarCard car={car} />
          </div>
        ))}
      </div>

      <button
        onClick={() => {
          navigate("/cars");
          scrollTo(0, 0);
        }}
        className="flex items-center justify-center gap-2 px-6 py-2 border border-borderColor hover:bg-gray-50 rounded-md mt-18 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Explore all available cars"
      >
        Explore all cars
        <img src={assets.arrow_icon} alt="" aria-hidden="true" />
      </button>
    </div>
  );
};

export default FeaturedSection;
