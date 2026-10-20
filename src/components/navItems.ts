import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  CalendarDays,
  Folder,
  LayoutDashboard,
  Settings,
  TrendingUp,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

// Navigation shared by the desktop sidebar and the mobile bottom nav.
export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transacciones", icon: ArrowLeftRight },
  { to: "/categories", label: "Categorías", icon: Folder },
  { to: "/monthly", label: "Mensual", icon: CalendarDays },
  { to: "/annual", label: "Anual", icon: TrendingUp },
  { to: "/settings", label: "Ajustes", icon: Settings },
];
