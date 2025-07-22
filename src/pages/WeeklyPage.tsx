import React, { useState, useEffect, useMemo } from "react";
import { Ship, Calendar } from "lucide-react";
import { fetchPorts, fetchWeeklyPerformancesWithPort } from "../services/api";
import { Port } from "../types";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/ui/Card";
import DateRangePicker from "../components/ui/DateRangePicker";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorDisplay from "../components/ui/ErrorDisplay";
import {
  exportWeeklySummaryAndReports,
  WeeklySummary,
} from "../utils/excelExport";
import Button from "../components/ui/Button";
// ...existing code...
const WeeklyPage: React.FC = () => {
  const [ports, setPorts] = useState<Port[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPortId, setSelectedPortId] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const portsData = await fetchPorts();
        setPorts(portsData);
        const allReports = await fetchWeeklyPerformancesWithPort();
        setReports(allReports);
      } catch (err) {
        setError("Failed to load weekly reports");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter reports based on port and date range
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (selectedPortId !== "all" && report.portId !== selectedPortId)
        return false;
      if (!fromDate && !toDate) return true;
      const createdAt = report.createdAt || report.created_at;
      const reportDate =
        createdAt && createdAt.seconds
          ? new Date(createdAt.seconds * 1000)
          : null;
      if (!reportDate) return true;
      const fromDateObj = fromDate ? new Date(fromDate) : null;
      const toDateObj = toDate ? new Date(toDate) : null;
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
  }, [reports, selectedPortId, fromDate, toDate]);

  // Summary calculation logic (moved inside component)
  const summary = useMemo(() => {
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
    const totalVesselsInPort = filteredReports.length;
    const totalLoading = filteredReports.filter(
      (r) => r.status === "Loading"
    ).length;
    const totalUnloading = filteredReports.filter(
      (r) => r.status === "Unloading"
    ).length;
    const totalArrivedLastWeek = filteredReports.filter(isLastWeek).length;
    const totalDepartedLastWeek = filteredReports.filter(
      (r) => r.status === "Departed" && isLastWeek(r)
    ).length;
    const totalDemurrages = filteredReports.reduce(
      (sum, r) => sum + (Number(r.demurragesCollected) || 0),
      0
    );
    const totalCargoHandled = filteredReports.reduce(
      (sum, r) => sum + (Number(r.totalQuantity) || 0),
      0
    );
    const bulkCargo = filteredReports.filter(
      (r) => r.cargoType === "Bulk"
    ).length;
    const breakBulk = filteredReports.filter(
      (r) => r.cargoType === "Break Bulk"
    ).length;
    const container = filteredReports.filter(
      (r) => r.cargoType === "Container"
    ).length;
    const projectCargo = filteredReports.filter(
      (r) => r.cargoType === "Project"
    ).length;
    const liquidCargo = filteredReports.filter(
      (r) => r.cargoType === "Liquid"
    ).length;
    const totalAppliedClearance = filteredReports.filter(
      (r) => r.clearanceIssued === "Applied"
    ).length;
    const totalIssuedClearance = filteredReports.filter(
      (r) => r.clearanceIssued === "Issued"
    ).length;
    const totalPendingClearance = filteredReports.filter(
      (r) => r.clearanceIssued === "Pending"
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
        description: "Total vessels arrived last week As on date",
        total: totalArrivedLastWeek,
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
        total: filteredReports
          .filter(isLastWeek)
          .reduce((sum, r) => sum + (Number(r.totalQuantity) || 0), 0),
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
      {
        description: "Total number of clearance pending if any",
        total: totalPendingClearance,
      },
    ];
  }, [filteredReports]);

  const handleExportAll = () => {
    exportWeeklySummaryAndReports(summary, filteredReports);
  };

  if (loading) {
    return (
      <DashboardLayout title="Weekly Reports">
        <LoadingSpinner message="Loading weekly reports..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Weekly Reports">
        <ErrorDisplay message={error} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Weekly Reports"
      subtitle="View and manage all weekly vessel performance reports"
      icon={<Ship className="h-6 w-6 text-seagreen-600" />}
    >
      <Card
        title="Filters"
        icon={<Calendar className="h-6 w-6 text-seagreen-600" />}
        className="mb-6"
      >
        {/* Summary Table */}

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
              fromLabel="From Report Date"
              toLabel="To Report Date"
            />
          </div>
        </div>

        {(fromDate || toDate || selectedPortId !== "all") && (
          <div className="mt-4 flex items-center justify-between bg-seagreen-50 p-3 rounded-lg">
            <p className="text-sm text-seagreen-700">
              Showing {filteredReports.length} reports
              {selectedPortId !== "all" &&
                ` from ${ports.find((p) => p.id === selectedPortId)?.portName}`}
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

      <Card title="Summary (Abstract)" className="mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  S.no
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Number
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {summary.map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{row.description}</td>
                  <td className="px-4 py-2">{row.total}</td>
                  <td className="px-4 py-2">{row.remarks || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Weekly Performance Reports"
        icon={<Ship className="h-6 w-6 text-seagreen-600" />}
      >
        <Button
          variant="outline"
          onClick={handleExportAll}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          }
        >
          Export All
        </Button>
        {filteredReports.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded text-center">
            <Ship className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <h3 className="text-lg font-medium">No weekly reports found</h3>
            <p className="mt-2 text-gray-500">
              No weekly performance reports have been added yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vessel Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Port
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Demurrages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departure
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {report.vesselName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.port?.portName || report.portId || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.purposeOfArrival || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.status || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.totalQuantity ?? "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.demurragesCollected ?? "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.departureDate || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default WeeklyPage;
