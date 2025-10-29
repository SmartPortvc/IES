import * as XLSX from 'xlsx';

export interface ReportVessel {
  id?: string;
  vesselName: string;
  imo?: string;
  grt?: string;
  portName?: string;
  vesselOwner?: string;
  vesselAgent?: string;
  arrivalDateTime?: any;
  berthingDateTime?: any;
  sailedOutDate?: any;
  pobDepartureDateTime?: any;
  loa?: string;
  dwt?: string;
  operation?: string;
  operationType?: string;
  voyageType?: string;
  cargo?: {
    type?: string;
    name?: string;
    volume?: number;
    units?: string;
  };
  totalRevenue?: number;
  demurragesCollected?: number;
  clearanceIssuedOn?: any;
  dailyCargoDetails?: Array<{
    date?: any;
    cargoType?: string;
    cargoTypeInDetail?: string;
    quantity?: string;
    demurrageCharges?: string;
    demurrages?: string;
    reason?: string;
  }>;
  createdAt?: any;
  addedDate?: any;
}

interface WeeklySummaryRow {
  description: string;
  total: number | string;
  remarks?: string;
}

const formatFirebaseDate = (timestamp: any): string => {
  if (!timestamp) return '-';
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return '-';
};

const formatNumber = (value: number | string): string | number => {
  if (typeof value === 'number') {
    return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }
  return value;
};

