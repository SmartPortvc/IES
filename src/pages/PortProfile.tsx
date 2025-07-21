import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Ship, FileText, FileCheck, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Port } from '../types';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import { formatDate } from '../utils/formatters';
import DocumentUpload from '../components/port/DocumentUpload';
import { uploadPortDocument, deletePortDocument } from '../services/api';
import { toast } from 'react-toastify';

const PortProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [portData, setPortData] = useState<Port | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPortData = async () => {
      if (!currentUser) return;

      try {
        // First get the user document to find the portId
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists() && userDoc.data().portId) {
          const portId = userDoc.data().portId;
          
          // Then get the port document
          const portDoc = await getDoc(doc(db, 'ports', portId));
          
          if (portDoc.exists()) {
            const port = {
              id: portDoc.id,
              ...portDoc.data()
            } as Port;
            setPortData(port);
          } else {
            setError('Port data not found');
          }
        } else {
          setError('User is not associated with any port');
        }
      } catch (err) {
        console.error('Error fetching port data:', err);
        setError('Failed to load port information');
      } finally {
        setLoading(false);
      }
    };

    fetchPortData();
  }, [currentUser]);

  const handleDocumentUpload = async (file: File, message: string) => {
    if (!portData?.id) return;
    
    try {
      await uploadPortDocument(portData.id, file, message);
      
      // Refresh port data to get updated documents list
      const portDoc = await getDoc(doc(db, 'ports', portData.id));
      if (portDoc.exists()) {
        setPortData({
          id: portDoc.id,
          ...portDoc.data()
        } as Port);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    if (!portData?.id) return;
    
    const document = portData.documents?.find(doc => doc.id === documentId);
    if (!document) return;
    
    try {
      await deletePortDocument(portData.id, document);
      
      // Refresh port data to get updated documents list
      const portDoc = await getDoc(doc(db, 'ports', portData.id));
      if (portDoc.exists()) {
        setPortData({
          id: portDoc.id,
          ...portDoc.data()
        } as Port);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Port Profile">
        <LoadingSpinner message="Loading port profile..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Port Profile">
        <ErrorDisplay message={error} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Port Profile"
      backLink="/port-dashboard"
      backLinkText="Back to Dashboard"
    >
      <div className="space-y-6">
        {/* Port Overview */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-seagreen-600 to-seagreen-800 p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-full">
                <Ship className="h-10 w-10 text-seagreen-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{portData?.portName}</h2>
                <p className="text-seagreen-100">{portData?.email}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Ship className="h-5 w-5 text-seagreen-600 mr-2" />
                  Registered Address
                </h3>
                <p className="text-gray-700">{portData?.registeredAddress || 'Not provided'}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FileText className="h-5 w-5 text-seagreen-600 mr-2" />
                  Tax Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">GST Number</p>
                    <p className="text-gray-700 font-medium">{portData?.gst || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">PAN Number</p>
                    <p className="text-gray-700 font-medium">{portData?.pan || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Ship className="h-5 w-5 text-seagreen-600 mr-2" />
                  Port Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Land allocated (acres)</p>
                    <p className="text-gray-700 font-medium">{portData?.landAllotted || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Land utilised (acres)</p>
                    <p className="text-gray-700 font-medium">{portData?.landUtilised || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">No of berths</p>
                    <p className="text-gray-700 font-medium">{portData?.unitizedBerths || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FileCheck className="h-5 w-5 text-seagreen-600 mr-2" />
                  Registration Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Registration Date</p>
                    <p className="text-gray-700 font-medium">{formatDate(portData?.registeredAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <Card 
          title="Port Documents" 
          icon={<FileText className="h-6 w-6 text-seagreen-600" />}
        >
          <DocumentUpload
            onUpload={handleDocumentUpload}
            onDelete={handleDocumentDelete}
            documents={portData?.documents || []}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PortProfile;