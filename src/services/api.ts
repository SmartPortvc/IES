// Fetch all weekly performances with port details
// Update weekly performance report
export const updateWeeklyPerformance = async (
  reportId: string,
  reportData: Partial<WeeklyPerformance>
): Promise<void> => {
  try {
    // Convert all numeric string values to actual numbers in dailyData
    const sanitizedData = { ...reportData };

    if (reportData.dailyData) {
      sanitizedData.dailyData = reportData.dailyData.map((day: any) => ({
        ...day,
        totalQuantity: Number(day.totalQuantity) || 0,
        demurrages: Number(day.demurrages) || 0,
        demurrageCharges: Number(day.demurrageCharges) || 0,
        quantity: Number(day.quantity) || 0,
      }));
    }

    if (reportData.totalQuantity !== undefined) {
      sanitizedData.totalQuantity = Number(reportData.totalQuantity) || 0;
    }

    if (reportData.demurragesCollected !== undefined) {
      sanitizedData.demurragesCollected = Number(reportData.demurragesCollected) || 0;
    }

    const reportRef = doc(db, "weeklyPerformances", reportId);
    await updateDoc(reportRef, sanitizedData);
  } catch (error) {
    console.error("Error updating weekly performance:", error);
    throw error;
  }
};

export const fetchWeeklyPerformancesWithPort = async (): Promise<
  Array<WeeklyPerformance & { port?: Port }>
> => {
  try {
    const snapshot = await getDocs(collection(db, "weeklyPerformances"));
    const performances = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (WeeklyPerformance & { id: string })[];
    // Fetch all unique portIds
    const portIds = Array.from(
      new Set(performances.map((p) => p.portId).filter(Boolean))
    );
    const portMap: Record<string, Port> = {};
    // Fetch all ports in parallel
    await Promise.all(
      portIds.map(async (portId) => {
        const portDoc = await getDoc(doc(db, "ports", portId));
        if (portDoc.exists()) {
          portMap[portId] = { id: portDoc.id, ...portDoc.data() } as Port;
        }
      })
    );

    console.log({
      performances,
      portMap,
    });

    // Attach port details to each performance
    return performances.map((perf) => ({
      ...perf,
      port: perf.portId ? portMap[perf.portId] : undefined,
    }));
  } catch (error) {
    console.error(
      "Error fetching weekly performances with port details:",
      error
    );
    throw error;
  }
};
// Weekly Performance API
export interface WeeklyPerformance {
  vesselName: string;
  ownerDetails: string;
  loa: string;
  agentName: string;
  purposeOfArrival: string;
  berthedDate: string;
  dwt: string;
  cargoType: string;
  typeOfCargo: string;
  totalQuantity: number;
  demurragesCollected: number;
  status: string;
  clearanceIssued: string;
  departureDate: string;
  dailyData?: any[];
  createdAt?: any;
  portId: string;
}