const calculateWeeklySummary = (
  vessels: ReportVessel[],
  portName: string,
  reportType: 'weekly' | 'custom',
  fromDate?: string,
  toDate?: string
): WeeklySummaryRow[] => {
  const now = new Date();
  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(now.getDate() - 7);
  lastWeekStart.setHours(0, 0, 0, 0);
  const lastWeekEnd = new Date(now);
  lastWeekEnd.setHours(23, 59, 59, 999);

  let periodStart: Date;
  let periodEnd: Date;
  let periodText: string;

  if (reportType === 'custom' && fromDate && toDate) {
    periodStart = new Date(fromDate);
    periodStart.setHours(0, 0, 0, 0);
    periodEnd = new Date(toDate);
    periodEnd.setHours(23, 59, 59, 999);
    periodText = 'selected period';
  } else {
    periodStart = lastWeekStart;
    periodEnd = lastWeekEnd;
    periodText = 'last week';
  }

  const isInPeriod = (vessel: ReportVessel, dateField: 'berthing' | 'departure' | 'arrival') => {
    let dateToCheck: any;

    if (dateField === 'berthing') {
      dateToCheck = vessel.berthingDateTime;
    } else if (dateField === 'departure') {
      dateToCheck = vessel.pobDepartureDateTime || vessel.sailedOutDate;
    } else {
      dateToCheck = vessel.arrivalDateTime || vessel.berthingDateTime;
    }

    if (!dateToCheck) return false;

    let date: Date;
    if (typeof dateToCheck === 'string') {
      date = new Date(dateToCheck);
    } else if (dateToCheck instanceof Date) {
      date = dateToCheck;
    } else if (dateToCheck.seconds) {
      date = new Date(dateToCheck.seconds * 1000);
    } else {
      return false;
    }

    return date >= periodStart && date <= periodEnd;
  };

  const isInDateRange = (dateField: any, rangeStart: Date, rangeEnd: Date) => {
    if (!dateField) return false;

    let date: Date;
    if (typeof dateField === 'string') {
      date = new Date(dateField);
    } else if (dateField instanceof Date) {
      date = dateField;
    } else if (dateField.seconds) {
      date = new Date(dateField.seconds * 1000);
    } else {
      return false;
    }

    return date >= rangeStart && date <= rangeEnd;
  };

  const getSaturdayToFridayRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSaturday = dayOfWeek === 6 ? 0 : dayOfWeek === 0 ? -1 : -(dayOfWeek + 1);
    const lastSaturday = new Date(today);
    lastSaturday.setDate(today.getDate() + daysToSaturday - 7);
    lastSaturday.setHours(0, 0, 0, 0);
    const lastFriday = new Date(lastSaturday);
    lastFriday.setDate(lastSaturday.getDate() + 6);
    lastFriday.setHours(23, 59, 59, 999);
    return { start: lastSaturday, end: lastFriday };
  };

  const satFriRange = getSaturdayToFridayRange();

  const totalVesselsCalled = vessels.filter(v => isInPeriod(v, 'berthing')).length;
  const totalBerthedVessels = vessels.filter(v => v.berthingDateTime).length;
  const totalDepartedVessels = vessels.filter(v => v.pobDepartureDateTime || v.sailedOutDate).length;
  const totalVesselsInPort = totalBerthedVessels - totalDepartedVessels;

  const totalLoading = vessels.filter(v =>
    isInDateRange(v.berthingDateTime || v.arrivalDateTime, satFriRange.start, satFriRange.end) &&
    (v.operationType?.toLowerCase()?.includes('loading') || v.operation?.toLowerCase()?.includes('loading'))
  ).length;

  const totalUnloading = vessels.filter(v =>
    isInDateRange(v.berthingDateTime || v.arrivalDateTime, satFriRange.start, satFriRange.end) &&
    (v.operationType?.toLowerCase()?.includes('unloading') || v.operation?.toLowerCase()?.includes('unloading'))
  ).length;

  const totalDeparted = vessels.filter(v =>
    isInPeriod(v, 'departure')
  ).length;

  const totalDemurrages = vessels.reduce((sum, v) => {
    // First priority: use pre-calculated demurragesCollected field
    if (v.demurragesCollected && v.demurragesCollected > 0) {
      return sum + Number(v.demurragesCollected);
    }
    // Second priority: use totalRevenue if available (stored as string in Vessel type)
    if (v.totalRevenue) {
      const revenueNum = parseFloat(String(v.totalRevenue));
      if (!isNaN(revenueNum) && revenueNum > 0) {
        return sum + revenueNum;
      }
    }
    // Fallback: calculate from daily cargo details (if present)
    const demurrage = v.dailyCargoDetails?.reduce((dSum, d) => {
      const chargeValue = Number(d.demurrageCharges) || parseFloat(String(d.demurrageCharges || '0')) || 0;
      return dSum + chargeValue;
    }, 0) || 0;
    return sum + demurrage;
  }, 0);

  const totalCargoHandled = vessels.reduce((sum, v) => {
    // First check if dailyCargoDetails exists (for ReportVessel objects)
    const dailyCargoQty = v.dailyCargoDetails?.reduce((cSum, d) => {
      return cSum + (parseFloat(d.quantity || '0') || 0);
    }, 0) || 0;

    // Add cargo.volume from the vessel object (always present in Vessel type)
    const cargoVolume = v.cargo?.volume || 0;

    // If we have daily cargo details, use that; otherwise use cargo.volume
    return sum + (dailyCargoQty > 0 ? dailyCargoQty : cargoVolume);
  }, 0);

  const cargoInPeriod = vessels.filter(v => {
    if (reportType === 'weekly') {
      return isInDateRange(v.berthingDateTime || v.arrivalDateTime, satFriRange.start, satFriRange.end);
    } else {
      return isInPeriod(v, 'arrival');
    }
  });

  const cargoByType = cargoInPeriod.reduce((acc, v) => {
    if (!v.clearanceIssuedOn) return acc;

    v.dailyCargoDetails?.forEach(d => {
      const type = d.cargoTypeInDetail || d.cargoType || '';
      const qty = parseFloat(d.quantity || '0') || 0;

      if (type.toLowerCase().includes('container')) acc.container += qty;
      else if (type.toLowerCase().includes('break bulk')) acc.breakBulk += qty;
      else if (type.toLowerCase().includes('project')) acc.project += qty;
      else if (type.toLowerCase().includes('liquid')) acc.liquid += qty;
      else if (type.toLowerCase().includes('dry bulk') || type.toLowerCase().includes('bulk')) acc.bulk += qty;
    });

    if (v.cargo?.volume) {
      const cargoType = v.cargo.type?.toLowerCase() || '';
      const cargoQty = v.cargo.volume || 0;

      if (cargoType.includes('container')) acc.container += cargoQty;
      else if (cargoType.includes('break bulk')) acc.breakBulk += cargoQty;
      else if (cargoType.includes('project')) acc.project += cargoQty;
      else if (cargoType.includes('liquid')) acc.liquid += cargoQty;
      else if (cargoType.includes('bulk')) acc.bulk += cargoQty;
    }

    return acc;
  }, { container: 0, breakBulk: 0, project: 0, liquid: 0, bulk: 0 });

  const totalAppliedClearance = vessels.length;
  const totalIssuedClearance = vessels.filter(v => Boolean(v.clearanceIssuedOn)).length;

  return [
    {
      description: `Total number of vessels called in the ${periodText}`,
      total: totalVesselsCalled,
    },
    {
      description: `Total number of vessels in the port as on date`,
      total: totalVesselsInPort,
    },
    {
      description: `Total number of vessels loading in the port as on date`,
      total: totalLoading,
    },
    {
      description: `Total number of vessels unloading in the port as on date`,
      total: totalUnloading,
    },
    {
      description: `Total vessels departed ${periodText}`,
      total: totalDeparted,
    },
    {
      description: `Demurrages collected (if any) from the ships by the port`,
      total: formatNumber(totalDemurrages),
    },
    {
      description: `Total cargo handled since the start of the financial year`,
      total: formatNumber(totalCargoHandled),
    },
    {
      description: `Cargo handled in the ${periodText}`,
      total: formatNumber(cargoByType.container + cargoByType.breakBulk + cargoByType.project + cargoByType.liquid + cargoByType.bulk),
    },
    { description: `Dry Bulk cargo`, total: formatNumber(cargoByType.bulk) },
    { description: `Break Bulk`, total: formatNumber(cargoByType.breakBulk) },
    { description: `Container (in TEU & MMT)`, total: formatNumber(cargoByType.container) },
    { description: `Project cargo`, total: formatNumber(cargoByType.project) },
    { description: `Liquid cargo`, total: formatNumber(cargoByType.liquid) },
    {
      description: `Total number of vessels applied for clearance`,
      total: totalAppliedClearance,
    },
    {
      description: `Total number of clearances issued`,
      total: totalIssuedClearance,
    },
  ];
};

