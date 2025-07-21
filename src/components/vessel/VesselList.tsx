import React, { useState, useCallback, useMemo, memo } from 'react';
import { Ship, Calendar, Package, Navigation, ExternalLink, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Vessel } from '../../types';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorDisplay from '../ui/ErrorDisplay';
import Button from '../ui/Button';
import SearchFilter from '../ui/SearchFilter';
import StatusBadge from '../ui/StatusBadge';
import { formatDateTime, formatCurrency } from '../../utils/formatters';

interface VesselListProps {
  vessels: Vessel[];
  loading: boolean;
  error: string | null;
  portName?: string;
  showExport?: boolean;
}

const VesselList: React.FC<VesselListProps> = ({ 
  vessels, 
  loading, 
  error, 
  portName,
  showExport = false
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Import' | 'Export' | 'Coastal'>('all');

  const handleViewDetails = useCallback((vesselId: string) => {
    navigate(`/vessel-details/${vesselId}`);
  }, [navigate]);

  const filteredVessels = useMemo(() => {
    return vessels.filter(vessel => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (vessel.vesselName?.toLowerCase().includes(searchLower) ?? false) ||
        (vessel.imo?.toLowerCase().includes(searchLower) ?? false) ||
        (vessel.arrivalFrom?.toLowerCase().includes(searchLower) ?? false) ||
        (vessel.cargo?.type?.toLowerCase().includes(searchLower) ?? false) ||
        (vessel.portName?.toLowerCase().includes(searchLower) ?? false);
      
      const matchesType = 
        filterType === 'all' || 
        vessel.operationType === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [vessels, searchTerm, filterType]);

  const exportToCSV = useCallback(() => {
    // Generate headers
    const headers = [
      // General Information
      'Vessel Name',
      'IMO Number',
      'GRT',
      'Port Name',
      'Vessel Owner',
      'Vessel Agent',
      'Entry Date',
      'Sailed Out Date',
      
      // Dates and Times
      'Arrival Date & Time',
      'Pilot On Board Date & Time',
      'Berthing Date & Time',
      'Pilot Off Board Date & Time',
      'Next Port of Call',
      
      // Static Data
      'Length Over All (LOA)',
      'Beam',
      'Dead Weight Tonnage (DWT)',
      'Length',
      'Draft Available',
      
      // Draft Information
      'Arrival Draft Forward',
      'Arrival Draft Aft',
      'Departure Draft Forward',
      'Departure Draft Aft',
      
      // Operation Details
      'Operation Type',
      'Voyage Type',
      'Operation',
      'Arrival From',
      'Location',
      
      // Cargo Information
      'Cargo Type',
      'Cargo Name',
      'Cargo Volume',
      'Volume Units',
      'Cargo Quantity',
      'Total Revenue',
      'Status'
    ].join(',');

    // Generate data rows
    const rows = vessels.map(vessel => {
      const formatValue = (value: any) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return value;
      };

      const formatDateValue = (date: any) => {
        return date ? formatDateTime(date) : '';
      };

      return [
        // General Information
        formatValue(vessel.vesselName),
        formatValue(vessel.imo),
        formatValue(vessel.grt),
        formatValue(vessel.portName),
        formatValue(vessel.vesselOwner),
        formatValue(vessel.vesselAgent),
        formatValue(formatDateValue(vessel.entryDate)),
        formatValue(formatDateValue(vessel.sailedOutDate)),
        
        // Dates and Times
        formatValue(formatDateValue(vessel.arrivalDateTime)),
        formatValue(formatDateValue(vessel.pobDateTime)),
        formatValue(formatDateValue(vessel.berthingDateTime)),
        formatValue(formatDateValue(vessel.pobDepartureDateTime)),
        formatValue(vessel.nextPortOfCall),
        
        // Static Data
        formatValue(vessel.loa),
        formatValue(vessel.beam),
        formatValue(vessel.dwt),
        formatValue(vessel.length),
        formatValue(vessel.draftAvailable),
        
        // Draft Information
        formatValue(vessel.arrivalDraft?.forward),
        formatValue(vessel.arrivalDraft?.aft),
        formatValue(vessel.departureDraft?.forward),
        formatValue(vessel.departureDraft?.aft),
        
        // Operation Details
        formatValue(vessel.operationType),
        formatValue(vessel.voyageType),
        formatValue(vessel.operation),
        formatValue(vessel.arrivalFrom),
        formatValue(vessel.location),
        
        // Cargo Information
        formatValue(vessel.cargo?.type),
        formatValue(vessel.cargo?.name),
        formatValue(vessel.cargo?.volume),
        formatValue(vessel.cargo?.units),
        formatValue(vessel.cargoQuantity),
        formatValue(vessel.totalRevenue ? formatCurrency(vessel.totalRevenue) : ''),
        formatValue(vessel.sailedOutDate ? 'Sailed' : 'Active')
      ].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `${portName ? `${portName}_` : ''}vessels_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [vessels, portName]);

  if (loading) {
    return <LoadingSpinner message="Loading vessels..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <Card 
      title={portName ? `Vessels - ${portName}` : "Vessel List"} 
      icon={<Ship className="h-6 w-6 text-seagreen-600" />}
    >
      <SearchFilter 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchPlaceholder="Search by vessel name, IMO, cargo type..."
        filterOptions={[
          { value: 'all', label: 'All Types' },
          { value: 'Import', label: 'Import' },
          { value: 'Export', label: 'Export' },
          { value: 'Coastal', label: 'Coastal' }
        ]}
        filterValue={filterType}
        setFilterValue={(value) => setFilterType(value as typeof filterType)}
        onExport={showExport ? exportToCSV : undefined}
        showExport={showExport}
      />

      {filteredVessels.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-8 rounded text-center">
          <Ship className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <h3 className="text-lg font-medium">No vessels found</h3>
          <p className="mt-2 text-gray-500">
            {searchTerm || filterType !== 'all'
              ? 'Try adjusting your search or filter criteria' 
              : 'No vessels have been added yet'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vessel Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arrival Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVessels.map((vessel) => (
                <tr key={vessel.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <Ship className="h-5 w-5 text-seagreen-500 mr-2" />
                        <span className="font-medium text-gray-900">{vessel.vesselName || 'N/A'}</span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <div>IMO: {vessel.imo || 'N/A'}</div>
                        <div>GRT: {vessel.grt || 'N/A'}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        {vessel.arrivalDateTime ? formatDateTime(vessel.arrivalDateTime) : 'N/A'}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Navigation className="h-4 w-4 text-gray-400 mr-2" />
                        From: {vessel.arrivalFrom || 'N/A'}
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-2">
                      <StatusBadge 
                        status={vessel.operationType} 
                        label={vessel.operationType || 'N/A'} 
                      />
                      <StatusBadge 
                        status={vessel.voyageType} 
                        label={vessel.voyageType || 'N/A'} 
                      />
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-start space-x-2">
                      <Package className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {vessel.cargo?.type || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vessel.cargo?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vessel.cargo?.volume 
                            ? `${vessel.cargo.volume} ${vessel.cargo.units}` 
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-gray-400 mr-1" />
                      <span className="text-sm font-medium text-gray-900">
                        {vessel.totalRevenue 
                          ? formatCurrency(vessel.totalRevenue)
                          : 'N/A'}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => handleViewDetails(vessel.id!)}
                      icon={<ExternalLink className="h-4 w-4" />}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default memo(VesselList);