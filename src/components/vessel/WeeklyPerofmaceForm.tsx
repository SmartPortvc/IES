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
    ownerDetails: "",
    loa: "",
    agentName: "",
    purposeOfArrival: "Loading",
    otherPurposeOfArrival: "",
    berthedDate: "",
    dwt: "",
    cargoType: "",
    typeOfCargo: "",
    totalQuantity: "",
    demurragesCollected: "",
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

      const dataToSave = {
        ...rest,
        purposeOfArrival:
          form.purposeOfArrival === "Other"
            ? form.otherPurposeOfArrival
            : form.purposeOfArrival,
        portId: userPortId,
        totalQuantity: form.totalQuantity ? Number(form.totalQuantity) : 0,
        demurragesCollected: form.demurragesCollected
          ? Number(form.demurragesCollected)
          : 0,
      };

      await addWeeklyPerformance(dataToSave, userPortId);
      toast.success("Weekly performance submitted!");
      setForm({
        vesselName: "",
        ownerDetails: "",
        loa: "",
        agentName: "",
        purposeOfArrival: "Loading",
        otherPurposeOfArrival: "",
        berthedDate: "",
        dwt: "",
        cargoType: "",
        typeOfCargo: "",
        totalQuantity: "",
        demurragesCollected: "",
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
          <FormField
            id="cargoType"
            label="Type of Cargo in Detail"
            required
            icon={<Package className="h-5 w-5 text-seagreen-500" />}
          >
            <select
              id="cargoType"
              name="cargoType"
              value={form.cargoType}
              onChange={handleSelectChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              required
            >
              <option value="">Select cargo type</option>
              {cargoTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            id="typeOfCargo"
            label="Type of Cargo"
            icon={<Package className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="text"
              id="typeOfCargo"
              name="typeOfCargo"
              value={form.typeOfCargo}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              placeholder="Enter type of cargo"
            />
          </FormField>
          <FormField
            id="totalQuantity"
            label="Total quantity loaded/unloaded (Sat-Fri)"
            icon={<Package className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="number"
              id="totalQuantity"
              name="totalQuantity"
              value={form.totalQuantity}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              placeholder="Enter total quantity"
              min="0"
            />
          </FormField>
          {/* Status Dropdown */}
          <FormField
            id="status"
            label="Status"
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
            id="demurragesCollected"
            label="Demurrages Collected"
            icon={<Package className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="number"
              id="demurragesCollected"
              name="demurragesCollected"
              value={form.demurragesCollected}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              placeholder="Enter demurrages collected"
              min="0"
            />
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
