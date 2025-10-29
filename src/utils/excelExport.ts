import * as XLSX from "xlsx";

export interface WeeklySummary {
  description: string;
  total: number | string;
  remarks?: string;
}

export interface PortSummaryData {
  portName: string;
  summary: WeeklySummary[];
  vessels: Record<string, unknown>[];
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

  // Separate reports with and without clearance
  const clearedReports = reports.filter(
    (r) => r.clearanceIssuedOn || r.clearanceIssued
  );
  const pendingReports = reports.filter(
    (r) => !r.clearanceIssuedOn && !r.clearanceIssued
  );

  // Common headers for both sections
  const reportHeaders = [
    "Vessel Name",
    "Port",
    "Agent Name",
    "Owner Details",
    "Operation/Purpose",
    "Status",
    "Cargo Type",
    "Cargo Name",
    "Total Quantity",
    "DWT",
    "LOA",
    "Berthed Date",
    "Departure Date",
    "Total Revenue/Demurrages",
    "Clearance Date",
  ];

  // Daily data headers
  const dailyHeaders = [
    "Date",
    "Cargo Type",
    "Cargo Details",
    "Quantity",
    "Demurrage Charges",
    "Reason",
  ];

  // Function to format report data
  const formatReportData = (reports: any[]) => {
    const rows: any[] = [];
    reports.forEach((r) => {
      // Helper function to convert Firebase timestamp to date string
      const formatFirebaseDate = (timestamp: any): string => {
        if (!timestamp) return "-";
        if (typeof timestamp === "string") return formatDate(timestamp);
        if (timestamp.seconds) {
          return formatDate(new Date(timestamp.seconds * 1000).toISOString());
        }
        return "-";
      };

      // Calculate total quantity from various possible sources
      const getTotalQuantity = (report: any): number => {
        // Priority 1: Pre-calculated totalQuantity field
        if (report.totalQuantity) {
          const qty = parseFloat(String(report.totalQuantity));
          if (!isNaN(qty)) return qty;
        }

        // Priority 2: Calculate from dailyCargoDetails if present
        if (
          report.dailyCargoDetails &&
          Array.isArray(report.dailyCargoDetails) &&
          report.dailyCargoDetails.length > 0
        ) {
          const dailySum = report.dailyCargoDetails.reduce((sum: number, daily: any) => {
            const qty = parseFloat(daily.quantity) || 0;
            return sum + qty;
          }, 0);
          if (dailySum > 0) return dailySum;
        }

        // Priority 3: Calculate from dailyData if present
        if (
          report.dailyData &&
          Array.isArray(report.dailyData) &&
          report.dailyData.length > 0
        ) {
          const dailyDataSum = report.dailyData.reduce((sum: number, daily: any) => {
            const qty = parseFloat(daily.quantity || daily.totalQuantity) || 0;
            return sum + qty;
          }, 0);
          if (dailyDataSum > 0) return dailyDataSum;
        }

        // Priority 4: Use cargo.volume from the vessel (standard field)
        if (report.cargo?.volume) {
          const vol = parseFloat(String(report.cargo.volume));
          if (!isNaN(vol)) return vol;
        }

        return 0;
      };

      // Calculate total demurrages from various possible sources
      const getTotalDemurrages = (report: any): number => {
        // Priority 1: Pre-calculated demurragesCollected field
        if (report.demurragesCollected) {
          const dem = parseFloat(String(report.demurragesCollected));
          if (!isNaN(dem) && dem > 0) return dem;
        }

        // Priority 2: totalRevenue field (stored as string in Vessel type)
        if (report.totalRevenue) {
          const rev = parseFloat(String(report.totalRevenue));
          if (!isNaN(rev) && rev > 0) return rev;
        }

        // Priority 3: Calculate from dailyCargoDetails
        if (
          report.dailyCargoDetails &&
          Array.isArray(report.dailyCargoDetails) &&
          report.dailyCargoDetails.length > 0
        ) {
          const dailySum = report.dailyCargoDetails.reduce((sum: number, daily: any) => {
            const dem = parseFloat(daily.demurrageCharges || daily.demurrages) || 0;
            return sum + dem;
          }, 0);
          if (dailySum > 0) return dailySum;
        }

        // Priority 4: Calculate from dailyData
        if (
          report.dailyData &&
          Array.isArray(report.dailyData) &&
          report.dailyData.length > 0
        ) {
          const dailyDataSum = report.dailyData.reduce((sum: number, daily: any) => {
            const dem = parseFloat(daily.demurrageCharges || daily.demurrages) || 0;
            return sum + dem;
          }, 0);
          if (dailyDataSum > 0) return dailyDataSum;
        }

        return 0;
      };

      // Main report row
      const mainRow = [
        r.vesselName || "-",
        r.portName || "-",
        r.vesselAgent || r.agentName || "-",
        r.vesselOwner || r.ownerDetails || "-",
        r.operation || r.purposeOfArrival || "-",
        r.vesselStatus || r.status || "-",
        r.cargo?.type || r.cargo?.name || "-",
        r.cargo?.name || "-",
        formatNumber(getTotalQuantity(r)) || "-",
        r.dwt || "-",
        r.loa || "-",
        formatFirebaseDate(r.berthingDateTime) ||
          formatDate(r.berthedDate) ||
          "-",
        formatFirebaseDate(r.sailedOutDate) ||
          formatDate(r.departureDate) ||
          "-",
        formatNumber(getTotalDemurrages(r)) || "-",
        formatFirebaseDate(r.clearanceIssuedOn) ||
          formatDate(r.clearanceIssued) ||
          "-",
      ];
      rows.push(mainRow);

      // Daily data rows with indent - handle both old and new data structures
      const dailyDataArray = r.dailyCargoDetails || r.dailyData;
      if (
        dailyDataArray &&
        Array.isArray(dailyDataArray) &&
        dailyDataArray.length > 0
      ) {
        // Filter out empty daily data entries
        const validDailyData = dailyDataArray.filter((daily: any) => {
          return (
            daily &&
            (daily.date ||
              daily.cargoType ||
              daily.cargoTypeInDetail ||
              daily.typeOfCargo ||
              daily.quantity ||
              daily.totalQuantity ||
              daily.demurrageCharges ||
              daily.demurrages ||
              daily.reason)
          );
        });

        if (validDailyData.length > 0) {
          // Add daily data header with proper indentation
          const dailyHeaderRow = Array(
            reportHeaders.length - dailyHeaders.length
          ).fill("");
          rows.push([...dailyHeaderRow, ...dailyHeaders.map(String)]);

          // Add daily data rows
          validDailyData.forEach((daily: any) => {
            const dailyDataRow = Array(
              reportHeaders.length - dailyHeaders.length
            ).fill("");
            rows.push([
              ...dailyDataRow,
              String(formatFirebaseDate(daily.date) || "-"),
              String(daily.cargoType || "-"),
              String(daily.cargoTypeInDetail || daily.typeOfCargo || "-"),
              String(
                formatNumber(daily.quantity || daily.totalQuantity) || "-"
              ),
              String(
                formatNumber(daily.demurrageCharges || daily.demurrages) || "-"
              ),
              String(daily.reason || "-"),
            ]);
          });

          // Add spacing row
          rows.push(Array(reportHeaders.length).fill(""));
        }
      }
    });
    return rows;
  };

