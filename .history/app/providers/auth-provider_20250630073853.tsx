"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/app/lib/store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return <>{children}</>;
}
