/**
 * Export utilities for JSON and CSV
 */

/** Row data with string keys and unknown values */
type ExportRow = Record<string, unknown>;

/**
 * Export data as a JSON file download.
 * @param data - The data to export
 * @param filename - The output filename (default: "export.json")
 */
export function exportToJSON(data: unknown, filename = "export.json"): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export an array of objects as a CSV file download.
 * @param data - Array of row objects
 * @param filename - The output filename (default: "export.csv")
 */
export function exportToCSV<T extends object>(data: T[], filename = "export.csv"): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0] ?? {});
  const csvRows: string[] = [];

  csvRows.push(headers.join(","));

  for (const row of data) {
    const values = headers.map((header) => {
      const value = (row as ExportRow)[header];
      const escaped = ("" + value).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
