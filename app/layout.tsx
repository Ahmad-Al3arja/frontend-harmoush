import "./globals.css";
import { Inter } from "next/font/google";
import { RootProvider } from "./providers/root-provider";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Talabak Admin Dashboard",
  description: "Admin dashboard for Talabak marketplace",
};

function PageContent({ children }: { children: React.ReactNode }) {
  return (
    <RootProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        }
      >
        {children}
      </Suspense>
    </RootProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          }
        >
          <PageContent>{children}</PageContent>
        </Suspense>
      </body>
    </html>
  );
}
