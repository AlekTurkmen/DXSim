"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface BreadcrumbData {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

interface PageHeaderProps {
  breadcrumbs: BreadcrumbData[];
}

export function PageHeader({ breadcrumbs }: PageHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-neutral-200">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                  {crumb.isCurrentPage ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && (
                  <BreadcrumbSeparator className={index === 0 ? "hidden md:block" : ""} />
                )}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
