
"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// A helper function to capitalize the first letter of a string and decode URI components
const formatSegment = (s: string) =>
  decodeURIComponent(s).charAt(0).toUpperCase() + decodeURIComponent(s).slice(1);

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Do not show breadcrumbs on the root dashboard pages
  if (segments.length === 0 || (segments.length === 1 && (segments[0] === 'dashboard' || segments[0] === 'admin'))) {
    return <div className="hidden md:flex h-10 items-center"></div>; // Placeholder to maintain layout
  }

  // Handle case where it's just one level deep but not a root dashboard
  if (segments.length === 1) {
    return (
        <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbPage>{formatSegment(segments[0])}</BreadcrumbPage>
            </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  return (
    <Breadcrumb className="hidden md:flex">
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const originalHref = "/" + segments.slice(0, index + 1).join("/");
          let href = originalHref;
          const isLast = index === segments.length - 1;
          
          // When the path is /admin/applications/..., the "Applications" part should link back to /admin/applications
          if (segment === 'applications' && segments[0] === 'admin' && !isLast) {
            href = '/admin/applications';
          }

          return (
            <React.Fragment key={originalHref}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{formatSegment(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{formatSegment(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
