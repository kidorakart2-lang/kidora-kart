"use client";

import { BentoCell, BentoCellContent, CellLink } from "./BentoCell";

interface ThreeColLayoutProps {
  cells: BentoCell[];
}

export default function ThreeColLayout({ cells }: ThreeColLayoutProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cells.slice(0, 3).map((cell, i) => (
        <CellLink key={i} cell={cell}>
          <BentoCellContent cell={cell} className="h-[200px] md:h-[250px]" />
        </CellLink>
      ))}
    </div>
  );
}
