"use client";

import { DashboardLayout } from "./dashboard-layout";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
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
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // First, check the initial session
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAuthenticated(!!session);
      
      if (!session && pathname !== "/login") {
        router.push("/login");
      }
      setLoading(false);
    };

    checkAuth();

    // Then listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isAuthenticated = !!session;
      setAuthenticated(isAuthenticated);

      if (!isAuthenticated && pathname !== "/login") {
        router.push("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router, supabase.auth]);

  if (loading) {
    return <LoadingScreen />;
  }

  // Only show login page content when on login page
  if (pathname === "/login") {
    return children;
  }

  // Show dashboard layout for authenticated users
  if (authenticated) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  // This should never be reached due to the redirect in useEffect
  return <LoadingScreen />;
}
