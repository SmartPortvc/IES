import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Eye, Ship, FileText } from 'lucide-react';
import { Port } from '../../types';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorDisplay from '../ui/ErrorDisplay';
import Button from '../ui/Button';
import DataTable from '../ui/DataTable';
import StatusBadge from '../ui/StatusBadge';

interface PortListProps {
  ports: Port[];
  loading: boolean;
  error: string | null;
}

const PortList: React.FC<PortListProps> = ({ ports, loading, error }) => {
  const navigate = useNavigate();

  const handleViewDetails = (portId: string) => {
    navigate(`/port-details/${portId}`);
  };

  const handleViewVessels = (portId: string) => {
    navigate(`/vessel-list/${portId}`);
  };

  if (loading) {
    return <LoadingSpinner message="Loading ports..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (ports.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-6 rounded text-center">
        <Anchor className="h-12 w-12 mx-auto mb-3 text-yellow-600" />
        <h3 className="text-lg font-medium">No ports available</h3>
        <p className="mt-2">No ports have been invited or registered yet.</p>
      </div>
    );
  }

  const columns = [
    {
      key: 'portName',
      header: 'Port Name',
      render: (value: string, port: Port) => (
        <div className="flex items-center">
          <Anchor className="h-5 w-5 text-seagreen-500 mr-2" />
          <div className="text-sm font-medium text-gray-900">{value}</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <StatusBadge status={value || 'invited'} label={value === 'registered' ? 'Registered' : 'Invited'} />
      )
    },
    {
      key: 'email',
      header: 'Email'
    },
    {
      key: 'registeredAddress',
      header: 'Address',
      render: (value: string) => value || 'Not provided'
    },
    {
      key: 'taxInfo',
      header: 'Tax Info',
      render: (_: any, port: Port) => (
        port.gst && port.pan ? (
          <div>
            <div>GST: {port.gst}</div>
            <div>PAN: {port.pan}</div>
          </div>
        ) : (
          'Not provided'
        )
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, port: Port) => (
        <div className="flex space-x-2">
          {port.status === 'registered' ? (
            <>
              <Button 
                variant="outline" 
                size="small" 
                onClick={() => handleViewDetails(port.id!)}
                icon={<Eye className="h-4 w-4" />}
              >
                View Details
              </Button>
              <Button 
                variant="outline" 
                size="small" 
                onClick={() => handleViewVessels(port.id!)}
                icon={<Ship className="h-4 w-4" />}
                className="ml-2"
              >
                View Vessels
              </Button>
            </>
          ) : (
            <span className="text-gray-400">Pending Registration</span>
          )}
        </div>
      )
    }
  ];

  return (
    <Card title="Port Details" icon={<FileText className="h-6 w-6 text-seagreen-600" />}>
      <DataTable 
        columns={columns} 
        data={ports} 
        emptyMessage="No ports have been invited or registered yet."
        emptyIcon={<Anchor className="h-12 w-12 mx-auto mb-3 text-yellow-600" />}
      />
    </Card>
  );
};

export default PortList;