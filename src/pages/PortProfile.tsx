import React, { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Ship, FileText, FileCheck, MapPin, CreditCard, Anchor, Building2, Calendar, CheckCircle2, Mail, Briefcase } from 'lucide-react';
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
      <div className="space-y-8">
        {/* Hero Section - Port Overview */}
        <div className="bg-gradient-to-br from-seagreen-600 via-seagreen-700 to-seagreen-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="relative">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.1))]"></div>

            <div className="relative px-8 py-10 md:px-12 md:py-14">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
                    <div className="relative bg-white p-4 rounded-2xl shadow-lg">
                      <Ship className="h-12 w-12 text-seagreen-600" />
                    </div>
                  </div>

                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                      {portData?.portName}
                    </h1>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-seagreen-50">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm font-medium">{portData?.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-green-300" />
                          <span className="text-sm font-medium text-white">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                  <div className="flex items-center gap-2 text-seagreen-50">
                    <Calendar className="h-4 w-4" />
                    <div>
                      <p className="text-xs font-medium opacity-80">Registered</p>
                      <p className="text-sm font-semibold">{formatDate(portData?.registeredAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Anchor className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Berths</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {portData?.unitizedBerths || '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                <Building2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Land Allotted</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {portData?.landAllotted ? `${portData.landAllotted} ac` : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Land Utilized</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {portData?.landUtilised ? `${portData.landUtilised} ac` : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Documents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {portData?.documents?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact & Location */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-seagreen-50 to-seagreen-100 px-6 py-4 border-b border-seagreen-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-seagreen-600 rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Contact & Location</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Registered Address
                  </p>
                  <p className="text-gray-900 leading-relaxed">
                    {portData?.registeredAddress || 'Not provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Email Address
                  </p>
                  <p className="text-gray-900">{portData?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Tax Information</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      GST Number
                    </p>
                    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                      <p className="text-gray-900 font-mono text-sm">
                        {portData?.gst || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      PAN Number
                    </p>
                    <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                      <p className="text-gray-900 font-mono text-sm">
                        {portData?.pan || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Port Facilities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <Anchor className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Port Facilities</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Land Allocated
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {portData?.landAllotted ? `${portData.landAllotted}` : '—'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">acres</p>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Land Utilized
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {portData?.landUtilised ? `${portData.landUtilised}` : '—'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">acres</p>
                </div>

                <div className="sm:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Number of Berths
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {portData?.unitizedBerths || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-6 py-4 border-b border-purple-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <FileCheck className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Registration Details</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Registration Date
                  </p>
                  <p className="text-gray-900 font-medium">
                    {formatDate(portData?.registeredAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Account Status
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-semibold text-green-700">Active & Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 border-b border-amber-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-600 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Port Documents</h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Manage and view all port-related documents
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <DocumentUpload
              onUpload={handleDocumentUpload}
              onDelete={handleDocumentDelete}
              documents={portData?.documents || []}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PortProfile;