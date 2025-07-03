"use client";

import { useEffect, useState } from "react";
import { useLoadingStore } from "@/app/lib/store";

export function LoadingBar() {
  const { loading } = useLoadingStore();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (loading) {
      setIsVisible(true);
      setProgress(0);
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 100);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-blue-200">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-700 text-center">
        Connecting to t3h.dracode.org...
      </div>
    </div>
  );
}
