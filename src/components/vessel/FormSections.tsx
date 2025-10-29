import React, { useState, useEffect } from "react";
import {
  Ship,
  Ruler,
  Anchor,
  Package,
  Calendar,
  DollarSign,
  Navigation,
} from "lucide-react";
import FormField from "../ui/FormField";
import { CargoType } from "../../types";
import { fetchPorts } from "../../services/api";

interface VesselGeneralInfoProps {
  portName: string;
  setPortName: (value: string) => void;
  berthDetails: string;
  setBerthDetails: (value: string) => void;
  length: string;
  setLength: (value: string) => void;
  draftAvailable: string;
  setDraftAvailable: (value: string) => void;
  vesselName: string;
  setVesselName: (value: string) => void;
  vesselOwner: string;
  setVesselOwner: (value: string) => void;
  vesselAgent: string;
  setVesselAgent: (value: string) => void;
  entryDate: string;
  setEntryDate: (value: string) => void;
  sailedOutDate: string;
  setSailedOutDate: (value: string) => void;
  imo: string;
  setImo: (value: string) => void;
  grt: string;
  setGrt: (value: string) => void;
  arrivalDateTime: string;
  setArrivalDateTime: (value: string) => void;
  pobDateTime: string;
  setPobDateTime: (value: string) => void;
  berthingDateTime: string;
  setBerthingDateTime: (value: string) => void;
  pobDepartureDateTime: string;
  setPobDepartureDateTime: (value: string) => void;
  nextPortOfCall: string;
  setNextPortOfCall: (value: string) => void;
}

