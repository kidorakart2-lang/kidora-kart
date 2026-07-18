"use client";

import { Button } from "@/components/ui/button";
import { FileJson, FileSpreadsheet } from "lucide-react";
import { exportToJSON, exportToCSV } from "@/lib/export-utils";
import { useState } from "react";

interface ExportButtonsProps<T extends object> {
  data: T[];
  filename?: string;
}

export function ExportButtons<T extends object>({ data, filename = "export" }: ExportButtonsProps<T>) {
  const [exporting, setExporting] = useState(false);

  const handleExportJSON = () => {
    if (exporting) return;
    setExporting(true);
    exportToJSON(data, `${filename}.json`);
    setExporting(false);
  };

  const handleExportCSV = () => {
    if (exporting) return;
    setExporting(true);
    exportToCSV(data, `${filename}.csv`);
    setExporting(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportJSON}
        disabled={exporting}
        className="transition-all duration-200 hover:scale-105 bg-transparent"
      >
        <FileJson className="h-4 w-4 mr-2" />
        Export JSON
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportCSV}
        disabled={exporting}
        className="transition-all duration-200 hover:scale-105 bg-transparent"
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
}
