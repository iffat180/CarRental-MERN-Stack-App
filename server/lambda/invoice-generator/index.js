// lambda/invoice-generator/index.js
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');

// S3 Client
const s3Client = new S3Client({ region: 'us-east-1' });

// MongoDB Connection (reused across warm starts)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable not set');
  }

  console.log('Creating new MongoDB connection...');
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  
  isConnected = true;
  console.log('MongoDB connected successfully');
};

// Booking Schema (minimal, just for querying)
const bookingSchema = new mongoose.Schema({
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pickupDate: Date,
  returnDate: Date,
  status: String,
  price: Number,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'bookings' });

const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

/**
 * Generate PDF Invoice
 */
const generateInvoicePDF = async (booking) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      // Collect PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // === INVOICE HEADER ===
      doc
        .fontSize(20)
        .text('RENTAL INVOICE', { align: 'center' })
        .moveDown();

      doc
        .fontSize(10)
        .text(`Invoice Date: ${new Date().toLocaleDateString()}`, { align: 'right' })
        .text(`Booking ID: ${booking._id}`, { align: 'right' })
        .moveDown(2);

      // === CUSTOMER DETAILS ===
      doc
        .fontSize(12)
        .text('CUSTOMER DETAILS', { underline: true })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .text(`Name: ${booking.user?.name || 'N/A'}`)
        .text(`Email: ${booking.user?.email || 'N/A'}`)
        .moveDown(2);

      // === CAR DETAILS ===
      doc
        .fontSize(12)
        .text('CAR DETAILS', { underline: true })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .text(`Vehicle: ${booking.car?.brand || 'N/A'} ${booking.car?.model || ''}`)
        .text(`Category: ${booking.car?.category || 'N/A'}`)
        .text(`Location: ${booking.car?.location || 'N/A'}`)
        .moveDown(2);

      // === RENTAL DETAILS ===
      doc
        .fontSize(12)
        .text('RENTAL DETAILS', { underline: true })
        .moveDown(0.5);

      const pickupDate = booking.pickupDate 
        ? new Date(booking.pickupDate).toLocaleDateString() 
        : 'N/A';
      const returnDate = booking.returnDate 
        ? new Date(booking.returnDate).toLocaleDateString() 
        : 'N/A';
      
      const days = booking.pickupDate && booking.returnDate
        ? Math.ceil((new Date(booking.returnDate) - new Date(booking.pickupDate)) / (1000 * 60 * 60 * 24))
        : 0;

      doc
        .fontSize(10)
        .text(`Pickup Date: ${pickupDate}`)
        .text(`Return Date: ${returnDate}`)
        .text(`Duration: ${days} day(s)`)
        .text(`Status: ${booking.status || 'N/A'}`)
        .moveDown(2);

      // === PRICING ===
      doc
        .fontSize(12)
        .text('PRICING', { underline: true })
        .moveDown(0.5);

      const pricePerDay = booking.car?.pricePerDay || 0;
      const subtotal = booking.price || 0;
      const tax = subtotal * 0.1; // 10% tax
      const total = subtotal + tax;

      doc
        .fontSize(10)
        .text(`Price per day: $${pricePerDay.toFixed(2)}`)
        .text(`Days: ${days}`)
        .text(`Subtotal: $${subtotal.toFixed(2)}`)
        .text(`Tax (10%): $${tax.toFixed(2)}`)
        .moveDown(0.5);

      doc
        .fontSize(14)
        .fillColor('#000')
        .text(`TOTAL: $${total.toFixed(2)}`, { bold: true })
        .moveDown(3);

      // === FOOTER ===
      doc
        .fontSize(8)
        .fillColor('#666')
        .text('Thank you for your business!', { align: 'center' })
        .text('For questions, contact support@carrental.com', { align: 'center' });

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Lambda Handler
 */
exports.handler = async (event) => {
  console.log('Invoice generator triggered');
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = typeof event.body === 'string' 
      ? JSON.parse(event.body) 
      : event.body;

    const { bookingId } = body;

    if (!bookingId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'bookingId is required'
        })
      };
    }

    console.log(`Processing invoice for booking: ${bookingId}`);

    // Connect to MongoDB
    await connectDB();

    // Get booking with populated data
    const booking = await Booking.findById(bookingId)
      .populate('car')
      .populate('user')
      .lean();

    if (!booking) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Booking not found'
        })
      };
    }

    console.log('Booking found, generating PDF...');

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(booking);
    console.log(`PDF generated: ${pdfBuffer.length} bytes`);

    // Upload PDF to S3
    const s3Key = `invoices/invoice-${bookingId}-${Date.now()}.pdf`;
    
    const putCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      CacheControl: 'max-age=31536000'
    });

    await s3Client.send(putCommand);
    console.log(`PDF uploaded to S3: ${s3Key}`);

    // Build CloudFront URL
    const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
    const invoiceUrl = cloudFrontDomain
      ? `https://${cloudFrontDomain}/${s3Key}`
      : `https://${process.env.S3_BUCKET_NAME}.s3.us-east-1.amazonaws.com/${s3Key}`;

    console.log(`✅ Invoice generated: ${invoiceUrl}`);

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      },
      body: JSON.stringify({
        success: true,
        message: 'Invoice generated successfully',
        invoiceUrl: invoiceUrl,
        bookingId: bookingId
      })
    };

  } catch (error) {
    console.error('❌ Error generating invoice:', error);
    console.error('Error stack:', error.stack);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to generate invoice',
        message: error.message
      })
    };
  }
};