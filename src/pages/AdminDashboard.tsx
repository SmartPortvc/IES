import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import PortInviteForm from '../components/port/PortInviteForm';
import PortList from '../components/port/PortList';
import HodInviteForm from '../components/hod/HodInviteForm';
import HodList from '../components/hod/HodList';
import { fetchPorts, fetchHods } from '../services/api';
import { Port, HOD } from '../types';

const AdminDashboard: React.FC = () => {
  // Set initial active item based on user role
  const { userRole } = useAuth();
  const isHod = userRole === 'hod';
  const initialActiveItem = isHod ? 'details' : 'invite';
  
  const [activeItem, setActiveItem] = useState(initialActiveItem);
  
  // State for data
  const [ports, setPorts] = useState<Port[]>([]);
  const [hods, setHods] = useState<HOD[]>([]);
  const [loadingPorts, setLoadingPorts] = useState(true);
  const [loadingHods, setLoadingHods] = useState(true);
  const [portsError, setPortsError] = useState<string | null>(null);
  const [hodsError, setHodsError] = useState<string | null>(null);

  // Fetch ports and HODs data
  useEffect(() => {
    const loadData = async () => {
      // Fetch ports
      try {
        setLoadingPorts(true);
        const portsData = await fetchPorts();
        setPorts(portsData);
      } catch (error) {
        console.error('Error fetching ports:', error);
        setPortsError('Failed to load port details');
      } finally {
        setLoadingPorts(false);
      }
      
      // Fetch HODs
      try {
        setLoadingHods(true);
        const hodsData = await fetchHods();
        setHods(hodsData);
      } catch (error) {
        console.error('Error fetching HODs:', error);
        setHodsError('Failed to load HOD details');
      } finally {
        setLoadingHods(false);
      }
    };
    
    loadData();
  }, []);

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle={isHod ? "View port details and information (read-only access)" : "Manage ports and view their details"}
      activeItem={activeItem}
      setActiveItem={setActiveItem}
    >
      {isHod && (
        <div className="mb-6 bg-seagreen-50 border border-seagreen-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-6 w-6 text-seagreen-600 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-seagreen-800">HOD View-Only Access</h3>
              <p className="mt-1 text-sm text-seagreen-700">
                You are logged in as a Head of Department with view-only access.
                You can view port details and HOD information but cannot make any changes.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {activeItem === 'invite' && !isHod && <PortInviteForm />}
      {activeItem === 'details' && <PortList ports={ports} loading={loadingPorts} error={portsError} />}
      {activeItem === 'inviteHod' && !isHod && <HodInviteForm />}
      {activeItem === 'hodList' && <HodList hods={hods} loading={loadingHods} error={hodsError} />}
    </DashboardLayout>
  );
};

export default AdminDashboard;