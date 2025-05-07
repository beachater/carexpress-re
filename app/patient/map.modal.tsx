import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useNearestPharmacies from '../../hooks/useNearestPharmacies';

export default function PharmacyMapScreen() {
  const { nearestPharmacies, loading, error } = useNearestPharmacies();
  const router = useRouter();

  const [MapView, setMapView] = useState<any>(null);
  const [Marker, setMarker] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const maps = require('react-native-maps');
      setMapView(() => maps.default);
      setMarker(() => maps.Marker);
    }
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.center}>
        <Text>🗺️ Map view is not available on web.</Text>
      </View>
    );
  }

  if (!MapView || !Marker) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00C58E" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00C58E" />
        <Text>Getting nearby pharmacies...</Text>
      </View>
    );
  }

  if (error || !nearestPharmacies.length) {
    return (
      <View style={styles.center}>
        <Text>{String(error || 'No pharmacies found.')}</Text>
      </View>
    );
  }

  // Filter pharmacies with valid coordinates
  const safePharmacies = nearestPharmacies.filter(
    (p) =>
      typeof p.latitude === 'number' &&
      typeof p.longitude === 'number' &&
      !isNaN(p.latitude) &&
      !isNaN(p.longitude)
  );

  // 🛑 Prevent crash: skip map if no valid data
  if (safePharmacies.length === 0) {
    return (
      <View style={styles.center}>
        <Text>No valid pharmacies to display on map.</Text>
      </View>
    );
  }

  const initialRegion = {
    latitude: safePharmacies[0].latitude,
    longitude: safePharmacies[0].longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header / Close Button */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerText}>Nearby Pharmacies</Text>
        <View style={{ width: 24 }} pointerEvents="none" />
      </View>

      {/* Map View */}
      <MapView style={styles.map} initialRegion={initialRegion}>
        {safePharmacies.map((pharmacy) => (
          <Marker
            key={pharmacy.id}
            coordinate={{
              latitude: pharmacy.latitude,
              longitude: pharmacy.longitude,
            }}
            title={String(pharmacy.name || 'Unnamed Pharmacy')}
            description={
              pharmacy.distance != null
                ? `${pharmacy.distance.toFixed(2)} km away`
                : 'Distance unknown'
            }
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
