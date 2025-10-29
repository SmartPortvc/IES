import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Port } from '../types';
import { FileText, Anchor, MapPin, FileCheck, Layers, Eye, Ship } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PortDetailsList: React.FC = () => {
  const [ports, setPorts] = useState<Port[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPorts = async () => {
      try {
        const portsCollection = collection(db, 'ports');
        const portSnapshot = await getDocs(portsCollection);
        const portList = portSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Port[];
        
        setPorts(portList);
      } catch (err) {
        console.error('Error fetching ports:', err);
        setError('Failed to load port details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPorts();
  }, []);

  const handleViewDetails = (portId: string) => {
    navigate(`/port-details/${portId}`);
  };

  const handleViewVessels = (portId: string) => {
    navigate(`/vessel-list/${portId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-seagreen-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
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

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="flex items-center space-x-2 p-6 border-b">
        <FileText className="h-6 w-6 text-seagreen-600" />
        <h2 className="text-xl font-semibold text-gray-800">Port Details</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Port Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tax Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ports.map((port) => (
              <tr key={port.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Anchor className="h-5 w-5 text-seagreen-500 mr-2" />
                    <div className="text-sm font-medium text-gray-900">{port.portName}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    port.status === 'registered' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {port.status === 'registered' ? 'Registered' : 'Invited'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {port.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {port.registeredAddress || 'Not provided'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {port.gst && port.pan ? (
                    <div>
                      <div>GST: {port.gst}</div>
                      <div>PAN: {port.pan}</div>
                    </div>
                  ) : (
                    'Not provided'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    {port.status === 'registered' && (
                      <>
                        <button 
                          onClick={() => handleViewDetails(port.id!)}
                          className="flex items-center text-seagreen-600 hover:text-seagreen-800 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>
                        <button 
                          onClick={() => handleViewVessels(port.id!)}
                          className="flex items-center text-green-600 hover:text-green-800 transition-colors ml-3"
                        >
                          <Ship className="h-4 w-4 mr-1" />
                          View Vessels
                        </button>
                      </>
                    )}
                    {port.status !== 'registered' && (
                      <span className="text-gray-400">Pending Registration</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PortDetailsList;