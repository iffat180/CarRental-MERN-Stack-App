import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

// Validation utility functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  const requirements = {
    minLength: password.length >= 8,
  };
  return {
    isValid: requirements.minLength,
    requirements,
  };
};

// Redirect utility functions
const getRedirectPath = () => sessionStorage.getItem("redirectPath");

const redirectBack = (navigate) => {
  const path = getRedirectPath();
  if (path) {
    try {
      navigate(path);
      sessionStorage.removeItem("redirectPath");
    } catch (error) {
      console.log(`[Login] Navigation failed`, {
        path,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      // Keep redirectPath for retry - don't remove it on failure
    }
  }
};

const Login = () => {
  const { showLogin, setShowLogin, axios, setToken, navigate } = useAppContext();

  const [state, setState] = useState("login");
  
  // Check for initial mode when modal opens
  useEffect(() => {
    if (showLogin) {
      const initialMode = sessionStorage.getItem("loginInitialMode");
      if (initialMode) {
        setState(initialMode);
        sessionStorage.removeItem("loginInitialMode");
      } else {
        setState("login"); // Reset to login mode when opening normally
      }
    }
  }, [showLogin]);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
  });

  // Real-time validation handlers
  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    
    if (value && value.trim().length < 2) {
      setErrors(prev => ({ ...prev, name: "Name must be at least 2 characters" }));
    } else {
      setErrors(prev => ({ ...prev, name: "" }));
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    if (value && !validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
    } else {
      setErrors(prev => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    const validation = validatePassword(value);
    setPasswordRequirements(validation.requirements);
    
    if (value && !validation.isValid) {
      setErrors(prev => ({ ...prev, password: "Password must be at least 8 characters" }));
    } else {
      setErrors(prev => ({ ...prev, password: "" }));
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    
    // Reset errors
    setErrors({ name: "", email: "", password: "" });
    
    // Client-side validation BEFORE API call
    const validationErrors = {};
    
    if (state === "register") {
      if (!name.trim() || name.trim().length < 2) {
        validationErrors.name = "Name must be at least 2 characters";
      }
    }
    
    // Validate email format
    if (!email || !validateEmail(email)) {
      validationErrors.email = "Please enter a valid email address";
    }
    
    // Validate password - minimum 8 characters
    if (!password) {
      validationErrors.password = "Password is required";
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        validationErrors.password = "Password must be at least 8 characters";
      }
    }
    
    // If validation errors exist, show them and return
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Set loading state to disable button while submitting
    setIsLoading(true);
    
    try {
      const { data } = await axios.post(`/api/user/${state}`, {
        name: state === "register" ? name : undefined,
        email,
        password,
      });

      if (data.success) {
        // Save token to localStorage
        setToken(data.token);
        localStorage.setItem("token", data.token);
        
        // Close modal
        setShowLogin(false);
        
        // Show success message
        toast.success(state === "register" ? "Account created successfully!" : "Login successful!");
        
        // Redirect back to stored path if it exists
        redirectBack(navigate);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      // Better error handling
      const errorMessage = error.response?.data?.message || error.message || "An error occurred. Please try again.";
      toast.error(errorMessage);
      
      // Set specific field errors if available
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={() => setShowLogin(false)}
      className="fixed top-0 bottom-0 left-0 right-0 z-100 flex items-center text-sm text-gray-600 bg-black/50"
    >
      <form
        onSubmit={onSubmitHandler}
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[352px] rounded-lg shadow-xl border border-gray-200 bg-white"
      >
        <p className="text-2xl font-medium m-auto">
          <span className="text-primary">User</span>{" "}
          {state === "login" ? "Login" : "Sign Up"}
        </p>
        {state === "register" && (
          <div className="w-full">
            <p>Name</p>
            <input
              onChange={handleNameChange}
              value={name}
              placeholder="type here"
              className={`border rounded w-full p-2 mt-1 outline-primary ${
                errors.name ? "border-red-500" : "border-gray-200"
              }`}
              type="text"
              required
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>
        )}
        <div className="w-full">
          <p>Email</p>
          <input
            onChange={handleEmailChange}
            value={email}
            placeholder="type here"
            className={`border rounded w-full p-2 mt-1 outline-primary ${
              errors.email ? "border-red-500" : "border-gray-200"
            }`}
            type="email"
            required
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>
        <div className="w-full">
          <p>Password</p>
          <input
            onChange={handlePasswordChange}
            value={password}
            placeholder="type here"
            className={`border rounded w-full p-2 mt-1 outline-primary ${
              errors.password ? "border-red-500" : "border-gray-200"
            }`}
            type="password"
            required
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
          {state === "register" && password && (
            <div className="mt-2 text-xs">
              <p className="text-gray-600 mb-1">Password requirements:</p>
              <ul className="list-none space-y-1">
                <li className={`flex items-center gap-2 ${
                  passwordRequirements.minLength ? "text-green-600" : "text-gray-400"
                }`}>
                  <span>{passwordRequirements.minLength ? "✓" : "○"}</span>
                  <span>At least 8 characters</span>
                </li>
              </ul>
            </div>
          )}
        </div>
        {state === "register" ? (
          <p>
            Already have account?{" "}
            <span
              onClick={() => setState("login")}
              className="text-primary cursor-pointer"
            >
              click here
            </span>
          </p>
        ) : (
          <p>
            Create an account?{" "}
            <span
              onClick={() => setState("register")}
              className="text-primary cursor-pointer"
            >
              click here
            </span>
          </p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={`bg-primary hover:bg-blue-800 transition-all text-white w-full py-2 rounded-md ${
            isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              {state === "register" ? "Creating Account..." : "Logging in..."}
            </span>
          ) : (
            state === "register" ? "Create Account" : "Login"
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;
