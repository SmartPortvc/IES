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
  clearanceIssuedOn?: any;
  dailyCargoDetails?: Array<{
    date?: any;
    cargoType?: string;
    cargoTypeInDetail?: string;
    quantity?: string;
    demurrageCharges?: string;
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

const calculateWeeklySummary = (vessels: ReportVessel[], portName: string): WeeklySummaryRow[] => {
  const now = new Date();
  const lastWeekStart = new Date(now);
  lastWeekStart.setDate(now.getDate() - 7);
  lastWeekStart.setHours(0, 0, 0, 0);
  const lastWeekEnd = new Date(now);
  lastWeekEnd.setHours(23, 59, 59, 999);

  const isLastWeek = (vessel: ReportVessel) => {
    const createdAt = vessel.createdAt || vessel.addedDate;
    if (!createdAt) return false;

    let date: Date;
    if (typeof createdAt === 'string') {
      date = new Date(createdAt);
    } else if (createdAt instanceof Date) {
      date = createdAt;
    } else if (createdAt.seconds) {
      date = new Date(createdAt.seconds * 1000);
    } else {
      return false;
    }

    return date >= lastWeekStart && date <= lastWeekEnd;
  };

  const totalVesselsLastWeek = vessels.filter(isLastWeek).length;
  const totalBerthedVessels = vessels.filter(v => v.berthingDateTime).length;
  const totalDepartedVessels = vessels.filter(v => v.pobDepartureDateTime || v.sailedOutDate).length;
  const totalVesselsInPort = totalBerthedVessels - totalDepartedVessels;

  const totalLoading = vessels.filter(v =>
    (v.operationType?.toLowerCase() === 'loading' || v.operation?.toLowerCase()?.includes('loading')) &&
    Boolean(v.clearanceIssuedOn)
  ).length;

  const totalUnloading = vessels.filter(v =>
    (v.operationType?.toLowerCase() === 'unloading' || v.operation?.toLowerCase()?.includes('unloading')) &&
    Boolean(v.clearanceIssuedOn)
  ).length;

  const totalDepartedLastWeek = vessels.filter(v =>
    Boolean(v.pobDepartureDateTime || v.sailedOutDate) && isLastWeek(v)
  ).length;

  const totalDemurrages = vessels.reduce((sum, v) => {
    const demurrage = v.dailyCargoDetails?.reduce((dSum, d) => {
      return dSum + (parseFloat(d.demurrageCharges || '0') || 0);
    }, 0) || 0;
    return sum + demurrage + (v.totalRevenue || 0);
  }, 0);

  const totalCargoHandled = vessels.reduce((sum, v) => {
    const cargoQty = v.dailyCargoDetails?.reduce((cSum, d) => {
      return cSum + (parseFloat(d.quantity || '0') || 0);
    }, 0) || 0;
    return sum + cargoQty + (v.cargo?.volume || 0);
  }, 0);

  const cargoByType = vessels.reduce((acc, v) => {
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

    return acc;
  }, { container: 0, breakBulk: 0, project: 0, liquid: 0, bulk: 0 });

  const totalAppliedClearance = vessels.length;
  const totalIssuedClearance = vessels.filter(v => Boolean(v.clearanceIssuedOn)).length;

  return [
    {
      description: `Total number of vessels called in ${portName} in the last week`,
      total: totalVesselsLastWeek,
    },
    {
      description: `Total number of vessels in ${portName} as on date`,
      total: totalVesselsInPort,
    },
    {
      description: `Total number of vessels loading in ${portName} as on date`,
      total: totalLoading,
    },
    {
      description: `Total number of vessels unloading in ${portName} as on date`,
      total: totalUnloading,
    },
    {
      description: `Total vessels departed from ${portName} last week`,
      total: totalDepartedLastWeek,
    },
    {
      description: `Demurrages collected from ships by ${portName}`,
      total: formatNumber(totalDemurrages),
      remarks: 'In local currency',
    },
    {
      description: `Total cargo handled by ${portName} since start of financial year`,
      total: formatNumber(totalCargoHandled),
      remarks: 'In MT',
    },
    {
      description: `Cargo handled by ${portName} in the last week`,
      total: formatNumber(cargoByType.container + cargoByType.breakBulk + cargoByType.project + cargoByType.liquid + cargoByType.bulk),
      remarks: 'In MT',
    },
    { description: `${portName} - Dry Bulk cargo`, total: formatNumber(cargoByType.bulk), remarks: 'In MT' },
    { description: `${portName} - Break Bulk`, total: formatNumber(cargoByType.breakBulk), remarks: 'In MT' },
    { description: `${portName} - Container (in TEU & MMT)`, total: formatNumber(cargoByType.container), remarks: 'In TEU' },
    { description: `${portName} - Project cargo`, total: formatNumber(cargoByType.project), remarks: 'In MT' },
    { description: `${portName} - Liquid cargo`, total: formatNumber(cargoByType.liquid), remarks: 'In KL' },
    {
      description: `Total number of vessels applied for clearance at ${portName}`,
      total: totalAppliedClearance,
    },
    {
      description: `Total number of clearances issued by ${portName}`,
      total: totalIssuedClearance,
    },
  ];
};

export const generateExcelReport = (
  vessels: ReportVessel[],
  portName: string,
  reportType: 'weekly' | 'custom',
  fromDate?: string,
  toDate?: string
) => {
  const wb = XLSX.utils.book_new();

  const summary = calculateWeeklySummary(vessels, portName);
  const clearedVessels = vessels.filter(v => v.clearanceIssuedOn);
  const pendingVessels = vessels.filter(v => !v.clearanceIssuedOn);

  const dateRangeText = reportType === 'weekly'
    ? `${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} - ${new Date().toLocaleDateString()}`
    : `${new Date(fromDate!).toLocaleDateString()} - ${new Date(toDate!).toLocaleDateString()}`;

  const sheetData: any[][] = [
    [`${portName.toUpperCase()} - VESSEL MOVEMENT REPORT`],
    [`Report Period: ${dateRangeText}`],
    [],
    ['SUMMARY (ABSTRACT)'],
    [],
    ['S.No', 'Description', 'Total Number', 'Remarks'],
    ...summary.map((row, i) => [i + 1, row.description, row.total, row.remarks || '']),
    [],
    [],
  ];

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
      const totalQty = vessel.dailyCargoDetails?.reduce((sum, d) =>
        sum + (parseFloat(d.quantity || '0') || 0), 0
      ) || vessel.cargo?.volume || 0;

      const totalDem = vessel.dailyCargoDetails?.reduce((sum, d) =>
        sum + (parseFloat(d.demurrageCharges || '0') || 0), 0
      ) || vessel.totalRevenue || 0;

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
      const totalDem = vessel.dailyCargoDetails?.reduce((sum, d) =>
        sum + (parseFloat(d.demurrageCharges || '0') || 0), 0
      ) || vessel.totalRevenue || 0;

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
    { wch: 6 },
    { wch: 25 },
    { wch: 20 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
  ];

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (!ws[cellRef]) continue;

      const cellValue = ws[cellRef].v;

      if (R === 0 || R === 3 || String(cellValue).includes('ANNEXURE') || String(cellValue).includes('DEPARTURE DATE')) {
        ws[cellRef].s = {
          font: { bold: true, sz: 14, color: { rgb: '047857' } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: {
            bottom: { style: 'medium', color: { rgb: '14B8A6' } },
          },
        };
      } else if (R === 5 || String(cellValue) === 'S.No' || String(cellValue) === 'Description') {
        ws[cellRef].s = {
          fill: { fgColor: { rgb: '14B8A6' } },
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'E5E7EB' } },
            bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
            left: { style: 'thin', color: { rgb: 'E5E7EB' } },
            right: { style: 'thin', color: { rgb: 'E5E7EB' } },
          },
        };
      } else if (R > 5 && cellValue !== '') {
        ws[cellRef].s = {
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
          font: { sz: 10 },
          border: {
            top: { style: 'thin', color: { rgb: 'E5E7EB' } },
            bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
            left: { style: 'thin', color: { rgb: 'E5E7EB' } },
            right: { style: 'thin', color: { rgb: 'E5E7EB' } },
          },
        };
      }
    }
  }

  ws['!rows'] = Array(sheetData.length).fill(null).map((_, i) => {
    if (i === 0 || i === 3) return { hpt: 30 };
    if (i === 5) return { hpt: 35 };
    return { hpt: 25 };
  });

  ws['!margins'] = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 };

  XLSX.utils.book_append_sheet(wb, ws, 'Vessel Report');

  const fileName = `${portName.replace(/\s+/g, '_')}_${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
