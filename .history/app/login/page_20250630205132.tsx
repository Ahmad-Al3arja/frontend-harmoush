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
  }, [accessToken, user, router, searchParams, admin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use the proper API helper for login
      await login(email, password);
      
      // The navigation will be handled by the useEffect hook after login completes
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (accessToken && user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-100"
      >
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">Admin Login</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access the admin dashboard
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg text-sm text-center"
            >
              {error}
            </motion.div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              "Sign in to Dashboard"
            )}
          </Button>
        </form>
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Connected to: <span className="font-mono text-blue-600">t3h.dracode.org</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
