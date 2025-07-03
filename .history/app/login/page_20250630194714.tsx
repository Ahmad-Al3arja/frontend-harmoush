"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../lib/store";
import { api } from "../lib/api";
import { Suspense } from "react";

// Separate component for the login content
function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, accessToken, admin } = useAuthStore();

  useEffect(() => {
    if (accessToken && user) {
      // Check if the user is an admin
      if (admin) {
        // Admin users: Check if they were trying to access a specific page
        console.log("Admin user detected, redirecting to dashboard");
        const from = searchParams?.get("from");
        if (from === "/delete-account") {
          // Redirect directly to delete-account without going through dashboard
          router.replace("/delete-account");
        } else {
          router.replace("/dashboard");
        }
      } else {
        // Non-admin users: Always redirect to delete-account
        console.log("Non-admin user detected, redirecting to delete-account");
        router.replace("/delete-account");
      }
    }
  }, [accessToken, user, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Check if using admin credentials
      const isAdminLogin = email === "arjaahmad782@gmail.com" && password === "12341234";
      
      if (isAdminLogin) {
        // Create mock admin user data
        const mockAdminData = {
          user: {
            id: 1,
            email: "arjaahmad782@gmail.com",
            name: "Admin User",
            phone: "1234567890",
            is_seller: false,
            admin: true,
            is_admin: true,
            bio: "System Administrator",
            profile_picture: null,
            created_at: new Date().toISOString(),
            is_whatsapp: false,
            show_phone: false,
            is_email_verified: true
          },
          access: "mock_admin_access_token",
          refresh: "mock_admin_refresh_token",
          admin: true
        };

        // Store admin data in auth store
        useAuthStore.getState().login(email, password);
        
        // Manually set admin data
        useAuthStore.setState({
          user: mockAdminData.user,
          accessToken: mockAdminData.access,
          refreshToken: mockAdminData.refresh,
          admin: true
        });

        console.log("Admin login successful");
        return;
      }

      // Regular API login for other users
      const response = await fetch(`https://t3h.dracode.org/api/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Invalid email or password");
      }

      // Parse the response
      const data = await response.json();
      console.log("Login response:", data);

      // Complete the login process regardless of admin status
      useAuthStore.getState().login(email, password);

      // Navigation will be handled by the useEffect hook after login completes
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (accessToken && user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow"
      >
        <div>
          <h2 className="text-center text-3xl font-bold">Login</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in by entering your email and password
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded text-sm text-center">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
