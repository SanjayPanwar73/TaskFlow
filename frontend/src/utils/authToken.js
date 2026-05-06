const AUTH_TOKEN_KEY = 'ttm_token';

const canUseStorage = () => typeof window !== 'undefined' && Boolean(window.localStorage);

export const getStoredAuthToken = () => {
  if (!canUseStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredAuthToken = (token) => {
  if (!canUseStorage() || !token) {
    return;
  }

  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // Ignore storage write failures and continue with cookie auth.
  }
};

export const clearStoredAuthToken = () => {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Ignore storage removal failures.
  }
};
