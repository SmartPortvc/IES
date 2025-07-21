import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  Ship, 
  Package, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { fetchPorts, fetchVessels } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import DateRangePicker from '../components/ui/DateRangePicker';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vessels, setVessels] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedPort, setSelectedPort] = useState('all');
  const [ports, setPorts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all ports
        const portsData = await fetchPorts();
        setPorts(portsData);

        // Fetch vessels for all ports
        const allVessels: any[] = [];
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
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPort]);

  const filteredVessels = useMemo(() => {
    return vessels.filter(vessel => {
      // Filter by port
      if (selectedPort !== 'all') {
        if (vessel.portId !== selectedPort) return false;
      }

      // Filter by date range
      if (fromDate && vessel.arrivalDateTime) {
        const vesselDate = new Date(vessel.arrivalDateTime.seconds * 1000);
        const fromDateObj = new Date(fromDate);
        if (vesselDate < fromDateObj) return false;
      }

      if (toDate && vessel.arrivalDateTime) {
        const vesselDate = new Date(vessel.arrivalDateTime.seconds * 1000);
        const toDateObj = new Date(toDate);
        toDateObj.setHours(23, 59, 59, 999);
        if (vesselDate > toDateObj) return false;
      }

      return true;
    });
  }, [vessels, selectedPort, fromDate, toDate]);

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

  // Calculate revenue by month
  const revenueByMonth = useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
    
    filteredVessels.forEach(vessel => {
      if (!vessel.arrivalDateTime || !vessel.totalRevenue) return;
      
      const date = new Date(vessel.arrivalDateTime.seconds * 1000);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      // Convert revenue to number
      const revenueStr = String(vessel.totalRevenue);
      const cleanedValue = revenueStr.replace(/[^0-9.-]/g, '');
      const revenue = parseFloat(cleanedValue) || 0;
      
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + revenue;
    });
    
    return monthlyData;
  }, [filteredVessels]);

  // Calculate revenue by port
  const revenueByPort = useMemo(() => {
    const portData: { [key: string]: number } = {};
    
    filteredVessels.forEach(vessel => {
      if (!vessel.portName || !vessel.totalRevenue) return;
      
      // Convert revenue to number
      const revenueStr = String(vessel.totalRevenue);
      const cleanedValue = revenueStr.replace(/[^0-9.-]/g, '');
      const revenue = parseFloat(cleanedValue) || 0;
      
      portData[vessel.portName] = (portData[vessel.portName] || 0) + revenue;
    });
    
    return portData;
  }, [filteredVessels]);

  // Chart configurations
  const revenueChartData = {
    labels: Object.keys(revenueByMonth),
    datasets: [
      {
        label: 'Monthly Revenue',
        data: Object.values(revenueByMonth),
        borderColor: 'rgb(32, 178, 170)',
        backgroundColor: 'rgba(32, 178, 170, 0.5)',
        tension: 0.4
      }
    ]
  };

  const portRevenueChartData = {
    labels: Object.keys(revenueByPort),
    datasets: [
      {
        label: 'Revenue by Port',
        data: Object.values(revenueByPort),
        backgroundColor: 'rgba(32, 178, 170, 0.8)'
      }
    ]
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <LoadingSpinner message="Loading dashboard data..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <ErrorDisplay message={error} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Revenue Dashboard"
      subtitle="Track and analyze revenue across all vessels"
      icon={<BarChart className="h-6 w-6 text-seagreen-600" />}
    >
      {/* Filters */}
      <Card 
        title="Revenue Filters" 
        icon={<Filter className="h-6 w-6 text-seagreen-600" />}
        className="mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Port
            </label>
            <select
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
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
            />
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-seagreen-500 to-seagreen-600">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-white" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-white">Total Revenue</h3>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600">
          <div className="flex items-center">
            <Ship className="h-8 w-8 text-white" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-white">Total Vessels</h3>
              <p className="text-2xl font-bold text-white">
                {filteredVessels.length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-white" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-white">Avg Revenue/Vessel</h3>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(totalRevenue / (filteredVessels.length || 1))}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card 
          title="Revenue Trend" 
          icon={<LineChart className="h-6 w-6 text-seagreen-600" />}
        >
          <div className="h-80">
            <Line 
              data={revenueChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: false
                  }
                }
              }}
            />
          </div>
        </Card>

        <Card 
          title="Revenue by Port" 
          icon={<BarChart className="h-6 w-6 text-seagreen-600" />}
        >
          <div className="h-80">
            <Bar 
              data={portRevenueChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;