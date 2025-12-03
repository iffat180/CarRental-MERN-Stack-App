import { createContext, useContext } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

// ============================================
// Token Utility Functions
// ============================================

const decodeToken = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    
    // Protect against prototype pollution (JWT payloads should be simple objects)
    if (decoded && typeof decoded === 'object' && !Array.isArray(decoded)) {
      if (Object.prototype.hasOwnProperty.call(decoded, '__proto__') || 
          Object.prototype.hasOwnProperty.call(decoded, 'constructor') ||
          Object.prototype.hasOwnProperty.call(decoded, 'prototype')) {
        return null; // Reject token with suspicious payload
      }
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

const getTokenExpiryTime = (token) => {
  if (!token) return null;
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  return decoded.exp * 1000; // Convert to milliseconds
};

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY;

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showLoginRequired, setShowLoginRequired] = useState(false);
  const [showOwnerOnboarding, setShowOwnerOnboarding] = useState(false);
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const [cars, setCars] = useState([]);
  
  // Request state management
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [isFetchingCars, setIsFetchingCars] = useState(false);
  const [carsCacheTimestamp, setCarsCacheTimestamp] = useState(null);
  const CARS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
  // Use ref to access latest token in handleTokenExpiry
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Function to handle token expiry
  const handleTokenExpiry = useCallback(() => {
    // Remove expired token from localStorage
    localStorage.removeItem("token");
    
    // Clear token state
    setToken(null);
    
    // Clear user data
    setUser(null);
    setIsOwner(false);
    
    // Clear axios authorization header
    delete axios.defaults.headers.common["Authorization"];
    
    // Show notification
    toast.error("Your session has expired. Please login again.");
    
    // Navigate to home
    navigate("/");
  }, [navigate]);

  // Function to check if user is logged in
  const fetchUser = async () => {
    // Check if already fetching
    if (isFetchingUser) return;
    
    // Check token expiry before API call
    if (!token || isTokenExpired(token)) {
      handleTokenExpiry();
      return;
    }
    
    setIsFetchingUser(true);
    try {
      const { data } = await axios.get("/api/user/data");
      if (data.success) {
        setUser(data.user);
        setIsOwner(data.user.role === "owner");
      } else {
        navigate("/");
      }
    } catch (error) {
      // Handle 401 (Unauthorized) - token expired or invalid
      if (error.response?.status === 401) {
        handleTokenExpiry();
      } else {
        toast.error(error.response?.data?.message || error.message || "Failed to fetch user data");
      }
    } finally {
      setIsFetchingUser(false);
    }
  };

  // Function to fetch all cars from the server
  const fetchCars = async () => {
    // Check cache validity
    const now = Date.now();
    if (carsCacheTimestamp && (now - carsCacheTimestamp) < CARS_CACHE_DURATION) {
      return; // Use cached data
    }
    
    // Check if already fetching
    if (isFetchingCars) return;
    
    setIsFetchingCars(true);
    try {
      const { data } = await axios.get("/api/user/cars");
      if (data.success) {
        setCars(data.cars);
        setCarsCacheTimestamp(now);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      // Handle 401 (Unauthorized) - token expired or invalid
      if (error.response?.status === 401) {
        handleTokenExpiry();
      } else {
        toast.error(error.response?.data?.message || error.message || "Failed to fetch cars");
      }
    } finally {
      setIsFetchingCars(false);
    }
  };

  // Function to handle user logout
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsOwner(false);
    
    // Clear redirectPath to prevent redirect loops or state leakage
    sessionStorage.removeItem("redirectPath");
    
    // Clear axios authorization header (FIX: was setting it after clearing token)
    delete axios.defaults.headers.common["Authorization"];
    
    navigate("/");
    toast.success("Logged out successfully");
  };

  // Function to upgrade user to owner
  const upgradeToOwner = async () => {
    try {
      const { data } = await axios.post("/api/user/upgrade-to-owner");
      
      if (data.success) {
        // Update user in context with new role
        setUser(data.user);
        setIsOwner(true);
        return { success: true, user: data.user };
      } else {
        throw new Error(data.message || "Failed to upgrade to owner");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to upgrade to owner";
      throw new Error(errorMessage);
    }
  };

  // Helper function to check if error is booking-related
  const isBookingRelatedError = (error) => {
    const requestUrl = error.config?.url || "";
    return requestUrl.includes("/api/bookings/");
  };

  // Axios response interceptor for smart 401 handling
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          const currentToken = tokenRef.current || localStorage.getItem("token");
          
          // Check if token exists and is expired
          if (currentToken && isTokenExpired(currentToken)) {
            // Token expired - handle normally (show toast, navigate home)
            handleTokenExpiry();
          } else if (isBookingRelatedError(error)) {
            // Booking-related 401 but token is not expired (user not logged in)
            // Store current location for redirect after login
            const currentPath = window.location.pathname + window.location.search;
            sessionStorage.setItem("redirectPath", currentPath);
            
            // Show LoginRequiredModal instead of toast
            setShowLoginRequired(true);
          }
          // For non-booking 401 without expired token, let it fail normally
          // (components can handle their own login prompts)
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [handleTokenExpiry]);

  // useEffect to retrieve the token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    
    // Validate token before setting it
    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
    } else if (storedToken) {
      // Token exists but is expired - remove it
      localStorage.removeItem("token");
      toast.error("Your session has expired. Please login again.");
    }
    
    // Fetch cars (public endpoint, doesn't require token)
    fetchCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect to fetch user data when token is available
  useEffect(() => {
    if (token) {
      // Validate token before using it
      if (isTokenExpired(token)) {
        handleTokenExpiry();
        return;
      }
      
      // Set authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      // Fetch user data
      fetchUser();
    } else {
      // Clear authorization header if no token
      delete axios.defaults.headers.common["Authorization"];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Token expiry monitoring - check periodically
  useEffect(() => {
    if (!token) return;
    
    // Check token expiry every minute
    const interval = setInterval(() => {
      if (isTokenExpired(token)) {
        handleTokenExpiry();
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [token, handleTokenExpiry]);

  const value = {
    navigate,
    currency,
    axios,
    user,
    setUser,
    token,
    setToken,
    isOwner,
    setIsOwner,
    fetchUser,
    showLogin,
    setShowLogin,
    showLoginRequired,
    setShowLoginRequired,
    showOwnerOnboarding,
    setShowOwnerOnboarding,
    upgradeToOwner,
    logout,
    fetchCars,
    cars,
    setCars,
    pickupDate,
    setPickupDate,
    returnDate,
    setReturnDate,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  return useContext(AppContext);
};
