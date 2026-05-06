const AppError = require('../utils/appError');

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let normalizedError = err;

  if (err.name === 'CastError') {
    normalizedError = new AppError('Invalid resource id.', 400);
  }

  if (err.name === 'ValidationError') {
    normalizedError = new AppError('Validation failed.', 400, {
      details: Object.values(err.errors).map((item) => item.message),
    });
  }

  if (err.code === 11000) {
    normalizedError = new AppError('A record with the same value already exists.', 409);
  }

  if (err.message === 'Origin not allowed by CORS.') {
    normalizedError = new AppError('Origin not allowed by CORS.', 403);
  }

  const statusCode = normalizedError.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  console.error('Unhandled error:', err);

  return res.status(statusCode).json({
    message: normalizedError.message || 'Internal server error.',
    ...(normalizedError.details ? { errors: normalizedError.details } : {}),
    ...(!isProduction && statusCode >= 500 ? { debug: err.message } : {}),
  });
};

module.exports = errorHandler;
