import {
  Home,
  FileText,
  MessageSquare,
  User,
  Settings,
  Bell,
  BarChart,
  Users,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

export type VvRole = "user" | "reviewer" | "admin" | "head-admin";

export type VvNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
};

export type VvNavConfig = {
  primary: VvNavItem[];
  secondary: VvNavItem[];
  crumb: string;
};

const SECONDARY: VvNavItem[] = [
  { id: "community", label: "Community", icon: MessageSquare, href: "/community" },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/notifications" },
];

export const NAV_BY_ROLE: Record<VvRole, VvNavConfig> = {
  user: {
    primary: [
      { id: "dashboard", label: "Dashboard", icon: Home, href: "/dashboard" },
      { id: "applications", label: "Applications", icon: FileText, href: "/applications" },
    ],
    secondary: SECONDARY,
    crumb: "Pilot workspace",
  },
  reviewer: {
    primary: [
      { id: "dashboard", label: "Dashboard", icon: Home, href: "/admin" },
      { id: "admin-applications", label: "Applications", icon: FileText, href: "/admin/applications" },
    ],
    secondary: SECONDARY,
    crumb: "Review queue",
  },
  admin: {
    primary: [
      { id: "dashboard", label: "Dashboard", icon: Home, href: "/admin" },
      { id: "admin-applications", label: "Applications", icon: FileText, href: "/admin/applications" },
      { id: "admin-analytics", label: "Analytics", icon: BarChart, href: "/admin/analytics" },
    ],
    secondary: SECONDARY,
    crumb: "Admin · VAA",
  },
  "head-admin": {
    primary: [
      { id: "dashboard", label: "Dashboard", icon: Home, href: "/admin" },
      { id: "admin-applications", label: "Applications", icon: FileText, href: "/admin/applications" },
      { id: "admin-analytics", label: "Analytics", icon: BarChart, href: "/admin/analytics" },
      { id: "admin-users", label: "User Management", icon: Users, href: "/admin/users" },
      { id: "admin-audit", label: "Audit Log", icon: ListChecks, href: "/admin/audit-log" },
    ],
    secondary: SECONDARY,
    crumb: "Admin · VAA",
  },
};

export const ROLE_LABEL: Record<VvRole, string> = {
  user: "Pilot",
  reviewer: "Reviewer",
  admin: "Admin",
  "head-admin": "Head Admin",
};

export function navConfigForRole(role?: string | null): VvNavConfig {
  return NAV_BY_ROLE[(role as VvRole) ?? "user"] ?? NAV_BY_ROLE.user;
}
