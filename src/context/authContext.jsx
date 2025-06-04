import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const login = async (inputs) => {
    try {
      const res = await axios.post(`${apiUrl}/backend/auth/login`, inputs, {
        withCredentials: true,
      });
      setCurrentUser(res.data);
      return { success: true, user: res.data };
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: error.response?.data?.message || "An unexpected error occurred" };
    }
  };

  const loginWithGoogle = async (googleToken) => {
    try {
      const res = await axios.post(`${apiUrl}/backend/auth/google`, {
        token: googleToken
      });
      setCurrentUser(res.data.user);
      return { success: true, user: res.data.user };
    } catch (error) {
      console.error("Google login failed:", error);
      return { success: false, error: error.response?.data?.message || "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    await axios.post(`${apiUrl}/backend/auth/logout`, {}, {
      withCredentials: true
    });
    setCurrentUser(null);
  };

  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(currentUser));
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};