import { StatusCodes, getReasonPhrase } from "http-status-codes";

/**
 * Unified API response structure for both HTTP and Socket.IO
 */
export const apiResponse = ({
  res = null,
  error = null,
  statusCode = null,
  message = null,
  data = null,
  pagination = null,
  success = undefined,
  ...customFields
}) => {
  const status =
    statusCode || error?.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  const isSuccess = success !== undefined ? success : status < 400;

  const finalMessage =
    message || error?.message || getReasonPhrase(status) || "Unknown Error";

  const responsePayload = {
    status: isSuccess,
    statusCode: status,
    message: finalMessage,
    ...(data !== undefined && { data }), // avoid "body" key, use "data"
    ...(pagination && { pagination }),
    ...(error && !isSuccess && { error: formatError(error) }),
    ...customFields,
  };

  if (res) {
    // Response for Express.js
    return res.status(status).json(responsePayload);
  } else {
    // Plain object for Socket.IO or internal return
    return responsePayload;
  }
};

/**
 * Parses Joi validation errors into field: message format
 */
export const parseJoiError = (error) => {
  const errors = {};
  if (error?.details) {
    for (const detail of error.details) {
      if (detail?.context?.key) {
        errors[detail.context.key] = detail.message.replace(/['"]/g, "");
      }
    }
  }
  return errors;
};

/**
 * Handles Joi or manual validation response
 */
export const validateResponse = ({
  res,
  error,
  statusCode = StatusCodes.BAD_REQUEST,
  label = "Validation failed",
}) => {
  const parsed = parseJoiError(error);
  const firstMessage =
    Object.values(parsed)?.[0] ||
    error?.message?.replace(/['"]/g, "") ||
    label;

  return res.status(statusCode).json({
    status: false,
    statusCode,
    message: firstMessage,
    errors: parsed,
    data: null,
  });
};

/**
 * Formats raw error (stack, name, etc.)
 */
const formatError = (err) => {
  if (!err || typeof err !== "object") return err;
  return {
    name: err.name || "Error",
    message: err.message,
    ...(err.stack && { stack: err.stack }),
  };
};
