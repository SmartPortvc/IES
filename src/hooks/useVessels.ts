import { useState, useEffect } from 'react';
import { fetchVessels } from '../services/api';
import { Vessel } from '../types';

export const useVessels = (portId?: string) => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVessels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Only fetch vessels if portId is provided
        if (portId) {
          const vesselData = await fetchVessels(portId);
          setVessels(vesselData);
        } else {
          // If no portId, set empty array
          setVessels([]);
        }
      } catch (err) {
        console.error('Error in useVessels hook:', err);
        setError('Failed to load vessel data');
      } finally {
        setLoading(false);
      }
    };

    // Only run the fetch if we have a portId or explicitly set loading to false
    if (portId) {
      loadVessels();
    } else {
      setLoading(false);
      setVessels([]);
    }
  }, [portId]);

  return { vessels, loading, error, setVessels };
};