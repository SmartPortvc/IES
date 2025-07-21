import React, { useState, useEffect, useMemo } from 'react';
import { Ship, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchPorts, fetchVessels } from '../services/api';
import { Port, Vessel } from '../types';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import DateRangePicker from '../components/ui/DateRangePicker';
import VesselList from '../components/vessel/VesselList';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorDisplay from '../components/ui/ErrorDisplay';

const VesselsPage: React.FC = () => {
  const { userRole } = useAuth();
  const [ports, setPorts] = useState<Port[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedPortId, setSelectedPortId] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all ports first
        const portsData = await fetchPorts();
        setPorts(portsData);

        // If a specific port is selected, fetch vessels for that port
        if (selectedPortId && selectedPortId !== 'all') {
          const vesselData = await fetchVessels(selectedPortId);
          setVessels(vesselData);
        } else {
          // Fetch vessels for all ports
          const allVessels: Vessel[] = [];
          for (const port of portsData) {
            if (port.id) {
              const portVessels = await fetchVessels(port.id);
              // Add port name to each vessel for display
              const vesselsWithPortName = portVessels.map(vessel => ({
                ...vessel,
                portName: port.portName
              }));
              allVessels.push(...vesselsWithPortName);
            }
          }
          setVessels(allVessels);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load vessels data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPortId]);

  // Filter vessels based on date range
  const filteredVessels = useMemo(() => {
    return vessels.filter(vessel => {
      if (!fromDate && !toDate) return true;

      const vesselDate = vessel.arrivalDateTime 
        ? new Date(vessel.arrivalDateTime.seconds * 1000) 
        : null;

      if (!vesselDate) return true;

      const fromDateObj = fromDate ? new Date(fromDate) : null;
      const toDateObj = toDate ? new Date(toDate) : null;

      if (fromDateObj && toDateObj) {
        // Set end of day for toDate
        toDateObj.setHours(23, 59, 59, 999);
        return vesselDate >= fromDateObj && vesselDate <= toDateObj;
      } else if (fromDateObj) {
        return vesselDate >= fromDateObj;
      } else if (toDateObj) {
        toDateObj.setHours(23, 59, 59, 999);
        return vesselDate <= toDateObj;
      }

      return true;
    });
  }, [vessels, fromDate, toDate]);

  if (loading) {
    return (
      <DashboardLayout title="Vessels">
        <LoadingSpinner message="Loading vessels data..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Vessels">
        <ErrorDisplay message={error} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Vessels"
      subtitle="View and manage all vessels across ports"
      icon={<Ship className="h-6 w-6 text-seagreen-600" />}
    >
      <Card 
        title="Filters" 
        icon={<Calendar className="h-6 w-6 text-seagreen-600" />}
        className="mb-6"
      >
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
              {ports.map(port => (
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
              fromLabel="From Arrival Date"
              toLabel="To Arrival Date"
            />
          </div>
        </div>

        {(fromDate || toDate || selectedPortId !== 'all') && (
          <div className="mt-4 flex items-center justify-between bg-seagreen-50 p-3 rounded-lg">
            <p className="text-sm text-seagreen-700">
              Showing {filteredVessels.length} vessels
              {selectedPortId !== 'all' && ` from ${ports.find(p => p.id === selectedPortId)?.portName}`}
              {fromDate && toDate ? ` between ${new Date(fromDate).toLocaleDateString()} and ${new Date(toDate).toLocaleDateString()}` : 
               fromDate ? ` from ${new Date(fromDate).toLocaleDateString()}` :
               toDate ? ` until ${new Date(toDate).toLocaleDateString()}` : ''}
            </p>
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
                setSelectedPortId('all');
              }}
              className="text-sm text-seagreen-600 hover:text-seagreen-800 font-medium"
            >
              Clear Filters
            </button>
          </div>
        )}
      </Card>

      <VesselList 
        vessels={filteredVessels}
        loading={loading}
        error={error}
        showExport={true}
      />
    </DashboardLayout>
  );
};

export default VesselsPage;