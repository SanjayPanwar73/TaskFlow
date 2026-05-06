const getApiError = (error, fallbackMessage = 'Something went wrong.') => {
  const validationErrors = error?.response?.data?.errors;

  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    return validationErrors.map((item) => item.message || item).join(' ');
  }

  if (error?.code === 'ERR_NETWORK' || (error?.request && !error?.response)) {
    return 'Cannot reach the server. Check Render env vars, CORS, and backend status.';
  }

  return error?.response?.data?.message || fallbackMessage;
};

export default getApiError;