export const addWeeklyPerformance = async (
  data: WeeklyPerformance,
  portId: string
): Promise<string> => {
  try {
    // Convert all numeric string values to actual numbers in dailyData
    const sanitizedDailyData = data.dailyData?.map((day: any) => ({
      ...day,
      totalQuantity: Number(day.totalQuantity) || 0,
      demurrages: Number(day.demurrages) || 0,
      demurrageCharges: Number(day.demurrageCharges) || 0,
      quantity: Number(day.quantity) || 0,
    }));

    const docRef = await addDoc(collection(db, "weeklyPerformances"), {
      ...data,
      dailyData: sanitizedDailyData,
      totalQuantity: Number(data.totalQuantity) || 0,
      demurragesCollected: Number(data.demurragesCollected) || 0,
      createdAt: serverTimestamp(),
      portId,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding weekly performance:", error);
    throw error;
  }
};
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import { db, storage } from "../firebase/config";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { Port, HOD, Vessel, CargoType, PortDocument } from "../types";

// Port API
export const fetchPorts = async (): Promise<Port[]> => {
  try {
    const portsCollection = collection(db, "ports");
    const portSnapshot = await getDocs(portsCollection);
    return portSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Port[];
  } catch (error) {
    console.error("Error fetching ports:", error);
    throw error;
  }
};

export const fetchPortById = async (portId: string): Promise<Port | null> => {
  try {
    const portDoc = await getDoc(doc(db, "ports", portId));
    if (portDoc.exists()) {
      return {
        id: portDoc.id,
        ...portDoc.data(),
      } as Port;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching port ${portId}:`, error);
    throw error;
  }
};

export const updatePortStatus = async (
  portId: string,
  data: Partial<Port>
): Promise<void> => {
  try {
    await updateDoc(doc(db, "ports", portId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating port ${portId}:`, error);
    throw error;
  }
};

export const createPortInvitation = async (
  portName: string,
  email: string
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "ports"), {
      portName,
      email,
      status: "invited",
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating port invitation:", error);
    throw error;
  }
};

// Document Upload API
export const uploadPortDocument = async (
  portId: string,
  file: File,
  message: string
): Promise<PortDocument> => {
  try {
    // Create a unique file path
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `ports/${portId}/documents/${fileName}`;

    // Upload file to Firebase Storage
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);

    // Get the download URL
    const url = await getDownloadURL(storageRef);

    // Create document metadata without timestamp
    const documentData: Omit<PortDocument, "uploadedAt"> = {
      id: `doc_${timestamp}`,
      url,
      message,
      fileName: file.name,
    };

    // Create a Firestore timestamp for the current time
    const currentTimestamp = Timestamp.now();

    // Update port document with new document metadata
    await updateDoc(doc(db, "ports", portId), {
      documents: arrayUnion({
        ...documentData,
        uploadedAt: currentTimestamp,
      }),
    });

    // Return the document data with the timestamp converted to a Date
    return {
      ...documentData,
      uploadedAt: currentTimestamp.toDate(),
    } as PortDocument;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
};

export const deletePortDocument = async (
  portId: string,
  document: PortDocument
): Promise<void> => {
  try {
    // Delete file from Storage
    const storageRef = ref(storage, document.url);
    await deleteObject(storageRef);

    // Remove document metadata from port document
    await updateDoc(doc(db, "ports", portId), {
      documents: arrayRemove(document),
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

// HOD API
export const fetchHods = async (): Promise<HOD[]> => {
  try {
    const hodsCollection = collection(db, "hods");
    const hodSnapshot = await getDocs(hodsCollection);
    return hodSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as HOD[];
  } catch (error) {
    console.error("Error fetching HODs:", error);
    throw error;
  }
};

export const fetchHodById = async (hodId: string): Promise<HOD | null> => {
  try {
    const hodDoc = await getDoc(doc(db, "hods", hodId));
    if (hodDoc.exists()) {
      return {
        id: hodDoc.id,
        ...hodDoc.data(),
      } as HOD;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching HOD ${hodId}:`, error);
    throw error;
  }
};

export const createHodInvitation = async (email: string): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "hods"), {
      email,
      status: "invited",
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating HOD invitation:", error);
    throw error;
  }
};

export const updateHodStatus = async (
  hodId: string,
  data: Partial<HOD>
): Promise<void> => {
  try {
    await updateDoc(doc(db, "hods", hodId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating HOD ${hodId}:`, error);
    throw error;
  }
};

// Vessel API
export const fetchVessels = async (portId?: string): Promise<Vessel[]> => {
  try {
    if (!portId) {
      return [];
    }

    const vesselsCollection = collection(db, "vessels");
    const vesselsQuery = query(
      vesselsCollection,
      where("portId", "==", portId),
      orderBy("createdAt", "desc")
    );

    const vesselsSnapshot = await getDocs(vesselsQuery);
    const vessels = await Promise.all(
      vesselsSnapshot.docs.map(async (docSnapshot) => {
        const vesselData = docSnapshot.data();

        // If portId exists, fetch port name
        let portName = "";
        if (vesselData.portId) {
          const portRef = doc(db, "ports", vesselData.portId);
          const portDoc = await getDoc(portRef);
          if (portDoc.exists()) {
            portName = portDoc.data().portName;
          }
        }

        return {
          id: docSnapshot.id,
          ...vesselData,
          portName,
        } as Vessel;
      })
    );

    return vessels;
  } catch (error) {
    console.error("Error fetching vessels:", error);
    throw error;
  }
};

export const fetchVesselById = async (
  vesselId: string
): Promise<Vessel | null> => {
  try {
    const vesselDoc = await getDoc(doc(db, "vessels", vesselId));
    if (!vesselDoc.exists()) {
      return null;
    }

    const vesselData = vesselDoc.data();

    // Fetch port name if portId exists
    let portName = "";
    if (vesselData.portId) {
      const portRef = doc(db, "ports", vesselData.portId);
      const portDoc = await getDoc(portRef);
      if (portDoc.exists()) {
        portName = portDoc.data().portName;
      }
    }

    return {
      id: vesselDoc.id,
      ...vesselData,
      portName,
    } as Vessel;
  } catch (error) {
    console.error(`Error fetching vessel ${vesselId}:`, error);
    throw error;
  }
};

export const addVessel = async (
  vesselData: Omit<Vessel, "id" | "createdAt">
): Promise<string> => {
  try {
    // Ensure all required fields are present
    const requiredFields = [
      "portId",
      "vesselName",
      "imo",
      "grt",
      "loa",
      "dwt",
      "operationType",
      "voyageType",
      "arrivalFrom",
      "location",
      "operation",
      "cargo",
    ];

    for (const field of requiredFields) {
      if (!vesselData[field as keyof typeof vesselData]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Format dates properly
    const formatDate = (date: Date | null) =>
      date ? Timestamp.fromDate(date) : null;

    // Convert all numeric string values to actual numbers in dailyCargoDetails
    const sanitizedDailyCargoDetails = (vesselData as any).dailyCargoDetails?.map((detail: any) => ({
      ...detail,
      quantity: Number(detail.quantity) || 0,
      demurrageCharges: Number(detail.demurrageCharges) || 0,
      demurrages: Number(detail.demurrages) || 0,
    }));

    const formattedData = {
      ...vesselData,
      entryDate: formatDate(vesselData.entryDate),
      sailedOutDate: formatDate(vesselData.sailedOutDate),
      arrivalDateTime: formatDate(vesselData.arrivalDateTime),
      pobDateTime: formatDate(vesselData.pobDateTime),
      berthingDateTime: formatDate(vesselData.berthingDateTime),
      pobDepartureDateTime: formatDate(vesselData.pobDepartureDateTime),
      createdAt: serverTimestamp(),
      addedDate: serverTimestamp(),
      // Ensure numeric fields are stored as numbers
      length: Number(vesselData.length),
      draftAvailable: Number(vesselData.draftAvailable),
      loa: Number(vesselData.loa),
      beam: vesselData.beam ? Number(vesselData.beam) : null,
      dwt: Number(vesselData.dwt),
      // Ensure draft information is properly formatted
      arrivalDraft: vesselData.arrivalDraft
        ? {
            forward: Number(vesselData.arrivalDraft.forward),
            aft: Number(vesselData.arrivalDraft.aft),
          }
        : null,
      departureDraft: vesselData.departureDraft
        ? {
            forward: Number(vesselData.departureDraft.forward),
            aft: Number(vesselData.departureDraft.aft),
          }
        : null,
      // Ensure cargo information is properly formatted
      cargo: {
        ...vesselData.cargo,
        volume: Number(vesselData.cargo.volume),
      },
      // Ensure dailyCargoDetails numeric values are stored as numbers
      dailyCargoDetails: sanitizedDailyCargoDetails,
      // Convert totalRevenue and demurragesCollected to numbers
      totalRevenue: (vesselData as any).totalRevenue ? Number((vesselData as any).totalRevenue) : null,
      demurragesCollected: (vesselData as any).demurragesCollected ? Number((vesselData as any).demurragesCollected) : null,
    };

    const docRef = await addDoc(collection(db, "vessels"), formattedData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding vessel:", error);
    throw error;
  }
};

// Cargo Types API
export const fetchCargoTypes = async (): Promise<CargoType[]> => {
  try {
    const cargoTypesCollection = collection(db, "cargoTypes");
    const cargoTypesSnapshot = await getDocs(cargoTypesCollection);
    return cargoTypesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CargoType[];
  } catch (error) {
    console.error("Error fetching cargo types:", error);
    throw error;
  }
};

export const addCargoType = async (
  name: string,
  description: string = ""
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "cargoTypes"), {
      name,
      description,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding cargo type:", error);
    throw error;
  }
};

export const updateCargoType = async (
  id: string,
  name: string,
  description: string = ""
): Promise<void> => {
  try {
    await updateDoc(doc(db, "cargoTypes", id), {
      name,
      description,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating cargo type ${id}:`, error);
    throw error;
  }
};

export const deleteCargoType = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "cargoTypes", id));
  } catch (error) {
    console.error(`Error deleting cargo type ${id}:`, error);
    throw error;
  }
};

// User API
export const fetchUserPortId = async (
  userId: string
): Promise<string | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists() && userDoc.data().portId) {
      return userDoc.data().portId;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching user port ID for ${userId}:`, error);
    throw error;
  }
};
