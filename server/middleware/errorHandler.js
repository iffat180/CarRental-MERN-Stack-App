// Global Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  // Log error details server-side
  const errorDetails = {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  };

  console.error('Error:', errorDetails);

  // Determine status code
  let statusCode = err.statusCode || err.status || 500;
  
  // Handle specific error types
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    statusCode = 400;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
  } else if (err.name === 'MongoServerError' || err.name === 'MongooseError') {
    statusCode = 500;
  }

  // Return safe error message to client
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 
      ? "An internal server error occurred. Please try again later."
      : err.message || "An error occurred. Please try again."
  });
};

