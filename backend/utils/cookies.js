const COOKIE_NAME = 'ttm_token';

const parseCookies = (cookieHeader = '') =>
  cookieHeader
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((cookies, segment) => {
      const separatorIndex = segment.indexOf('=');

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = segment.slice(0, separatorIndex).trim();
      const value = decodeURIComponent(segment.slice(separatorIndex + 1).trim());
      cookies[key] = value;
      return cookies;
    }, {});

const getRequestOrigin = (req) => {
  const origin = req?.headers?.origin;

  if (!origin) {
    return '';
  }

  try {
    return new URL(origin).origin;
  } catch {
    return '';
  }
};

const getRequestHostOrigin = (req) => {
  const forwardedProto = req?.headers?.['x-forwarded-proto'];
  const proto = forwardedProto || req?.protocol || 'http';
  const host = req?.get?.('host');

  if (!host) {
    return '';
  }

  return `${proto}://${host}`;
};

const getAuthCookieOptions = (req) => {
  const requestOrigin = getRequestOrigin(req);
  const requestHostOrigin = getRequestHostOrigin(req);
  const isCrossSiteRequest =
    Boolean(requestOrigin) && Boolean(requestHostOrigin) && requestOrigin !== requestHostOrigin;
  const isHttpsRequest =
    req?.secure === true ||
    req?.headers?.['x-forwarded-proto'] === 'https' ||
    requestOrigin.startsWith('https://');

  return {
    httpOnly: true,
    secure: isHttpsRequest,
    sameSite: isCrossSiteRequest ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
};

module.exports = {
  COOKIE_NAME,
  parseCookies,
  getAuthCookieOptions,
};
