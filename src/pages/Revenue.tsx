import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Calendar, Ship, TrendingUp, Anchor } from 'lucide-react';
import { fetchPorts, fetchVessels } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Port, Vessel } from '../types';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import SearchFilter from '../components/ui/SearchFilter';
import DateRangePicker from '../components/ui/DateRangePicker';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';

const Revenue: React.FC = () => {
  const { userRole, currentUser } = useAuth();
  const [ports, setPorts] = useState<Port[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedPortId, setSelectedPortId] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilterType, setDateFilterType] = useState<'arrivalDate' | 'addedDate'>('addedDate');
  
  // For port users, we need to get their port ID
  const [userPortId, setUserPortId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // If user is a port, we only need to fetch their vessels
        if (userRole === 'port' && currentUser) {
          // Get the port ID for the current user
          const userDoc = await fetch(`/api/users/${currentUser.uid}`).then(res => res.json());
          const portId = userDoc.portId;
          setUserPortId(portId);
          
          // Fetch vessels for this port
          const vesselData = await fetchVessels(portId);
          setVessels(vesselData);
        } else {
          // For admin and HOD, fetch all ports first
          const portsData = await fetchPorts();
          setPorts(portsData);
          
          // If a port is selected, fetch vessels for that port
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
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load revenue data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userRole, currentUser, selectedPortId]);

  const filteredVessels = useMemo(() => {
    return vessels.filter(vessel => {
      // Filter by search term
      const matchesSearch = searchTerm === '' || 
        vessel.vesselName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vessel.imo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vessel.cargo?.type && vessel.cargo.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vessel.portName && vessel.portName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by date range
      let matchesDateRange = true;
      
      // Determine which date field to use for filtering
      const dateField = dateFilterType === 'arrivalDate' ? vessel.arrivalDateTime : vessel.addedDate || vessel.createdAt;
      
      if (fromDate && dateField) {
        const fieldDate = new Date(dateField.seconds * 1000);
        const fromDateObj = new Date(fromDate);
        matchesDateRange = matchesDateRange && fieldDate >= fromDateObj;
      }
      
      if (toDate && dateField) {
        const fieldDate = new Date(dateField.seconds * 1000);
        const toDateObj = new Date(toDate);
        // Set time to end of day
        toDateObj.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && fieldDate <= toDateObj;
      }
      
      return matchesSearch && matchesDateRange;
    });
  }, [vessels, searchTerm, fromDate, toDate, dateFilterType]);

  // Calculate total revenue from filtered vessels
  const totalRevenue = useMemo(() => {
    return filteredVessels.reduce((total, vessel) => {
      if (!vessel.totalRevenue) return total;
      
      // Convert totalRevenue to string and handle different formats
      const revenueStr = String(vessel.totalRevenue);
      
      // Remove currency symbols, commas, and other non-numeric characters
      // Keep decimal points and negative signs
      const cleanedValue = revenueStr.replace(/[^0-9.-]/g, '');
      
      // Parse the cleaned value as a float
      const revenue = parseFloat(cleanedValue) || 0;
      
      return total + revenue;
    }, 0);
  }, [filteredVessels]);

  // Calculate last month revenue
  const lastMonthRevenue = useMemo(() => {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    
    return filteredVessels.reduce((total, vessel) => {
      // Get the date from the vessel
      const dateField = dateFilterType === 'arrivalDate' ? vessel.arrivalDateTime : vessel.addedDate || vessel.createdAt;
      if (!dateField || !vessel.totalRevenue) return total;
      
      const vesselDate = new Date(dateField.seconds * 1000);
      
      // Check if the vessel date is within the last month
      if (vesselDate >= lastMonthStart && vesselDate <= lastMonthEnd) {
        const revenueStr = String(vessel.totalRevenue);
        const cleanedValue = revenueStr.replace(/[^0-9.-]/g, '');
        const revenue = parseFloat(cleanedValue) || 0;
        return total + revenue;
      }
      
      return total;
    }, 0);
  }, [filteredVessels, dateFilterType]);

  // Calculate last year revenue
  const lastYearRevenue = useMemo(() => {
    const now = new Date();
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    
    return filteredVessels.reduce((total, vessel) => {
      // Get the date from the vessel
      const dateField = dateFilterType === 'arrivalDate' ? vessel.arrivalDateTime : vessel.addedDate || vessel.createdAt;
      if (!dateField || !vessel.totalRevenue) return total;
      
      const vesselDate = new Date(dateField.seconds * 1000);
      
      // Check if the vessel date is within the last year
      if (vesselDate >= lastYearStart && vesselDate <= lastYearEnd) {
        const revenueStr = String(vessel.totalRevenue);
        const cleanedValue = revenueStr.replace(/[^0-9.-]/g, '');
        const revenue = parseFloat(cleanedValue) || 0;
        return total + revenue;
      }
      
      return total;
    }, 0);
  }, [filteredVessels, dateFilterType]);

  const columns = [
    {
      key: 'vesselName',
      header: 'Vessel Name',
      render: (value: string, vessel: Vessel) => (
        <div className="flex items-center">
          <Ship className="h-5 w-5 text-seagreen-500 mr-2" />
          <div className="text-sm font-medium text-gray-900">{value}</div>
        </div>
      )
    },
    {
      key: 'portName',
      header: 'Port Name',
      render: (_: any, vessel: Vessel) => (
        <div className="flex items-center">
          <Anchor className="h-5 w-5 text-teal-500 mr-2" />
          <div className="text-sm text-gray-700">{vessel.portName || 'N/A'}</div>
        </div>
      )
    },
    {
      key: 'imo',
      header: 'IMO'
    },
    {
      key: 'arrivalDateTime',
      header: 'Arrival Date',
      render: (value: any) => value ? formatDate(value) : 'N/A'
    },
    {
      key: 'addedDate',
      header: 'Added Date',
      render: (value: any, vessel: Vessel) => {
        // Use addedDate if available, otherwise fall back to createdAt
        const dateToUse = value || vessel.createdAt;
        return dateToUse ? formatDate(dateToUse) : 'N/A';
      }
    },
    {
      key: 'cargo',
      header: 'Cargo Type',
      render: (value: any) => value?.type || 'N/A'
    },
    {
      key: 'operationType',
      header: 'Operation',
      render: (value: string) => <StatusBadge status={value} label={value} />
    },
    {
      key: 'voyageType',
      header: 'Voyage Type',
      render: (value: string) => <StatusBadge status={value} label={value} />
    },
    {
      key: 'totalRevenue',
      header: 'Revenue',
      render: (value: string) => (
        <span className="text-sm font-medium text-gray-900">
          {value ? formatCurrency(value) : 'N/A'}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Revenue Generated">
        <LoadingSpinner message="Loading revenue data..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Revenue Generated">
        <ErrorDisplay message={error} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Revenue Generated"
      subtitle="Track and analyze revenue across all vessels"
      icon={<DollarSign className="h-6 w-6 text-seagreen-600" />}
    >
      <Card 
        title="Revenue Filters" 
        icon={<Calendar className="h-6 w-6 text-seagreen-600" />}
        className="mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Port Selection - Only for admin and HOD */}
          {userRole !== 'port' && (
            <div>
              <label htmlFor="portSelect" className="block text-sm font-medium text-gray-700 mb-1">
                Select Port
              </label>
              <select
                id="portSelect"
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
          )}
          
          {/* Date Filter Type Selection */}
          <div>
            <label htmlFor="dateFilterType" className="block text-sm font-medium text-gray-700 mb-1">
              Filter By Date Type
            </label>
            <select
              id="dateFilterType"
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value as 'arrivalDate' | 'addedDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
            >
              <option value="addedDate">Vessel Added Date</option>
              <option value="arrivalDate">Vessel Arrival Date</option>
            </select>
          </div>
          
          {/* Date Range Filters */}
          <div className={userRole !== 'port' ? 'md:col-span-2' : 'md:col-span-2'}>
            <DateRangePicker
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              fromLabel={`From ${dateFilterType === 'addedDate' ? 'Added' : 'Arrival'} Date`}
              toLabel={`To ${dateFilterType === 'addedDate' ? 'Added' : 'Arrival'} Date`}
            />
          </div>
        </div>
        
        <div className="mt-6">
          <SearchFilter
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            searchPlaceholder="Search vessels or ports..."
            showExport={false}
          />
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <div className="bg-seagreen-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-seagreen-600 mr-2" />
              <h3 className="text-sm font-medium text-seagreen-800">Total Revenue</h3>
            </div>
            <p className="text-2xl font-bold text-seagreen-900">
              {formatCurrency(totalRevenue)}
            </p>
            <p className="text-xs text-seagreen-600 mt-1">
              Based on {filteredVessels.length} vessels
              {fromDate && toDate && (
                <> • Filtered by {dateFilterType === 'addedDate' ? 'vessel added date' : 'vessel arrival date'}</>
              )}
            </p>
          </div>
          
          {/* Last Month Revenue */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <Calendar className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="text-sm font-medium text-green-800">Last Month Revenue</h3>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {formatCurrency(lastMonthRevenue)}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          {/* Last Year Revenue */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
              <h3 className="text-sm font-medium text-purple-800">Last Year Revenue</h3>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {formatCurrency(lastYearRevenue)}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              {new Date().getFullYear() - 1}
            </p>
          </div>
        </div>
      </Card>

      {/* Revenue Table */}
      <Card
        title="Revenue Data"
        icon={<DollarSign className="h-6 w-6 text-seagreen-600" />}
      >
        <DataTable
          columns={columns}
          data={filteredVessels}
          loading={loading}
          error={error}
          emptyMessage="No revenue data found. Try adjusting your filters or add vessels with revenue information."
          emptyIcon={<Ship className="h-12 w-12 mx-auto mb-3 text-gray-400" />}
          enablePagination={true}
          itemsPerPage={10}
        />
      </Card>
    </DashboardLayout>
  );
};

export default Revenue;