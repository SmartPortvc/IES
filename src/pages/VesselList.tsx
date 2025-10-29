import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Ship } from "lucide-react";
import { fetchPortById, fetchVessels } from "../services/api";
import { Port } from "../types";
import DashboardLayout from "../components/layout/DashboardLayout";
import VesselList from "../components/vessel/VesselList";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import ErrorDisplay from "../components/ui/ErrorDisplay";

const VesselListPage: React.FC = () => {
  const { portId } = useParams<{ portId: string }>();
  const navigate = useNavigate();

  const [portData, setPortData] = useState<Port | null>(null);
  const [vessels, setVessels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!portId) {
      setError("Port ID is missing");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch port data
        const port = await fetchPortById(portId);
        if (!port) {
          setError("Port not found");
          setLoading(false);
          return;
        }

        setPortData(port);

        // Fetch vessels for this port
        const vesselData = await fetchVessels(portId);
        setVessels(vesselData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load vessel data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [portId]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading vessel data..." />;
  }

  if (error || !portData) {
    return (
      <ErrorDisplay
        message={error || "Failed to load port details"}
        redirectLink="/admin"
        redirectText="Back to Dashboard"
        fullPage
      />
    );
  }

  return (
    <DashboardLayout
      title={`Vessel List - ${portData.portName}`}
      subtitle="View and manage vessels for this port"
      backLink="/admin"
      backLinkText="Back to Dashboard"
      icon={<Ship className="h-6 w-6 text-seagreen-600" />}
    >
      <VesselList
        vessels={vessels}
        loading={false}
        error={null}
        portName={portData.portName}
        portId={portId}
        showExport={true}
      />
    </DashboardLayout>
  );
};

export default VesselListPage;
