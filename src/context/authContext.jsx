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
      return res;  // Ensure this returns a response indicating success or failure
    } catch (error) {
      console.error("Login failed:", error);
      throw error;  // Rethrow to handle it in the calling component
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
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};