"use client";

import { BentoCell, BentoCellContent, CellLink } from "./BentoCell";

interface TwoColLayoutProps {
  cells: BentoCell[];
}

export default function TwoColLayout({ cells }: TwoColLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cells.slice(0, 2).map((cell, i) => (
        <CellLink key={i} cell={cell}>
          <BentoCellContent cell={cell} className="h-[200px] md:h-[250px]" />
        </CellLink>
      ))}
    </div>
  );
}
