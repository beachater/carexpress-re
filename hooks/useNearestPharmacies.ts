import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

type Pharmacy = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  distance?: number; // We'll add this dynamically
};

export default function useNearestPharmacies() {
  const [nearestPharmacies, setNearestPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // 1. Request permission + get user location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const userLat = location.coords.latitude;
        const userLon = location.coords.longitude;

        // 2. Fetch pharmacies from Supabase
        const { data: pharmacies, error: supabaseError } = await supabase
          .from('pharmacies')
          .select('*');

        if (supabaseError || !pharmacies) {
          throw new Error(supabaseError?.message || 'Failed to fetch pharmacies');
        }

        // 3. Compute distance to each pharmacy
        const pharmaciesWithDistance = pharmacies.map((pharmacy: Pharmacy) => {
          const distance = haversine(userLat, userLon, pharmacy.latitude, pharmacy.longitude);
          return { ...pharmacy, distance };
        });

        // 4. Sort by nearest
        pharmaciesWithDistance.sort((a, b) => a.distance! - b.distance!);

        setNearestPharmacies(pharmaciesWithDistance);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { nearestPharmacies, loading, error };
}

// Haversine formula
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of Earth in KM
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in KM
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}
