import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
}

const Breadcrumb = ({ items = [] }: BreadcrumbProps) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    router.push(href);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
      role="navigation"
      aria-label="Breadcrumb"
    >
      <Link
        href="/"
        className="text-brand-600 hover:text-brand-700 transition-colors font-medium"
        onClick={(e) => handleClick(e, "/")}
      >
        Home
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight
            size={14}
            aria-hidden="true"
            className="text-muted-foreground"
          />
          {index === items.length - 1 ? (
            <span className="text-foreground font-medium" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href ?? "#"}
              className="text-brand-600 hover:text-brand-700 transition-colors font-medium"
              onClick={(e) => handleClick(e, item.href ?? "#")}
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </motion.div>
  );
};

export default Breadcrumb;
