"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import {
  MenuIcon,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <html lang="en">
      <body className={inter.className}>
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
            <nav className="flex-1 px-2 py-4">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className={cn(
                      "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                      pathname === "/" ? "bg-accent" : "hover:bg-accent"
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-3" />
                    {isSidebarOpen && "Dashboard"}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/settings"
                    className={cn(
                      "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                      pathname === "/settings" ? "bg-accent" : "hover:bg-accent"
                    )}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    {isSidebarOpen && "Settings"}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div
            className={cn(
              "flex-1 transition-all duration-200 ease-in-out",
              isSidebarOpen ? "ml-64" : "ml-16"
            )}
          >
            <main className="p-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
