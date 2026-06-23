import axios from "axios";
import { createContext, useEffect, useState } from "react";
import {
  clearSession,
  getAccessToken,
  getAccessTokenExpiryMs,
  getSessionUser,
  isAccessTokenExpired,
  setAccessToken,
  setSessionUser,
} from "../functions/authToken";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [currentUser, setCurrentUser] = useState(() => {
    const user = getSessionUser();
    if (user && getAccessToken() && !isAccessTokenExpired()) return user;
    clearSession();
    return null;
  });

  const login = async (inputs) => {
    try {
      const res = await axios.post(`${apiUrl}/backend/auth/login`, inputs, {
        withCredentials: true,
      });
      const { accessToken, ...user } = res.data;
      setAccessToken(accessToken);
      setSessionUser(user);
      setCurrentUser(user);
      return { success: true, user };
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: error.response?.data?.message || "An unexpected error occurred" };
    }
  };

  const loginWithGoogle = async (googleToken) => {
    try {
      const res = await axios.post(
        `${apiUrl}/backend/auth/google`,
        { token: googleToken },
        { withCredentials: true }
      );
      setAccessToken(res.data.accessToken);
      setSessionUser(res.data.user);
      setCurrentUser(res.data.user);
      return { success: true, user: res.data.user };
    } catch (error) {
      console.error("Google login failed:", error);
      return { success: false, error: error.response?.data?.message || "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    await axios.post(`${apiUrl}/backend/auth/logout`, {}, {
      withCredentials: true,
    });
    clearSession();
    setCurrentUser(null);
  };

  useEffect(() => {
    setSessionUser(currentUser);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const expiry = getAccessTokenExpiryMs();
    if (!expiry) {
      clearSession();
      setCurrentUser(null);
      return undefined;
    }

    const delay = Math.max(expiry - Date.now(), 0);
    const timer = window.setTimeout(() => {
      clearSession();
      setCurrentUser(null);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [currentUser]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          clearSession();
          setCurrentUser(null);
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
