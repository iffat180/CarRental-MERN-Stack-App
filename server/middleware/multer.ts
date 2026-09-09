import multer, { type FileFilterCallback } from "multer";
import type { Request } from "express";

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
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  // Check MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`));
    return;
  }

  // Check file extension
  const fileExtension = file.originalname
    .toLowerCase()
    .substring(file.originalname.lastIndexOf("."));
  if (!allowedExtensions.includes(fileExtension)) {
    cb(new Error(`Invalid file extension. Allowed extensions: ${allowedExtensions.join(", ")}`));
    return;
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
