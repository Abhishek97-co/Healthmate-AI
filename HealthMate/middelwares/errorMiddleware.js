const errorResponse = require("../utils/errroResponse");

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose CastError
  if (err.name === "CastError") {
    const message = "Resource Not Found";
    error = new errorResponse(message, 404);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = new errorResponse(message, 400);
  }

  // Mongoose ValidationError
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message).join(", ");
    error = new errorResponse(message, 400);
  }

  // Global fallback response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error",
  });
};

module.exports = errorHandler;
