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
  House,
  History,
  Sparkles,
  Megaphone,
  ShoppingBag,
  Tags,
  MessageCircle,
  Ruler,
  type LucideIcon,
} from "lucide-react";
import type { LucideIcon as LucideIconType } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  target?: string;
}

export interface NavItemWithIcon extends NavItem {
  icon: LucideIconType;
}

export interface NavSection {
  label: string;
  icon: LucideIconType;
  items: NavItemWithIcon[];
}

// Section definitions for collapsible groups in the sidebar
export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    items: [
      { label: "Orders", href: "/dashboard/orders", icon: ShoppingBag },
    ],
  },
  {
    label: "Products",
    icon: Package,
    items: [
      { label: "Products", href: "/dashboard/products", icon: Package },
      { label: "Reviews", href: "/dashboard/reviews", icon: MessageSquare },
      { label: "Product FAQs", href: "/dashboard/product-faqs", icon: HelpCircle },
      { label: "Categories", href: "/dashboard/categories", icon: FolderTree },
      { label: "Sub Categories", href: "/dashboard/sub-category", icon: Tags },
      { label: "Sub Sub Categories", href: "/dashboard/sub-sub-category", icon: Tags },
      { label: "Materials & Colors", href: "/dashboard/materials", icon: Palette },
      { label: "Sizes", href: "/dashboard/sizes", icon: Ruler },
    ],
  },
  {
    label: "Content",
    icon: ImageIcon,
    items: [
      { label: "Home Page", href: "/dashboard/home-page", icon: House },
      { label: "Banners", href: "/dashboard/banners", icon: Megaphone },
      { label: "Testimonials", href: "/dashboard/testimonials", icon: MessageCircle },
      { label: "FAQs", href: "/dashboard/faqs", icon: HelpCircle },
      { label: "Why Choose Us", href: "/dashboard/why-choose-us", icon: Star },
      { label: "Logos", href: "/dashboard/logos", icon: ImageIcon },
    ],
  },
  {
    label: "Users",
    icon: Users,
    items: [
      { label: "Users", href: "/dashboard/users", icon: Users },
    ],
  },
  {
    label: "System",
    icon: Sparkles,
    items: [
      // ── AI (disabled for Jewellery Walla) ──
      // The autonomous AI agent chat and AI-generated response history are
      // intentionally hidden on this branch. To re-enable: uncomment the items
      // below (and the API route mount in `api/src/server.ts`, marked with the
      // same comment).
      // { label: "AI Agent", href: "/dashboard/ai-agent", icon: Sparkles, target: "_blank" },
      // { label: "AI Responses", href: "/dashboard/ai-responses", icon: History },
      { label: "Audit Log", href: "/dashboard/audit-log", icon: History },
      { label: "Settings", href: "/dashboard/settings", icon: LayoutDashboard },
    ],
  },
];

// Flatten for backward compatibility (used by other parts of the codebase)
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) =>
  section.items.map(({ label, href, target }) => ({
    label,
    href,
    target,
  })),
);

export const NAV_ITEMS_WITH_ICONS: NavItemWithIcon[] = NAV_SECTIONS.flatMap(
  (section) => section.items,
);
