import { useState, useEffect } from 'react';
import { fetchCargoTypes } from '../services/api';
import { CargoType } from '../types';

export const useCargoTypes = () => {
  const [cargoTypes, setCargoTypes] = useState<CargoType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCargoTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const cargoTypeData = await fetchCargoTypes();
        setCargoTypes(cargoTypeData);
      } catch (err) {
        console.error('Error in useCargoTypes hook:', err);
        setError('Failed to load cargo types');
      } finally {
        setLoading(false);
      }
    };

    loadCargoTypes();
  }, []);

  return { cargoTypes, loading, error, setCargoTypes };
};