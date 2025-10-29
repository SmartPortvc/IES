import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ship, Anchor } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useCargoTypes } from "../../hooks/useCargoTypes";
import { addVessel } from "../../services/api";
import { fetchUserPortId, fetchPortById } from "../../services/api";
import Card from "../ui/Card";
import Button from "../ui/Button";
import LoadingSpinner from "../ui/LoadingSpinner";
import ErrorDisplay from "../ui/ErrorDisplay";
import {
  VesselGeneralInfo,
  VesselStaticData,
  VesselDraftInfo,
  VesselOperationInfo,
} from "./FormSections";

const VesselForm: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    cargoTypes,
    loading: loadingCargoTypes,
    error: cargoTypesError,
  } = useCargoTypes();

  // Port ID state
  const [portId, setPortId] = useState<string | null>(null);
  const [portName, setPortName] = useState("");
  const [berthDetails, setBerthDetails] = useState("");

  // General Vessel Information
  const [length, setLength] = useState("");
  const [draftAvailable, setDraftAvailable] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [vesselOwner, setVesselOwner] = useState("");
  const [vesselAgent, setVesselAgent] = useState("");
  const [entryDate, setEntryDate] = useState("");
  const [sailedOutDate, setSailedOutDate] = useState("");
  const [imo, setImo] = useState("");
  const [grt, setGrt] = useState("");
  const [arrivalDateTime, setArrivalDateTime] = useState("");
  const [pobDateTime, setPobDateTime] = useState("");
  const [berthingDateTime, setBerthingDateTime] = useState("");
  const [pobDepartureDateTime, setPobDepartureDateTime] = useState("");
  const [nextPortOfCall, setNextPortOfCall] = useState("");

  // Vessel Static Data
  const [loa, setLoa] = useState("");
  const [beam, setBeam] = useState("");
  const [dwt, setDwt] = useState("");

  // Arrival Draft
  const [arrivalDraftFwd, setArrivalDraftFwd] = useState("");
  const [arrivalDraftAft, setArrivalDraftAft] = useState("");

  // Departure Draft
  const [departureDraftFwd, setDepartureDraftFwd] = useState("");
  const [departureDraftAft, setDepartureDraftAft] = useState("");

  // Operation Details
  const [operationType, setOperationType] = useState<
    "Import" | "Export" | "Coastal" | "Other"
  >("Import");
  const [purposeOfArrivalOther, setPurposeOfArrivalOther] = useState("");
  const [arrivalFrom, setArrivalFrom] = useState("");
  const [location, setLocation] = useState("");
  const [operation, setOperation] = useState<
    "Loading" | "Unloading" | "Transhipment" | "Lighterage"
  >("Loading");
  const [cargoType, setCargoType] = useState("");
  const [cargoName, setCargoName] = useState("");
  const [volume, setVolume] = useState("");
  const [units, setUnits] = useState<"MT" | "TEUs">("MT");
  const [cargoQuantity, setCargoQuantity] = useState("");
  const [totalRevenue, setTotalRevenue] = useState("");
  const [voyageType, setVoyageType] = useState<"Coastal" | "Foreign">(
    "Coastal"
  );

  // Daily Cargo Details
  const [dailyCargoRows, setDailyCargoRows] = useState([
    {
      date: "",
      cargoTypeInDetail: "",
      cargoType: "",
      quantity: "",
      demurrageCharges: "",
      reason: "",
    },
  ]);

  // Vessel Status and Clearance
  const [vesselStatus, setVesselStatus] = useState<
    "Loading" | "Discharging" | "Completed"
  >("Loading");
  const [clearanceIssuedOn, setClearanceIssuedOn] = useState("");

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch port ID and name on component mount
  useEffect(() => {
    const getPortInfo = async () => {
      if (!currentUser) return;

      try {
        const userPortId = await fetchUserPortId(currentUser.uid);
        if (userPortId) {
          setPortId(userPortId);

          // Fetch port details to get the name
          const portDetails = await fetchPortById(userPortId);
          if (portDetails) {
            setPortName(portDetails.portName);
          }
        }
      } catch (err) {
        console.error("Error fetching port information:", err);
        setError("Failed to load user port information");
      }
    };

    getPortInfo();
  }, [currentUser]);

  const validateForm = (): boolean => {
    // Required fields validation
    const requiredFields = [
      { value: vesselName, name: "Vessel Name" },
      { value: imo, name: "IMO Number" },
      { value: grt, name: "Gross Registered Tonnage" },
      { value: length, name: "Length" },
      { value: entryDate, name: "Entry Date" },
      { value: loa, name: "Length Over All" },
      { value: dwt, name: "Dead Weight Tonnage" },
      { value: arrivalFrom, name: "Arrival From" },
      { value: location, name: "Coastal State / Country" },
      { value: cargoName, name: "Cargo Name" },
      { value: volume, name: "Volume" },
    ];

    // Add purposeOfArrivalOther to required fields if operationType is "Other"
    if (operationType === "Other") {
      requiredFields.push({
        value: purposeOfArrivalOther,
        name: "Purpose of Arrival (Other)",
      });
    }

    for (const field of requiredFields) {
      if (!field.value.trim()) {
        toast.error(`${field.name} is required`);
        return false;
      }
    }

    // Numeric validation
    const numericFields = [
      { value: length, name: "Length" },
      { value: draftAvailable, name: "Draft Available" },
      { value: loa, name: "LOA" },
      { value: beam, name: "Beam" },
      { value: dwt, name: "DWT" },
      { value: volume, name: "Volume" },
    ];

    for (const field of numericFields) {
      if (field.value && isNaN(Number(field.value))) {
        toast.error(`${field.name} must be a number`);
        return false;
      }
    }

    // Date validation
    if (sailedOutDate && new Date(sailedOutDate) < new Date(entryDate)) {
      toast.error("Sailed Out Date cannot be before Entry Date");
      return false;
    }

    return true;
  };

  const handleAddDailyCargoRow = () => {
    setDailyCargoRows([
      ...dailyCargoRows,
      {
        date: "",
        cargoTypeInDetail: "",
        cargoType: "",
        quantity: "",
        demurrageCharges: "",
        reason: "",
      },
    ]);
  };

  const handleDailyCargoChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedRows = [...dailyCargoRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    setDailyCargoRows(updatedRows);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!portId) {
      toast.error("Port ID not found. Please contact support.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const vesselData = {
        portId,
        // General Information
        berthDetails: berthDetails || "",
        length: Number(length),
        draftAvailable: Number(draftAvailable),
        vesselName,
        vesselOwner,
        vesselAgent,
        entryDate: new Date(entryDate),
        sailedOutDate: sailedOutDate ? new Date(sailedOutDate) : null,
        imo,
        grt,
        arrivalDateTime: arrivalDateTime ? new Date(arrivalDateTime) : null,
        pobDateTime: pobDateTime ? new Date(pobDateTime) : null,
        berthingDateTime: berthingDateTime ? new Date(berthingDateTime) : null,
        pobDepartureDateTime: pobDepartureDateTime
          ? new Date(pobDepartureDateTime)
          : null,
        nextPortOfCall,
        cargoQuantity,
        totalRevenue: totalRevenue,
        voyageType,
        arrivalFrom,
        clearanceIssuedOn: clearanceIssuedOn
          ? new Date(clearanceIssuedOn)
          : null,

        // Static Data
        loa: Number(loa),
        beam: Number(beam),
        dwt: Number(dwt),

        // Draft Information
        arrivalDraft: {
          forward: Number(arrivalDraftFwd),
          aft: Number(arrivalDraftAft),
        },
        departureDraft: {
          forward: Number(departureDraftFwd),
          aft: Number(departureDraftAft),
        },

        // Operation Details
        operationType,
        purposeOfArrivalOther,
        fromTo: arrivalFrom, // Map arrivalFrom to fromTo for now
        location,
        operation,
        cargo: {
          type: cargoType,
          name: cargoName,
          volume: Number(volume),
          units,
        },

        // Daily Cargo Details
        dailyCargoDetails: dailyCargoRows.map((row) => ({
          date: row.date ? new Date(row.date) : null,
          cargoTypeInDetail: row.cargoTypeInDetail,
          cargoType: row.cargoType,
          quantity: row.quantity,
          demurrageCharges: row.demurrageCharges,
          reason: row.reason,
        })),

        // Vessel Status and Clearance
        vesselStatus,

        // Metadata
        createdAt: new Date(),
        addedDate: new Date(),
      };

      await addVessel(vesselData);

      toast.success("Vessel added successfully!");
      navigate("/port-dashboard");
    } catch (err) {
      console.error("Error adding vessel:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to add vessel. Please try again.";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (error || cargoTypesError) {
    return (
      <ErrorDisplay message={error || cargoTypesError || "An error occurred"} />
    );
  }

  if (loadingCargoTypes) {
    return <LoadingSpinner message="Loading cargo types..." />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Vessel Information */}
      <Card
        title="General Vessel Information"
        icon={<Ship className="h-6 w-6 text-seagreen-600" />}
      >
        <VesselGeneralInfo
          portName={portName}
          setPortName={setPortName}
          berthDetails={berthDetails}
          setBerthDetails={setBerthDetails}
          length={length}
          setLength={setLength}
          draftAvailable={draftAvailable}
          setDraftAvailable={setDraftAvailable}
          vesselName={vesselName}
          setVesselName={setVesselName}
          vesselOwner={vesselOwner}
          setVesselOwner={setVesselOwner}
          vesselAgent={vesselAgent}
          setVesselAgent={setVesselAgent}
          entryDate={entryDate}
          setEntryDate={setEntryDate}
          sailedOutDate={sailedOutDate}
          setSailedOutDate={setSailedOutDate}
          imo={imo}
          setImo={setImo}
          grt={grt}
          setGrt={setGrt}
          arrivalDateTime={arrivalDateTime}
          setArrivalDateTime={setArrivalDateTime}
          pobDateTime={pobDateTime}
          setPobDateTime={setPobDateTime}
          berthingDateTime={berthingDateTime}
          setBerthingDateTime={setBerthingDateTime}
          pobDepartureDateTime={pobDepartureDateTime}
          setPobDepartureDateTime={setPobDepartureDateTime}
          nextPortOfCall={nextPortOfCall}
          setNextPortOfCall={setNextPortOfCall}
        />
      </Card>

      <Card
        title="Vessel Static Data"
        icon={<Anchor className="h-6 w-6 text-seagreen-600" />}
      >
        <VesselStaticData
          loa={loa}
          setLoa={setLoa}
          beam={beam}
          setBeam={setBeam}
          dwt={dwt}
          setDwt={setDwt}
        />
      </Card>

      <Card
        title="Vessel Status & Clearance"
        icon={<Ship className="h-6 w-6 text-seagreen-600" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">
              Vessel Status <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                value={vesselStatus}
                onChange={(e) =>
                  setVesselStatus(
                    e.target.value as "Loading" | "Discharging" | "Completed"
                  )
                }
                required
              >
                <option value="Loading">Loading</option>
                <option value="Discharging">Discharging</option>
                <option value="Completed">Completed</option>
              </select>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Ship className="h-5 w-5 text-seagreen-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">
              Clearance Issued On
            </label>
            <div className="relative">
              <input
                type="date"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                value={clearanceIssuedOn}
                onChange={(e) => setClearanceIssuedOn(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Ship className="h-5 w-5 text-seagreen-500" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="Draft Information"
        icon={<Ship className="h-6 w-6 text-seagreen-600" />}
      >
        <VesselDraftInfo
          arrivalDraftFwd={arrivalDraftFwd}
          setArrivalDraftFwd={setArrivalDraftFwd}
          arrivalDraftAft={arrivalDraftAft}
          setArrivalDraftAft={setArrivalDraftAft}
          departureDraftFwd={departureDraftFwd}
          setDepartureDraftFwd={setDepartureDraftFwd}
          departureDraftAft={departureDraftAft}
          setDepartureDraftAft={setDepartureDraftAft}
        />
      </Card>

      <Card
        title="Operation Details"
        icon={<Ship className="h-6 w-6 text-seagreen-600" />}
      >
        <VesselOperationInfo
          operationType={operationType}
          setOperationType={setOperationType}
          purposeOfArrivalOther={purposeOfArrivalOther}
          setPurposeOfArrivalOther={setPurposeOfArrivalOther}
          arrivalFrom={arrivalFrom}
          setArrivalFrom={setArrivalFrom}
          location={location}
          setLocation={setLocation}
          operation={operation}
          setOperation={setOperation}
          cargoType={cargoType}
          setCargoType={setCargoType}
          cargoName={cargoName}
          setCargoName={setCargoName}
          volume={volume}
          setVolume={setVolume}
          units={units}
          setUnits={setUnits}
          cargoTypes={cargoTypes}
          cargoQuantity={cargoQuantity}
          setCargoQuantity={setCargoQuantity}
          totalRevenue={totalRevenue}
          setTotalRevenue={setTotalRevenue}
          voyageType={voyageType}
          setVoyageType={setVoyageType}
        />
      </Card>

      <Card
        title="Daily Cargo Details"
        icon={<Ship className="h-6 w-6 text-seagreen-600" />}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2">DATE</th>
                <th className="border px-4 py-2">TYPE OF CARGO IN DETAIL</th>
                <th className="border px-4 py-2">TYPE OF CARGO</th>
                <th className="border px-4 py-2">QUANTITY</th>
                <th className="border px-4 py-2">
                  DEMARAGE CHARGES COLLECTED FROM THE SHIP IN RS.
                </th>
                <th className="border px-4 py-2">REASON</th>
              </tr>
            </thead>
            <tbody>
              {dailyCargoRows.map((row, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2">
                    <input
                      type="date"
                      className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                      value={row.date}
                      onChange={(e) =>
                        handleDailyCargoChange(index, "date", e.target.value)
                      }
                    />
                  </td>
                  <td className="border px-4 py-2">
                    <select
                      className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                      value={row.cargoTypeInDetail}
                      onChange={(e) =>
                        handleDailyCargoChange(
                          index,
                          "cargoTypeInDetail",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Select cargo type</option>
                      {cargoTypes.map((type) => (
                        <option key={type.id} value={type.name}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border px-4 py-2">
                    <input
                      type="text"
                      className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                      value={row.cargoType}
                      onChange={(e) =>
                        handleDailyCargoChange(
                          index,
                          "cargoType",
                          e.target.value
                        )
                      }
                      placeholder="Enter type"
                    />
                  </td>
                  <td className="border px-4 py-2">
                    <input
                      type="text"
                      className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                      value={row.quantity}
                      onChange={(e) =>
                        handleDailyCargoChange(
                          index,
                          "quantity",
                          e.target.value
                        )
                      }
                      placeholder="Enter quantity"
                    />
                  </td>
                  <td className="border px-4 py-2">
                    <input
                      type="text"
                      className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                      value={row.demurrageCharges}
                      onChange={(e) =>
                        handleDailyCargoChange(
                          index,
                          "demurrageCharges",
                          e.target.value
                        )
                      }
                      placeholder="Enter demurrages"
                    />
                  </td>
                  <td className="border px-4 py-2">
                    <input
                      type="text"
                      className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                      value={row.reason}
                      onChange={(e) =>
                        handleDailyCargoChange(index, "reason", e.target.value)
                      }
                      placeholder="Enter Reason"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            type="button"
            onClick={handleAddDailyCargoRow}
            icon={<span className="mr-2">+</span>}
          >
            Add Row
          </Button>
        </div>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => navigate("/port-dashboard")}>
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          icon={<Ship className="h-4 w-4" />}
        >
          Add Vessel
        </Button>
      </div>
    </form>
  );
};

export default VesselForm;
