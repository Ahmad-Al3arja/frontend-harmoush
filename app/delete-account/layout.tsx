"use client";

import { Suspense } from "react";

// Simple layout that doesn't include the dashboard components
export default function DeleteAccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
