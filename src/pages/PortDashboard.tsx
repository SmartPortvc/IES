import React, { useEffect, useState, useMemo } from 'react';
import { Ship, PlusCircle, FileText, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePortData } from '../hooks/usePortData';
import { useVessels } from '../hooks/useVessels';
import DashboardLayout from '../components/layout/DashboardLayout';
import VesselList from '../components/vessel/VesselList';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import DateRangePicker from '../components/ui/DateRangePicker';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import ExcelReportGenerator from '../components/reports/ExcelReportGenerator';
import { generateExcelReport } from '../utils/excelReportGenerator';

const PortDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { portData, loading: loadingPort, error: portError } = usePortData();
  const [portId, setPortId] = useState<string | undefined>(undefined);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Set portId once portData is loaded
  useEffect(() => {
    if (portData && portData.id) {
      setPortId(portData.id);
    }
  }, [portData]);
  
  // Fetch vessels for this port
  const { vessels, loading: loadingVessels, error: vesselsError } = useVessels(portId);

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

  const handleAddVessel = () => {
    navigate('/add-vessel');
  };

  const handleGenerateWeeklyReport = (selectedPortId: string) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklyVessels = vessels.filter(vessel => {
      const arrivalDate = vessel.arrivalDateTime;
      if (!arrivalDate) return false;

      let vesselDate: Date;
      if (typeof arrivalDate === 'string') {
        vesselDate = new Date(arrivalDate);
      } else if (arrivalDate instanceof Date) {
        vesselDate = arrivalDate;
      } else if (arrivalDate.seconds) {
        vesselDate = new Date(arrivalDate.seconds * 1000);
      } else {
        return false;
      }

      return vesselDate >= weekAgo && vesselDate <= now;
    });

    generateExcelReport(weeklyVessels, portData?.portName || 'Port', 'weekly', undefined, undefined, false);
  };

  const handleGenerateCustomReport = (fromDate: string, toDate: string, selectedPortId: string) => {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    const customVessels = vessels.filter(vessel => {
      const arrivalDate = vessel.arrivalDateTime;
      if (!arrivalDate) return false;

      let vesselDate: Date;
      if (typeof arrivalDate === 'string') {
        vesselDate = new Date(arrivalDate);
      } else if (arrivalDate instanceof Date) {
        vesselDate = arrivalDate;
      } else if (arrivalDate.seconds) {
        vesselDate = new Date(arrivalDate.seconds * 1000);
      } else {
        return false;
      }

      return vesselDate >= from && vesselDate <= to;
    });

    generateExcelReport(customVessels, portData?.portName || 'Port', 'custom', fromDate, toDate, false);
  };

  if (loadingPort) {
    return (
      <DashboardLayout title="Port Dashboard">
        <LoadingSpinner message="Loading port data..." />
      </DashboardLayout>
    );
  }

  if (portError) {
    return (
      <DashboardLayout title="Port Dashboard">
        <ErrorDisplay message={portError} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Port Dashboard">
      <div className="mb-6">
        <Card
          title={`Welcome, ${portData?.portName}`}
          icon={<Ship className="h-6 w-6 text-seagreen-600" />}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-gray-600 mb-4">
                Welcome to your port management dashboard. Here you can manage your vessels and view port information.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={handleAddVessel}
                  icon={<PlusCircle className="h-4 w-4" />}
                >
                  Add New Vessel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/port-profile')}
                  icon={<FileText className="h-4 w-4" />}
                >
                  View Port Profile
                </Button>
              </div>
            </div>
            <div className="mt-4 md:mt-0 bg-seagreen-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-seagreen-800">Quick Stats</h3>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-seagreen-600">Total Vessels</p>
                  <p className="text-2xl font-bold text-seagreen-900">{filteredVessels.length}</p>
                </div>
                <div>
                  <p className="text-xs text-seagreen-600">Last Updated</p>
                  <p className="text-sm font-medium text-seagreen-900">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <ExcelReportGenerator
        onGenerateWeekly={handleGenerateWeeklyReport}
        onGenerateCustom={handleGenerateCustomReport}
        ports={portData ? [{ id: portData.id, portName: portData.portName }] : []}
        selectedPortId={portData?.id}
        isAdmin={false}
      />

      {/* Date Range Filter */}
      <Card 
        title="Filter Vessels" 
        icon={<Calendar className="h-6 w-6 text-seagreen-600" />}
        className="mb-6"
      >
        <DateRangePicker
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          fromLabel="From Arrival Date"
          toLabel="To Arrival Date"
        />
        {(fromDate || toDate) && (
          <div className="mt-4 flex items-center justify-between bg-seagreen-50 p-3 rounded-lg">
            <p className="text-sm text-seagreen-700">
              Showing {filteredVessels.length} vessels
              {fromDate && toDate ? ` from ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}` : 
               fromDate ? ` from ${new Date(fromDate).toLocaleDateString()}` :
               toDate ? ` until ${new Date(toDate).toLocaleDateString()}` : ''}
            </p>
            <Button
              variant="outline"
              size="small"
              onClick={() => {
                setFromDate('');
                setToDate('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Card>

      <VesselList 
        vessels={filteredVessels} 
        loading={loadingVessels} 
        error={vesselsError} 
      />
    </DashboardLayout>
  );
};

export default PortDashboard;