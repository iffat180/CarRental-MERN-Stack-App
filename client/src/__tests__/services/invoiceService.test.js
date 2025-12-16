import { describe, it, expect, vi, beforeEach } from 'vitest';
import invoiceService from '../../services/invoiceService';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('Invoice Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variable
    delete import.meta.env.VITE_INVOICE_API_URL;
  });

  describe('generateInvoice - Input Validation', () => {
    it('should throw error when bookingId is missing', async () => {
      import.meta.env.VITE_INVOICE_API_URL = 'https://api.example.com/invoice';
      await expect(invoiceService.generateInvoice()).rejects.toThrow(
        'Booking ID is required to generate invoice.'
      );
    });

    it('should throw error when bookingId is null', async () => {
      import.meta.env.VITE_INVOICE_API_URL = 'https://api.example.com/invoice';
      await expect(invoiceService.generateInvoice(null)).rejects.toThrow(
        'Booking ID is required to generate invoice.'
      );
    });

    it('should throw error when bookingId is empty string', async () => {
      import.meta.env.VITE_INVOICE_API_URL = 'https://api.example.com/invoice';
      await expect(invoiceService.generateInvoice('')).rejects.toThrow(
        'Booking ID is required to generate invoice.'
      );
    });

    it('should throw error when API URL is not configured', async () => {
      const bookingId = '507f1f77bcf86cd799439011';
      
      await expect(invoiceService.generateInvoice(bookingId)).rejects.toThrow(
        'Invoice API URL is not configured. Please contact support.'
      );
    });
  });

  describe('generateInvoice - Success Cases', () => {
    it('should return invoice URL on successful generation', async () => {
      const bookingId = '507f1f77bcf86cd799439011';
      const mockInvoiceUrl = 'https://s3.amazonaws.com/invoices/invoice123.pdf';
      
      import.meta.env.VITE_INVOICE_API_URL = 'https://api.example.com/invoice';
      
      axios.post.mockResolvedValueOnce({
        data: {
          invoiceUrl: mockInvoiceUrl
        }
      });

      const result = await invoiceService.generateInvoice(bookingId);
      
      expect(result).toEqual({ invoiceUrl: mockInvoiceUrl });
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.example.com/invoice',
        { bookingId },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );
    });
  });

  describe('generateInvoice - Error Handling', () => {
    beforeEach(() => {
      import.meta.env.VITE_INVOICE_API_URL = 'https://api.example.com/invoice';
    });

    it('should handle 404 error (booking not found)', async () => {
      const bookingId = '507f1f77bcf86cd799439011';
      
      axios.post.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: 'Booking not found' }
        }
      });

      await expect(invoiceService.generateInvoice(bookingId)).rejects.toThrow(
        'Booking not found. Please verify the booking ID.'
      );
    });

    it('should handle 400 error (bad request)', async () => {
      const bookingId = '507f1f77bcf86cd799439011';
      const errorMessage = 'Invalid booking data';
      
      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: errorMessage }
        }
      });

      await expect(invoiceService.generateInvoice(bookingId)).rejects.toThrow(errorMessage);
    });

    it('should handle 500+ server errors', async () => {
      const bookingId = '507f1f77bcf86cd799439011';
      
      axios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Internal server error' }
        }
      });

      await expect(invoiceService.generateInvoice(bookingId)).rejects.toThrow(
        'Invoice service is temporarily unavailable. Please try again later.'
      );
    });

    it('should handle network errors (no response)', async () => {
      const bookingId = '507f1f77bcf86cd799439011';
      
      axios.post.mockRejectedValueOnce({
        request: {},
        message: 'Network Error'
      });

      await expect(invoiceService.generateInvoice(bookingId)).rejects.toThrow(
        'Unable to connect to invoice service. Please check your internet connection.'
      );
    });

    it('should handle timeout errors', async () => {
      const bookingId = '507f1f77bcf86cd799439011';
      
      axios.post.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded'
      });

      await expect(invoiceService.generateInvoice(bookingId)).rejects.toThrow(
        'Invoice generation is taking longer than expected. Please try again.'
      );
    });

    it('should handle invalid response format', async () => {
      const bookingId = '507f1f77bcf86cd799439011';
      
      axios.post.mockResolvedValueOnce({
        data: {
          // Missing invoiceUrl
          status: 'success'
        }
      });

      await expect(invoiceService.generateInvoice(bookingId)).rejects.toThrow(
        'Invalid response from invoice service'
      );
    });

    it('should handle generic errors', async () => {
      const bookingId = '507f1f77bcf86cd799439011';
      const errorMessage = 'Unexpected error';
      
      axios.post.mockRejectedValueOnce({
        message: errorMessage
      });

      await expect(invoiceService.generateInvoice(bookingId)).rejects.toThrow(errorMessage);
    });
  });
});

