"use client";

import { BentoCell, BentoCellContent, CellLink } from "./BentoCell";

interface FeaturedLargeLayoutProps {
  cells: BentoCell[];
}

export default function FeaturedLargeLayout({ cells }: FeaturedLargeLayoutProps) {
  const [first, second, third] = cells;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {first && (
        <CellLink cell={first} className="md:col-span-2 md:row-span-2">
          <BentoCellContent cell={first} className="h-full min-h-[280px] md:min-h-[400px]" />
        </CellLink>
      )}
      {second && (
        <CellLink cell={second}>
          <BentoCellContent cell={second} className="h-full min-h-[192px]" />
        </CellLink>
      )}
      {third && (
        <CellLink cell={third}>
          <BentoCellContent cell={third} className="h-full min-h-[192px]" />
        </CellLink>
      )}
    </div>
  );
}
