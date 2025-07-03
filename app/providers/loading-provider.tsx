"use client";

import { useEffect, Suspense } from "react";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { usePathname, useSearchParams } from "next/navigation";

// Separate component for ProgressBar
function ProgressBarWrapper() {
  return (
    <ProgressBar
      height="2px"
      color="#2563eb"
      options={{ showSpinner: false }}
      shallowRouting
    />
  );
}

function LoadingContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Add delay to show progress bar on route changes
  }, [pathname, searchParams]);

  return (
    <>
      <Suspense fallback={<div className="h-0.5 w-full bg-blue-600" />}>
        <ProgressBarWrapper />
      </Suspense>
      {children}
    </>
  );
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="h-0.5 w-full bg-blue-600" />}>
      <LoadingContent>{children}</LoadingContent>
    </Suspense>
  );
}
