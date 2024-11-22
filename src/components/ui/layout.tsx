"use client";

import { cn } from "@/lib/utils";
import { MenuIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen">
      <div
        className={cn(
          "fixed top-0 left-0 h-screen w-64 bg-background border-r transition-transform duration-200 ease-in-out",
          !isSidebarOpen && "-translate-x-full"
        )}
      >
        <div className="p-6">
          <h1 className="text-xl font-semibold">HVAC Dialler</h1>
        </div>
        <nav className="px-4 py-2">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-accent rounded-md lg:hidden"
          >
            <MenuIcon className="h-4 w-4" />
          </button>
          <ul className="space-y-2">
            <li>
              <Link
                href="/"
                className="flex items-center px-4 py-2 text-sm font-medium rounded-md bg-accent"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/settings"
                className="flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent"
              >
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div
        className={cn(
          "transition-margin duration-200 ease-in-out",
          isSidebarOpen ? "ml-64" : "ml-0"
        )}
      >
        <div className="sticky top-0 z-10 bg-background border-b lg:hidden">
          <button onClick={() => setIsSidebarOpen(true)} className="p-4">
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
