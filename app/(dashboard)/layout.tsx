"use client";

import { Header } from "@/app/components/layout/header";
import { Sidebar } from "@/app/components/layout/sidebar";
import { useAuthStore } from "@/app/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

// Separate component for auth checking
function AuthCheck({ children }: { children: React.ReactNode }) {
  const { accessToken, user, admin, refreshAccessToken, logout } =
    useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isNotAdmin, setIsNotAdmin] = useState(false);

  // Function to check if current path is delete-account
  const isDeleteAccountPath = () => {
    return (
      typeof window !== "undefined" &&
      window.location.pathname === "/delete-account"
    );
  };

  useEffect(() => {
    // Skip auth check for delete-account path
    if (isDeleteAccountPath()) {
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        if (!accessToken) {
          // For all other paths, redirect to login
          router.push("/login");
          return;
        }

        if (!user) {
          await refreshAccessToken();
        }

        // Check if the current user has admin privileges
        if (
          admin === false ||
          (user && (user.admin === false || user.is_admin === false))
        ) {
          // User is not an admin; stop loading and show not-admin message
          setIsNotAdmin(true);
          return;
        }
      } catch (error) {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [accessToken, user, router, refreshAccessToken, logout, admin]);

  // Show loading spinner while checking auth (except for delete-account path)
  if (isLoading && !isDeleteAccountPath()) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is not an admin, show a friendly message
  if (isNotAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-semibold text-red-600">
          You're not an admin.
        </p>
      </div>
    );
  }

  // Skip auth check for delete-account path
  if (!accessToken && !isDeleteAccountPath()) return null;

  // Skip rendering dashboard layout for delete-account path
  if (isDeleteAccountPath()) {
    return null;
  }

  return children;
}

// Separate component for layout structure
function LayoutStructure({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Suspense fallback={<div className="w-64 bg-gray-100 animate-pulse" />}>
        <Sidebar />
      </Suspense>
      <div className="flex-1 flex flex-col">
        <Suspense
          fallback={<div className="h-16 bg-white border-b animate-pulse" />}
        >
          <Header />
        </Suspense>
        <main className="flex-1 overflow-y-auto p-6">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

// Main dashboard content
function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <AuthCheck>
        <LayoutStructure>{children}</LayoutStructure>
      </AuthCheck>
    </Suspense>
  );
}

// Main layout component
export default function DashboardLayout({
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
      <DashboardContent>{children}</DashboardContent>
    </Suspense>
  );
}
