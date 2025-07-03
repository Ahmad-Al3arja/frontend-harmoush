"use client";

import { AuthProvider } from "./auth-provider";
import { LoadingBar } from "../components/ui/loading-bar";

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LoadingBar />
      {children}
    </AuthProvider>
  );
}
