import React, { useState, useEffect, useMemo } from "react";
import { Ship, Calendar } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchPorts,
  fetchVessels,
  fetchWeeklyPerformancesWithPort,
} from "../services/api";
import { Port, Vessel } from "../types";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/ui/Card";
import DateRangePicker from "../components/ui/DateRangePicker";
import VesselList from "../components/vessel/VesselList";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorDisplay from "../components/ui/ErrorDisplay";
import { exportWeeklySummaryAndReports } from "../utils/excelExport";
import Button from "../components/ui/Button";
import ViewReportModal from "../components/vessel/ViewReportModal";
import ExcelReportGenerator from "../components/reports/ExcelReportGenerator";
import { generateExcelReport } from "../utils/excelReportGenerator";

const VesselsPage: React.FC = () => {
  const { userRole } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<"vessels" | "weekly">("vessels");

  // Vessel Info Tab states
  const [ports, setPorts] = useState<Port[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states for vessel tab
  const [selectedPortId, setSelectedPortId] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Weekly Report Tab states
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [weeklySelectedPortId, setWeeklySelectedPortId] =
    useState<string>("all");
  const [weeklyFromDate, setWeeklyFromDate] = useState<string>("");
  const [weeklyToDate, setWeeklyToDate] = useState<string>("");

  // Fetch vessels data
  useEffect(() => {
    const fetchVesselData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all ports first
        const portsData = await fetchPorts();
        setPorts(portsData);

        // If a specific port is selected, fetch vessels for that port
        if (selectedPortId && selectedPortId !== "all") {
          const vesselData = await fetchVessels(selectedPortId);
          setVessels(vesselData);
        } else {
          // Fetch vessels for all ports
          const allVessels: Vessel[] = [];
          for (const port of portsData) {
            if (port.id) {
              const portVessels = await fetchVessels(port.id);
              // Add port name to each vessel for display
              const vesselsWithPortName = portVessels.map((vessel) => ({
                ...vessel,
                portName: port.portName,
              }));
              allVessels.push(...vesselsWithPortName);
            }
          }
          setVessels(allVessels);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load vessels data");
      } finally {
        setLoading(false);
      }
    };

    fetchVesselData();
  }, [selectedPortId]);

  // Fetch weekly reports data
  useEffect(() => {
    const fetchWeeklyData = async () => {
      if (activeTab !== "weekly") return;

      try {
        setWeeklyLoading(true);
        setWeeklyError(null);

        // Fetch ports data if not already available
        if (ports.length === 0) {
          const portsData = await fetchPorts();
          setPorts(portsData);
        }

        // Fetch weekly reports
        const allReports = await fetchWeeklyPerformancesWithPort();
        setReports(allReports);
      } catch (err) {
        console.error("Error fetching weekly reports:", err);
        setWeeklyError("Failed to load weekly reports");
      } finally {
        setWeeklyLoading(false);
      }
    };

    fetchWeeklyData();
  }, [activeTab, ports.length]);

  // Filter vessels based on date range
  const filteredVessels = useMemo(() => {
    return vessels.filter((vessel) => {
      if (!fromDate && !toDate) return true;

      const arrivalDate = vessel.arrivalDateTime;
      if (!arrivalDate) return false;

      let vesselDate: Date;

      if (typeof arrivalDate === 'string') {
        vesselDate = new Date(arrivalDate);
      } else if (arrivalDate instanceof Date) {
        vesselDate = arrivalDate;
      } else if (arrivalDate && typeof arrivalDate === 'object' && 'seconds' in arrivalDate) {
        vesselDate = new Date((arrivalDate as any).seconds * 1000);
      } else {
        return false;
      }

      if (isNaN(vesselDate.getTime())) return false;

      const fromDateObj = fromDate ? new Date(fromDate) : null;
      const toDateObj = toDate ? new Date(toDate) : null;

      if (fromDateObj) {
        fromDateObj.setHours(0, 0, 0, 0);
        if (vesselDate < fromDateObj) {
          return false;
        }
      }

      if (toDateObj) {
        toDateObj.setHours(23, 59, 59, 999);
        if (vesselDate > toDateObj) {
          return false;
        }
      }

      return true;
    });
  }, [vessels, fromDate, toDate]);

  // Helper function for weekly reports - Calculate cargo sums by type
  function getCargoSumsByType(data) {
    const cargoSums = {
      Container: 0,
      "Break Bulk": 0,
      Project: 0,
      "Liquid Bulk": 0,
      "Dry Bulk": 0,
    };

    for (const vessel of data) {
      if (!vessel.clearanceIssued) continue;

      for (const entry of vessel.dailyData || []) {
        const type = entry.cargoType;
        const quantity = parseFloat(entry.totalQuantity);

        if (!isNaN(quantity) && cargoSums.hasOwnProperty(type)) {
          cargoSums[type] += quantity;
        }
      }
    }

    return cargoSums;
  }

  // Filter weekly reports based on port and date range
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (
        weeklySelectedPortId !== "all" &&
        report.portId !== weeklySelectedPortId
      )
        return false;
      if (!weeklyFromDate && !weeklyToDate) return true;
      const createdAt = report.createdAt || report.created_at;
      const reportDate =
        createdAt && createdAt.seconds
          ? new Date(createdAt.seconds * 1000)
          : null;
      if (!reportDate) return true;
      const fromDateObj = weeklyFromDate ? new Date(weeklyFromDate) : null;
      const toDateObj = weeklyToDate ? new Date(weeklyToDate) : null;
      if (fromDateObj && toDateObj) {
        toDateObj.setHours(23, 59, 59, 999);
        return reportDate >= fromDateObj && reportDate <= toDateObj;
      } else if (fromDateObj) {
        return reportDate >= fromDateObj;
      } else if (toDateObj) {
        toDateObj.setHours(23, 59, 59, 999);
        return reportDate <= toDateObj;
      }
      return true;
    });
  }, [reports, weeklySelectedPortId, weeklyFromDate, weeklyToDate]);

  // Calculate weekly summary data
  const weeklySummary = useMemo(() => {
    const now = new Date();
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);
    const lastWeekEnd = new Date(now);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const isLastWeek = (report: any) => {
      const createdAt = report.createdAt || report.created_at;
      if (!createdAt || !createdAt.seconds) return false;
      const d = new Date(createdAt.seconds * 1000);
      return d >= lastWeekStart && d <= lastWeekEnd;
    };

    const totalVesselsLastWeek = filteredReports.filter(isLastWeek).length;
    // Calculate total vessels in port (berthed - departed)
    const totalBerthedVessels = filteredReports.filter(
      (r) => r.berthedDate
    ).length;
    const totalDepartedVessels = filteredReports.filter(
      (r) => r.departureDate
    ).length;
    const totalVesselsInPort = totalBerthedVessels - totalDepartedVessels;

    const totalLoading = filteredReports.filter(
      (r) =>
        r.purposeOfArrival?.toLowerCase() === "loading" &&
        Boolean(r.clearanceIssued)
    ).length;

    const totalUnloading = filteredReports.filter(
      (r) =>
        r.purposeOfArrival?.toLowerCase() === "unloading" &&
        Boolean(r.clearanceIssued)
    ).length;

    const totalDepartedLastWeek = filteredReports.filter(
      (r) => Boolean(r.departureDate) && isLastWeek(r)
    ).length;

    const totalDemurrages = filteredReports.reduce(
      (sum, r) => sum + (Number(r.demurragesCollected) || 0),
      0
    );

    const totalCargoHandled = filteredReports.reduce(
      (sum, r) => sum + (Number(r.totalQuantity) || 0),
      0
    );

    const {
      Container: container = 0,
      "Break Bulk": breakBulk = 0,
      Project: projectCargo = 0,
      "Liquid Bulk": liquidCargo = 0,
      "Dry Bulk": bulkCargo = 0,
    } = getCargoSumsByType(filteredReports);

    const totalAppliedClearance = filteredReports.filter((r) =>
      Boolean(r.clearanceIssued)
    ).length;

    const totalIssuedClearance = filteredReports.filter((r) =>
      Boolean(r.clearanceIssued)
    ).length;

    return [
      {
        description: "Total number of vessels called in the last week",
        total: totalVesselsLastWeek,
      },
      {
        description: "Total number of vessels in the port as on date",
        total: totalVesselsInPort,
      },
      {
        description: "Total number of vessels loading in the port as on date",
        total: totalLoading,
      },
      {
        description: "Total number of vessels Unloading in the port as on date",
        total: totalUnloading,
      },
      {
        description: "Total vessels departed last week",
        total: totalDepartedLastWeek,
      },
      {
        description: "Demurrages collected (if any) from the ships by the port",
        total: totalDemurrages,
      },
      {
        description:
          "Total cargo handled since the start of the financial year",
        total: totalCargoHandled,
      },
      {
        description: "Cargo handled in the last week",
        total: breakBulk + bulkCargo + container + projectCargo + liquidCargo,
      },
      { description: "Bulk cargo", total: bulkCargo },
      { description: "Break Bulk", total: breakBulk },
      { description: "Container (in TEU & MMT)", total: container },
      { description: "Project cargo", total: projectCargo },
      { description: "Liquid cargo", total: liquidCargo },
      {
        description: "Total number of vessels applied for clearance",
        total: totalAppliedClearance,
      },
      {
        description: "Total number of clearances issued",
        total: totalIssuedClearance,
      },
    ];
  }, [filteredReports]);

  const handleExportAll = () => {
    const loadingUnloadingReports = filteredReports.filter(
      (report) =>
        report.purposeOfArrival?.toLowerCase() === "loading" ||
        report.purposeOfArrival?.toLowerCase() === "unloading"
    );
    exportWeeklySummaryAndReports(weeklySummary, loadingUnloadingReports);
  };

  const handleGenerateWeeklyReport = (portId: string) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Determine which vessels to use based on portId
    let vesselsToFilter = portId === 'all' ? vessels : vessels.filter(v => v.portId === portId);

    const weeklyVessels = vesselsToFilter.filter(vessel => {
      const arrivalDate = vessel.arrivalDateTime;
      if (!arrivalDate) return false;

      let vesselDate: Date;
      if (typeof arrivalDate === 'string') {
        vesselDate = new Date(arrivalDate);
      } else if (arrivalDate instanceof Date) {
        vesselDate = arrivalDate;
      } else if (arrivalDate && typeof arrivalDate === 'object' && 'seconds' in arrivalDate) {
        vesselDate = new Date((arrivalDate as any).seconds * 1000);
      } else {
        return false;
      }

      return vesselDate >= weekAgo && vesselDate <= now;
    });

    const portName = portId !== 'all'
      ? ports.find(p => p.id === portId)?.portName || 'Selected Port'
      : 'All Ports';

    generateExcelReport(weeklyVessels, portName, 'weekly', undefined, undefined, portId === 'all');
  };

  const handleGenerateCustomReport = (fromDateStr: string, toDateStr: string, portId: string) => {
    const from = new Date(fromDateStr);
    from.setHours(0, 0, 0, 0);
    const to = new Date(toDateStr);
    to.setHours(23, 59, 59, 999);

    // Determine which vessels to use based on portId
    let vesselsToFilter = portId === 'all' ? vessels : vessels.filter(v => v.portId === portId);

    const customVessels = vesselsToFilter.filter(vessel => {
      const arrivalDate = vessel.arrivalDateTime;
      if (!arrivalDate) return false;

      let vesselDate: Date;
      if (typeof arrivalDate === 'string') {
        vesselDate = new Date(arrivalDate);
      } else if (arrivalDate instanceof Date) {
        vesselDate = arrivalDate;
      } else if (arrivalDate && typeof arrivalDate === 'object' && 'seconds' in arrivalDate) {
        vesselDate = new Date((arrivalDate as any).seconds * 1000);
      } else {
        return false;
      }

      return vesselDate >= from && vesselDate <= to;
    });

    const portName = portId !== 'all'
      ? ports.find(p => p.id === portId)?.portName || 'Selected Port'
      : 'All Ports';

    generateExcelReport(customVessels, portName, 'custom', fromDateStr, toDateStr, portId === 'all');
  };

  const renderTabs = () => (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("vessels")}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "vessels"
                  ? "border-seagreen-500 text-seagreen-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Vessel Info
          </button>
          {/* <button
            onClick={() => setActiveTab("weekly")}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "weekly"
                  ? "border-seagreen-500 text-seagreen-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Weekly Reports
          </button> */}
        </nav>
      </div>
    </div>
  );

  const renderVesselsTab = () => {
    if (loading) {
      return <LoadingSpinner message="Loading vessels data..." />;
    }

    if (error) {
      return <ErrorDisplay message={error} />;
    }

    return (
      <>
        <ExcelReportGenerator
          onGenerateWeekly={handleGenerateWeeklyReport}
          onGenerateCustom={handleGenerateCustomReport}
          ports={ports}
          selectedPortId={selectedPortId}
          onPortChange={setSelectedPortId}
          isAdmin={true}
        />

        <Card
          title="Filters"
          icon={<Calendar className="h-6 w-6 text-seagreen-600" />}
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Port
              </label>
              <select
                value={selectedPortId}
                onChange={(e) => setSelectedPortId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              >
                <option value="all">All Ports</option>
                {ports.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.portName}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <DateRangePicker
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                fromLabel="From Arrival Date"
                toLabel="To Arrival Date"
              />
            </div>
          </div>

          {(fromDate || toDate || selectedPortId !== "all") && (
            <div className="mt-4 flex items-center justify-between bg-seagreen-50 p-3 rounded-lg">
              <p className="text-sm text-seagreen-700">
                Showing {filteredVessels.length} vessel{filteredVessels.length !== 1 ? 's' : ''}
                {selectedPortId !== "all" &&
                  ` from ${
                    ports.find((p) => p.id === selectedPortId)?.portName
                  }`}
                {fromDate && toDate
                  ? ` between ${new Date(
                      fromDate
                    ).toLocaleDateString()} and ${new Date(
                      toDate
                    ).toLocaleDateString()}`
                  : fromDate
                  ? ` from ${new Date(fromDate).toLocaleDateString()}`
                  : toDate
                  ? ` until ${new Date(toDate).toLocaleDateString()}`
                  : ""}
              </p>
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setSelectedPortId("all");
                }}
                className="text-sm text-seagreen-600 hover:text-seagreen-800 font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
        </Card>

        <VesselList
          vessels={filteredVessels}
          loading={loading}
          error={error}
          showExport={true}
        />
      </>
    );
  };

  // const renderWeeklyTab = () => {
  //   if (weeklyLoading) {
  //     return <LoadingSpinner message="Loading weekly reports..." />;
  //   }

  //   if (weeklyError) {
  //     return <ErrorDisplay message={weeklyError} />;
  //   }

  //   return (
  //     <>
  //       <Card
  //         title="Filters"
  //         icon={<Calendar className="h-6 w-6 text-seagreen-600" />}
  //         className="mb-6"
  //       >
  //         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700 mb-1">
  //               Select Port
  //             </label>
  //             <select
  //               value={weeklySelectedPortId}
  //               onChange={(e) => setWeeklySelectedPortId(e.target.value)}
  //               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
  //             >
  //               <option value="all">All Ports</option>
  //               {ports.map((port) => (
  //                 <option key={port.id} value={port.id}>
  //                   {port.portName}
  //                 </option>
  //               ))}
  //             </select>
  //           </div>
  //           <div className="md:col-span-2">
  //             <DateRangePicker
  //               fromDate={weeklyFromDate}
  //               toDate={weeklyToDate}
  //               onFromDateChange={setWeeklyFromDate}
  //               onToDateChange={setWeeklyToDate}
  //               fromLabel="From Report Date"
  //               toLabel="To Report Date"
  //             />
  //           </div>
  //         </div>

  //         {(weeklyFromDate ||
  //           weeklyToDate ||
  //           weeklySelectedPortId !== "all") && (
  //           <div className="mt-4 flex items-center justify-between bg-seagreen-50 p-3 rounded-lg">
  //             <p className="text-sm text-seagreen-700">
  //               Showing {filteredReports.length} reports
  //               {weeklySelectedPortId !== "all" &&
  //                 ` from ${
  //                   ports.find((p) => p.id === weeklySelectedPortId)?.portName
  //                 }`}
  //               {weeklyFromDate && weeklyToDate
  //                 ? ` between ${new Date(
  //                     weeklyFromDate
  //                   ).toLocaleDateString()} and ${new Date(
  //                     weeklyToDate
  //                   ).toLocaleDateString()}`
  //                 : weeklyFromDate
  //                 ? ` from ${new Date(weeklyFromDate).toLocaleDateString()}`
  //                 : weeklyToDate
  //                 ? ` until ${new Date(weeklyToDate).toLocaleDateString()}`
  //                 : ""}
  //             </p>
  //             <button
  //               onClick={() => {
  //                 setWeeklyFromDate("");
  //                 setWeeklyToDate("");
  //                 setWeeklySelectedPortId("all");
  //               }}
  //               className="text-sm text-seagreen-600 hover:text-seagreen-800 font-medium"
  //             >
  //               Clear Filters
  //             </button>
  //           </div>
  //         )}
  //       </Card>

  //       <Card
  //         title="Weekly Performance Reports"
  //         icon={<Ship className="h-6 w-6 text-seagreen-600" />}
  //       >
  //         <div className="w-full flex items-center mb-4">
  //           <Button
  //             variant="outline"
  //             onClick={handleExportAll}
  //             className="ml-auto"
  //             icon={
  //               <svg
  //                 xmlns="http://www.w3.org/2000/svg"
  //                 width="16"
  //                 height="16"
  //                 viewBox="0 0 24 24"
  //                 fill="none"
  //                 stroke="currentColor"
  //                 strokeWidth="2"
  //                 strokeLinecap="round"
  //                 strokeLinejoin="round"
  //               >
  //                 <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
  //                 <polyline points="7 10 12 15 17 10"></polyline>
  //                 <line x1="12" y1="15" x2="12" y2="3"></line>
  //               </svg>
  //             }
  //           >
  //             Export All
  //           </Button>
  //         </div>
  //         {filteredReports.length === 0 ? (
  //           <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded text-center">
  //             <Ship className="h-12 w-12 mx-auto mb-3 text-gray-400" />
  //             <h3 className="text-lg font-medium">No weekly reports found</h3>
  //             <p className="mt-2 text-gray-500">
  //               No weekly performance reports have been added yet
  //             </p>
  //           </div>
  //         ) : (
  //           <div className="overflow-x-auto">
  //             <table className="min-w-full divide-y divide-gray-200">
  //               <thead className="bg-gray-50 w-full">
  //                 <tr>
  //                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                     Vessel Name
  //                   </th>
  //                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                     Port
  //                   </th>
  //                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                     Agent Name
  //                   </th>
  //                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                     Owner Details
  //                   </th>
  //                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                     Purpose
  //                   </th>
  //                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                     Status
  //                   </th>
  //                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                     Cargo Type
  //                   </th>
  //                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                     Type of Cargo
  //                   </th>
  //                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                     Total Quantity
  //                   </th>
  //                   <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                     Actions
  //                   </th>
  //                 </tr>
  //               </thead>
  //               <tbody className="bg-white divide-y divide-gray-200">
  //                 {filteredReports.map((report) => (
  //                   <tr key={report.id} className="hover:bg-gray-50">
  //                     <td className="px-6 py-4 whitespace-nowrap">
  //                       {report.vesselName || "N/A"}
  //                     </td>
  //                     <td className="px-6 py-4 whitespace-nowrap">
  //                       {report.port?.portName || "N/A"}
  //                     </td>
  //                     <td className="px-6 py-4 whitespace-nowrap">
  //                       {report.agentName || "N/A"}
  //                     </td>
  //                     <td className="px-6 py-4 whitespace-nowrap">
  //                       {report.ownerDetails || "N/A"}
  //                     </td>
  //                     <td className="px-6 py-4 whitespace-nowrap">
  //                       {report.purposeOfArrival || "N/A"}
  //                     </td>
  //                     <td className="px-6 py-4 whitespace-nowrap">
  //                       {report.status || "N/A"}
  //                     </td>
  //                     <td className="px-6 py-4 whitespace-nowrap">
  //                       {report.cargoType || "N/A"}
  //                     </td>
  //                     <td className="px-6 py-4 whitespace-nowrap">
  //                       {report.typeOfCargo || "N/A"}
  //                     </td>
  //                     <td className="px-6 py-4 whitespace-nowrap">
  //                       {report.totalQuantity ?? "N/A"}
  //                     </td>
  //                     <td className="px-6 py-4 whitespace-nowrap">
  //                       <Button
  //                         variant="outline"
  //                         onClick={() => {
  //                           setSelectedReport(report);
  //                           setIsViewModalOpen(true);
  //                         }}
  //                       >
  //                         View Details
  //                       </Button>
  //                     </td>
  //                   </tr>
  //                 ))}
  //               </tbody>
  //             </table>
  //           </div>
  //         )}
  //       </Card>
  //     </>
  //   );
  // };

  return (
    <DashboardLayout
      title={activeTab === "vessels" ? "Vessels" : "Weekly Reports"}
      subtitle={
        activeTab === "vessels"
          ? "View and manage all vessels across ports"
          : "Weekly vessel performance reports"
      }
      icon={<Ship className="h-6 w-6 text-seagreen-600" />}
    >
      {renderVesselsTab()}

      {/* View Modal for Weekly Reports */}
      <ViewReportModal
        report={selectedReport}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />
    </DashboardLayout>
  );
};

export default VesselsPage;
