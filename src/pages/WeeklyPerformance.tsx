import React, { useState, useEffect, useMemo } from "react";
import { Ship, Calendar } from "lucide-react";
import {
  fetchWeeklyPerformancesWithPort,
  fetchUserPortId,
  updateWeeklyPerformance,
} from "../services/api";
import DashboardLayout from "../components/layout/DashboardLayout";
import Card from "../components/ui/Card";
import DateRangePicker from "../components/ui/DateRangePicker";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorDisplay from "../components/ui/ErrorDisplay";
import { exportWeeklySummaryAndReports } from "../utils/excelExport";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import ViewReportModal from "../components/vessel/ViewReportModal";
import EditReportModal from "../components/vessel/EditReportModal";

const WeeklyPerformance: React.FC = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPortId, setUserPortId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  const handleEditReport = (report: any) => {
    setSelectedReport(report);
    setIsEditModalOpen(true);
  };

  const handleUpdateReport = async (updatedReport: any) => {
    try {
      // Call API to update the report
      await updateWeeklyPerformance(updatedReport.id, updatedReport);

      // Update local state
      const newReports = reports.map((report) =>
        report.id === updatedReport.id ? updatedReport : report
      );
      setReports(newReports);

      // Close modal
      setIsEditModalOpen(false);
    } catch (err) {
      setError("Failed to update report");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user's port ID
        const portId = await fetchUserPortId(currentUser?.uid || "");
        if (!portId) {
          setError("User port ID not found");
          return;
        }
        setUserPortId(portId);

        // Fetch reports
        const allReports = await fetchWeeklyPerformancesWithPort();
        // Filter reports for current port
        const portReports = allReports.filter(
          (report) => report.portId === portId
        );
        setReports(portReports);
        console.log("Fetched reports:", portReports);
      } catch (err) {
        setError("Failed to load weekly reports");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  // Filter reports based on date range
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
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
  }, [reports, fromDate, toDate]);

  // Summary calculation logic
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
    const totalBerthedVessels = filteredReports.filter(
      (r) => r.berthedDate
    ).length;
    const totalDepartedVessels = filteredReports.filter(
      (r) => r.departureDate
    ).length;
    const totalVesselsInPort = totalBerthedVessels - totalDepartedVessels;
    const totalLoading = filteredReports.filter(
      (r) => r.status === "Loading"
    ).length;
    const totalUnloading = filteredReports.filter(
      (r) => r.status === "Unloading"
    ).length;
    const totalDepartedLastWeek = filteredReports.filter(
      (r) => Boolean(r.departureDate) && isLastWeek(r)
    ).length;

    const totalDemurrages = filteredReports.reduce((sum, r) => {
      const dailyDemurrages =
        r.dailyData?.reduce(
          (total: number, day: any) => total + (Number(day.demurrages) || 0),
          0
        ) || 0;
      return sum + dailyDemurrages;
    }, 0);

    const totalCargoHandled = filteredReports.reduce((sum, r) => {
      const dailyQuantities =
        r.dailyData?.reduce(
          (total: number, day: any) => total + (Number(day.totalQuantity) || 0),
          0
        ) || 0;
      return sum + dailyQuantities;
    }, 0);

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
        total: filteredReports.filter(isLastWeek).reduce((sum, r) => {
          const dailyQuantities =
            r.dailyData?.reduce(
              (total: number, day: any) =>
                total + (Number(day.totalQuantity) || 0),
              0
            ) || 0;
          return sum + dailyQuantities;
        }, 0),
      },
      { description: "Bulk cargo", total: bulkCargo },
      { description: "Break Bulk", total: breakBulk },
      { description: "Container (in TEU & MMT)", total: container },
      { description: "Project cargo", total: projectCargo },
      { description: "Liquid cargo", total: liquidCargo },
    ];
  }, [filteredReports]);

  const handleExportAll = () => {
    const loadingUnloadingReports = filteredReports.filter(
      (report) =>
        report.purposeOfArrival.toLowerCase() === "loading" ||
        report.purposeOfArrival.toLowerCase() === "unloading"
    );
    exportWeeklySummaryAndReports(summary, loadingUnloadingReports);
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
      subtitle="View and manage your port's weekly vessel performance reports"
      icon={<Ship className="h-6 w-6 text-seagreen-600" />}
    >
      <Card
        title="Filters"
        icon={<Calendar className="h-6 w-6 text-seagreen-600" />}
        className="mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {(fromDate || toDate) && (
          <div className="mt-4 flex items-center justify-between bg-seagreen-50 p-3 rounded-lg">
            <p className="text-sm text-seagreen-700">
              Showing {filteredReports.length} reports
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
              }}
              className="text-sm text-seagreen-600 hover:text-seagreen-800 font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </Card>

      <Card
        title="Weekly Performance Reports"
        icon={<Ship className="h-6 w-6 text-seagreen-600" />}
      >
        <div className="w-full flex items-center mb-4">
          <Button
            variant="outline"
            onClick={handleExportAll}
            className="ml-auto"
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
        </div>
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
              <thead className="bg-gray-50 w-full">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vessel Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent Name
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner Details
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DWT
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LOA
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Berthed Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departure Date
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clearance Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.vesselName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.agentName || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.ownerDetails || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.purposeOfArrival || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.status || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.dwt || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.loa || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.berthedDate || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.departureDate || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {report.clearanceIssued || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handleViewReport(report)}
                        className="mr-2"
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleEditReport(report)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* View Modal */}
      <ViewReportModal
        report={selectedReport}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />

      {/* Edit Modal */}
      <EditReportModal
        report={selectedReport}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateReport}
      />
    </DashboardLayout>
  );
};

export default WeeklyPerformance;
