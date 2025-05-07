import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export default function useCurrentLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission denied. Please enable location.');
          return;
        }

        const current = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
      } catch (err) {
        console.error('Location error:', err);
        setError('Failed to get location.');
      }
    };

    getLocation();
  }, []);

  return { location, error };
}
