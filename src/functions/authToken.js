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
