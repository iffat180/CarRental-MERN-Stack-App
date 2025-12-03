import mongoose from "mongoose";

// Connection retry configuration
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds in milliseconds

// Connection options
const connectionOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Mongoose connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ Database Connected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Database connection error:', {
    message: err.message,
    name: err.name,
    timestamp: new Date().toISOString()
  });
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Database disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 Database reconnected');
});

const connectDB = async (retryCount = 0) => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(mongoURI, connectionOptions);
    
    console.log('✅ Successfully connected to MongoDB');
  } catch (error) {
    // Structured error logging with context
    console.error('❌ Database connection failed:', {
      attempt: retryCount + 1,
      maxRetries: MAX_RETRIES,
      error: error.message,
      name: error.name,
      timestamp: new Date().toISOString()
    });

    // Retry logic
    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Retrying connection in ${RETRY_DELAY / 1000} seconds... (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectDB(retryCount + 1);
    } else {
      console.error('❌ Max retry attempts reached. Exiting...');
      process.exit(1);
    }
  }
};

// Graceful shutdown handlers
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Closing database connection...`);
  
  try {
    await mongoose.connection.close();
    console.log('✅ Database connection closed gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database shutdown:', {
      message: error.message,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  }
};

// Listen for termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default connectDB;
