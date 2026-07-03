import { env } from "../config/env.js";
import { errorResponse } from "../utils/apiResponse.js";

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const message = err.message || "Internal server error.";

  if (env.NODE_ENV === "development") {
    console.error(err);
  }

  res.status(statusCode).json(errorResponse(code, message, err.details));
}
