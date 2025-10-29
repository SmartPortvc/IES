import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Ship, 
  Calendar, 
  Clock, 
  Package, 
  Navigation, 
  Anchor, 
  FileText, 
  Clipboard, 
  DollarSign,
  Ruler,
  Building,
  MapPin,
  ArrowLeft
} from 'lucide-react';
import { fetchVesselById, fetchPortById } from '../services/api';
import { Vessel, Port } from '../types';
import { formatDateTime, formatCurrency } from '../utils/formatters';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import StatusBadge from '../components/ui/StatusBadge';

const VesselDetails: React.FC = () => {
  const { vesselId } = useParams<{ vesselId: string }>();
  const navigate = useNavigate();
  
  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [portData, setPortData] = useState<Port | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVesselDetails = async () => {
      if (!vesselId) {
        setError('Vessel ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const vesselData = await fetchVesselById(vesselId);
        
        if (!vesselData) {
          setError('Vessel not found');
          setLoading(false);
          return;
        }
        
        setVessel(vesselData);

        if (vesselData.portId) {
          const port = await fetchPortById(vesselData.portId);
          setPortData(port);
        }
      } catch (err) {
        console.error('Error fetching vessel details:', err);
        setError('Failed to load vessel details');
      } finally {
        setLoading(false);
      }
    };

    loadVesselDetails();
  }, [vesselId]);

  const getBackLink = () => {
    if (portData?.id) {
      return `/vessel-list/${portData.id}`;
    }
    return '/port-dashboard';
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading vessel details..." />;
  }

  if (error || !vessel) {
    return (
      <ErrorDisplay 
        message={error || 'Failed to load vessel details'} 
        redirectLink={getBackLink()}
        redirectText="Back to Vessel List" 
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
                        {vessel.vesselName}
                      </h1>
                      <div className="ml-4 flex space-x-2">
                        <StatusBadge status={vessel.operationType} label={vessel.operationType} />
                        <StatusBadge status={vessel.voyageType} label={vessel.voyageType} />
                      </div>
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <Ship className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                      <span>IMO: {vessel.imo}</span>
                      <span className="mx-2">•</span>
                      <span>Port: {portData?.portName || 'Unknown Port'}</span>
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
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Vessel Details</h2>
              </div>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">GRT</dt>
                  <dd className="mt-1 text-lg text-gray-900">{vessel.grt}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Length (LOA)</dt>
                  <dd className="mt-1 text-lg text-gray-900">{vessel.loa} meters</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">DWT</dt>
                  <dd className="mt-1 text-lg text-gray-900">{vessel.dwt} MT</dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-seagreen-600" />
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Cargo Information</h2>
              </div>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-lg text-gray-900">{vessel.cargo.type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Volume</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {vessel.cargo.volume} {vessel.cargo.units}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Revenue</dt>
                  <dd className="mt-1 text-lg text-gray-900 font-semibold text-seagreen-600">
                    {formatCurrency(vessel.totalRevenue || '0')}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-seagreen-600" />
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Timeline</h2>
              </div>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Arrival</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {formatDateTime(vessel.arrivalDateTime)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Berthing</dt>
                  <dd className="mt-1 text-lg text-gray-900">
                    {formatDateTime(vessel.berthingDateTime)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge 
                      status={vessel.sailedOutDate ? 'Sailed' : 'Berthed'} 
                      label={vessel.sailedOutDate ? 'Sailed' : 'Berthed'} 
                    />
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Building className="h-8 w-8 text-seagreen-600" />
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Vessel Information</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Owner/Operator</h3>
                  <p className="mt-2 text-gray-900">{vessel.vesselOwner || 'Not provided'}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Vessel Agent</h3>
                  <p className="mt-2 text-gray-900">{vessel.vesselAgent || 'Not provided'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Beam</h3>
                    <p className="mt-2 text-gray-900">{vessel.beam || 'N/A'} meters</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Draft Available</h3>
                    <p className="mt-2 text-gray-900">{vessel.draftAvailable} meters</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Navigation className="h-8 w-8 text-seagreen-600" />
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Navigation Details</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Arrival From</h3>
                  <p className="mt-2 text-gray-900">{vessel.arrivalFrom}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Location</h3>
                  <p className="mt-2 text-gray-900">{vessel.location}</p>
                </div>
                
                {vessel.nextPortOfCall && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Next Port of Call</h3>
                    <p className="mt-2 text-gray-900">{vessel.nextPortOfCall}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Ruler className="h-8 w-8 text-seagreen-600" />
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Draft Information</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Arrival Draft</h3>
                  <div className="space-y-4">
                    <div>
                      <dt className="text-xs text-gray-500">Forward</dt>
                      <dd className="mt-1 text-gray-900">{vessel.arrivalDraft?.forward || 'N/A'} meters</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Aft</dt>
                      <dd className="mt-1 text-gray-900">{vessel.arrivalDraft?.aft || 'N/A'} meters</dd>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Departure Draft</h3>
                  <div className="space-y-4">
                    <div>
                      <dt className="text-xs text-gray-500">Forward</dt>
                      <dd className="mt-1 text-gray-900">{vessel.departureDraft?.forward || 'N/A'} meters</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-gray-500">Aft</dt>
                      <dd className="mt-1 text-gray-900">{vessel.departureDraft?.aft || 'N/A'} meters</dd>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <Package className="h-8 w-8 text-seagreen-600" />
                <h2 className="ml-3 text-lg font-semibold text-gray-900">Cargo Details</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cargo Name</h3>
                  <p className="mt-2 text-gray-900">{vessel.cargo.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
                  <p className="mt-2 text-gray-900">{vessel.cargoQuantity}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Operation</h3>
                  <p className="mt-2">
                    <StatusBadge status={vessel.operation} label={vessel.operation} />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VesselDetails;