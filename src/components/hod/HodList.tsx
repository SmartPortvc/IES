import React from 'react';
import { HOD } from '../../types';
import { UserCheck, Users, Clock } from 'lucide-react';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorDisplay from '../ui/ErrorDisplay';
import DataTable from '../ui/DataTable';
import StatusBadge from '../ui/StatusBadge';
import { formatDate } from '../../utils/formatters';

interface HodListProps {
  hods: HOD[];
  loading: boolean;
  error: string | null;
}

const HodList: React.FC<HodListProps> = ({ hods, loading, error }) => {
  if (loading) {
    return <LoadingSpinner message="Loading HODs..." />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (hods.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-6 rounded text-center">
        <Users className="h-12 w-12 mx-auto mb-3 text-yellow-600" />
        <h3 className="text-lg font-medium">No HODs available</h3>
        <p className="mt-2">No HODs have been invited or registered yet.</p>
      </div>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (value: string, hod: HOD) => (
        <div className="flex items-center">
          <UserCheck className="h-5 w-5 text-seagreen-500 mr-2" />
          <div className="text-sm font-medium text-gray-900">{value || 'Not registered yet'}</div>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email'
    },
    {
      key: 'department',
      header: 'Department',
      render: (value: string) => value || 'Not provided'
    },
    {
      key: 'designation',
      header: 'Designation',
      render: (value: string) => value || 'Not provided'
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string) => (
        <StatusBadge status={value || 'invited'} label={value === 'registered' ? 'Registered' : 'Invited'} />
      )
    },
    {
      key: 'createdAt',
      header: 'Invited On',
      render: (value: any) => (
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-gray-400 mr-1" />
          {formatDate(value)}
        </div>
      )
    }
  ];

  return (
    <Card title="HOD List" icon={<Users className="h-6 w-6 text-seagreen-600" />}>
      <DataTable 
        columns={columns} 
        data={hods} 
        emptyMessage="No HODs have been invited or registered yet."
        emptyIcon={<Users className="h-12 w-12 mx-auto mb-3 text-yellow-600" />}
      />
    </Card>
  );
};

export default HodList;