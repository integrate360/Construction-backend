// middleware/errorMiddleware.js
import AppError from '../helpers/errorHelper.js';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    message: 'Something went wrong'
  });
};