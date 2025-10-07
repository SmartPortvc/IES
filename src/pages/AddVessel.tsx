import React from 'react';
import { Ship } from 'lucide-react';
import VesselForm from '../components/vessel/VesselForm';

const AddVessel: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <img 
            src="https://apmaritime.in/assets/apmb-B0Lm-J0A.png"
            alt="APMB Logo"
            className="h-32 w-32 mx-auto mb-6 object-contain rounded-2xl shadow-lg"
          />
          <h1 className="text-3xl font-bold text-gray-800">Add New Vessel</h1>
          <p className="mt-2 text-xl font-medium text-seagreen-600">Enter vessel details and operation information</p>
        </div>
        
        <VesselForm />
      </div>
    </div>
  );
};

export default AddVessel;