import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const HodRegistration: React.FC = () => {
  const { hodId } = useParams<{ hodId: string }>();
  const navigate = useNavigate();
  const { registerHodUser } = useAuth();
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hodExists, setHodExists] = useState(false);
  const [invitationValid, setInvitationValid] = useState(true);

  useEffect(() => {
    const fetchHodData = async () => {
      if (!hodId) return;
      
      try {
        const hodDoc = await getDoc(doc(db, 'hods', hodId));
        if (hodDoc.exists()) {
          const hodData = hodDoc.data();
          
          // Check if HOD is already registered
          if (hodData.status === 'registered') {
            setError('This HOD has already been registered.');
            setInvitationValid(false);
            return;
          }
          
          // Check if invitation is expired (7 days)
          if (hodData.invitationSentAt) {
            const invitationDate = new Date(hodData.invitationSentAt.toDate());
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - invitationDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays > 7) {
              setError('This invitation has expired. Please contact the administrator for a new invitation.');
              setInvitationValid(false);
              return;
            }
          }
          
          setEmail(hodData.email || '');
          setHodExists(true);
        } else {
          setError('Invalid registration link. HOD not found.');
          setInvitationValid(false);
        }
      } catch (err) {
        console.error('Error fetching HOD data:', err);
        setError('Failed to load HOD information. Please try again later.');
        setInvitationValid(false);
      }
    };

    fetchHodData();
  }, [hodId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!hodId || !hodExists || !invitationValid) {
      setError('Invalid or expired registration link');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Update HOD data in Firestore
      await updateDoc(doc(db, 'hods', hodId), {
        name,
        designation,
        department,
        status: 'registered',
        registeredAt: new Date()
      });
      
      // Create user account
      await registerHodUser(email, password, hodId, name, designation, department);
      
      toast.success('Registration completed successfully!');
      
      // Redirect to admin dashboard
      navigate('/admin');
    } catch (err) {
      console.error('Error registering HOD:', err);
      setError('Failed to complete registration. Please try again.');
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (error && !invitationValid) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Registration Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-seagreen-600 hover:bg-seagreen-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <img 
            src="https://apmaritime.in/assets/apmb-B0Lm-J0A.png"
            alt="APMB Logo"
            className="h-32 w-32 mx-auto mb-6 object-contain rounded-2xl shadow-lg"
          />
          <h1 className="text-3xl font-bold text-gray-800">Andhra Pradesh Maritime Board (APMB)</h1>
          <p className="mt-2 text-xl font-medium text-seagreen-600">HOD Registration</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-gray-700 font-medium mb-2">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="designation" className="block text-gray-700 font-medium mb-2">
                  Designation
                </label>
                <input
                  type="text"
                  id="designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                  required
                />
              </div>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Create Account</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-seagreen-500"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-seagreen-600 hover:bg-seagreen-700 text-white font-medium py-3 px-4 rounded-md transition duration-300 ease-in-out disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Complete Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HodRegistration;