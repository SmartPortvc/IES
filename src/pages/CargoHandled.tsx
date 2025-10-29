import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, Package, Calendar, ArrowUpDown, Ship } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchPorts, fetchVessels } from '../services/api';
import { Port, Vessel } from '../types';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import DateRangePicker from '../components/ui/DateRangePicker';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import { formatDate } from '../utils/formatters';

const CargoHandled: React.FC = () => {
  const { userRole } = useAuth();
  const [ports, setPorts] = useState<Port[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [selectedPorts, setSelectedPorts] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all ports
        const portsData = await fetchPorts();
        setPorts(portsData);
        
        // Fetch vessels for all ports
        const allVessels: Vessel[] = [];
        for (const port of portsData) {
          if (port.id) {
            const portVessels = await fetchVessels(port.id);
            allVessels.push(...portVessels.map(vessel => ({
              ...vessel,
              portName: port.portName
            })));
          }
        }
        setVessels(allVessels);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load cargo data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredVessels = useMemo(() => {
    return vessels.filter(vessel => {
      // Filter by selected ports
      const matchesPort = selectedPorts.length === 0 ||
        (vessel.portId && selectedPorts.includes(vessel.portId));

      // Filter by date range
      let matchesDateRange = true;
      if (fromDate && vessel.arrivalDateTime) {
        const vesselDate = new Date(vessel.arrivalDateTime.seconds * 1000);
        const fromDateObj = new Date(fromDate);
        matchesDateRange = matchesDateRange && vesselDate >= fromDateObj;
      }
      if (toDate && vessel.arrivalDateTime) {
        const vesselDate = new Date(vessel.arrivalDateTime.seconds * 1000);
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && vesselDate <= toDateObj;
      }

      return matchesPort && matchesDateRange;
    });
  }, [vessels, selectedPorts, fromDate, toDate]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredVessels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVessels = useMemo(() => {
    return filteredVessels.slice(startIndex, endIndex);
  }, [filteredVessels, startIndex, endIndex]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPorts, fromDate, toDate]);

  // Calculate cargo statistics
  const cargoStats = useMemo(() => {
    const stats = {
      totalCargo: 0,
      cargoByType: {} as Record<string, number>,
      cargoByPort: {} as Record<string, number>,
      averageCargoPerVessel: 0
    };

    filteredVessels.forEach(vessel => {
      // Parse cargo quantity from the cargo object
      const cargoQuantityStr = vessel.cargo?.quantity || '0';
      const quantity = parseInt(cargoQuantityStr.split(' ')[0]) || 0;
      
      // Total cargo
      stats.totalCargo += quantity;
      
      // Cargo by type
      const cargoType = vessel.cargo?.type || 'Unknown';
      stats.cargoByType[cargoType] = (stats.cargoByType[cargoType] || 0) + quantity;
      
      // Cargo by port
      if (vessel.portName) {
        stats.cargoByPort[vessel.portName] = (stats.cargoByPort[vessel.portName] || 0) + quantity;
      }
    });

    // Calculate average
    stats.averageCargoPerVessel = filteredVessels.length > 0 
      ? stats.totalCargo / filteredVessels.length 
      : 0;

    return stats;
  }, [filteredVessels]);

  if (loading) {
    return (
      <DashboardLayout title="Cargo Handled Details">
        <LoadingSpinner message="Loading cargo data..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Cargo Handled Details">
        <ErrorDisplay message={error} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Cargo Handled Details"
      subtitle="Analyze cargo data across all ports"
      icon={<BarChart3 className="h-6 w-6 text-seagreen-600" />}
    >
      {/* Filters */}
      <Card 
        title="Filters" 
        icon={<Package className="h-6 w-6 text-seagreen-600" />}
        className="mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Ports for Comparison
            </label>
            <select
              multiple
              value={selectedPorts}
              onChange={(e) => setSelectedPorts(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              size={4}
            >
              {ports.map(port => (
                <option key={port.id} value={port.id}>
                  {port.portName}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Hold Ctrl/Cmd to select multiple ports
            </p>
          </div>

          <DateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
          />
        </div>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card 
          title="Total Cargo Handled" 
          icon={<Package className="h-5 w-5 text-seagreen-600" />}
        >
          <div className="text-3xl font-bold text-gray-900">
            {cargoStats.totalCargo.toLocaleString()} MT
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Across {filteredVessels.length} vessels
          </p>
        </Card>

        <Card 
          title="Average Cargo per Vessel" 
          icon={<Ship className="h-5 w-5 text-seagreen-600" />}
        >
          <div className="text-3xl font-bold text-gray-900">
            {Math.round(cargoStats.averageCargoPerVessel).toLocaleString()} MT
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Based on selected data
          </p>
        </Card>

        <Card 
          title="Date Range" 
          icon={<Calendar className="h-5 w-5 text-seagreen-600" />}
        >
          <div className="text-lg font-medium text-gray-900">
            {fromDate && toDate ? (
              <>
                {formatDate(new Date(fromDate))} - {formatDate(new Date(toDate))}
              </>
            ) : (
              'All Time'
            )}
          </div>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cargo by Type */}
        <Card 
          title="Cargo by Type" 
          icon={<Package className="h-6 w-6 text-seagreen-600" />}
        >
          <div className="space-y-4">
            {Object.entries(cargoStats.cargoByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, quantity]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-seagreen-500 mr-2" />
                    <span className="text-gray-700">{type}</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {quantity.toLocaleString()} MT
                  </span>
                </div>
              ))}
          </div>
        </Card>

        {/* Cargo by Port */}
        <Card 
          title="Cargo by Port" 
          icon={<Ship className="h-6 w-6 text-seagreen-600" />}
        >
          <div className="space-y-4">
            {Object.entries(cargoStats.cargoByPort)
              .sort(([, a], [, b]) => b - a)
              .map(([portName, quantity]) => (
                <div key={portName} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Ship className="h-5 w-5 text-seagreen-500 mr-2" />
                    <span className="text-gray-700">{portName}</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {quantity.toLocaleString()} MT
                  </span>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* Vessel List */}
      <Card
        title="Vessel Details"
        icon={<Ship className="h-6 w-6 text-seagreen-600" />}
        className="mt-6"
      >
        <div className="space-y-4">
          {/* Items per page selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                Items per page:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500 text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="text-sm text-gray-700">
              Showing {filteredVessels.length === 0 ? 0 : startIndex + 1} to{' '}
              {Math.min(endIndex, filteredVessels.length)} of {filteredVessels.length} vessels
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vessel Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Port
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arrival Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Operation
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedVessels.length > 0 ? (
                  paginatedVessels.map((vessel) => (
                    <tr key={vessel.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Ship className="h-5 w-5 text-seagreen-500 mr-2" />
                          <div className="text-sm font-medium text-gray-900">
                            {vessel.vesselName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vessel.portName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vessel.arrivalDateTime ? formatDate(vessel.arrivalDateTime) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vessel.cargo?.type || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vessel.cargo?.quantity || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          vessel.operationType === 'Loaded'
                            ? 'bg-green-100 text-green-800'
                            : vessel.operationType === 'Unloaded'
                            ? 'bg-seagreen-100 text-seagreen-800'
                            : vessel.operationType === 'Lighterage'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {vessel.operationType}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                      No vessels found matching the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <div className="flex items-center space-x-2">
                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      1
                    </button>
                    {currentPage > 4 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                  </>
                )}

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return (
                      page === currentPage ||
                      page === currentPage - 1 ||
                      page === currentPage + 1 ||
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    );
                  })
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        currentPage === page
                          ? 'bg-seagreen-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default CargoHandled;