import * as XLSX from "xlsx";

export interface WeeklySummary {
  description: string;
  total: number | string;
  remarks?: string;
}

// Helper function to create cell styles
const createStyles = () => ({
  headerStyle: {
    fill: {
      fgColor: { rgb: "14B8A6" }, // seagreen-500
    },
    font: {
      bold: true,
      color: { rgb: "FFFFFF" }, // white
      size: 11,
    },
    alignment: {
      horizontal: "left",
      vertical: "center",
      wrapText: true,
    },
    border: {
      top: { style: "thin", color: { rgb: "E5E7EB" } },
      bottom: { style: "thin", color: { rgb: "E5E7EB" } },
      left: { style: "thin", color: { rgb: "E5E7EB" } },
      right: { style: "thin", color: { rgb: "E5E7EB" } },
    },
  },
  cellStyle: {
    alignment: {
      horizontal: "left",
      vertical: "center",
      wrapText: true,
    },
    font: {
      size: 10,
    },
    border: {
      top: { style: "thin", color: { rgb: "E5E7EB" } },
      bottom: { style: "thin", color: { rgb: "E5E7EB" } },
      left: { style: "thin", color: { rgb: "E5E7EB" } },
      right: { style: "thin", color: { rgb: "E5E7EB" } },
    },
  },
  titleStyle: {
    font: {
      bold: true,
      size: 16,
      color: { rgb: "047857" }, // seagreen-700
    },
    alignment: {
      horizontal: "left",
    },
    border: {
      bottom: { style: "medium", color: { rgb: "14B8A6" } }, // seagreen-500
    },
  },
});

// Helper function to apply styles to a worksheet
const applyStyles = (ws: XLSX.WorkSheet, styles: any) => {
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) continue;

      if (R === 0 || R === range.s.r + summaryTable.length + 2) {
        // Apply header style to both table headers
        ws[cellRef].s = styles.headerStyle;
      } else {
        // Apply regular cell style
        ws[cellRef].s = styles.cellStyle;
      }
    }
  }
};

// Helper to set column widths
const setColumnWidths = (ws: XLSX.WorkSheet, widths: number[]) => {
  ws["!cols"] = widths.map((w) => ({ wch: w }));
};

// Function to format numbers
const formatNumber = (value: number | string): string | number => {
  if (typeof value === "number") {
    // Format with thousand separators
    return value.toLocaleString("en-US");
  }
  return value;
};

// Function to format dates
const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// Store summary table length for header styling
let summaryTable: any[][] = [];

export function exportWeeklySummaryAndReports(
  summary: WeeklySummary[],
  reports: any[],
  fileName = "weekly_report.xlsx"
) {
  const styles = createStyles();

  // Add title row and spacing
  const summaryTitle = [["SUMMARY (ABSTRACT)"]];
  summaryTable = [
    ...summaryTitle,
    [],
    ["S.no", "Description", "Total Number", "Remarks"],
    ...summary.map((row, i) => [
      i + 1,
      row.description,
      formatNumber(row.total),
      row.remarks || "",
    ]),
  ];

  // Add title for reports section
  const reportsTitle = [["WEEKLY PERFORMANCE REPORTS"]];
  const reportHeaders = [
    "Vessel Name",
    "Port",
    "Agent Name",
    "Owner Details",
    "Purpose of Arrival",
    "Status",
    "Cargo Type",
    "Type of Cargo",
    "Total Quantity",
    "DWT",
    "LOA",
    "Berthed Date",
    "Departure Date",
    "Demurrages Collected",
    "Clearance Status",
  ];
  const reportRows = reports.map((r) => [
    r.vesselName || "",
    r.port?.portName || "",
    r.agentName || "",
    r.ownerDetails || "",
    r.purposeOfArrival || "",
    r.status || "",
    r.cargoType || "",
    r.typeOfCargo || "",
    formatNumber(r.totalQuantity) ?? "",
    r.dwt || "",
    r.loa || "",
    formatDate(r.berthedDate) || "",
    formatDate(r.departureDate) || "",
    formatNumber(r.demurragesCollected) ?? "",
    formatDate(r.clearanceIssued) || "",
  ]);

  const combinedSheetData = [
    ...summaryTable,
    [],
    [], // Add spacing
    ...reportsTitle,
    [],
    reportHeaders,
    ...reportRows,
  ];

  const combinedSheet = XLSX.utils.aoa_to_sheet(combinedSheetData);

  // Set column widths for weekly performance fields
  setColumnWidths(combinedSheet, [
    6, // S.No (for summary)
    25, // Vessel Name
    20, // Port
    15, // Agent Name
    20, // Owner Details
    15, // Purpose of Arrival
    15, // Status
    15, // Cargo Type
    20, // Type of Cargo
    12, // Total Quantity
    12, // DWT
    12, // LOA
    15, // Berthed Date
    15, // Departure Date
    15, // Clearance Status
  ]);

  // Apply styles
  applyStyles(combinedSheet, styles);

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, combinedSheet, "Weekly Report");

  // Set sheet properties for better visual appearance
  const ws = wb.Sheets["Weekly Report"];

  // Add title styles
  if (ws.A1) ws.A1.s = styles.titleStyle; // Summary title
  const reportsTitleRow = summaryTable.length + 3;
  const reportsTitleCell = XLSX.utils.encode_cell({ r: reportsTitleRow, c: 0 });
  if (ws[reportsTitleCell]) ws[reportsTitleCell].s = styles.titleStyle;

  // Set custom row heights
  ws["!rows"] = Array(combinedSheetData.length)
    .fill(null)
    .map((_, i) => {
      // Title rows get more height
      if (i === 0 || i === summaryTable.length + 3) {
        return { hpt: 35 }; // Title rows
      }
      // Headers get slightly more height
      if (i === 3 || i === summaryTable.length + 5) {
        return { hpt: 30 }; // Header rows
      }
      // Regular rows
      return { hpt: 25 };
    });

  // Add some padding to the worksheet
  ws["!margins"] = {
    left: 0.5,
    right: 0.5,
    top: 0.5,
    bottom: 0.5,
  };

  // Export
  XLSX.writeFile(wb, fileName);
}
