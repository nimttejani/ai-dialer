"use client";

import { DashboardLayout } from "./dashboard-layout";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Spinner } from "@/components/ui/spinner";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}

export function AuthAwareLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setAuthenticated(!!session);
        
        // Handle routing based on auth state
        if (!session && pathname !== "/login") {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [supabase.auth, pathname, router]);

  if (loading) {
    return <LoadingScreen />;
  }

  // Only show login page content when on login page
  if (pathname === "/login") {
    return children;
  }

  // Require authentication for all other pages
  if (!authenticated) {
    return <LoadingScreen />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
