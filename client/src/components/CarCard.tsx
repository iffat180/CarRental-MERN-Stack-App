import React from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import { carImage } from "../utils/carImage";

const CarCard = ({ car }) => {
  const currency = import.meta.env.VITE_CURRENCY;

  // A real link: it is keyboard- and screen-reader-friendly with no extra ARIA, and its
  // accessible name is simply the card's visible text (WCAG "label in name").
  return (
    <Link
      to={`/car-details/${car._id}`}
      className="a4-fcard group h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#d3d8dd]">
        <img
          src={carImage(car.image)}
          alt={`${car.brand} ${car.model} ${car.year} - ${car.category}`}
          className="w-full h-full object-cover object-[center_62%] transition-transform duration-500 group-hover:scale-105"
        />

        {car.isAvailable && (
          <p className="absolute top-3 left-3 bg-primary/90 text-white text-xs px-2.5 py-1 rounded-full">
            Available Now
          </p>
        )}

        <div className="absolute bottom-3 right-3 bg-[#14181C]/85 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg">
          <span className="font-semibold">
            {currency}
            {car.pricePerDay}
          </span>
          <span className="text-sm text-white/80"> / day</span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-[15px] leading-snug">
              {car.brand} {car.model}
            </h3>
            <p className="text-muted-foreground text-sm">
              {car.category} • {car.year}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-y-2 text-gray-600">
          <div className="flex items-center text-sm text-muted-foreground">
            <img src={assets.users_icon} alt="" className="h-4 mr-2" aria-hidden="true" />
            <span>{car.seating_capacity} Seats</span>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <img src={assets.fuel_icon} alt="" className="h-4 mr-2" aria-hidden="true" />
            <span>{car.fuel_type}</span>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <img src={assets.car_icon} alt="" className="h-4 mr-2" aria-hidden="true" />
            <span>{car.transmission}</span>
          </div>

          <div className="flex items-center text-sm text-muted-foreground">
            <img src={assets.location_icon} alt="" className="h-4 mr-2" aria-hidden="true" />
            <span>{car.location}</span>
          </div>

          {/* MPG - fuel efficiency for trip cost estimation and AI reasoning */}
          {car.mpg && (
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="font-medium mr-1">MPG:</span>
              <span>{car.mpg}</span>
            </div>
          )}

          {/* Trunk capacity in liters - luggage space for trip suitability matching */}
          {car.trunk_capacity && (
            <div className="flex items-center text-sm text-muted-foreground">
              <span className="font-medium mr-1">Trunk (L):</span>
              <span>{car.trunk_capacity}</span>
            </div>
          )}
        </div>

        {/* Tags - semantic attributes for future AI similarity matching */}
        {(car.tags && car.tags.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(car.tags || []).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default CarCard;
