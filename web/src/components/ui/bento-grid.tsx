import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[14rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group/bento row-span-1 flex flex-col justify-between rounded-xl bg-neutral-50 p-4 transition duration-200 hover:shadow-lg dark:bg-neutral-900",
        className,
      )}
    >
      {header}
      <div className="transition duration-200">
        {icon}
        <div className="mt-2 font-sans text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          {title}
        </div>
        {description && (
          <div className="font-sans text-xs font-normal text-neutral-500 dark:text-neutral-400">
            {description}
          </div>
        )}
      </div>
    </div>
  );
};
