import React, { useState, useCallback, useMemo, memo, useEffect } from "react";
import {
  Ship,
  Calendar,
  Package,
  Navigation,
  ExternalLink,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Vessel } from "../../types";
import Card from "../ui/Card";
import LoadingSpinner from "../ui/LoadingSpinner";
import ErrorDisplay from "../ui/ErrorDisplay";
import Button from "../ui/Button";
import SearchFilter from "../ui/SearchFilter";
import DateRangePicker from "../ui/DateRangePicker";
import StatusBadge from "../ui/StatusBadge";
import { formatDateTime, formatCurrency } from "../../utils/formatters";
import {
  WeeklySummary,
  exportPortWiseSummaryAndReports,
  PortSummaryData,
} from "../../utils/excelExport";

interface DailyCargoDetail {
  date?: Date | string;
  cargoType?: string;
  cargoTypeInDetail?: string;
  quantity?: string;
  demurrageCharges?: string;
  reason?: string;
}

interface VesselWithPortName extends Vessel {
  portName?: string;
  dailyCargoDetails?: DailyCargoDetail[];
}

interface VesselListProps {
  vessels: VesselWithPortName[];
  loading: boolean;
  error: string | null;
  portName?: string;
  showExport?: boolean;
  portId?: string;
}

const VesselList: React.FC<VesselListProps> = ({
  vessels,
  loading,
  error,
  portName,
  showExport = false,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "Import" | "Export" | "Coastal"
  >("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleViewDetails = useCallback(
    (vesselId: string) => {
      navigate(`/vessel-details/${vesselId}`);
    },
    [navigate]
  );

  const filteredVessels = useMemo(() => {
    return vessels.filter((vessel) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (vessel.vesselName?.toLowerCase().includes(searchLower) ?? false) ||
        (vessel.imo?.toLowerCase().includes(searchLower) ?? false) ||
        (vessel.arrivalFrom?.toLowerCase().includes(searchLower) ?? false) ||
        (vessel.cargo?.type?.toLowerCase().includes(searchLower) ?? false) ||
        (vessel.portName?.toLowerCase().includes(searchLower) ?? false);

      const matchesType =
        filterType === "all" || vessel.operationType === filterType;

      let matchesDateRange = true;
      if (fromDate || toDate) {
        const arrivalDate = vessel.arrivalDateTime;
        if (arrivalDate) {
          let vesselDate: Date;

          if (typeof arrivalDate === 'string') {
            vesselDate = new Date(arrivalDate);
          } else if (arrivalDate instanceof Date) {
            vesselDate = arrivalDate;
          } else if (arrivalDate && typeof arrivalDate === 'object' && 'seconds' in arrivalDate) {
            vesselDate = new Date((arrivalDate as any).seconds * 1000);
          } else {
            matchesDateRange = false;
            return false;
          }

          if (fromDate) {
            const from = new Date(fromDate);
            from.setHours(0, 0, 0, 0);
            if (vesselDate < from) {
              matchesDateRange = false;
            }
          }

          if (toDate && matchesDateRange) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            if (vesselDate > to) {
              matchesDateRange = false;
            }
          }
        } else {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesType && matchesDateRange;
    });
  }, [vessels, searchTerm, filterType, fromDate, toDate]);

  const totalPages = Math.ceil(filteredVessels.length / pageSize);

  const paginatedVessels = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredVessels.slice(startIndex, endIndex);
  }, [filteredVessels, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, fromDate, toDate]);

  console.log({
    vessels: vessels.filter((vessel) => vessel.imo === "12341234"),
  });

  function getCargoSumsByType(data: VesselWithPortName[]) {
    const cargoSums = {
      Container: 0,
      "Break Bulk": 0,
      Project: 0,
      "Liquid Bulk": 0,
      "Dry Bulk": 0,
    };

    for (const vessel of data) {
      if (!vessel.clearanceIssuedOn) continue;

      for (const entry of vessel.dailyCargoDetails || []) {
        const type = entry.cargoTypeInDetail;
        const quantity = parseFloat(entry.quantity || "0");

        if (!isNaN(quantity) && type && type in cargoSums) {
          (cargoSums as Record<string, number>)[type] += quantity;
        }
      }
    }

    return cargoSums;
  }

  interface DailyCargoDetail {
    demurrageCharges?: string;
    quantity?: string;
  }

  interface VesselDemurrageSummary {
    vesselName: string;
    totalDemurrage: number;
  }

  function calculateTotalDemurrage(
    vessels: VesselWithPortName[]
  ): VesselDemurrageSummary[] {
    return vessels.map((vessel) => {
      const totalDemurrage =
        vessel.dailyCargoDetails?.reduce(
          (sum: number, cargo: DailyCargoDetail) => {
            const charge = parseFloat(cargo.demurrageCharges || "0") || 0;
            return sum + charge;
          },
          0
        ) || 0;

      return {
        vesselName: vessel.vesselName,
        totalDemurrage,
      };
    });
  }

  interface VesselTotalSummary {
    vesselName: string;
    totalQuantity: number;
  }

  function calculateTotalQuantity(
    vessels: VesselWithPortName[]
  ): VesselTotalSummary[] {
    return vessels.map((vessel) => {
      const totalQuantity =
        vessel.dailyCargoDetails?.reduce(
          (sum: number, cargo: DailyCargoDetail) => {
            const charge = parseFloat(cargo.quantity || "0") || 0;
            return sum + charge;
          },
          0
        ) || 0;

      return {
        vesselName: vessel.vesselName,
        totalQuantity,
      };
    });
  }

  // Function to calculate summary for a specific port
  const calculatePortSummary = (
    vessels: VesselWithPortName[],
    portName: string
  ): WeeklySummary[] => {
    const now = new Date();
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);
    const lastWeekEnd = new Date(now);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const isLastWeek = (report: VesselWithPortName) => {
      const createdAt = report.createdAt || report.addedDate;
      if (!createdAt || !createdAt.seconds) return false;
      const d = new Date(createdAt.seconds * 1000);
      return d >= lastWeekStart && d <= lastWeekEnd;
    };

    const totalVesselsLastWeek = vessels.filter(isLastWeek).length;
    const totalBerthedVessels = vessels.filter(
      (r) => r.berthingDateTime
    ).length;
    const totalDepartedVessels = vessels.filter(
      (r) => r.pobDepartureDateTime
    ).length;
    const totalVesselsInPort = totalBerthedVessels - totalDepartedVessels;

    const totalLoading = vessels.filter(
      (r) =>
        r.operationType.toLowerCase() === "loading" &&
        Boolean(r.clearanceIssuedOn)
    ).length;
    const totalUnloading = vessels.filter(
      (r) =>
        r.operationType.toLowerCase() === "unloading" &&
        Boolean(r.clearanceIssuedOn)
    ).length;
    const totalDepartedLastWeek = vessels.filter(
      (r) => Boolean(r.pobDepartureDateTime) && isLastWeek(r)
    ).length;

    const totalDemurrages = calculateTotalDemurrage(vessels).reduce(
      (sum, { totalDemurrage }) => sum + totalDemurrage,
      0
    );
    const totalCargoHandled = calculateTotalQuantity(vessels).reduce(
      (sum, { totalQuantity }) => sum + totalQuantity,
      0
    );

    const {
      Container: container,
      "Break Bulk": breakBulk,
      Project: projectCargo,
      "Liquid Bulk": liquidCargo,
      "Dry Bulk": bulkCargo,
    } = getCargoSumsByType(vessels);

    const totalAppliedClearance = vessels.filter((r) =>
      Boolean(r.clearanceIssuedOn)
    ).length;
    const totalIssuedClearance = vessels.filter((r) =>
      Boolean(r.clearanceIssuedOn)
    ).length;

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
        total: totalDemurrages,
      },
      {
        description: `Total cargo handled by ${portName} since start of financial year`,
        total: totalCargoHandled,
      },
      {
        description: `Cargo handled by ${portName} in the last week`,
        total: breakBulk + bulkCargo + container + projectCargo + liquidCargo,
      },
      { description: `${portName} - Bulk cargo`, total: bulkCargo },
      { description: `${portName} - Break Bulk`, total: breakBulk },
      {
        description: `${portName} - Container (in TEU & MMT)`,
        total: container,
      },
      { description: `${portName} - Project cargo`, total: projectCargo },
      { description: `${portName} - Liquid cargo`, total: liquidCargo },
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

  const handleExportAllWeekly = () => {
    // Use all filtered vessels without filtering by operation type
    const allReports = filteredVessels;

    // Group vessels by port
    const vesselsByPort = new Map<string, VesselWithPortName[]>();
    allReports.forEach((vessel) => {
      const port = vessel.portName || "Unknown Port";
      if (!vesselsByPort.has(port)) {
        vesselsByPort.set(port, []);
      }
      vesselsByPort.get(port)!.push(vessel);
    });

    // Calculate summary for all ports combined
    const allPortsSummary = calculatePortSummary(allReports, "All Ports");

    // Calculate summary for each port and sort alphabetically
    const portSummaries: PortSummaryData[] = [];

    // First add the "All Ports" summary
    portSummaries.push({
      portName: "All Ports",
      summary: allPortsSummary,
      vessels: allReports.filter(
        (vessel) => vessel.clearanceIssuedOn
      ) as unknown as Record<string, unknown>[], // Only cleared vessels
    });

    // Then add individual port summaries sorted alphabetically
    const sortedPortEntries = Array.from(vesselsByPort.entries()).sort(
      ([a], [b]) => a.localeCompare(b)
    );

    sortedPortEntries.forEach(([portName, portVessels]) => {
      const portSummary = calculatePortSummary(portVessels, portName);
      portSummaries.push({
        portName,
        summary: portSummary,
        vessels: portVessels.filter(
          (vessel) => vessel.clearanceIssuedOn
        ) as unknown as Record<string, unknown>[], // Only cleared vessels
      });
    });

    console.log({
      portSummaries,
    });
    exportPortWiseSummaryAndReports(portSummaries);
  };

  const exportToCSV = useCallback(() => {
    // Generate headers
    const headers = [
      // General Information
      "Vessel Name",
      "IMO Number",
      "GRT",
      "Port Name",
      "Vessel Owner",
      "Vessel Agent",
      "Entry Date",
      "Sailed Out Date",

      // Dates and Times
      "Arrival Date & Time",
      "Pilot On Board Date & Time",
      "Berthing Date & Time",
      "Pilot Off Board Date & Time",
      "Next Port of Call",

      // Static Data
      "Length Over All (LOA)",
      "Beam",
      "Dead Weight Tonnage (DWT)",
      "Length",
      "Draft Available",

      // Draft Information
      "Arrival Draft Forward",
      "Arrival Draft Aft",
      "Departure Draft Forward",
      "Departure Draft Aft",

      // Operation Details
      "Operation Type",
      "Voyage Type",
      "Operation",
      "Arrival From",
      "Location",

      // Cargo Information
      "Cargo Type",
      "Cargo Name",
      "Cargo Volume",
      "Volume Units",
      "Cargo Quantity",
      "Total Revenue",
      "Status",
    ].join(",");

    // Generate data rows
    const rows = vessels.map((vessel) => {
      const formatValue = (value: string | number | null | undefined) => {
        if (value === null || value === undefined) return "";
        if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`;
        return value;
      };

      const formatDateValue = (date: Date | string | null | undefined) => {
        return date ? formatDateTime(date) : "";
      };

      return [
        // General Information
        formatValue(vessel.vesselName),
        formatValue(vessel.imo),
        formatValue(vessel.grt),
        formatValue(vessel.portName),
        formatValue(vessel.vesselOwner),
        formatValue(vessel.vesselAgent),
        formatValue(formatDateValue(vessel.entryDate)),
        formatValue(formatDateValue(vessel.sailedOutDate)),

        // Dates and Times
        formatValue(formatDateValue(vessel.arrivalDateTime)),
        formatValue(formatDateValue(vessel.pobDateTime)),
        formatValue(formatDateValue(vessel.berthingDateTime)),
        formatValue(formatDateValue(vessel.pobDepartureDateTime)),
        formatValue(vessel.nextPortOfCall),

        // Static Data
        formatValue(vessel.loa),
        formatValue(vessel.beam),
        formatValue(vessel.dwt),
        formatValue(vessel.length),
        formatValue(vessel.draftAvailable),

        // Draft Information
        formatValue(vessel.arrivalDraft?.forward),
        formatValue(vessel.arrivalDraft?.aft),
        formatValue(vessel.departureDraft?.forward),
        formatValue(vessel.departureDraft?.aft),

        // Operation Details
        formatValue(vessel.operationType),
        formatValue(vessel.voyageType),
        formatValue(vessel.operation),
        formatValue(vessel.arrivalFrom),
        formatValue(vessel.location),

        // Cargo Information
        formatValue(vessel.cargo?.type),
        formatValue(vessel.cargo?.name),
        formatValue(vessel.cargo?.volume),
        formatValue(vessel.cargo?.units),
        formatValue(vessel.cargoQuantity),
        formatValue(
          vessel.totalRevenue ? formatCurrency(vessel.totalRevenue) : ""
        ),
        formatValue(vessel.sailedOutDate ? "Sailed" : "Active"),
      ].join(",");
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${portName ? `${portName}_` : ""}vessels_${timestamp}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [vessels, portName]);

  if (loading) {
    return <LoadingSpinner message="Loading vessels..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <Card
      title={portName ? `Vessels - ${portName}` : "Vessel List"}
      icon={<Ship className="h-6 w-6 text-seagreen-600" />}
    >
      <SearchFilter
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder="Search by vessel name, IMO, cargo type..."
        filterOptions={[
          { value: "all", label: "All Types" },
          { value: "Import", label: "Import" },
          { value: "Export", label: "Export" },
          { value: "Coastal", label: "Coastal" },
        ]}
        filterValue={filterType}
        setFilterValue={(value) => setFilterType(value as typeof filterType)}
        onExport={showExport ? exportToCSV : undefined}
        showExport={showExport}
        handleExportAllWeekly={handleExportAllWeekly}
      />



      {filteredVessels.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded text-center">
          <Ship className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <h3 className="text-lg font-medium">No vessels found</h3>
          <p className="mt-2 text-gray-500">
            {searchTerm || filterType !== "all"
              ? "Try adjusting your search or filter criteria"
              : "No vessels have been added yet"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vessel Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arrival Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedVessels.map((vessel) => (
                <tr key={vessel.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <Ship className="h-5 w-5 text-seagreen-500 mr-2" />
                        <span className="font-medium text-gray-900">
                          {vessel.vesselName || "N/A"}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <div>IMO: {vessel.imo || "N/A"}</div>
                        <div>GRT: {vessel.grt || "N/A"}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {vessel.arrivalDateTime
                          ? formatDateTime(vessel.arrivalDateTime)
                          : "N/A"}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Navigation className="h-4 w-4 text-gray-400 mr-2" />
                        From: {vessel.arrivalFrom || "N/A"}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-2">
                      <StatusBadge
                        status={vessel.operationType}
                        label={vessel.operationType || "N/A"}
                      />
                      <StatusBadge
                        status={vessel.voyageType}
                        label={vessel.voyageType || "N/A"}
                      />
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start space-x-2">
                      <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {vessel.cargo?.type || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vessel.cargo?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vessel.cargo?.volume
                            ? `${vessel.cargo.volume} ${vessel.cargo.units}`
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-gray-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900">
                        {vessel.totalRevenue
                          ? formatCurrency(vessel.totalRevenue)
                          : "N/A"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleViewDetails(vessel.id!)}
                      icon={<ExternalLink className="h-4 w-4" />}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVessels.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              <div className="flex flex-1 items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * pageSize + 1}
                    </span>
                    {' '}-{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * pageSize, filteredVessels.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{filteredVessels.length}</span>
                    {' '}results
                  </div>

                  <div className="flex items-center gap-2">
                    <label htmlFor="pageSize" className="text-sm text-gray-700">
                      Per page:
                    </label>
                    <select
                      id="pageSize"
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className="rounded-md border-gray-300 py-1 pl-3 pr-8 text-sm focus:border-seagreen-500 focus:outline-none focus:ring-1 focus:ring-seagreen-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`relative inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium ${
                            currentPage === pageNumber
                              ? 'border-seagreen-500 bg-seagreen-50 text-seagreen-600 z-10'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default memo(VesselList);
