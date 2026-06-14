"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { verifyCode } from "@/lib/api";

export type Role = "public" | "staff" | "admin";

const SESSION_KEY = "medtrust_role";

interface AuthContextType {
  role: Role;
  isStaff: boolean;  // staff OR owner
  isAdmin: boolean;  // owner only
  tryUnlock: (code: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  role: "public",
  isStaff: false,
  isAdmin: false,
  tryUnlock: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("public");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(SESSION_KEY) as Role | null;
      if (saved === "staff" || saved === "admin") setRole(saved);
    }
  }, []);

  const tryUnlock = useCallback(async (code: string) => {
    try {
      const { valid, role: r } = await verifyCode(code);
      if (valid && (r === "staff" || r === "admin")) {
        sessionStorage.setItem(SESSION_KEY, r);
        setRole(r);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const isStaff = role === "staff" || role === "admin";
  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider value={{ role, isStaff, isAdmin, tryUnlock }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
