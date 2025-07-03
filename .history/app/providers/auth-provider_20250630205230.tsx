"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/app/lib/store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initAuth, isInitialized } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await initAuth();
      } catch (error) {
        console.error("Failed to initialize authentication:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [initAuth]);

  // Show loading state while initializing
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-sm text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
