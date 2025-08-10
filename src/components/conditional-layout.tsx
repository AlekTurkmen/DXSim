"use client"

import { usePathname } from "next/navigation";
import SiteNavbar from "@/components/site-navbar";
import SiteFooter from "@/components/site-footer";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Routes and their sub-routes where we don't want navbar/footer
  // This automatically includes all sub-routes (e.g., /library/nejm, /dashboard/settings, etc.)
  const routesWithoutNavFooter = ["/chat", "/dashboard", "/library"];
  const hideNavFooter = routesWithoutNavFooter.some(route => 
    pathname === route || pathname.startsWith(route + "/")
  );

  if (hideNavFooter) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteNavbar />
      {children}
      <SiteFooter />
    </>
  );
}
