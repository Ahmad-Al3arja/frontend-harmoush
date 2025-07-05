"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "../lib/store";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { LogOut } from "lucide-react";

export default function DeleteAccount() {
  // Password no longer required for account deletion
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { user, accessToken, logout, refreshAccessToken } = useAuthStore();
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!accessToken) {
          // Redirect to login with the delete-account path as the 'from' parameter
          router.push("/login?from=/delete-account");
          return;
        }

        if (!user) {
          await refreshAccessToken();
        }
      } catch (error) {
        // Redirect to login with the delete-account path as the 'from' parameter
        router.push("/login?from=/delete-account");
      } finally {
        setIsAuthChecking(false);
      }
    };

    checkAuth();
  }, [accessToken, user, router, refreshAccessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Show confirmation dialog instead of immediately deleting
    setShowConfirmation(true);
  };

  // Function to handle the actual account deletion after confirmation
  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      setShowConfirmation(false);

      // Call the delete account API without password in the payload
      if (user?.id && accessToken) {
        // Send DELETE request to users/<id>/delete/ without password in payload
        const response = await fetch(
          `https://amris.duckdns.org/api/users/${user.id}/delete/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Invalid password or server error"
          );
        }

        // Account deletion was successful
        setSuccess("Your account has been successfully deleted.");

        // Log the user out and redirect to login page
        setTimeout(() => {
          logout();
          router.push("/login");
        }, 2000);
      }
    } catch (error: any) {
      // Handle certificate errors gracefully
      if (error instanceof Error && (
        error.message.includes('certificate') || 
        error.message.includes('CERT_') ||
        error.message.includes('SSL') ||
        error.message.includes('TLS') ||
        error.message.includes('self-signed')
      )) {
        console.warn('Certificate error detected while deleting account');
        setError('Connection security issue. Please contact your administrator.');
      } else {
        // Show the error message but don't redirect
        setError(
          error.message || "Failed to delete account. Please try again later."
        );
      }
      console.error("Delete account error:", error);
      // No password field to reset
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for manual logout
  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Show loading state while checking auth
  if (isAuthChecking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Account Deletion
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete your account? This action cannot
              be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
              >
                {isLoading ? "Processing..." : "Yes, Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Delete Account</h1>
          <p className="mt-2 text-sm text-gray-600">
            This action cannot be undone. Please be certain.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
        )}

        {success && (
          <div className="p-3 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}

        {/* Manual Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <p className="block text-sm text-gray-600 mb-4">
              Account: <span className="font-medium">{user?.email}</span>
            </p>
            <p className="block text-sm text-gray-700 mb-4">
              Click the button below to permanently delete your account.
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300"
            >
              {isLoading ? "Processing..." : "Delete My Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
