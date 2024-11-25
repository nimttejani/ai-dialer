"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex">
      <Sidebar
        collapsed={!isSidebarOpen}
        onToggleCollapse={() => setIsSidebarOpen(!isSidebarOpen)}
      />
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
