"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLoadingStore } from "../../lib/api";

export function LoadingBar() {
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const loading = useLoadingStore(
    (state: { loading: boolean }) => state.loading
  );

  useEffect(() => {
    let timer: NodeJS.Timeout;
    setProgress(0);

    if (loading) {
      const increment = () => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + (90 - prev) * 0.1;
        });
      };

      timer = setInterval(increment, 100);
    } else {
      // Complete the progress bar
      setProgress(100);
      timer = setTimeout(() => {
        setProgress(0);
      }, 200);
    }

    return () => {
      clearInterval(timer);
    };
  }, [loading, pathname, searchParams]);

  if (progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <div
        className="h-full bg-blue-600 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
