import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Port } from '../types';
import { 
  Ship, 
  FileText, 
  FileCheck, 
  Anchor, 
  Building, 
  Briefcase, 
  FileDigit, 
  Warehouse, 
  Ruler, 
  Calendar, 
  Clock,
  ArrowLeft
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import Card from '../components/ui/Card';
import DocumentUpload from '../components/port/DocumentUpload';

const PortDetailsView: React.FC = () => {
  const { portId } = useParams<{ portId: string }>();
  const navigate = useNavigate();
  
  const [vessel, setVessel] = useState<Port | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portName, setPortName] = useState<string | null>(null);

  useEffect(() => {
    const loadPortDetails = async () => {
      if (!portId) {
        setError('Port ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const portDoc = await getDoc(doc(db, 'ports', portId));
        
        if (!portDoc.exists()) {
          setError('Port not found');
          setLoading(false);
          return;
        }
        
        const portData = {
          id: portDoc.id,
          ...portDoc.data()
        } as Port;
        
        setVessel(portData);
        setPortName(portData.portName);
      } catch (err) {
        console.error('Error fetching port details:', err);
        setError('Failed to load port details');
      } finally {
        setLoading(false);
      }
    };

    loadPortDetails();
  }, [portId]);

  const getBackLink = () => {
    return '/admin';
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading port details..." />;
  }

  if (error || !vessel) {
    return (
      <ErrorDisplay 
        message={error || 'Failed to load port details'} 
        redirectLink={getBackLink()}
        redirectText="Back to Dashboard" 
        fullPage
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <button
                    onClick={() => navigate(getBackLink())}
                    className="mr-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                  <div>
                    <div className="flex items-center">
                      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl truncate">
                        {vessel.portName}
                      </h1>
                      <div className="ml-4">
                        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                          vessel.status === 'registered'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {vessel.status === 'registered' ? 'Registered' : 'Invited'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <Ship className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      <span>{vessel.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-8">
          {/* Key Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Ship className="h-8 w-8 text-seagreen-600" />
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Port Details</h2>
              </div>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-lg text-gray-900">{vessel.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      vessel.status === 'registered'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {vessel.status === 'registered' ? 'Registered' : 'Invited'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-seagreen-600" />
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Address Information</h2>
              </div>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Registered Address</dt>
                  <dd className="mt-1 text-lg text-gray-900">{vessel.registeredAddress || 'Not provided'}</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-seagreen-600" />
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Tax Information</h2>
              </div>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">GST Number</dt>
                  <dd className="mt-1 text-lg text-gray-900">{vessel.gst || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">PAN Number</dt>
                  <dd className="mt-1 text-lg text-gray-900">{vessel.pan || 'Not provided'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Building className="h-8 w-8 text-seagreen-600" />
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Port Information</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 flex items-center">
                    <Warehouse className="h-4 w-4 text-gray-400 mr-2" />
                    Land allocated (acres)
                  </h3>
                  <p className="mt-1 text-gray-800">{vessel.landAllotted || 'Not provided'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 flex items-center">
                    <Warehouse className="h-4 w-4 text-gray-400 mr-2" />
                    Land utilised (acres)
                  </h3>
                  <p className="mt-1 text-gray-800">{vessel.landUtilised || 'Not provided'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 flex items-center">
                    <Ruler className="h-4 w-4 text-gray-400 mr-2" />
                    No of berths
                  </h3>
                  <p className="mt-1 text-gray-800">{vessel.unitizedBerths || 'Not provided'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Clock className="h-8 w-8 text-seagreen-600" />
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Timeline</h2>
              </div>
              
              <div className="space-y-6">
                <div className="relative pl-8 pb-4 border-l-2 border-seagreen-200">
                  <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-seagreen-500"></div>
                  <h3 className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    Created
                  </h3>
                  <p className="mt-1 text-gray-800">{formatDate(vessel.createdAt)}</p>
                </div>
                
                {vessel.invitationSentAt && (
                  <div className="relative pl-8 pb-4 border-l-2 border-seagreen-200">
                    <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-seagreen-500"></div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      Invitation Sent
                    </h3>
                    <p className="mt-1 text-gray-800">{formatDate(vessel.invitationSentAt)}</p>
                  </div>
                )}
                
                {vessel.registeredAt && (
                  <div className="relative pl-8">
                    <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-green-500"></div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      Registered
                    </h3>
                    <p className="mt-1 text-gray-800">{formatDate(vessel.registeredAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="mt-8">
            <Card 
              title="Port Documents" 
              icon={<FileText className="h-6 w-6 text-seagreen-600" />}
            >
              <DocumentUpload
                documents={vessel.documents || []}
                onUpload={() => {}}
                readOnly
              />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PortDetailsView;