export const VesselGeneralInfo: React.FC<VesselGeneralInfoProps> = ({
  portName,
  setPortName,
  berthDetails,
  setBerthDetails,
  length,
  setLength,
  draftAvailable,
  setDraftAvailable,
  vesselName,
  setVesselName,
  vesselOwner,
  setVesselOwner,
  vesselAgent,
  setVesselAgent,
  entryDate,
  setEntryDate,
  sailedOutDate,
  setSailedOutDate,
  imo,
  setImo,
  grt,
  setGrt,
  arrivalDateTime,
  setArrivalDateTime,
  pobDateTime,
  setPobDateTime,
  berthingDateTime,
  setBerthingDateTime,
  pobDepartureDateTime,
  setPobDepartureDateTime,
  nextPortOfCall,
  setNextPortOfCall,
}) => {
  const [portSuggestions, setPortSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const loadPortSuggestions = async () => {
      try {
        const ports = await fetchPorts();
        setPortSuggestions(ports.map((port) => port.portName));
      } catch (error) {
        console.error("Error loading port suggestions:", error);
      }
    };

    loadPortSuggestions();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          id="vesselName"
          label="Vessel Name"
          required
          icon={<Ship className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="text"
            id="vesselName"
            value={vesselName}
            onChange={(e) => setVesselName(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            required
            placeholder="Enter vessel name"
          />
        </FormField>

        <FormField
          id="imo"
          label="IMO Number"
          required
          icon={<Ship className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="text"
            id="imo"
            value={imo}
            onChange={(e) => setImo(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            required
            placeholder="Enter IMO number"
          />
        </FormField>

        <FormField
          id="grt"
          label="Gross Registered Tonnage (GRT)"
          required
          icon={<Ship className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="text"
            id="grt"
            value={grt}
            onChange={(e) => setGrt(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            required
            placeholder="Enter GRT"
          />
        </FormField>

        <FormField
          id="portName"
          label="Port Name"
          required
          icon={<Anchor className="h-5 w-5 text-seagreen-500" />}
        >
          <div className="relative">
            <input
              type="text"
              id="portName"
              value={portName}
              onChange={(e) => {
                setPortName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              required
              placeholder="Enter port name"
              autoComplete="off"
            />
            {showSuggestions && portName && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {portSuggestions
                  .filter((port) =>
                    port.toLowerCase().includes(portName.toLowerCase())
                  )
                  .map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setPortName(suggestion);
                        setShowSuggestions(false);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {suggestion}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </FormField>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">
          Details of Berth / Terminal, vessel is berthed at
        </h4>
        <div className="grid grid-cols-1 gap-4 mb-4">
          <FormField
            id="berthDetails"
            label="Berth / Terminal Name"
            icon={<Anchor className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="text"
              id="berthDetails"
              value={berthDetails}
              onChange={(e) => setBerthDetails(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              placeholder="Enter berth or terminal name"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            id="length"
            label="Length (mts)"
            required
            icon={<Ruler className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="number"
              id="length"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              required
              step="0.01"
              min="0"
              placeholder="Enter length"
            />
          </FormField>

          <FormField
            id="draftAvailable"
            label="Draft Available (mts)"
            icon={<Ship className="h-5 w-5 text-seagreen-500" />}
          >
            <input
              type="number"
              id="draftAvailable"
              value={draftAvailable}
              onChange={(e) => setDraftAvailable(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              step="0.01"
              min="0"
              placeholder="Enter draft"
            />
          </FormField>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          id="vesselOwner"
          label="Vessel Owner / Operator"
          icon={<Ship className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="text"
            id="vesselOwner"
            value={vesselOwner}
            onChange={(e) => setVesselOwner(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            placeholder="Enter vessel owner"
          />
        </FormField>

        <FormField
          id="vesselAgent"
          label="Agent Name"
          icon={<Ship className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="text"
            id="vesselAgent"
            value={vesselAgent}
            onChange={(e) => setVesselAgent(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            placeholder="Enter vessel agent"
          />
        </FormField>

        <FormField
          id="arrivalDateTime"
          label="Arrival Date & Time"
          required
          icon={<Calendar className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="datetime-local"
            id="arrivalDateTime"
            value={arrivalDateTime}
            onChange={(e) => setArrivalDateTime(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            required
          />
        </FormField>

        <FormField
          id="pobDateTime"
          label="Pilot On Board Date & Time"
          required
          icon={<Calendar className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="datetime-local"
            id="pobDateTime"
            value={pobDateTime}
            onChange={(e) => setPobDateTime(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            required
          />
        </FormField>

        <FormField
          id="berthingDateTime"
          label="Berthing Date & Time"
          required
          icon={<Calendar className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="datetime-local"
            id="berthingDateTime"
            value={berthingDateTime}
            onChange={(e) => setBerthingDateTime(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            required
          />
        </FormField>

        <FormField
          id="pobDepartureDateTime"
          label="Pilot Off Board Date & Time"
          icon={<Calendar className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="datetime-local"
            id="pobDepartureDateTime"
            value={pobDepartureDateTime}
            onChange={(e) => setPobDepartureDateTime(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
          />
        </FormField>

        <FormField
          id="nextPortOfCall"
          label="Next Port of Call"
          icon={<Navigation className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="text"
            id="nextPortOfCall"
            value={nextPortOfCall}
            onChange={(e) => setNextPortOfCall(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            placeholder="Enter next port of call"
          />
        </FormField>

        <FormField
          id="entryDate"
          label="Vessel Entry Date"
          required
          icon={<Calendar className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="datetime-local"
            id="entryDate"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            required
          />
        </FormField>

        <FormField
          id="sailedOutDate"
          label="Vessel Departure Date"
          icon={<Calendar className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="datetime-local"
            id="sailedOutDate"
            value={sailedOutDate}
            onChange={(e) => setSailedOutDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            min={entryDate}
          />
        </FormField>
      </div>
    </div>
  );
};

interface VesselStaticDataProps {
  loa: string;
  setLoa: (value: string) => void;
  beam: string;
  setBeam: (value: string) => void;
  dwt: string;
  setDwt: (value: string) => void;
}

export const VesselStaticData: React.FC<VesselStaticDataProps> = ({
  loa,
  setLoa,
  beam,
  setBeam,
  dwt,
  setDwt,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <FormField
      id="loa"
      label="Length Over All (LOA) (meters)"
      required
      icon={<Ruler className="h-5 w-5 text-seagreen-500" />}
    >
      <input
        type="number"
        id="loa"
        value={loa}
        onChange={(e) => setLoa(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
        required
        step="0.01"
        min="0"
        placeholder="Enter LOA"
      />
    </FormField>

    <FormField
      id="beam"
      label="Beam (meters)"
      icon={<Ruler className="h-5 w-5 text-seagreen-500" />}
    >
      <input
        type="number"
        id="beam"
        value={beam}
        onChange={(e) => setBeam(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
        step="0.01"
        min="0"
        placeholder="Enter beam"
      />
    </FormField>

    <FormField
      id="dwt"
      label="Dead Weight Tonnage (DWT)"
      required
      icon={<Ship className="h-5 w-5 text-seagreen-500" />}
    >
      <input
        type="number"
        id="dwt"
        value={dwt}
        onChange={(e) => setDwt(e.target.value)}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
        required
        step="0.01"
        min="0"
        placeholder="Enter DWT"
      />
    </FormField>
  </div>
);

interface VesselDraftInfoProps {
  arrivalDraftFwd: string;
  setArrivalDraftFwd: (value: string) => void;
  arrivalDraftAft: string;
  setArrivalDraftAft: (value: string) => void;
  departureDraftFwd: string;
  setDepartureDraftFwd: (value: string) => void;
  departureDraftAft: string;
  setDepartureDraftAft: (value: string) => void;
}

export const VesselDraftInfo: React.FC<VesselDraftInfoProps> = ({
  arrivalDraftFwd,
  setArrivalDraftFwd,
  arrivalDraftAft,
  setArrivalDraftAft,
  departureDraftFwd,
  setDepartureDraftFwd,
  departureDraftAft,
  setDepartureDraftAft,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <Ship className="h-5 w-5 text-seagreen-500 mr-2" />
        Arrival Draft
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="arrivalDraftFwd"
          label="Forward (meters)"
          icon={<Ruler className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="number"
            id="arrivalDraftFwd"
            value={arrivalDraftFwd}
            onChange={(e) => setArrivalDraftFwd(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            step="0.01"
            min="0"
            placeholder="Forward draft"
          />
        </FormField>

        <FormField
          id="arrivalDraftAft"
          label="Aft (meters)"
          icon={<Ruler className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="number"
            id="arrivalDraftAft"
            value={arrivalDraftAft}
            onChange={(e) => setArrivalDraftAft(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            step="0.01"
            min="0"
            placeholder="Aft draft"
          />
        </FormField>
      </div>
    </div>

    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <Ship className="h-5 w-5 text-seagreen-500 mr-2" />
        Departure Draft
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="departureDraftFwd"
          label="Forward (meters)"
          icon={<Ruler className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="number"
            id="departureDraftFwd"
            value={departureDraftFwd}
            onChange={(e) => setDepartureDraftFwd(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            step="0.01"
            min="0"
            placeholder="Forward draft"
          />
        </FormField>

        <FormField
          id="departureDraftAft"
          label="Aft (meters)"
          icon={<Ruler className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="number"
            id="departureDraftAft"
            value={departureDraftAft}
            onChange={(e) => setDepartureDraftAft(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            step="0.01"
            min="0"
            placeholder="Aft draft"
          />
        </FormField>
      </div>
    </div>
  </div>
);

interface VesselOperationInfoProps {
  operationType: "Import" | "Export" | "Coastal" | "Other";
  setOperationType: (value: "Import" | "Export" | "Coastal" | "Other") => void;
  purposeOfArrivalOther: string;
  setPurposeOfArrivalOther: (value: string) => void;
  arrivalFrom: string;
  setArrivalFrom: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
  operation: "Loading" | "Unloading" | "Transhipment" | "Lighterage";
  setOperation: (
    value: "Loading" | "Unloading" | "Transhipment" | "Lighterage"
  ) => void;
  cargoType: string;
  setCargoType: (value: string) => void;
  cargoName: string;
  setCargoName: (value: string) => void;
  volume: string;
  setVolume: (value: string) => void;
  units: "MT" | "TEUs";
  setUnits: (value: "MT" | "TEUs") => void;
  cargoTypes: CargoType[];
  cargoQuantity: string;
  setCargoQuantity: (value: string) => void;
  totalRevenue: string;
  setTotalRevenue: (value: string) => void;
  voyageType: "Coastal" | "Foreign";
  setVoyageType: (value: "Coastal" | "Foreign") => void;
}

export const VesselOperationInfo: React.FC<VesselOperationInfoProps> = ({
  operationType,
  setOperationType,
  purposeOfArrivalOther,
  setPurposeOfArrivalOther,
  arrivalFrom,
  setArrivalFrom,
  location,
  setLocation,
  operation,
  setOperation,
  cargoType,
  setCargoType,
  cargoName,
  setCargoName,
  volume,
  setVolume,
  units,
  setUnits,
  cargoTypes,
  cargoQuantity,
  setCargoQuantity,
  totalRevenue,
  setTotalRevenue,
  voyageType,
  setVoyageType,
}) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        id="operationType"
        label="Purpose of Arrival"
        required
        icon={<Ship className="h-5 w-5 text-seagreen-500" />}
      >
        <select
          id="operationType"
          value={operationType}
          onChange={(e) =>
            setOperationType(
              e.target.value as "Import" | "Export" | "Coastal" | "Other"
            )
          }
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
          required
        >
          <option value="Import">Import</option>
          <option value="Export">Export</option>
          <option value="Coastal">Coastal</option>
          <option value="Other">Other</option>
        </select>
      </FormField>

      <FormField
        id="voyageType"
        label="Voyage Type"
        required
        icon={<Ship className="h-5 w-5 text-seagreen-500" />}
      >
        <select
          id="voyageType"
          value={voyageType}
          onChange={(e) =>
            setVoyageType(e.target.value as "Coastal" | "Foreign")
          }
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
          required
        >
          <option value="Coastal">Coastal</option>
          <option value="Foreign">Foreign</option>
        </select>
      </FormField>
    </div>

    {operationType === "Other" && (
      <div className="grid grid-cols-1 gap-6">
        <FormField
          id="purposeOfArrivalOther"
          label="Specify Purpose of Arrival"
          required
          icon={<Ship className="h-5 w-5 text-seagreen-500" />}
        >
          <input
            type="text"
            id="purposeOfArrivalOther"
            value={purposeOfArrivalOther}
            onChange={(e) => setPurposeOfArrivalOther(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            required
            placeholder="Enter purpose of arrival"
          />
        </FormField>
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        id="arrivalFrom"
        label="Arrival From"
        required
        icon={<Ship className="h-5 w-5 text-seagreen-500" />}
      >
        <input
          type="text"
          id="arrivalFrom"
          value={arrivalFrom}
          onChange={(e) => setArrivalFrom(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
          required
          placeholder="Origin port/location"
        />
      </FormField>

      <FormField
        id="location"
        label="Coastal State / Country"
        required
        icon={<Anchor className="h-5 w-5 text-seagreen-500" />}
      >
        <input
          type="text"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
          required
          placeholder="Enter state/country"
        />
      </FormField>

      <FormField
        id="operation"
        label="Operation"
        required
        icon={<Ship className="h-5 w-5 text-seagreen-500" />}
      >
        <select
          id="operation"
          value={operation}
          onChange={(e) =>
            setOperation(
              e.target.value as
                | "Loading"
                | "Unloading"
                | "Transhipment"
                | "Lighterage"
            )
          }
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
          required
        >
          <option value="Loading">Loading</option>
          <option value="Unloading">Unloading</option>
          <option value="Transhipment">Transhipment</option>
          <option value="Lighterage">Lighterage</option>
        </select>
      </FormField>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        id="cargoType"
        label="Cargo Name"
        required
        icon={<Package className="h-5 w-5 text-seagreen-500" />}
      >
        <select
          id="cargoType"
          value={cargoType}
          onChange={(e) => setCargoType(e.target.value)}
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
        id="cargoName"
        label="Cargo Name / Commodity"
        required
        icon={<Package className="h-5 w-5 text-seagreen-500" />}
      >
        <input
          type="text"
          id="cargoName"
          value={cargoName}
          onChange={(e) => setCargoName(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
          required
          placeholder="Enter cargo name"
        />
      </FormField>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        id="cargoQuantity"
        label="Cargo Quantity"
        required
        icon={<Package className="h-5 w-5 text-seagreen-500" />}
      >
        <input
          type="text"
          id="cargoQuantity"
          value={cargoQuantity}
          onChange={(e) => setCargoQuantity(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
          required
          placeholder="Enter cargo quantity"
        />
      </FormField>

      <FormField
        id="totalRevenue"
        label="Total Revenue"
        icon={<DollarSign className="h-5 w-5 text-seagreen-500" />}
      >
        <input
          type="text"
          id="totalRevenue"
          value={totalRevenue}
          onChange={(e) => setTotalRevenue(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
          placeholder="Enter total revenue"
        />
      </FormField>

      <FormField
        id="volume"
        label="Volume Handled"
        required
        icon={<DollarSign className="h-5 w-5 text-seagreen-500" />}
      >
        <div className="flex">
          <div className="relative flex-1">
            <input
              type="number"
              id="volume"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              required
              step="0.01"
              min="0"
              placeholder="Enter volume"
            />
          </div>
          <select
            value={units}
            onChange={(e) => setUnits(e.target.value as "MT" | "TEUs")}
            className="w-24 px-2 py-2 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-seagreen-500 bg-gray-50"
          >
            <option value="MT">MT</option>
            <option value="TEUs">TEUs</option>
          </select>
        </div>
      </FormField>
    </div>
  </div>
);
