import React, { useState } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { toast } from "react-toastify";
import FormField from "../ui/FormField";
import { useCargoTypes } from "../../hooks/useCargoTypes";
import { Package, Calendar, Ship } from "lucide-react";
import { addWeeklyPerformance, fetchUserPortId } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const WeeklyPerofmaceForm: React.FC = () => {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({
    vesselName: "",
    imoNumber: "",
    ownerDetails: "",
    loa: "",
    agentName: "",
    purposeOfArrival: "Loading",
    otherPurposeOfArrival: "",
    berthedDate: "",
    dwt: "",
    dailyData: [
      {
        date: "",
        cargoType: "",
        typeOfCargo: "",
        totalQuantity: "",
        demurrages: "",
        reason: "",
      },
    ],
    status: "Loading",
    clearanceIssued: "",
    departureDate: "",
  });

  // Cargo types from hook
  const {
    cargoTypes,
    loading: loadingCargoTypes,
    error: cargoTypesError,
  } = useCargoTypes();

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // For select fields
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!form.vesselName || !form.loa || !form.agentName) {
      toast.error("Please fill all required fields.");
      return;
    }
    setLoading(true);
    try {
      const userPortId = await fetchUserPortId(currentUser?.uid || "");
      if (!userPortId) {
        toast.error("User port ID not found.");
        return;
      }

      // If 'Other' is selected, use the text field value for purposeOfArrival
      const { otherPurposeOfArrival, ...rest } = form;

      const totalQuantity = form.dailyData.reduce(
        (sum, day) => sum + (Number(day.totalQuantity) || 0),
        0
      );

      const totalDemurrages = form.dailyData.reduce(
        (sum, day) => sum + (Number(day.demurrages) || 0),
        0
      );

      const dataToSave = {
        ...rest,
        purposeOfArrival:
          form.purposeOfArrival === "Other"
            ? form.otherPurposeOfArrival
            : form.purposeOfArrival,
        portId: userPortId,
        dailyData: form.dailyData,
        totalQuantity,
        demurragesCollected: totalDemurrages,
        status: form.status,
      };

      await addWeeklyPerformance(dataToSave, userPortId);
      toast.success("Weekly performance submitted!");
      setForm({
        vesselName: "",
        imoNumber: "",
        ownerDetails: "",
        loa: "",
        agentName: "",
        purposeOfArrival: "Loading",
        otherPurposeOfArrival: "",
        berthedDate: "",
        dwt: "",
        dailyData: Array(7).fill({
          date: "",
          cargoType: "",
          typeOfCargo: "",
          totalQuantity: "",
          demurrages: "",
        }),
        status: "Loading",
        clearanceIssued: "",
        departureDate: "",
      });
    } catch (error) {
      toast.error("Failed to submit weekly performance.");
    } finally {
      setLoading(false);
    }
  };

  if (cargoTypesError) {
    return <div className="text-red-500">Failed to load cargo types.</div>;
  }
  if (loadingCargoTypes) {
    return <div>Loading cargo types...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Weekly Vessel Performance Form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            id="vesselName"
            label="Vessel Name *"
            required
            icon={<Ship className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="text"
              id="vesselName"
              name="vesselName"
              value={form.vesselName}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              required
              placeholder="Enter vessel name"
            />
          </FormField>
          <FormField
            id="imoNumber"
            label="IMO Number *"
            required
            icon={<Ship className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="text"
              id="imoNumber"
              name="imoNumber"
              value={form.imoNumber}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              required
              placeholder="Enter IMO number"
            />
          </FormField>
          <FormField
            id="ownerDetails"
            label="Owner's / Proprietor Details"
            icon={<Ship className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="text"
              id="ownerDetails"
              name="ownerDetails"
              value={form.ownerDetails}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              placeholder="Enter owner/proprietor details"
            />
          </FormField>
          <FormField
            id="loa"
            label="LOA *"
            required
            icon={<Ship className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="text"
              id="loa"
              name="loa"
              value={form.loa}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              required
              placeholder="Enter LOA"
            />
          </FormField>
          <FormField
            id="agentName"
            label="Agent Name *"
            required
            icon={<Ship className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="text"
              id="agentName"
              name="agentName"
              value={form.agentName}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              required
              placeholder="Enter agent name"
            />
          </FormField>
          <FormField
            id="purposeOfArrival"
            label="Purpose of Arrival"
            required
            icon={<Package className="h-5 w-5 text-seagreen-500" />}
          >
            <select
              id="purposeOfArrival"
              name="purposeOfArrival"
              value={form.purposeOfArrival}
              onChange={handleSelectChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              required
            >
              <option value="Loading">Loading</option>
              <option value="Unloading">Unloading</option>
              <option value="Other">Other</option>
            </select>
          </FormField>
          {form.purposeOfArrival === "Other" && (
            <input
              type="text"
              id="otherPurposeOfArrival"
              name="otherPurposeOfArrival"
              value={form.otherPurposeOfArrival}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              placeholder="Please specify purpose of arrival"
              required
            />
          )}
          <FormField
            id="berthedDate"
            label="BERTHED A/S Date"
            icon={<Calendar className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="date"
              id="berthedDate"
              name="berthedDate"
              value={form.berthedDate}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            />
          </FormField>
          <FormField
            id="dwt"
            label="Vessel DWT"
            icon={<Ship className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="text"
              id="dwt"
              name="dwt"
              value={form.dwt}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              placeholder="Enter DWT"
            />
          </FormField>
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium mb-4">Daily Cargo Details</h3>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      dailyData: [
                        ...prev.dailyData,
                        {
                          date: "",
                          cargoType: "",
                          typeOfCargo: "",
                          totalQuantity: "",
                          demurrages: "",
                          reason: "",
                        },
                      ],
                    }));
                  }}
                  className="px-4 py-2 text-white bg-seagreen-600 hover:bg-seagreen-700 rounded-md transition"
                >
                  + Add Row
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type of Cargo in Detail
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type of Cargo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Demarage charges collected from the ship in Rs.
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {form.dailyData.map((day, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <input
                          type="date"
                          value={day.date}
                          onChange={(e) => {
                            const newDailyData = [...form.dailyData];
                            newDailyData[index] = {
                              ...day,
                              date: e.target.value,
                            };
                            setForm((prev) => ({
                              ...prev,
                              dailyData: newDailyData,
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-seagreen-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={day.cargoType}
                          onChange={(e) => {
                            const newDailyData = [...form.dailyData];
                            newDailyData[index] = {
                              ...day,
                              cargoType: e.target.value,
                            };
                            setForm((prev) => ({
                              ...prev,
                              dailyData: newDailyData,
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-seagreen-500"
                        >
                          <option value="">Select cargo type</option>
                          {cargoTypes.map((type) => (
                            <option key={type.id} value={type.name}>
                              {type.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={day.typeOfCargo}
                          onChange={(e) => {
                            const newDailyData = [...form.dailyData];
                            newDailyData[index] = {
                              ...day,
                              typeOfCargo: e.target.value,
                            };
                            setForm((prev) => ({
                              ...prev,
                              dailyData: newDailyData,
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-seagreen-500"
                          placeholder="Enter type"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={day.totalQuantity}
                          onChange={(e) => {
                            const newDailyData = [...form.dailyData];
                            newDailyData[index] = {
                              ...day,
                              totalQuantity: e.target.value,
                            };
                            setForm((prev) => ({
                              ...prev,
                              dailyData: newDailyData,
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-seagreen-500"
                          placeholder="Enter quantity"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={day.demurrages}
                          onChange={(e) => {
                            const newDailyData = [...form.dailyData];
                            newDailyData[index] = {
                              ...day,
                              demurrages: e.target.value,
                            };
                            setForm((prev) => ({
                              ...prev,
                              dailyData: newDailyData,
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-seagreen-500"
                          placeholder="Enter demurrages"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={day.reason}
                          onChange={(e) => {
                            const newDailyData = [...form.dailyData];
                            newDailyData[index] = {
                              ...day,
                              reason: e.target.value,
                            };
                            setForm((prev) => ({
                              ...prev,
                              dailyData: newDailyData,
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-seagreen-500"
                          placeholder="Enter Reason"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <FormField
            id="status"
            label="Vessel Status"
            required
            icon={<Package className="h-5 w-5 text-seagreen-500" />}
          >
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleSelectChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              required
            >
              <option value="Loading">Loading</option>
              <option value="Discharging">Discharging</option>
              <option value="Completed">Completed</option>
            </select>
          </FormField>
          <FormField
            id="clearanceIssued"
            label="Clearance Issued On"
            icon={<Calendar className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="date"
              id="clearanceIssued"
              name="clearanceIssued"
              value={form.clearanceIssued}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              placeholder="Enter clearance issued date"
            />
          </FormField>
          <FormField
            id="departureDate"
            label="Departure Date"
            icon={<Calendar className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="date"
              id="departureDate"
              name="departureDate"
              value={form.departureDate}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            />
          </FormField>
        </div>
        <div className="flex justify-end mt-6">
          <Button type="submit" loading={loading}>
            Submit
          </Button>
        </div>
      </Card>
    </form>
  );
};

export default WeeklyPerofmaceForm;