  // Create sections for cleared and pending reports
  const clearedReportsTitle =
    clearedReports.length > 0
      ? [[String("WEEKLY PERFORMANCE REPORTS - CLEARED VESSELS")]]
      : [];
  const pendingReportsTitle =
    pendingReports.length > 0
      ? [[String("WEEKLY PERFORMANCE REPORTS - PENDING CLEARANCE")]]
      : [];

  const clearedReportRows = formatReportData(clearedReports);
  const pendingReportRows = formatReportData(pendingReports);

  const combinedSheetData = [
    ...summaryTable,
    [],
    [], // Add spacing
    ...(clearedReports.length > 0
      ? [...clearedReportsTitle, [], reportHeaders, ...clearedReportRows, []]
      : []),
    ...(pendingReports.length > 0
      ? [...pendingReportsTitle, [], reportHeaders, ...pendingReportRows]
      : []),
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

  // Apply styles with special handling for daily data
  const ws = combinedSheet;
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) continue;

      const cellValue = ws[cellRef].v;
      if (R === 0) {
        // Summary title
        ws[cellRef].s = styles.titleStyle;
      } else if (
        cellValue === "WEEKLY PERFORMANCE REPORTS - CLEARED VESSELS" ||
        cellValue === "WEEKLY PERFORMANCE REPORTS - PENDING CLEARANCE"
      ) {
        // Section titles
        ws[cellRef].s = styles.titleStyle;
      } else if (
        cellValue === "Date" ||
        cellValue === "Cargo Type" ||
        cellValue === "Cargo Details" ||
        cellValue === "Quantity" ||
        cellValue === "Demurrage Charges" ||
        cellValue === "Reason"
      ) {
        // Daily data headers - slightly different style
        ws[cellRef].s = {
          ...styles.headerStyle,
          fill: { fgColor: { rgb: "E2E8F0" } }, // Lighter background for sub-headers
        };
      } else if (
        [
          "Vessel Name",
          "Port",
          "Agent Name",
          "Owner Details",
          "Operation/Purpose",
          "Status",
          "Cargo Type",
          "Cargo Name",
          "Total Quantity",
          "DWT",
          "LOA",
          "Berthed Date",
          "Departure Date",
          "Total Revenue/Demurrages",
          "Clearance Date",
        ].includes(cellValue)
      ) {
        // Main headers
        ws[cellRef].s = styles.headerStyle;
      } else {
        // Regular cells
        ws[cellRef].s = styles.cellStyle;
      }
    }
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, combinedSheet, "Weekly Report");

  // Set custom row heights
  ws["!rows"] = Array(range.e.r + 1)
    .fill(null)
    .map((_, i) => {
      if (
        combinedSheetData[i] &&
        Array.isArray(combinedSheetData[i]) &&
        combinedSheetData[i][0] &&
        typeof combinedSheetData[i][0] === "string" &&
        combinedSheetData[i][0].includes("WEEKLY PERFORMANCE")
      ) {
        return { hpt: 35 }; // Title rows
      } else if (i === 0) {
        // First row (Summary title)
        return { hpt: 35 }; // Title row height
      }
      return { hpt: 25 }; // Regular rows
    });

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

