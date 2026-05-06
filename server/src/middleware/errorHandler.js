const errorHandler = (err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
      errors: Object.values(err.errors).map((item) => item.message),
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid data format" });
  }

  if (err.name === "MongoServerSelectionError" || err.name === "MongoNetworkError") {
    return res.status(503).json({
      message: "Database connection issue. Please try again in a moment.",
    });
  }

  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
};

module.exports = errorHandler;
