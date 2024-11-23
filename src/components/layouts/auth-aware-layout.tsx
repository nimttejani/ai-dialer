"use client";

import { DashboardLayout } from "./dashboard-layout";
import { usePathname } from "next/navigation";

export function AuthAwareLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Show plain content for login page, dashboard layout for authenticated pages
  return pathname === "/login" ? children : <DashboardLayout>{children}</DashboardLayout>;
}
