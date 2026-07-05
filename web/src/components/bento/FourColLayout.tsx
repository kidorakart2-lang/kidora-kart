"use client";

import { BentoCell, BentoCellContent, CellLink } from "./BentoCell";

interface FourColLayoutProps {
  cells: BentoCell[];
}

export default function FourColLayout({ cells }: FourColLayoutProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cells.slice(0, 4).map((cell, i) => (
        <CellLink key={i} cell={cell}>
          <BentoCellContent cell={cell} className="h-[160px] md:h-[220px]" />
        </CellLink>
      ))}
    </div>
  );
}
