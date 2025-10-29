import React, { useEffect, useState } from 'react';
import { fetchHods } from '../services/api';
import { HOD } from '../types';
import { UserCheck, Users, Clock } from 'lucide-react';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorDisplay from './ui/ErrorDisplay';
import Card from './ui/Card';

const HodList: React.FC = () => {
  const [hods, setHods] = useState<HOD[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHodData = async () => {
      try {
        setLoading(true);
        const hodsData = await fetchHods();
        setHods(hodsData);
      } catch (err) {
        console.error('Error fetching HODs:', err);
        setError('Failed to load HOD details');
      } finally {
        setLoading(false);
      }
    };

    fetchHodData();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

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

  return (
    <Card title="HOD List" icon={<Users className="h-6 w-6 text-seagreen-600" />}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Designation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invited On
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hods.map((hod) => (
              <tr key={hod.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <UserCheck className="h-5 w-5 text-seagreen-500 mr-2" />
                    <div className="text-sm font-medium text-gray-900">{hod.name || 'Not registered yet'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {hod.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {hod.department || 'Not provided'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {hod.designation || 'Not provided'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    hod.status === 'registered' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {hod.status === 'registered' ? 'Registered' : 'Invited'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    {formatDate(hod.createdAt)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default HodList;