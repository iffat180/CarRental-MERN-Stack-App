import React, { type ReactNode } from "react";
import { AppContext } from "../context/AppContext";

const car = (_id: string, brand: string, model: string, extra: Record<string, unknown> = {}) => ({
  _id,
  brand,
  model,
  image: `https://d3c38yoff69w1u.cloudfront.net/cars/${_id}.jpg`,
  year: 2023,
  category: "SUV",
  seating_capacity: 5,
  fuel_type: "Petrol",
  transmission: "Automatic",
  pricePerDay: 95,
  location: "Denver",
  description: "",
  mpg: 29,
  trunk_capacity: 850,
  tags: [],
  isAvailable: true,
  ...extra,
});

/** The same models the slider has cut-outs for, plus a van and a truck. */
export const MOCK_CARS = [
  car("car17", "Subaru", "Outback"),
  car("car14", "Mazda", "MX-5 Miata", {
    category: "Convertible",
    seating_capacity: 2,
    location: "Los Angeles",
    trunk_capacity: 130,
  }),
  car("car15", "Mercedes-Benz", "E-Class", {
    category: "Sedan",
    location: "New York",
    pricePerDay: 180,
  }),
  car("car12", "KIA", "EV9", { seating_capacity: 7, location: "Chicago", pricePerDay: 135 }),
  car("car13", "Toyota", "Prius", {
    category: "Sedan",
    location: "San Francisco",
    pricePerDay: 55,
    mpg: 54,
  }),
  car("car16", "Dodge", "Grand Caravan", {
    category: "Van",
    seating_capacity: 7,
    location: "Chicago",
    pricePerDay: 85,
  }),
];

/** A stand-in for the app's context, so components that read it can be shown on their own. */
export const MockApp = ({
  children,
  loggedIn = false,
}: {
  children: ReactNode;
  loggedIn?: boolean;
}) => {
  const noop = () => {};
  const value: any = {
    cars: MOCK_CARS,
    carsLoading: false,
    currency: "$",
    user: loggedIn
      ? { _id: "u1", name: "Demo User", email: "demo@example.com", role: "user" }
      : null,
    isOwner: false,
    token: null,
    navigate: noop,
    setShowLogin: noop,
    setPickupDate: noop,
    setReturnDate: noop,
    logout: noop,
    upgradeToOwner: async () => ({ success: true }),
    axios: {
      get: async () => ({ data: { success: true, cities: ["Chicago", "Denver", "Los Angeles"] } }),
      post: async () => ({ data: { success: true, recommendations: [] } }),
    },
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
