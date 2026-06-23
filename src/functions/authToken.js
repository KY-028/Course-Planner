const TOKEN_KEY = "accessToken";
const USER_KEY = "user";

export function setAccessToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAccessTokenPayload() {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function getAccessTokenExpiryMs() {
  const payload = getAccessTokenPayload();
  return typeof payload?.exp === "number" ? payload.exp * 1000 : null;
}

export function isAccessTokenExpired(skewMs = 30000) {
  const expiry = getAccessTokenExpiryMs();
  return !expiry || Date.now() >= expiry - skewMs;
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function setSessionUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function getSessionUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSessionUser() {
  localStorage.removeItem(USER_KEY);
}

export function clearSession() {
  clearAccessToken();
  clearSessionUser();
}

/** Auth headers for credentialed API calls (cookie + Bearer fallback for local dev). */
export function authRequestConfig() {
  const token = getAccessToken();
  return {
    withCredentials: true,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
}
