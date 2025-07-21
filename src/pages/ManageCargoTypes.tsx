import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Package, ArrowLeft, PlusCircle, Edit, Trash2, AlertCircle, Check, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { CargoType } from '../types';
import DashboardLayout from '../components/layout/DashboardLayout';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorDisplay from '../components/ui/ErrorDisplay';

const ManageCargoTypes: React.FC = () => {
  const navigate = useNavigate();
  
  // State for cargo types list
  const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for adding new cargo type
  const [newCargoName, setNewCargoName] = useState('');
  const [newCargoDescription, setNewCargoDescription] = useState('');
  const [addingCargo, setAddingCargo] = useState(false);
  
  // State for editing cargo type
  const [editingCargoId, setEditingCargoId] = useState<string | null>(null);
  const [editCargoName, setEditCargoName] = useState('');
  const [editCargoDescription, setEditCargoDescription] = useState('');

  // Fetch cargo types on component mount
  useEffect(() => {
    fetchCargoTypes();
  }, []);

  const fetchCargoTypes = async () => {
    try {
      setLoading(true);
      const cargoTypesSnapshot = await getDocs(collection(db, 'cargoTypes'));
      const cargoTypesList = cargoTypesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CargoType[];
      
      setCargoTypes(cargoTypesList);
    } catch (err) {
      console.error('Error fetching cargo types:', err);
      setError('Failed to load cargo types');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCargoType = async () => {
    if (!newCargoName.trim()) {
      toast.error('Cargo type name is required');
      return;
    }
    
    try {
      setAddingCargo(true);
      
      await addDoc(collection(db, 'cargoTypes'), {
        name: newCargoName.trim(),
        description: newCargoDescription.trim(),
        createdAt: serverTimestamp()
      });
      
      toast.success('Cargo type added successfully');
      setNewCargoName('');
      setNewCargoDescription('');
      fetchCargoTypes();
    } catch (err) {
      console.error('Error adding cargo type:', err);
      toast.error('Failed to add cargo type');
    } finally {
      setAddingCargo(false);
    }
  };

  const startEditingCargo = (cargoType: CargoType) => {
    setEditingCargoId(cargoType.id);
    setEditCargoName(cargoType.name);
    setEditCargoDescription(cargoType.description || '');
  };

  const cancelEditingCargo = () => {
    setEditingCargoId(null);
    setEditCargoName('');
    setEditCargoDescription('');
  };

  const handleUpdateCargoType = async (id: string) => {
    if (!editCargoName.trim()) {
      toast.error('Cargo type name is required');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'cargoTypes', id), {
        name: editCargoName.trim(),
        description: editCargoDescription.trim(),
        updatedAt: serverTimestamp()
      });
      
      toast.success('Cargo type updated successfully');
      setEditingCargoId(null);
      fetchCargoTypes();
    } catch (err) {
      console.error('Error updating cargo type:', err);
      toast.error('Failed to update cargo type');
    }
  };

  const handleDeleteCargoType = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this cargo type?')) {
      try {
        await deleteDoc(doc(db, 'cargoTypes', id));
        toast.success('Cargo type deleted successfully');
        fetchCargoTypes();
      } catch (err) {
        console.error('Error deleting cargo type:', err);
        toast.error('Failed to delete cargo type');
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Manage Cargo Types">
        <LoadingSpinner message="Loading cargo types..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Manage Cargo Types">
        <ErrorDisplay message={error} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Manage Cargo Types"
      subtitle="Add and manage cargo types that will be available for ports to select when adding vessels"
      backLink="/admin"
      backLinkText="Back to Dashboard"
      icon={<Package className="h-6 w-6 text-seagreen-600" />}
    >
      {/* Add New Cargo Type */}
      <Card 
        title="Add New Cargo Type" 
        icon={<Package className="h-6 w-6 text-seagreen-600" />}
        className="mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label htmlFor="cargoName" className="block text-sm font-medium text-gray-700 mb-1">
              Cargo Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="cargoName"
              value={newCargoName}
              onChange={(e) => setNewCargoName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              placeholder="e.g., Containers, Bulk Cargo"
              required
            />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="cargoDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              id="cargoDescription"
              value={newCargoDescription}
              onChange={(e) => setNewCargoDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
              placeholder="Optional description"
            />
          </div>

          <div className="md:col-span-1 flex items-end">
            <Button
              type="button"
              onClick={handleAddCargoType}
              disabled={addingCargo || !newCargoName.trim()}
              loading={addingCargo}
              icon={<PlusCircle className="h-4 w-4" />}
              fullWidth
            >
              Add Cargo Type
            </Button>
          </div>
        </div>
      </Card>

      {/* Cargo Types List */}
      <Card 
        title="Cargo Types List" 
        icon={<Package className="h-6 w-6 text-seagreen-600" />}
      >
        {cargoTypes.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No cargo types added yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding your first cargo type</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo Type Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cargoTypes.map((cargoType) => (
                  <tr key={cargoType.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCargoId === cargoType.id ? (
                        <input
                          type="text"
                          value={editCargoName}
                          onChange={(e) => setEditCargoName(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{cargoType.name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCargoId === cargoType.id ? (
                        <input
                          type="text"
                          value={editCargoDescription}
                          onChange={(e) => setEditCargoDescription(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">{cargoType.description || '-'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingCargoId === cargoType.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateCargoType(cargoType.id!)}
                            className="text-green-600 hover:text-green-900"
                            title="Save changes"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={cancelEditingCargo}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => startEditingCargo(cargoType)}
                            className="text-seagreen-600 hover:text-seagreen-900"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCargoType(cargoType.id!)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default ManageCargoTypes;