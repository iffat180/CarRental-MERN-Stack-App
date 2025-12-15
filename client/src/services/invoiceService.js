import axios from "axios";

/**
 * Service to generate and retrieve invoice PDFs for bookings
 */
const invoiceService = {
  /**
   * Generate invoice PDF for a booking
   * @param {string} bookingId - MongoDB booking ID
   * @returns {Promise<{invoiceUrl: string}>} - Object containing the S3 URL of the generated PDF
   * @throws {Error} - If the API call fails
   */
  generateInvoice: async (bookingId) => {
    const invoiceApiUrl = import.meta.env.VITE_INVOICE_API_URL;

    if (!invoiceApiUrl) {
      throw new Error("Invoice API URL is not configured. Please contact support.");
    }

    if (!bookingId) {
      throw new Error("Booking ID is required to generate invoice.");
    }

    try {
      const response = await axios.post(
        invoiceApiUrl,
        { bookingId },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout for PDF generation
        }
      );

      if (response.data && response.data.invoiceUrl) {
        return response.data;
      } else {
        throw new Error("Invalid response from invoice service");
      }
    } catch (error) {
      // Handle different types of errors
      if (error.response) {
        // API responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || error.response.data?.error || "Failed to generate invoice";

        if (status === 404) {
          throw new Error("Booking not found. Please verify the booking ID.");
        } else if (status === 400) {
          throw new Error(message || "Invalid booking data. Please try again.");
        } else if (status >= 500) {
          throw new Error("Invoice service is temporarily unavailable. Please try again later.");
        } else {
          throw new Error(message);
        }
      } else if (error.request) {
        // Request was made but no response received
        throw new Error("Unable to connect to invoice service. Please check your internet connection.");
      } else if (error.code === "ECONNABORTED") {
        // Request timeout
        throw new Error("Invoice generation is taking longer than expected. Please try again.");
      } else {
        // Something else happened
        throw new Error(error.message || "An unexpected error occurred while generating the invoice.");
      }
    }
  },
};

export default invoiceService;

