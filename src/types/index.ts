export interface Port {
  id?: string;
  portName: string;
  email: string;
  registeredAddress?: string;
  gst?: string;
  pan?: string;
  landAllotted?: string;
  landUtilised?: string;
  unitizedBerths?: string;
  documents?: PortDocument[];
  locationLink?: string;
  status?: "invited" | "registered";
  createdAt?: any;
  invitationSentAt?: any;
  registeredAt?: any;
  registrationToken?: string;
}

export interface PortDocument {
  id: string;
  url: string;
  message: string;
  fileName: string;
  uploadedAt: any;
}

export interface User {
  uid: string;
  email: string;
  role: "admin" | "port" | "hod";
  portId?: string;
  name?: string;
  designation?: string;
  department?: string;
  viewOnly?: boolean;
}

export interface HOD {
  id?: string;
  email: string;
  name?: string;
  designation?: string;
  department?: string;
  status?: "invited" | "registered";
  createdAt?: any;
  invitationSentAt?: any;
  registeredAt?: any;
  registrationToken?: string;
}

export interface Vessel {
  id?: string;
  portId: string;

  // General Information
  berthDetails: string;
  length: number;
  draftAvailable: number;
  vesselName: string;
  vesselOwner?: string;
  vesselAgent?: string;
  entryDate: Date;
  sailedOutDate?: Date | null;

  // Additional Fields
  imo: string;
  grt: string;
  arrivalDateTime?: Date | null;
  pobDateTime?: Date | null;
  berthingDateTime?: Date | null;
  pobDepartureDateTime?: Date | null;
  nextPortOfCall?: string;
  cargoQuantity: string;
  totalRevenue?: string;
  voyageType: "Coastal" | "Foreign";
  arrivalFrom: string;

  // Static Data
  loa: number;
  beam?: number;
  dwt: number;
  clearanceIssuedOn?: Date | null;

  // Draft Information
  arrivalDraft?: {
    forward: number;
    aft: number;
  };
  departureDraft?: {
    forward: number;
    aft: number;
  };

  // Operation Details
  operationType: "Import" | "Export" | "Coastal" | "Other";
  purposeOfArrivalOther?: string;
  fromTo: string;
  location: string;
  operation: "Loading" | "Unloading" | "Transhipment" | "Lighterage";
  cargo: {
    type: string;
    name: string;
    volume: number;
    units: "MT" | "TEUs";
  };

  // Metadata
  createdAt: any;
  updatedAt?: any;
  addedDate?: any;
}

export interface CargoType {
  id?: string;
  name: string;
  description?: string;
  createdAt: any;
  updatedAt?: any;
}
