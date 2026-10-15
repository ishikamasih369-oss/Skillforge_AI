"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import { tokenStorage } from "@/lib/token-storage";
import type { AuthResponse, LoginRequest, RegisterRequest, User } from "@/lib/types/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session verification on mount
  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      const storedToken = tokenStorage.getToken();
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const verifiedUser = await apiClient.getMe(storedToken);
        if (isMounted) {
          setUser(verifiedUser);
          setToken(storedToken);
        }
      } catch {
        // If the token is expired (401) or invalid, purge it safely
        if (isMounted) {
          tokenStorage.removeToken();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.login(credentials);
    tokenStorage.setToken(response.access_token);
    setToken(response.access_token);
    setUser(response.user);
    return response;
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<User> => {
    const createdUser = await apiClient.register(data);
    return createdUser;
  }, []);

  const logout = useCallback(() => {
    tokenStorage.removeToken();
    setUser(null);
    setToken(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const currentToken = tokenStorage.getToken();
    if (!currentToken) {
      setUser(null);
      setToken(null);
      return null;
    }
    try {
      const freshUser = await apiClient.getMe(currentToken);
      setUser(freshUser);
      setToken(currentToken);
      return freshUser;
    } catch {
      tokenStorage.removeToken();
      setUser(null);
      setToken(null);
      return null;
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(user && token),
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