const applyCellStyle = (
  ws: XLSX.WorkSheet,
  cellRef: string,
  style: {
    font?: { name?: string; sz?: number; bold?: boolean; color?: { rgb: string } };
    alignment?: { horizontal?: string; vertical?: string; wrapText?: boolean };
    fill?: { fgColor: { rgb: string } };
    border?: {
      top?: { style: string; color: { rgb: string } };
      bottom?: { style: string; color: { rgb: string } };
      left?: { style: string; color: { rgb: string } };
      right?: { style: string; color: { rgb: string } };
    };
  }
) => {
  if (!ws[cellRef]) return;
  ws[cellRef].s = style;
};

const generateAllPortsReport = (
  wb: XLSX.WorkBook,
  vessels: ReportVessel[],
  reportType: 'weekly' | 'custom',
  fromDate?: string,
  toDate?: string
) => {
  const dateRangeText = reportType === 'weekly'
    ? `${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} - ${new Date().toLocaleDateString()}`
    : `${new Date(fromDate!).toLocaleDateString()} - ${new Date(toDate!).toLocaleDateString()}`;

  // Group vessels by port
  const vesselsByPort = vessels.reduce((acc, vessel) => {
    const port = vessel.portName || 'Unknown Port';
    if (!acc[port]) {
      acc[port] = [];
    }
    acc[port].push(vessel);
    return acc;
  }, {} as Record<string, ReportVessel[]>);

  const sheetData: any[][] = [
    ['ALL PORTS - VESSEL MOVEMENT REPORT'],
    [`Report Period: ${dateRangeText}`],
    [`Report Date Range (Arrival): ${dateRangeText}`],
    [`Generated on: ${new Date().toLocaleString()}`],
    [],
  ];

  const baseBorder = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } },
  };

  const baseFont = {
    name: 'Calibri',
    sz: 11,
  };

  // Calculate collective Abstract Data for ALL ports together
  const collectiveAbstract = calculateWeeklySummary(vessels, 'All Ports', reportType, fromDate, toDate);

  sheetData.push(
    ['SUMMARY (ABSTRACT) - ALL PORTS COLLECTIVELY'],
    [],
    ['S.No', 'Description', 'Total Number', 'Remarks'],
    ...collectiveAbstract.map((row, i) => [i + 1, row.description, row.total, '']),
    [],
    [],
  );

  // Generate section for each port with Cleared and Uncleared vessels
  Object.entries(vesselsByPort).forEach(([portName, portVessels]) => {
    const clearedVessels = portVessels.filter(v => v.clearanceIssuedOn);
    const pendingVessels = portVessels.filter(v => !v.clearanceIssuedOn);

    sheetData.push(
      [`${portName.toUpperCase()}`],
      [],
    );

    if (clearedVessels.length > 0) {
      sheetData.push(
        ['CLEARED VESSELS'],
        [
          'S.No',
          'Vessel Name',
          'Owner/Proprietor',
          'LOA (m)',
          'Agent Name',
          'Purpose of Arrival',
          'Berthed Date',
          'Vessel DWT',
          'Type of Cargo',
          'Quantity (MT/TEU)',
          'Loading/Discharging Commenced',
          'Loading/Discharging Completed',
          'Demurrage (₹)',
          'Clearance Issued On',
        ]
      );

      clearedVessels.forEach((vessel, i) => {
        // Calculate total quantity: try dailyCargoDetails first, then fall back to cargo.volume
        const dailyCargoQty = vessel.dailyCargoDetails?.reduce((sum, d) =>
          sum + (parseFloat(d.quantity || '0') || 0), 0
        ) || 0;
        const totalQty = dailyCargoQty > 0 ? dailyCargoQty : (vessel.cargo?.volume || 0);

        // Calculate demurrages: try demurragesCollected, then totalRevenue (as string), then dailyCargoDetails
        let totalDem = 0;
        if (vessel.demurragesCollected && vessel.demurragesCollected > 0) {
          totalDem = Number(vessel.demurragesCollected);
        } else if (vessel.totalRevenue) {
          const revenueNum = parseFloat(String(vessel.totalRevenue));
          totalDem = !isNaN(revenueNum) && revenueNum > 0 ? revenueNum : 0;
        } else {
          totalDem = vessel.dailyCargoDetails?.reduce((sum, d) => {
            const chargeValue = Number(d.demurrageCharges) || parseFloat(String(d.demurrageCharges || '0')) || 0;
            return sum + chargeValue;
          }, 0) || 0;
        }

        const firstCargoDate = vessel.dailyCargoDetails?.[0]?.date;
        const lastCargoDate = vessel.dailyCargoDetails?.[vessel.dailyCargoDetails.length - 1]?.date;

        sheetData.push([
          i + 1,
          vessel.vesselName || '-',
          vessel.vesselOwner || '-',
          vessel.loa || '-',
          vessel.vesselAgent || '-',
          vessel.operation || vessel.operationType || '-',
          formatFirebaseDate(vessel.berthingDateTime),
          vessel.dwt || '-',
          vessel.cargo?.type || vessel.dailyCargoDetails?.[0]?.cargoTypeInDetail || '-',
          formatNumber(totalQty),
          formatFirebaseDate(firstCargoDate),
          formatFirebaseDate(lastCargoDate),
          formatNumber(totalDem),
          formatFirebaseDate(vessel.clearanceIssuedOn),
        ]);
      });

      sheetData.push([]);
    }

    if (pendingVessels.length > 0) {
      sheetData.push(
        ['UNCLEARED VESSELS (PENDING CLEARANCE)'],
        [
          'S.No',
          'Vessel Name',
          'Agent Name',
          'Berthed Date',
          'Purpose of Arrival',
          'Demurrage (₹)',
          'Status',
        ]
      );

      pendingVessels.forEach((vessel, i) => {
        // Calculate demurrages: try demurragesCollected, then totalRevenue (as string), then dailyCargoDetails
        let totalDem = 0;
        if (vessel.demurragesCollected && vessel.demurragesCollected > 0) {
          totalDem = Number(vessel.demurragesCollected);
        } else if (vessel.totalRevenue) {
          const revenueNum = parseFloat(String(vessel.totalRevenue));
          totalDem = !isNaN(revenueNum) && revenueNum > 0 ? revenueNum : 0;
        } else {
          totalDem = vessel.dailyCargoDetails?.reduce((sum, d) => {
            const chargeValue = Number(d.demurrageCharges) || parseFloat(String(d.demurrageCharges || '0')) || 0;
            return sum + chargeValue;
          }, 0) || 0;
        }

        sheetData.push([
          i + 1,
          vessel.vesselName || '-',
          vessel.vesselAgent || '-',
          formatFirebaseDate(vessel.berthingDateTime),
          vessel.operation || vessel.operationType || '-',
          formatNumber(totalDem),
          'Pending Clearance',
        ]);
      });

      sheetData.push([]);
    }

    sheetData.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 8 },
    { wch: 30 },
    { wch: 25 },
    { wch: 12 },
    { wch: 25 },
    { wch: 22 },
    { wch: 18 },
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
  ];

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) continue;

      const cellValue = ws[cellRef].v;
      const cellString = String(cellValue);

      if (R === 0) {
        applyCellStyle(ws, cellRef, {
          font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: '1F2937' } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
          fill: { fgColor: { rgb: 'E0F2FE' } },
          border: baseBorder,
        });
      } else if (R === 1 || R === 2) {
        applyCellStyle(ws, cellRef, {
          font: { name: 'Calibri', sz: 10, bold: false, color: { rgb: '4B5563' } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
          border: baseBorder,
        });
      } else if (cellString.includes('SUMMARY (ABSTRACT)')) {
        applyCellStyle(ws, cellRef, {
          font: { name: 'Calibri', sz: 13, bold: true, color: { rgb: '047857' } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
          fill: { fgColor: { rgb: 'D1FAE5' } },
          border: baseBorder,
        });
      } else if (cellString.includes('CLEARED VESSELS') || cellString.includes('PENDING CLEARANCE') || cellString.includes('UNCLEARED VESSELS')) {
        applyCellStyle(ws, cellRef, {
          font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '047857' } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
          fill: { fgColor: { rgb: 'D1FAE5' } },
          border: baseBorder,
        });
      } else if (cellValue && typeof cellValue === 'string' && cellValue.toUpperCase() === cellValue && cellValue.length > 10 && !cellString.includes('CLEARED') && !cellString.includes('PENDING') && !cellString.includes('UNCLEARED') && !cellString.includes('SUMMARY')) {
        applyCellStyle(ws, cellRef, {
          font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '0F172A' } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
          fill: { fgColor: { rgb: 'FEF3C7' } },
          border: baseBorder,
        });
      } else if (
        cellString === 'S.No' ||
        cellString === 'Description' ||
        cellString === 'Total Number' ||
        cellString === 'Remarks' ||
        cellString === 'Vessel Name' ||
        cellString === 'Owner/Proprietor' ||
        cellString === 'LOA (m)' ||
        cellString === 'Agent Name' ||
        cellString === 'Purpose of Arrival' ||
        cellString === 'Berthed Date' ||
        cellString === 'Vessel DWT' ||
        cellString === 'Type of Cargo' ||
        cellString === 'Quantity (MT/TEU)' ||
        cellString === 'Loading/Discharging Commenced' ||
        cellString === 'Loading/Discharging Completed' ||
        cellString === 'Demurrage (₹)' ||
        cellString === 'Clearance Issued On' ||
        cellString === 'Status'
      ) {
        applyCellStyle(ws, cellRef, {
          font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          fill: { fgColor: { rgb: '14B8A6' } },
          border: baseBorder,
        });
      } else if (cellValue !== '' && cellValue !== null && cellValue !== undefined) {
        const isNumeric = typeof cellValue === 'number' ||
                         (typeof cellValue === 'string' && !isNaN(parseFloat(cellValue.replace(/,/g, ''))));

        const isSerialNumber = C === 0 && typeof cellValue === 'number' && cellValue < 1000;

        let alignment: any = { vertical: 'center', wrapText: true };

        if (isSerialNumber) {
          alignment.horizontal = 'center';
        } else if (isNumeric && !cellString.includes('-') && cellString !== '-') {
          alignment.horizontal = 'right';
        } else {
          alignment.horizontal = 'left';
        }

        applyCellStyle(ws, cellRef, {
          font: isSerialNumber ? { ...baseFont, bold: true } : baseFont,
          alignment,
          border: baseBorder,
        });
      } else {
        applyCellStyle(ws, cellRef, {
          font: baseFont,
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: baseBorder,
        });
      }
    }
  }

  ws['!rows'] = Array(sheetData.length).fill(null).map((_, i) => {
    if (i === 0) return { hpt: 35 };
    const cellValue = sheetData[i]?.[0];
    if (typeof cellValue === 'string' && cellValue.toUpperCase() === cellValue && cellValue.length > 10 && !cellValue.includes('CLEARED') && !cellValue.includes('PENDING') && !cellValue.includes('UNCLEARED') && !cellValue.includes('SUMMARY')) {
      return { hpt: 30 };
    }
    if (
      sheetData[i]?.includes('SUMMARY (ABSTRACT)') ||
      sheetData[i]?.includes('CLEARED VESSELS') ||
      sheetData[i]?.includes('PENDING CLEARANCE') ||
      sheetData[i]?.includes('UNCLEARED VESSELS')
    ) {
      return { hpt: 28 };
    }
    if (sheetData[i]?.includes('S.No') || sheetData[i]?.includes('Vessel Name') || sheetData[i]?.includes('Description')) {
      return { hpt: 28 };
    }
    return { hpt: 22 };
  });

  ws['!margins'] = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };

  XLSX.utils.book_append_sheet(wb, ws, 'All Ports Report');
};

