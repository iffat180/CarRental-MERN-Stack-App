import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { errMessage, errName } from "../utils/errors.js";

const {
  AWS_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET_NAME,
  AWS_CLOUDFRONT_DOMAIN,
} = process.env;

const s3Config: S3ClientConfig = { region: AWS_REGION };
if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  s3Config.credentials = {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  };
}

// Initialize S3 Client
const s3Client = new S3Client(s3Config);

export interface CarImageUploadResult {
  originalUrl: string;
  optimizedUrl: string;
  filename: string;
}

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} fileName - Original filename
 * @param {string} folder - Folder path (e.g., 'cars', 'users', 'uploads')
 * @param {string} mimetype - File MIME type
 * @returns {Promise<string>} - CloudFront URL or S3 URL
 */
export const uploadToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  folder: string,
  mimetype: string
): Promise<string> => {
  try {
    // Generate unique filename to prevent collisions
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `${folder}/${timestamp}-${sanitizedFileName}`;

    // Upload to S3 using multipart upload (handles large files)
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimetype,
        // Optional: Set cache control for better performance
        CacheControl: "max-age=31536000", // 1 year
      },
    });

    await upload.done();

    // Return CloudFront URL if configured, otherwise S3 URL
    if (process.env.AWS_CLOUDFRONT_DOMAIN) {
      return `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`;
    } else {
      return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }
  } catch (error) {
    console.error("[uploadToS3] Error:", {
      message: errMessage(error),
      name: errName(error),
      timestamp: new Date().toISOString(),
    });
    throw new Error("Failed to upload file to S3");
  }
};

/**
 * NEW FUNCTION: Upload to S3 and wait for Lambda optimization
 * Used specifically for car images that need optimization
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} fileName - Original filename
 * @param {string} mimetype - File MIME type
 * @returns {Promise<{originalUrl: string, optimizedUrl: string, filename: string}>}
 */
export const uploadCarImageToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  mimetype: string
): Promise<CarImageUploadResult> => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = fileName.split(".").pop();
    const uniqueFilename = `car-${timestamp}.${fileExtension}`;

    console.log("📤 Uploading car image to S3 uploads/ folder...");

    // Upload to uploads/ folder (triggers Lambda)
    const key = `uploads/${uniqueFilename}`;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: mimetype,
        CacheControl: "max-age=31536000",
      },
    });

    await upload.done();
    console.log(`Uploaded: ${key}`);

    // Build original and optimized URLs
    const cloudFrontDomain = process.env.AWS_CLOUDFRONT_DOMAIN;
    const originalUrl = cloudFrontDomain
      ? `https://${cloudFrontDomain}/${key}`
      : `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    const optimizedUrl = cloudFrontDomain
      ? `https://${cloudFrontDomain}/optimized/car-${timestamp}-large.${fileExtension}`
      : `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/optimized/car-${timestamp}-large.${fileExtension}`;

    // Wait for Lambda to process (5 seconds)
    console.log("⏳ Waiting for Lambda to create optimized versions...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Verify optimized image exists
    try {
      const headCommand = new HeadObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `optimized/car-${timestamp}-large.${fileExtension}`,
      });
      await s3Client.send(headCommand);
      console.log("Optimized image verified");
    } catch (err) {
      console.warn("⚠️  Optimized image not found, waiting 3 more seconds...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    return {
      originalUrl,
      optimizedUrl,
      filename: uniqueFilename,
    };
  } catch (error) {
    console.error("[uploadCarImageToS3] Error:", {
      message: errMessage(error),
      name: errName(error),
      timestamp: new Date().toISOString(),
    });
    throw new Error("Failed to upload car image to S3");
  }
};

/**
 * Delete file from S3
 * @param {string} fileUrl - Full URL of file to delete
 * @returns {Promise<void>}
 */
export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  try {
    // Extract key from URL
    let key: string | undefined;
    if (AWS_CLOUDFRONT_DOMAIN && fileUrl.includes(AWS_CLOUDFRONT_DOMAIN)) {
      // CloudFront URL
      key = fileUrl.split(`${AWS_CLOUDFRONT_DOMAIN}/`)[1];
    } else {
      // S3 URL
      key = fileUrl.split(".amazonaws.com/")[1];
    }

    if (!key) {
      throw new Error("Invalid S3 URL format");
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`[deleteFromS3] Deleted: ${key}`);
  } catch (error) {
    console.error("[deleteFromS3] Error:", {
      message: errMessage(error),
      key: fileUrl,
      timestamp: new Date().toISOString(),
    });
    // Don't throw - allow operation to continue even if delete fails
  }
};

/**
 * Generate signed URL for private S3 objects (if needed)
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiration in seconds (default: 3600)
 * @returns {Promise<string>} - Signed URL
 */
export const getSignedS3Url = async (key: string, expiresIn = 3600): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error("[getSignedS3Url] Error:", {
      message: errMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw new Error("Failed to generate signed URL");
  }
};

export default s3Client;
