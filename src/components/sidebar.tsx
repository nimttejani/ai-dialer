'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from "@/lib/utils"
import { ThemeToggle } from './theme-toggle'
import { Button } from './ui/button'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "fixed top-0 left-0 h-screen bg-background border-r transition-all duration-200 ease-in-out flex flex-col",
        collapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]"
      )}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-xl font-semibold">AI Dialer</h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className={cn(
            "p-2 hover:bg-accent rounded-md",
            collapsed && "w-full flex justify-center"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link
          href="/"
          className={cn(
            "flex items-center space-x-2 rounded-md p-2 hover:bg-accent",
            pathname === "/" && "bg-accent",
            collapsed && "justify-center"
          )}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Lead Management</span>}
        </Link>
        <Link
          href="/settings"
          className={cn(
            "flex items-center space-x-2 rounded-md p-2 hover:bg-accent",
            pathname === "/settings" && "bg-accent",
            collapsed && "justify-center"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </nav>
      <div className="p-4 border-t">
        <ThemeToggle 
          className="w-full justify-start" 
          collapsed={collapsed}
        />
      </div>
    </div>
  )
}
