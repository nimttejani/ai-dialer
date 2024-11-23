"use client";

import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex">
      <div
        className={cn(
          "fixed top-0 left-0 h-screen bg-background border-r transition-all duration-200 ease-in-out flex flex-col",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="p-4 flex items-center justify-between">
          {isSidebarOpen && (
            <h1 className="text-xl font-semibold">HVAC Dialler</h1>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-accent rounded-md"
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/"
            className={cn(
              "flex items-center space-x-2 p-2 rounded-md hover:bg-accent",
              pathname === "/" && "bg-accent"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            {isSidebarOpen && <span>Dashboard</span>}
          </Link>
          <Link
            href="/settings"
            className={cn(
              "flex items-center space-x-2 p-2 rounded-md hover:bg-accent",
              pathname === "/settings" && "bg-accent"
            )}
          >
            <Settings className="h-4 w-4" />
            {isSidebarOpen && <span>Settings</span>}
          </Link>
        </nav>
      </div>
      <main
        className={cn(
          "flex-1 p-8 transition-all duration-200 ease-in-out",
          isSidebarOpen ? "ml-64" : "ml-16"
        )}
      >
        {children}
      </main>
    </div>
  );
};
