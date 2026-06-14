"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { verifyCode } from "@/lib/api";

const SESSION_KEY = "medtrust_unlocked";

interface AuthContextType {
  isUnlocked: boolean;
  tryUnlock: (code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  isUnlocked: false,
  tryUnlock: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1") {
      setIsUnlocked(true);
    }
  }, []);

  const tryUnlock = useCallback(async (code: string) => {
    try {
      const { valid } = await verifyCode(code);
      if (valid) {
        sessionStorage.setItem(SESSION_KEY, "1");
        setIsUnlocked(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  return <AuthContext.Provider value={{ isUnlocked, tryUnlock }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
