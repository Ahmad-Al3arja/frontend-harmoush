"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, User, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { useAuthStore } from "../../lib/store";
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";

export function Header() {
  const router = useRouter();
  const { user, logout, admin } = useAuthStore();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Check connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus('checking');
        await api.health.check();
        setConnectionStatus('connected');
      } catch (error) {
        setConnectionStatus('disconnected');
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) return null;

  // Connection status indicator
  const statusColor =
    connectionStatus === 'connected'
      ? 'bg-green-100 text-green-700 border-green-200'
      : connectionStatus === 'checking'
      ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
      : 'bg-red-100 text-red-700 border-red-200';
  const statusDot =
    connectionStatus === 'connected'
      ? 'bg-green-500'
      : connectionStatus === 'checking'
      ? 'bg-yellow-400'
      : 'bg-red-500';
  const statusText =
    connectionStatus === 'connected'
      ? 'Connected'
      : connectionStatus === 'checking'
      ? 'Checking...'
      : 'Disconnected';

  return (
    <header className="w-full bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand and Dashboard Title */}
        <div className="flex items-center gap-4">
          <span className="text-2xl font-extrabold text-blue-700 tracking-tight select-none">Talabak 3nd Harmoush</span>
          <span className="hidden md:inline-block text-lg font-semibold text-gray-900 ml-4">Dashboard</span>
        </div>
        {/* Right Side: Status, User, Logout */}
        <div className="flex items-center gap-6">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-xl border text-sm font-medium ${statusColor} transition-colors`}>
            <span className={`inline-block w-2 h-2 rounded-full ${statusDot} mr-1`} />
            <span>{statusText}</span>
            <span className="ml-2 text-xs text-blue-600 font-mono hidden sm:inline">
              {process.env.NEXT_PUBLIC_API_DOMAIN || "amris.duckdns.org"}
            </span>
          </div>
          {/* User Info */}
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
            <User className="w-5 h-5 text-blue-500" />
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</span>
              <span className="text-xs text-gray-500">{user.email}</span>
              {admin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">Admin</span>
              )}
            </div>
          </div>
          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="text-gray-600 hover:text-white hover:bg-blue-600 border-blue-200 shadow-sm rounded-lg px-4 py-2 font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
