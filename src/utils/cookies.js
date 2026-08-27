const ACCESS_COOKIE = "accessToken";
const REFRESH_COOKIE = "refreshToken";

const isProduction = () => process.env.NODE_ENV === "production";

const baseCookie = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: isProduction() ? "strict" : "lax",
});

const accessCookieOptions = () => ({
  ...baseCookie(),
  path: "/api/v1",
  maxAge: 15 * 60 * 1000,
});

const refreshCookieOptions = () => ({
  ...baseCookie(),
  path: "/api/v1/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  res.cookie(ACCESS_COOKIE, accessToken, accessCookieOptions());
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
};

export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, accessCookieOptions());
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
};

export const getAccessCookie = (req) => req.cookies?.[ACCESS_COOKIE];

export const getRefreshCookie = (req) => req.cookies?.[REFRESH_COOKIE];
