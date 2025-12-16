import React, { useState } from 'react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

// Email validation utility
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const Newsletter = () => {
  const { axios } = useAppContext();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSuccess(false);

    // Client-side email validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await axios.post('/api/user/newsletter/subscribe', { email });
      if (data.success) {
        setIsSuccess(true);
        setEmail('');
        toast.success(data.message || 'Successfully subscribed to newsletter!');
        // Reset success message after 3 seconds
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        const errorMessage = data.message || 'Failed to subscribe. Please try again.';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to subscribe. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-2 max-md:px-4 my-10 mb-40">
      <h1 className="md:text-4xl text-2xl font-semibold">Never Miss a Deal!</h1>
      <p className="md:text-lg text-gray-500/70 pb-8">
        Subscribe to get the latest offers, new arrivals, and exclusive discounts
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col items-center justify-between max-w-2xl w-full gap-3" noValidate>
        <div className="flex items-center justify-between w-full md:h-13 h-12">
          <label htmlFor="newsletter-email" className="sr-only">Enter your email address to subscribe to newsletter</label>
          <input
            id="newsletter-email"
            className="border border-gray-300 rounded-md h-full border-r-0 outline-none w-full rounded-r-none px-3 text-gray-500 focus:ring-2 focus:ring-primary focus:ring-offset-2"
            type="email"
            placeholder="Enter your email id"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
              setIsSuccess(false);
            }}
            disabled={isLoading}
            required
            aria-required="true"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "newsletter-error" : isSuccess ? "newsletter-success" : undefined}
          />
          <button 
            type="submit" 
            disabled={isLoading}
            aria-disabled={isLoading}
            aria-busy={isLoading}
            className={`md:px-12 px-8 h-full text-white bg-primary hover:bg-primary-dull transition-all rounded-md rounded-l-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isLoading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </div>
        {error && (
          <p id="newsletter-error" className="text-red-500 text-sm w-full text-left px-3" role="alert">
            {error}
          </p>
        )}
        {isSuccess && (
          <p id="newsletter-success" className="text-green-500 text-sm w-full text-left px-3" role="status" aria-live="polite">
            Successfully subscribed! Check your email for confirmation.
          </p>
        )}
      </form>
    </div>
  )
}

export default Newsletter