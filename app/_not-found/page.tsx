"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Separate component for any hooks
function NotFoundContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-lg text-gray-600">Page not found</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          Go back to dashboard
        </button>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <NotFoundContent />
    </Suspense>
  );
}
