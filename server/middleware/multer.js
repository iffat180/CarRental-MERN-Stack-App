import multer from "multer";

// Allowed MIME types for images
const allowedMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

// Allowed file extensions
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

// File filter function to validate MIME types and extensions
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`), false);
  }

  // Check file extension
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error(`Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`), false);
  }

  // File is valid
  cb(null, true);
};

// Configure multer with memory storage and security settings
const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage instead of disk storage
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter, // Validate MIME types and extensions
});

export default upload;
