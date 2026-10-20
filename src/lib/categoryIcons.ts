import {
  Award,
  Baby,
  Briefcase,
  Bus,
  Car,
  Coffee,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  Package,
  Plane,
  Receipt,
  Salad,
  Shapes,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Stethoscope,
  Tv,
  UtensilsCrossed,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// Name → lucide icon registry for categories. Stored as a plain string in the
// DB so it survives serialization; resolved to a component at render time.
const REGISTRY: Record<string, LucideIcon> = {
  Award,
  Baby,
  Briefcase,
  Bus,
  Car,
  Coffee,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  Package,
  Plane,
  Receipt,
  Salad,
  Shapes,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Stethoscope,
  Tv,
  UtensilsCrossed,
  Wallet,
  Wrench,
};

// Curated list offered in the category icon picker.
export const ICON_CHOICES = Object.keys(REGISTRY);

// Fallback keeps rendering safe for unknown/legacy names.
export function getCategoryIcon(name: string | null): LucideIcon {
  if (name && REGISTRY[name]) return REGISTRY[name];
  return Shapes;
}
