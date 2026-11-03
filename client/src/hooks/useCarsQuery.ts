import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { Car } from "../types";

export const CARS_QUERY_KEY = ["cars"] as const;

/** The cars list is public and changes rarely: treat it as fresh for 5 minutes. */
export const CARS_STALE_TIME = 5 * 60 * 1000;

export const fetchAllCars = async (): Promise<Car[]> => {
  const { data } = await axios.get("/api/user/cars");
  if (!data.success) throw new Error(data.message || "Failed to fetch cars");
  return data.cars as Car[];
};

/**
 * All cars, cached by TanStack Query. Every component that calls this shares one
 * request and one cached result, and the list is only refetched once it is older
 * than CARS_STALE_TIME (or when fetchCars/refetch is called).
 */
export const useCarsQuery = () =>
  useQuery({
    queryKey: CARS_QUERY_KEY,
    queryFn: fetchAllCars,
    staleTime: CARS_STALE_TIME,
  });
