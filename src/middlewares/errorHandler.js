class ApiError extends Error {
  constructor(statusCode = 500, message = 'Internal Server Error', details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

function notFoundHandler(req, res, next) {
  next(new ApiError(404, 'Not Found'));
}

function globalErrorHandler(err, req, res, next) {
  console.error('Global error handler:', err.stack || err);

  const statusCode = err.statusCode || err.status || 500;
  const payload = {
    success: false,
    status: 'error',
    message: err.message || 'Internal Server Error',
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.details = err.details || err.stack;
  }

  res.status(statusCode).json(payload);
}

module.exports = {
  ApiError,
  notFoundHandler,
  globalErrorHandler,
};
