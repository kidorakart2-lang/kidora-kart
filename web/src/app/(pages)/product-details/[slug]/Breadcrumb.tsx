import { motion } from "framer-motion";
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
      className="flex items-center gap-2 text-sm text-gray-600 mb-6"
      role="navigation"
      aria-label="Breadcrumb"
    >
      <Link
        href="/"
        className="text-amber-600 hover:text-amber-700 transition-colors font-medium"
        onClick={(e) => handleClick(e, "/")}
      >
        Home
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight
            size={14}
            aria-hidden="true"
            className="text-gray-400"
          />
          {index === items.length - 1 ? (
            <span className="text-gray-900 font-medium" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href ?? "#"}
              className="text-amber-600 hover:text-amber-700 transition-colors font-medium"
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
