import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserPortId, fetchPortById } from '../services/api';
import { Port } from '../types';

export const usePortData = () => {
  const { currentUser } = useAuth();
  const [portData, setPortData] = useState<Port | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Get the port ID associated with the current user
        const portId = await fetchUserPortId(currentUser.uid);
        
        if (!portId) {
          setError('User is not associated with any port');
          setLoading(false);
          return;
        }
        
        // Fetch the port data
        const port = await fetchPortById(portId);
        
        if (!port) {
          setError('Port data not found');
          setLoading(false);
          return;
        }
        
        setPortData(port);
      } catch (err) {
        console.error('Error in usePortData hook:', err);
        setError('Failed to load port information');
      } finally {
        setLoading(false);
      }
    };

    fetchPortData();
  }, [currentUser]);

  return { portData, loading, error };
};