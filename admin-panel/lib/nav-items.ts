import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FolderTree,
  ImageIcon,
  MessageSquare,
  HelpCircle,
  Star,
  Palette,
  Ruler,
  House,
  History,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
}

export interface NavItemWithIcon extends NavItem {
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Products", href: "/dashboard/products" },
  { label: "Users", href: "/dashboard/users" },
  { label: "Audit Log", href: "/dashboard/audit-log" },
  { label: "Logos", href: "/dashboard/logos" },
  { label: "Orders", href: "/dashboard/orders" },
  { label: "Categories", href: "/dashboard/categories" },
  { label: "Sub Categories", href: "/dashboard/sub-category" },
  { label: "Sub Sub Categories", href: "/dashboard/sub-sub-category" },
  { label: "Banners", href: "/dashboard/banners" },
  { label: "Testimonials", href: "/dashboard/testimonials" },
  { label: "FAQs", href: "/dashboard/faqs" },
  { label: "Why Choose Us", href: "/dashboard/why-choose-us" },
  { label: "Materials & Colors", href: "/dashboard/materials" },
  { label: "Sizes", href: "/dashboard/sizes" },
  { label: "Home Page", href: "/dashboard/home-page" },
  { label: "Product FAQs", href: "/dashboard/product-faqs" },
  { label: "AI Responses", href: "/dashboard/ai-responses" },
];

const ICON_MAP: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Products: Package,
  Users: Users,
  "Audit Log": History,
  Logos: ImageIcon,
  Orders: ShoppingCart,
  Categories: FolderTree,
  "Sub Categories": FolderTree,
  "Sub Sub Categories": FolderTree,
  Banners: ImageIcon,
  Testimonials: MessageSquare,
  FAQs: HelpCircle,
  "Why Choose Us": Star,
  "Materials & Colors": Palette,
  Sizes: Ruler,
  "Home Page": House,
  "Product FAQs": HelpCircle,
  "AI Responses": Sparkles,
};

export const NAV_ITEMS_WITH_ICONS: NavItemWithIcon[] = NAV_ITEMS.map(
  (item) => ({
    ...item,
    icon: ICON_MAP[item.label] || LayoutDashboard,
  }),
);
