export function successResponse(data = null) {
  return {
    success: true,
    data,
  };
}

export function errorResponse(code, message, details = null) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}
