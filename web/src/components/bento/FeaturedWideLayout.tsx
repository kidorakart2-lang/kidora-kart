"use client";

import { BentoCell, BentoCellContent, CellLink } from "./BentoCell";

interface FeaturedWideLayoutProps {
  cells: BentoCell[];
}

export default function FeaturedWideLayout({ cells }: FeaturedWideLayoutProps) {
  const [first, second, third] = cells;

  return (
    <div className="flex flex-col gap-4">
      {first && (
        <CellLink cell={first}>
          <BentoCellContent cell={first} className="h-[200px] md:h-[300px]" />
        </CellLink>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {second && (
          <CellLink cell={second}>
            <BentoCellContent cell={second} className="h-[180px] md:h-[200px]" />
          </CellLink>
        )}
        {third && (
          <CellLink cell={third}>
            <BentoCellContent cell={third} className="h-[180px] md:h-[200px]" />
          </CellLink>
        )}
      </div>
    </div>
  );
}
