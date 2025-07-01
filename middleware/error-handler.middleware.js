import { StatusCodes } from "http-status-codes";
import { apiResponse } from "../helper/api-response.helper.js";

const errorHandler = (error, req, res, next) => {
  console.error("🔥 Error Handler Triggered:", {
    message: error.message,
    stack: error.stack,
    name: error.name,
    statusCode: error.statusCode || error?.response?.status,
    path: req.originalUrl,
    method: req.method,
  });

  if (error?.response?.data) {
    const externalMessage =
      error.response.data.message || error.response.statusText || "External API Error";
    return apiResponse({
      res,
      statusCode: error.response.status,
      message: externalMessage,
      error,
    });
  }

  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  return apiResponse({
    res,
    statusCode,
    message: error.message || "Something went wrong",
    error,
  });
};

export default errorHandler;
