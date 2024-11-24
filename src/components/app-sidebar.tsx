'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AppSidebar({ collapsed, onToggleCollapse }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "fixed top-0 left-0 h-screen bg-background border-r transition-all duration-200 ease-in-out flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-xl font-semibold">HVAC Dialler</h1>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-accent rounded-md"
        >
          {!collapsed ? (
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
          {!collapsed && <span>Lead Management</span>}
        </Link>
        <Link
          href="/settings"
          className={cn(
            "flex items-center space-x-2 p-2 rounded-md hover:bg-accent",
            pathname === "/settings" && "bg-accent"
          )}
        >
          <Settings className="h-4 w-4" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </nav>
    </div>
  );
}
