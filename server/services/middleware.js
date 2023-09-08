import { formatObject } from "./logger.js";

export function requestFormatter(request) {
  const parts = [
    request.method,
    request.path,
    formatObject(request.query),
    formatObject(request.body),
  ];
  return parts.join(" ");
}

export function errorFormatter(error) {
  return { error: error.message };
}

export function logRequests(formatter = requestFormatter) {
  return (request, response, next) => {
    const { logger } = request.app.locals;
    logger.info(formatter(request));
    next();
  };
}

export function logErrors(formatter = errorFormatter) {
  return (error, request, response, next) => {
    const { logger } = request.app.locals;
    logger.error(formatObject(error));
    response
      .status(400)
      .json({
        error:
          "An error occurred processing your request. Please try again later.",
      });
  };
}
