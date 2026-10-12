/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState } from "react";
import { api, setUnauthorizedHandler } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(
    () => Boolean(localStorage.getItem("token"))
  );

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    setUnauthorizedHandler(logout);

    if (!localStorage.getItem("token")) {
      return () => {
        active = false;
      };
    }

    async function fetchUser() {
      try {
        const data = await api("/auth/me");

        if (active) {
          setUser(data.user);
        }
      } catch {
        // Keep the user logged out if authentication fails.
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    return () => {
      active = false;
    };
  }, []);

  async function authenticate(mode, body) {
    const data = await api(`/auth/${mode}`, {
      method: "POST",
      body,
    });

    localStorage.setItem("token", data.token);
    setUser(data.user);
    setLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, authenticate, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
