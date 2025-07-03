"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  Package,
  Users,
  Settings,
  LayoutDashboard,
  FolderTree,
  Flag,
  BarChart3,
  Video,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    href: "/dashboard",
  },
  {
    title: "Analytics",
    icon: <BarChart3 className="w-5 h-5" />,
    href: "/analytics",
  },
  {
    title: "Products",
    icon: <Package className="w-5 h-5" />,
    href: "/products",
  },
  {
    title: "Categories",
    icon: <FolderTree className="w-5 h-5" />,
    href: "/categories",
  },
  {
    title: "Users",
    icon: <Users className="w-5 h-5" />,
    href: "/users",
  },
  {
    title: "Reports",
    icon: <Flag className="w-5 h-5" />,
    href: "/reports",
  },
  {
    title: "Advertisement Videos",
    icon: <Video className="w-5 h-5" />,
    href: "/videos/advertisement",
  },
];

export function Sidebar() {
  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="h-screen w-64 bg-background border-r p-4 flex flex-col"
    >
      <div className="flex items-center gap-2 ps-2 mb-8">
        <Home className="w-6 h-6" />
        <span className="font-bold text-[16px]">Talabak 3nd Harmoush</span>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <motion.li
              key={item.href}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </nav>
    </motion.div>
  );
}
