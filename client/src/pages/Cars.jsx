import React, { useEffect, useState, useCallback, useRef } from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CarCard from "../components/CarCard";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Cars = () => {
  const [searchParams] = useSearchParams();
  const pickupLocation = searchParams.get("pickupLocation");
  const pickupDate = searchParams.get("pickupDate");
  const returnDate = searchParams.get("returnDate");
  const searchParam = searchParams.get("search");
  const isSearchData = Boolean(pickupLocation && pickupDate && returnDate);

  const { cars, axios, fetchCars } = useAppContext();
  const navigate = useNavigate();

  // Base list (either all cars or available cars for a date/location)
  const [baseCars, setBaseCars] = useState([]);
  // What we actually render after filtering by the search box
  const [filteredCars, setFilteredCars] = useState([]);
  const [input, setInput] = useState(searchParam || "");
  
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(9); // 3x3 grid
  
  const debounceTimeoutRef = useRef(null);
  
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);
  
  // Validate cars array from context
  const isValidCarsArray = cars && Array.isArray(cars) && cars.length >= 0;

  // Search car availability function
  const searchCarAvailability = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axios.post("/api/bookings/check-availability", {
        location: pickupLocation,
        pickupDate,
        returnDate,
      });
      if (data.success) {
        setBaseCars(data.availableCars);
        setCurrentPage(1); // Reset to first page
        if (data.availableCars.length === 0) {
          toast("No cars available");
        }
      } else {
        const errorMessage = data.message || "Failed to check availability";
        setError(errorMessage);
        toast.error(errorMessage);
        setBaseCars([]); // fail safe
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to check availability";
      setError(errorMessage);
      toast.error(errorMessage);
      setBaseCars([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 1) When the page opens with search params, fetch availability
  useEffect(() => {
    if (isSearchData) {
      searchCarAvailability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearchData, pickupLocation, pickupDate, returnDate]);

  // 2) If there are NO search params, the base list is simply all cars from context
  useEffect(() => {
    if (!isSearchData) setBaseCars(cars);
  }, [isSearchData, cars]);

  // Sync search param from URL to input state
  useEffect(() => {
    if (searchParam && searchParam.trim()) {
      setInput(searchParam);
      resetPagination();
    }
  }, [searchParam, resetPagination]);

  // 3) Filter whenever the input or base list changes (with debounce)
  useEffect(() => {
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Validate cars array - only show error for actual context failure
    if (!isValidCarsArray) {
      setError("Cars data is not available");
      setFilteredCars([]);
      return;
    }
    
    // Debounce filtering
    debounceTimeoutRef.current = setTimeout(() => {
      const q = input.trim().toLowerCase();
      
      // Empty search shows all cars (no error, no pagination reset)
      if (!q) {
        setFilteredCars(baseCars);
        return;
      }
      
      // Reset pagination only for non-empty trimmed query (inside debounced block)
      resetPagination();
      
      const next = baseCars.filter((car) => {
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
    }, 300);
    
    // Cleanup timeout on unmount or dependency change
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [input, baseCars, isValidCarsArray, resetPagination, searchParam]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCars = filteredCars.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Filter chips and clear filters
  const hasActiveFilters = Boolean(pickupLocation || pickupDate || returnDate || input);

  const clearFilters = () => {
    setInput("");
    navigate("/cars");
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col items-center py-20 bg-light max-md:px-4">
      <Title
        title="Available Cars"
        subTitle="Browse our selection of premium vehicles available for your next adventure"
      />

      <div className="flex items-center bg-white px-4 mt-6 max-w-140 w-full h-12 rounded-full shadow">
        <label htmlFor="cars-search" className="sr-only">Search cars by make, model or features</label>
        <img src={assets.search_icon} alt="" className="w-4.5 h-4.5 mr-2" aria-hidden="true" />
        <input
          id="cars-search"
          onChange={(e) => setInput(e.target.value)}
          value={input}
          type="search"
          placeholder="Search by make, model or features"
          className="w-full h-full outline-none text-gray-500 focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          aria-label="Search cars by make, model or features"
        />
        <img src={assets.filter_icon} alt="" className="w-4.5 h-4.5 ml-2" aria-hidden="true" />
      </div>

      {/* Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-4 max-w-140 w-full">
          {pickupLocation && (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2">
              Location: {pickupLocation}
            </span>
          )}
          {pickupDate && (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2">
              Pickup: {new Date(pickupDate).toLocaleDateString()}
            </span>
          )}
          {returnDate && (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2">
              Return: {new Date(returnDate).toLocaleDateString()}
            </span>
          )}
          {input && (
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2">
              Search: {input}
            </span>
          )}
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="px-6 md:px-16 lg:px-24 xl:px-32 mt-10 w-full">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-gray-500">Loading available cars...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isValidCarsArray && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-500 text-lg mb-2">Error loading cars</p>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={() => {
                  if (typeof fetchCars === "function") {
                    fetchCars();
                  } else {
                    window.location.reload();
                  }
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dull"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredCars.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center">
              <p className="text-gray-500 text-lg mb-2">No cars found</p>
              <p className="text-gray-400 mb-4">
                {isSearchData
                  ? "Try adjusting your search criteria"
                  : "No cars available at the moment"}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dull"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cars Grid */}
        {!isLoading && !error && filteredCars.length > 0 && (
          <>
            <p className="text-gray-500 xl:px-20 max-w-7xl mx-auto">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredCars.length)} of {filteredCars.length} Cars
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-4 xl:px-20 max-w-7xl mx-auto">
              {paginatedCars.map((car) => (
                <div key={car._id}>
                  <CarCard car={car} />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  aria-disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary-dull"
                  }`}
                  aria-label="Go to previous page"
                >
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      aria-label={`Go to page ${page}`}
                      aria-current={currentPage === page ? "page" : undefined}
                      className={`px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        currentPage === page
                          ? "bg-primary text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  aria-disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary-dull"
                  }`}
                  aria-label="Go to next page"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Cars;
