"use client";

import { motion } from "framer-motion";
import { Bell, User, LogOut, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { useAuthStore } from "../../lib/store";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="container h-full flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-4">
          {/* <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5" />
          </Button> */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white p-2 rounded-md shadow-lg border"
            >
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{user?.email}</p>
                <p className="text-gray-500 text-xs">
                  {user?.is_seller ? "Seller" : "Buyer"}
                </p>
              </div>
              <DropdownMenuSeparator className="my-1 border-t" />
              {/* <DropdownMenuItem className="cursor-pointer flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-100 rounded">
                <Settings className="w-4 h-4" />
                Settings
              </DropdownMenuItem> */}
              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-2 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
