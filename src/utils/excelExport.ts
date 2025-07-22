import * as XLSX from "xlsx";

export interface WeeklySummary {
  description: string;
  total: number | string;
  remarks?: string;
}

export function exportWeeklySummaryAndReports(
  summary: WeeklySummary[],
  reports: any[],
  fileName = "weekly_report.xlsx"
) {
  // Prepare summary sheet
  const summarySheetData = [
    ["S.no", "Description", "Total Number", "Remarks"],
    ...summary.map((row, i) => [
      i + 1,
      row.description,
      row.total,
      row.remarks || "",
    ]),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);

  // Prepare reports sheet
  const reportHeaders = [
    "Vessel Name",
    "Port",
    "Purpose",
    "Status",
    "Total Qty",
    "Demurrages",
    "Departure",
  ];
  const reportSheetData = [
    reportHeaders,
    ...reports.map((r) => [
      r.vesselName || "",
      r.port?.portName || r.portId || "",
      r.purposeOfArrival || "",
      r.status || "",
      r.totalQuantity ?? "",
      r.demurragesCollected ?? "",
      r.departureDate || "",
    ]),
  ];
  const reportSheet = XLSX.utils.aoa_to_sheet(reportSheetData);

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(wb, reportSheet, "Reports");

  // Export
  XLSX.writeFile(wb, fileName);
}
