const getApiError = (error, fallbackMessage = 'Something went wrong.') => {
  const validationErrors = error?.response?.data?.errors;

  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    return validationErrors.map((item) => item.message || item).join(' ');
  }

  return error?.response?.data?.message || fallbackMessage;
};

export default getApiError;
