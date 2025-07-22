import React, { useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { toast } from "react-toastify";
import { addWeeklyReport, fetchUserPortId } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// Helper to get last Saturday and next 6 days
function getLastSaturdayAndWeek() {
  const today = new Date();
  const day = today.getDay();
  // 6 = Saturday
  const lastSaturday = new Date(today);
  lastSaturday.setDate(today.getDate() - ((day + 1) % 7));
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(lastSaturday);
    d.setDate(lastSaturday.getDate() + i);
    week.push(d);
  }
  return week;
}

const VesselWeeklyForm: React.FC = () => {
  const { currentUser } = useAuth();

  // General fields
  const [totalVesselsCalled, setTotalVesselsCalled] = useState("");
  // For each of the 7 dates, store 4 fields: in port, loading, unloading, arrived
  const weekDates = getLastSaturdayAndWeek();
  const [asOnDateFields, setAsOnDateFields] = useState(
    weekDates.map(() => ({
      inPort: "",
      loading: "",
      unloading: "",
      arrived: "",
    }))
  );
  const [totalVesselsDeparted, setTotalVesselsDeparted] = useState("");
  const [demurragesCollected, setDemurragesCollected] = useState("");
  const [totalCargoSinceFY, setTotalCargoSinceFY] = useState("");
  const [totalVesselsAppliedClearance, setTotalVesselsAppliedClearance] =
    useState("");
  const [totalClearancesIssued, setTotalClearancesIssued] = useState("");
  const [totalClearancesPending, setTotalClearancesPending] = useState("");

  // Cargo handled in last week (5 fields)
  const [bulkCargo, setBulkCargo] = useState("");
  const [breakBulk, setBreakBulk] = useState("");
  const [containerTEU, setContainerTEU] = useState("");
  const [projectCargo, setProjectCargo] = useState("");
  const [liquidCargo, setLiquidCargo] = useState("");

  const handleAsOnDateFieldChange = (
    idx: number,
    field: "inPort" | "loading" | "unloading" | "arrived",
    value: string
  ) => {
    const updated = [...asOnDateFields];
    updated[idx] = { ...updated[idx], [field]: value };
    setAsOnDateFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation: all number fields must be numbers or empty
    const userPortId = await fetchUserPortId(currentUser.uid);

    const numberFields = [
      totalVesselsCalled,

      ...asOnDateFields.flatMap((f) => [
        f.inPort,
        f.loading,
        f.unloading,
        f.arrived,
      ]),
      totalVesselsDeparted,
      demurragesCollected,
      totalCargoSinceFY,
      bulkCargo,
      breakBulk,
      containerTEU,
      projectCargo,
      liquidCargo,
      totalVesselsAppliedClearance,
      totalClearancesIssued,
      totalClearancesPending,
    ];
    for (const val of numberFields) {
      if (val && isNaN(Number(val))) {
        toast.error("All fields must be numbers");
        return;
      }
    }

    // Prepare data for saving
    const reportData = {
      totalVesselsCalled: Number(totalVesselsCalled) || 0,
      asOnDateFields: asOnDateFields.map((f) => ({
        inPort: Number(f.inPort) || 0,
        loading: Number(f.loading) || 0,
        unloading: Number(f.unloading) || 0,
        arrived: Number(f.arrived) || 0,
      })),
      portId: userPortId || null,
      totalVesselsDeparted: Number(totalVesselsDeparted) || 0,
      demurragesCollected: Number(demurragesCollected) || 0,
      totalCargoSinceFY: Number(totalCargoSinceFY) || 0,
      bulkCargo: Number(bulkCargo) || 0,
      breakBulk: Number(breakBulk) || 0,
      containerTEU: Number(containerTEU) || 0,
      projectCargo: Number(projectCargo) || 0,
      liquidCargo: Number(liquidCargo) || 0,
      totalVesselsAppliedClearance: Number(totalVesselsAppliedClearance) || 0,
      totalClearancesIssued: Number(totalClearancesIssued) || 0,
      totalClearancesPending: Number(totalClearancesPending) || 0,
      weekDates: weekDates.map((d) => d.toISOString()),
    };

    try {
      await addWeeklyReport(reportData);
      toast.success("Weekly vessel report submitted!");
      // Optionally reset form
      setTotalVesselsCalled("");
      setAsOnDateFields(
        weekDates.map(() => ({
          inPort: "",
          loading: "",
          unloading: "",
          arrived: "",
        }))
      );
      setTotalVesselsDeparted("");
      setDemurragesCollected("");
      setTotalCargoSinceFY("");
      setBulkCargo("");
      setBreakBulk("");
      setContainerTEU("");
      setProjectCargo("");
      setLiquidCargo("");
      setTotalVesselsAppliedClearance("");
      setTotalClearancesIssued("");
      setTotalClearancesPending("");
    } catch (err) {
      toast.error("Failed to submit weekly report");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Weekly Vessel Report">
        <div className="space-y-4">
          <div>
            <label className="block font-medium">
              Total number of vessels called in the last week (Sat-Fri)
            </label>
            <input
              type="number"
              className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              value={totalVesselsCalled}
              onChange={(e) => setTotalVesselsCalled(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium mb-2">
              As on date vessel details (for each day)
            </label>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Date</th>
                    <th className="border px-2 py-1">In Port</th>
                    <th className="border px-2 py-1">Loading</th>
                    <th className="border px-2 py-1">Unloading</th>
                    <th className="border px-2 py-1">Arrived</th>
                  </tr>
                </thead>
                <tbody>
                  {weekDates.map((date, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1 font-medium">
                        {date.toLocaleDateString()}
                      </td>
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                          value={asOnDateFields[idx].inPort}
                          onChange={(e) =>
                            handleAsOnDateFieldChange(
                              idx,
                              "inPort",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                          value={asOnDateFields[idx].loading}
                          onChange={(e) =>
                            handleAsOnDateFieldChange(
                              idx,
                              "loading",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                          value={asOnDateFields[idx].unloading}
                          onChange={(e) =>
                            handleAsOnDateFieldChange(
                              idx,
                              "unloading",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="border px-2 py-1">
                        <input
                          type="number"
                          className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                          value={asOnDateFields[idx].arrived}
                          onChange={(e) =>
                            handleAsOnDateFieldChange(
                              idx,
                              "arrived",
                              e.target.value
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">
                Total vessels departed last week
              </label>
              <input
                type="number"
                className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                value={totalVesselsDeparted}
                onChange={(e) => setTotalVesselsDeparted(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-medium">
                Demurrages collected (if any) from the ships by the port
              </label>
              <input
                type="number"
                className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                value={demurragesCollected}
                onChange={(e) => setDemurragesCollected(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-medium">
                Total cargo handled since the start of the financial year
              </label>
              <input
                type="number"
                className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                value={totalCargoSinceFY}
                onChange={(e) => setTotalCargoSinceFY(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card title="Cargo handled in the last week">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">Bulk cargo</label>
            <input
              type="number"
              className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              value={bulkCargo}
              onChange={(e) => setBulkCargo(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium">Break Bulk</label>
            <input
              type="number"
              className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              value={breakBulk}
              onChange={(e) => setBreakBulk(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium">
              Container (in TEU & MMT)
            </label>
            <input
              type="number"
              className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              value={containerTEU}
              onChange={(e) => setContainerTEU(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium">Project cargo</label>
            <input
              type="number"
              className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              value={projectCargo}
              onChange={(e) => setProjectCargo(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium">Liquid cargo</label>
            <input
              type="number"
              className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              value={liquidCargo}
              onChange={(e) => setLiquidCargo(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card title="Clearances">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium">
              Total number of vessels applied for clearance
            </label>
            <input
              type="number"
              className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              value={totalVesselsAppliedClearance}
              onChange={(e) => setTotalVesselsAppliedClearance(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium">
              Total number of clearances issued
            </label>
            <input
              type="number"
              className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              value={totalClearancesIssued}
              onChange={(e) => setTotalClearancesIssued(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium">
              Total number of clearance pending if any
            </label>
            <input
              type="number"
              className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              value={totalClearancesPending}
              onChange={(e) => setTotalClearancesPending(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="submit">Submit Weekly Report</Button>
      </div>
    </form>
  );
};

export default VesselWeeklyForm;