export function exportPortWiseSummaryAndReports(
  portSummaries: PortSummaryData[],
  fileName = "port_wise_weekly_report.xlsx"
) {
  const styles = createStyles();
  let allSheetData: any[] = [];

  // Process each port
  portSummaries.forEach((portData, index) => {
    // Port title
    allSheetData.push([
      `${portData.portName.toUpperCase()} - SUMMARY (ABSTRACT)`,
    ]);
    allSheetData.push([]); // Empty row

    // Summary table
    allSheetData.push(["S.no", "Description", "Total Number", "Remarks"]);
    portData.summary.forEach((row, i) => {
      allSheetData.push([
        i + 1,
        row.description,
        formatNumber(row.total),
        row.remarks || "",
      ]);
    });

    allSheetData.push([]); // Empty row

    // Only process cleared vessels
    const clearedVessels = portData.vessels.filter(
      (vessel) => vessel.clearanceIssuedOn || vessel.clearanceIssued
    );

    if (clearedVessels.length > 0) {
      // Vessels section title
      allSheetData.push([
        `${portData.portName.toUpperCase()} - CLEARED VESSELS`,
      ]);
      allSheetData.push([]); // Empty row

      // Vessel headers
      const reportHeaders = [
        "Vessel Name",
        "Port",
        "Agent Name",
        "Owner Details",
        "Operation/Purpose",
        "Status",
        "Cargo Type",
        "Cargo Name",
        "Total Quantity",
        "DWT",
        "LOA",
        "Berthed Date",
        "Departure Date",
        "Total Revenue/Demurrages",
        "Clearance Date",
      ];
      allSheetData.push(reportHeaders);

      // Format vessel data
      clearedVessels.forEach((vessel) => {
        const formatFirebaseDate = (timestamp: any): string => {
          if (!timestamp) return "-";
          if (typeof timestamp === "string") return formatDate(timestamp);
          if (timestamp.seconds) {
            return formatDate(new Date(timestamp.seconds * 1000).toISOString());
          }
          return "-";
        };

        const getTotalQuantity = (vessel: any): number => {
          // Priority 1: Pre-calculated totalQuantity field
          if (vessel.totalQuantity) {
            const qty = parseFloat(String(vessel.totalQuantity));
            if (!isNaN(qty)) return qty;
          }

          // Priority 2: Calculate from dailyCargoDetails if present
          if (
            vessel.dailyCargoDetails &&
            Array.isArray(vessel.dailyCargoDetails) &&
            vessel.dailyCargoDetails.length > 0
          ) {
            const dailySum = vessel.dailyCargoDetails.reduce(
              (sum: number, daily: any) => {
                const qty = parseFloat(daily.quantity) || 0;
                return sum + qty;
              },
              0
            );
            if (dailySum > 0) return dailySum;
          }

          // Priority 3: Calculate from dailyData if present
          if (
            vessel.dailyData &&
            Array.isArray(vessel.dailyData) &&
            vessel.dailyData.length > 0
          ) {
            const dailyDataSum = vessel.dailyData.reduce(
              (sum: number, daily: any) => {
                const qty = parseFloat(daily.quantity || daily.totalQuantity) || 0;
                return sum + qty;
              },
              0
            );
            if (dailyDataSum > 0) return dailyDataSum;
          }

          // Priority 4: Use cargo.volume from the vessel (standard field)
          if (vessel.cargo?.volume) {
            const vol = parseFloat(String(vessel.cargo.volume));
            if (!isNaN(vol)) return vol;
          }

          return 0;
        };

        const getTotalDemurrages = (vessel: any): number => {
          // Priority 1: Pre-calculated demurragesCollected field
          if (vessel.demurragesCollected) {
            const dem = parseFloat(String(vessel.demurragesCollected));
            if (!isNaN(dem) && dem > 0) return dem;
          }

          // Priority 2: totalRevenue field (stored as string in Vessel type)
          if (vessel.totalRevenue) {
            const rev = parseFloat(String(vessel.totalRevenue));
            if (!isNaN(rev) && rev > 0) return rev;
          }

          // Priority 3: Calculate from dailyCargoDetails
          if (
            vessel.dailyCargoDetails &&
            Array.isArray(vessel.dailyCargoDetails) &&
            vessel.dailyCargoDetails.length > 0
          ) {
            const dailySum = vessel.dailyCargoDetails.reduce(
              (sum: number, daily: any) => {
                const dem = parseFloat(daily.demurrageCharges || daily.demurrages) || 0;
                return sum + dem;
              },
              0
            );
            if (dailySum > 0) return dailySum;
          }

          // Priority 4: Calculate from dailyData
          if (
            vessel.dailyData &&
            Array.isArray(vessel.dailyData) &&
            vessel.dailyData.length > 0
          ) {
            const dailyDataSum = vessel.dailyData.reduce(
              (sum: number, daily: any) => {
                const dem = parseFloat(daily.demurrageCharges || daily.demurrages) || 0;
                return sum + dem;
              },
              0
            );
            if (dailyDataSum > 0) return dailyDataSum;
          }

          return 0;
        };

        // Main vessel row
        const vesselRow = [
          vessel.vesselName || "-",
          portData.portName || "-",
          vessel.vesselAgent || vessel.agentName || "-",
          vessel.vesselOwner || vessel.ownerDetails || "-",
          vessel.operation || vessel.purposeOfArrival || "-",
          vessel.vesselStatus || vessel.status || "-",
          vessel.cargo?.type || vessel.cargo?.name || "-",
          vessel.cargo?.name || "-",
          formatNumber(getTotalQuantity(vessel)) || "-",
          vessel.dwt || "-",
          vessel.loa || "-",
          formatFirebaseDate(vessel.berthingDateTime) ||
            formatDate(vessel.berthedDate) ||
            "-",
          formatFirebaseDate(vessel.sailedOutDate) ||
            formatDate(vessel.departureDate) ||
            "-",
          formatNumber(getTotalDemurrages(vessel)) || "-",
          formatFirebaseDate(vessel.clearanceIssuedOn) ||
            formatDate(vessel.clearanceIssued) ||
            "-",
        ];
        allSheetData.push(vesselRow);

        // Add daily cargo details if available
        const dailyDataArray = vessel.dailyCargoDetails || vessel.dailyData;
        if (
          dailyDataArray &&
          Array.isArray(dailyDataArray) &&
          dailyDataArray.length > 0
        ) {
          // Filter out empty daily data entries
          const validDailyData = dailyDataArray.filter((daily: any) => {
            return (
              daily &&
              (daily.date ||
                daily.cargoType ||
                daily.cargoTypeInDetail ||
                daily.typeOfCargo ||
                daily.quantity ||
                daily.totalQuantity ||
                daily.demurrageCharges ||
                daily.demurrages ||
                daily.reason)
            );
          });

          if (validDailyData.length > 0) {
            // Daily data headers
            const dailyHeaders = [
              "Date",
              "Cargo Type",
              "Cargo Details",
              "Quantity",
              "Demurrage Charges",
              "Reason",
            ];

            // Add daily data header with proper indentation
            const dailyHeaderRow = Array(
              reportHeaders.length - dailyHeaders.length
            ).fill("");
            allSheetData.push([...dailyHeaderRow, ...dailyHeaders.map(String)]);

            // Add daily data rows
            validDailyData.forEach((daily: any) => {
              const dailyDataRow = Array(
                reportHeaders.length - dailyHeaders.length
              ).fill("");
              allSheetData.push([
                ...dailyDataRow,
                String(formatFirebaseDate(daily.date) || "-"),
                String(daily.cargoType || "-"),
                String(daily.cargoTypeInDetail || daily.typeOfCargo || "-"),
                String(
                  formatNumber(daily.quantity || daily.totalQuantity) || "-"
                ),
                String(
                  formatNumber(daily.demurrageCharges || daily.demurrages) ||
                    "-"
                ),
                String(daily.reason || "-"),
              ]);
            });

            // Add spacing row after daily data
            allSheetData.push(Array(reportHeaders.length).fill(""));
          }
        }
      });
    }

    // Add space between ports (except for the last one)
    if (index < portSummaries.length - 1) {
      allSheetData.push([]); // Empty row
      allSheetData.push([]); // Extra empty row
    }
  });

  // Create worksheet
  const combinedSheet = XLSX.utils.aoa_to_sheet(allSheetData);

  // Set column widths
  setColumnWidths(combinedSheet, [
    6, // S.No
    35, // Description/Vessel Name
    20, // Total Number/Port
    15, // Remarks/Agent Name
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
    15, // Total Revenue
    15, // Clearance Date
  ]);

  // Apply styles
  const ws = combinedSheet;
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) continue;

      const cellValue = ws[cellRef].v;
      if (
        typeof cellValue === "string" &&
        cellValue.includes(" - SUMMARY (ABSTRACT)")
      ) {
        // Port summary titles
        ws[cellRef].s = styles.titleStyle;
      } else if (
        typeof cellValue === "string" &&
        cellValue.includes(" - CLEARED VESSELS")
      ) {
        // Vessel section titles
        ws[cellRef].s = styles.titleStyle;
      } else if (
        [
          "S.no",
          "Description",
          "Total Number",
          "Remarks",
          "Vessel Name",
          "Port",
          "Agent Name",
          "Owner Details",
          "Operation/Purpose",
          "Status",
          "Cargo Type",
          "Cargo Name",
          "Total Quantity",
          "DWT",
          "LOA",
          "Berthed Date",
          "Departure Date",
          "Total Revenue/Demurrages",
          "Clearance Date",
        ].includes(cellValue)
      ) {
        // Headers
        ws[cellRef].s = styles.headerStyle;
      } else if (
        [
          "Date",
          "Cargo Type",
          "Cargo Details",
          "Quantity",
          "Demurrage Charges",
          "Reason",
        ].includes(cellValue)
      ) {
        // Daily data headers - slightly different style
        ws[cellRef].s = {
          ...styles.headerStyle,
          fill: { fgColor: { rgb: "E2E8F0" } }, // Lighter background for sub-headers
        };
      } else {
        // Regular cells
        ws[cellRef].s = styles.cellStyle;
      }
    }
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, combinedSheet, "Port Wise Weekly Report");

  // Set custom row heights
  ws["!rows"] = Array(allSheetData.length)
    .fill(null)
    .map((_, i) => {
      const rowData = allSheetData[i];
      if (rowData && rowData[0] && typeof rowData[0] === "string") {
        if (
          rowData[0].includes("SUMMARY (ABSTRACT)") ||
          rowData[0].includes("CLEARED VESSELS")
        ) {
          return { hpt: 35 }; // Title rows
        }
      }
      // Headers get slightly more height
      if (
        rowData &&
        (rowData.includes("S.no") || rowData.includes("Vessel Name"))
      ) {
        return { hpt: 30 }; // Header rows
      }
      // Regular rows
      return { hpt: 25 };
    });

  // Add margins
  ws["!margins"] = {
    left: 0.5,
    right: 0.5,
    top: 0.5,
    bottom: 0.5,
  };

  // Export
  XLSX.writeFile(wb, fileName);
}
