import ImageKit from "imagekit";

// Validate required environment variables
const requiredEnvVars = {
  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  IMAGEKIT_URL_ENDPOINT: process.env.IMAGEKIT_URL_ENDPOINT
};

// Check if any required env var is missing
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing required ImageKit environment variables: ${missingVars.join(', ')}`);
}

// Initialize ImageKit with error handling
let imagekit;

try {
  imagekit = new ImageKit({
    publicKey: requiredEnvVars.IMAGEKIT_PUBLIC_KEY,
    privateKey: requiredEnvVars.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: requiredEnvVars.IMAGEKIT_URL_ENDPOINT
  });
} catch (error) {
  throw new Error(`Failed to initialize ImageKit: ${error.message}`);
}

// Helper function to validate upload response
export const validateUploadResponse = (response) => {
  if (!response) {
    throw new Error("ImageKit upload response is missing");
  }

  // Check for required fields (ImageKit returns filePath, not url)
  const requiredFields = ['filePath', 'fileId'];
  const missingFields = requiredFields.filter(field => !response[field]);

  if (missingFields.length > 0) {
    throw new Error(`ImageKit upload response missing required fields: ${missingFields.join(', ')}`);
  }

  return true;
};

export default imagekit;