export const generateExcelReport = (
  vessels: ReportVessel[],
  portName: string,
  reportType: 'weekly' | 'custom',
  fromDate?: string,
  toDate?: string,
  isAllPorts: boolean = false
) => {
  const wb = XLSX.utils.book_new();

  // If All Ports is selected, generate grouped report
  if (isAllPorts) {
    generateAllPortsReport(wb, vessels, reportType, fromDate, toDate);
    const fileName = `All_Ports_${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    return;
  }

  const summary = calculateWeeklySummary(vessels, portName, reportType, fromDate, toDate);
  const clearedVessels = vessels.filter(v => v.clearanceIssuedOn);
  const pendingVessels = vessels.filter(v => !v.clearanceIssuedOn);

  const dateRangeText = reportType === 'weekly'
    ? `${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} - ${new Date().toLocaleDateString()}`
    : `${new Date(fromDate!).toLocaleDateString()} - ${new Date(toDate!).toLocaleDateString()}`;

  const sheetData: any[][] = [
    [`${portName.toUpperCase()} - VESSEL MOVEMENT REPORT`],
    [`Report Period: ${dateRangeText}`],
    [`Generated on: ${new Date().toLocaleString()}`],
    [],
    ['SUMMARY (ABSTRACT)'],
    [],
    ['S.No', 'Description', 'Total Number', 'Remarks'],
    ...summary.map((row, i) => [i + 1, row.description, row.total, '']),
    [],
    [],
  ];

  let currentRow = sheetData.length;

  if (clearedVessels.length > 0) {
    sheetData.push(
      ['ANNEXURE - CLEARED VESSELS'],
      [],
      [
        'S.No',
        'Vessel Name',
        'Owner/Proprietor',
        'LOA (m)',
        'Agent Name',
        'Purpose of Arrival',
        'Berthed Date',
        'Vessel DWT',
        'Type of Cargo',
        'Quantity (MT/TEU)',
        'Loading/Discharging Commenced',
        'Loading/Discharging Completed',
        'Demurrage (₹)',
        'Clearance Issued On',
      ]
    );

    clearedVessels.forEach((vessel, i) => {
      // Calculate total quantity: try dailyCargoDetails first, then fall back to cargo.volume
      const dailyCargoQty = vessel.dailyCargoDetails?.reduce((sum, d) =>
        sum + (parseFloat(d.quantity || '0') || 0), 0
      ) || 0;
      const totalQty = dailyCargoQty > 0 ? dailyCargoQty : (vessel.cargo?.volume || 0);

      // Calculate demurrages: try demurragesCollected, then totalRevenue (as string), then dailyCargoDetails
      let totalDem = 0;
      if (vessel.demurragesCollected && vessel.demurragesCollected > 0) {
        totalDem = Number(vessel.demurragesCollected);
      } else if (vessel.totalRevenue) {
        const revenueNum = parseFloat(String(vessel.totalRevenue));
        totalDem = !isNaN(revenueNum) && revenueNum > 0 ? revenueNum : 0;
      } else {
        totalDem = vessel.dailyCargoDetails?.reduce((sum, d) => {
          const chargeValue = Number(d.demurrageCharges) || parseFloat(String(d.demurrageCharges || '0')) || 0;
          return sum + chargeValue;
        }, 0) || 0;
      }

      const firstCargoDate = vessel.dailyCargoDetails?.[0]?.date;
      const lastCargoDate = vessel.dailyCargoDetails?.[vessel.dailyCargoDetails.length - 1]?.date;

      sheetData.push([
        i + 1,
        vessel.vesselName || '-',
        vessel.vesselOwner || '-',
        vessel.loa || '-',
        vessel.vesselAgent || '-',
        vessel.operation || vessel.operationType || '-',
        formatFirebaseDate(vessel.berthingDateTime),
        vessel.dwt || '-',
        vessel.cargo?.type || vessel.dailyCargoDetails?.[0]?.cargoTypeInDetail || '-',
        formatNumber(totalQty),
        formatFirebaseDate(firstCargoDate),
        formatFirebaseDate(lastCargoDate),
        formatNumber(totalDem),
        formatFirebaseDate(vessel.clearanceIssuedOn),
      ]);
    });

    sheetData.push([]);
  }

  if (pendingVessels.length > 0) {
    sheetData.push(
      ['DEPARTURE DATE SECTION - PENDING CLEARANCE'],
      [],
      [
        'S.No',
        'Vessel Name',
        'Agent Name',
        'Berthed Date',
        'Purpose of Arrival',
        'Demurrage (₹)',
        'Status',
      ]
    );

    pendingVessels.forEach((vessel, i) => {
      // Calculate demurrages: try demurragesCollected, then totalRevenue (as string), then dailyCargoDetails
      let totalDem = 0;
      if (vessel.demurragesCollected && vessel.demurragesCollected > 0) {
        totalDem = Number(vessel.demurragesCollected);
      } else if (vessel.totalRevenue) {
        const revenueNum = parseFloat(String(vessel.totalRevenue));
        totalDem = !isNaN(revenueNum) && revenueNum > 0 ? revenueNum : 0;
      } else {
        totalDem = vessel.dailyCargoDetails?.reduce((sum, d) => {
          const chargeValue = Number(d.demurrageCharges) || parseFloat(String(d.demurrageCharges || '0')) || 0;
          return sum + chargeValue;
        }, 0) || 0;
      }

      sheetData.push([
        i + 1,
        vessel.vesselName || '-',
        vessel.vesselAgent || '-',
        formatFirebaseDate(vessel.berthingDateTime),
        vessel.operation || vessel.operationType || '-',
        formatNumber(totalDem),
        'Pending Clearance',
      ]);
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 8 },
    { wch: 30 },
    { wch: 25 },
    { wch: 12 },
    { wch: 25 },
    { wch: 22 },
    { wch: 18 },
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
  ];

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  const baseBorder = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } },
  };

  const baseFont = {
    name: 'Calibri',
    sz: 11,
  };

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) continue;

      const cellValue = ws[cellRef].v;
      const cellString = String(cellValue);

      if (R === 0) {
        applyCellStyle(ws, cellRef, {
          font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: '1F2937' } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
          fill: { fgColor: { rgb: 'E0F2FE' } },
          border: baseBorder,
        });
      } else if (R === 1 || R === 2) {
        applyCellStyle(ws, cellRef, {
          font: { name: 'Calibri', sz: 10, bold: false, color: { rgb: '4B5563' } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
          border: baseBorder,
        });
      } else if (R === 4 || cellString.includes('ANNEXURE') || cellString.includes('DEPARTURE DATE SECTION')) {
        applyCellStyle(ws, cellRef, {
          font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '047857' } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: false },
          fill: { fgColor: { rgb: 'D1FAE5' } },
          border: baseBorder,
        });
      } else if (
        cellString === 'S.No' ||
        cellString === 'Description' ||
        cellString === 'Total Number' ||
        cellString === 'Remarks' ||
        cellString === 'Vessel Name' ||
        cellString === 'Owner/Proprietor' ||
        cellString === 'LOA (m)' ||
        cellString === 'Agent Name' ||
        cellString === 'Purpose of Arrival' ||
        cellString === 'Berthed Date' ||
        cellString === 'Vessel DWT' ||
        cellString === 'Type of Cargo' ||
        cellString === 'Quantity (MT/TEU)' ||
        cellString === 'Loading/Discharging Commenced' ||
        cellString === 'Loading/Discharging Completed' ||
        cellString === 'Demurrage (₹)' ||
        cellString === 'Clearance Issued On' ||
        cellString === 'Status'
      ) {
        applyCellStyle(ws, cellRef, {
          font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          fill: { fgColor: { rgb: '14B8A6' } },
          border: baseBorder,
        });
      } else if (cellValue !== '' && cellValue !== null && cellValue !== undefined) {
        const isNumeric = typeof cellValue === 'number' ||
                         (typeof cellValue === 'string' && !isNaN(parseFloat(cellValue.replace(/,/g, ''))));

        const isSerialNumber = C === 0 && typeof cellValue === 'number' && cellValue < 1000;

        let alignment: any = { vertical: 'center', wrapText: true };

        if (isSerialNumber) {
          alignment.horizontal = 'center';
        } else if (isNumeric && !cellString.includes('-') && cellString !== '-') {
          alignment.horizontal = 'right';
        } else {
          alignment.horizontal = 'left';
        }

        applyCellStyle(ws, cellRef, {
          font: isSerialNumber ? { ...baseFont, bold: true } : baseFont,
          alignment,
          border: baseBorder,
        });
      } else {
        applyCellStyle(ws, cellRef, {
          font: baseFont,
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: baseBorder,
        });
      }
    }
  }

  ws['!rows'] = Array(sheetData.length).fill(null).map((_, i) => {
    if (i === 0) return { hpt: 35 };
    if (i === 4 || sheetData[i]?.[0]?.includes?.('ANNEXURE') || sheetData[i]?.[0]?.includes?.('DEPARTURE')) {
      return { hpt: 30 };
    }
    if (
      sheetData[i]?.includes('S.No') ||
      sheetData[i]?.includes('Description') ||
      sheetData[i]?.includes('Vessel Name')
    ) {
      return { hpt: 28 };
    }
    return { hpt: 22 };
  });

  ws['!margins'] = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };

  XLSX.utils.book_append_sheet(wb, ws, 'Vessel Report');

  const fileName = `${portName.replace(/\s+/g, '_')}_${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
