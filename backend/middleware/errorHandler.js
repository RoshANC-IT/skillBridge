export const notFound = (req, res, next) => {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

export const errorHandler = (err, req, res, next) => {
  const status = err.status || (res.statusCode !== 200 ? res.statusCode : 500);
  res.status(status).json({
    message: err.message || "Internal Server Error",
    // hide stack in production
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
