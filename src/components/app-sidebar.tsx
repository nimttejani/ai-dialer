'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar'

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="min-w-[3rem]">
      {({ collapsed }) => (
        <>
          <SidebarHeader className="px-3 py-2">
            <div className="flex items-center justify-between">
              {!collapsed && <h2 className="text-xl font-bold">HVAC Sales</h2>}
              <SidebarTrigger className={collapsed ? "w-full flex justify-center" : ""}>
                {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </SidebarTrigger>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/'}>
                  <Link href="/" className="flex items-center justify-center w-full">
                    <LayoutDashboard className="w-4 h-4" />
                    {!collapsed && <span className="ml-2">Dashboard</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/settings'}>
                  <Link href="/settings" className="flex items-center justify-center w-full">
                    <Settings className="w-4 h-4" />
                    {!collapsed && <span className="ml-2">Settings</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </>
      )}
    </Sidebar>
  )
}

