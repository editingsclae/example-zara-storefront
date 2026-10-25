"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Customer,
  getCustomer,
  loginCustomer,
  registerCustomer,
} from "@/lib/medusa";

interface AuthContextType {
  customer: Customer | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => Promise<void>;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "medusa_customer_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize token and customer asynchronously on mount
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const saved = localStorage.getItem(TOKEN_KEY);
      if (saved) {
        setToken(saved);
        document.cookie = `${TOKEN_KEY}=${saved}; path=/; max-age=2592000; SameSite=Lax`;
        try {
          const cust = await getCustomer(saved);
          if (isMounted) {
            if (cust) {
              setCustomer(cust);
            } else {
              localStorage.removeItem(TOKEN_KEY);
              document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
              setToken(null);
            }
          }
        } catch {
          if (isMounted) setCustomer(null);
        }
      }
      if (isMounted) setIsLoading(false);
    };

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await loginCustomer(email, pass);
      setToken(res.token);
      localStorage.setItem(TOKEN_KEY, res.token);
      document.cookie = `${TOKEN_KEY}=${res.token}; path=/; max-age=2592000; SameSite=Lax`;
      const cust = await getCustomer(res.token);
      setCustomer(cust);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await registerCustomer(data);
      setToken(res.token);
      localStorage.setItem(TOKEN_KEY, res.token);
      document.cookie = `${TOKEN_KEY}=${res.token}; path=/; max-age=2592000; SameSite=Lax`;
      setCustomer(res.customer);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setCustomer(null);
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  };

  const refreshCustomer = async () => {
    if (!token) return;
    try {
      const cust = await getCustomer(token);
      setCustomer(cust);
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
