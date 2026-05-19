/**
 * Global error handler — must be the LAST middleware in app.js
 */
const errorMiddleware = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.url}:`, err.message);

  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorMiddleware;
