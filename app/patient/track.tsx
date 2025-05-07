import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useLocalSearchParams } from 'expo-router';
import Background from '../../components/Background';

export default function TrackScreen() {
  const { pLat, pLng, dLat, dLng } = useLocalSearchParams();
  const [routeCoords, setRouteCoords] = useState([]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
          method: 'POST',
          headers: {
            'Authorization': '5b3ce3597851110001cf6248dc16e5bf92dd4d239be5e0bcbfe2f1af',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: [
              [parseFloat(pLng), parseFloat(pLat)],
              [parseFloat(dLng), parseFloat(dLat)],
            ],
          }),
        });

        const json = await res.json();
        const coords = json.features[0].geometry.coordinates.map(([lng, lat]) => ({
          latitude: lat,
          longitude: lng,
        }));

        setRouteCoords(coords);
      } catch (error) {
        console.error('Route error:', error);
      }
    };

    if (pLat && pLng && dLat && dLng) {
      fetchRoute();
    }
  }, [pLat, pLng, dLat, dLng]);

  const pharmacy = { latitude: parseFloat(pLat), longitude: parseFloat(pLng) };
  const delivery = { latitude: parseFloat(dLat), longitude: parseFloat(dLng) };

  return (
    <Background>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: (pharmacy.latitude + delivery.latitude) / 2,
          longitude: (pharmacy.longitude + delivery.longitude) / 2,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
      >
        <Marker coordinate={pharmacy} title="Pharmacy" />
        <Marker coordinate={delivery} title="Your Location" />
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeColor="#00C58E" strokeWidth={4} />
        )}
      </MapView>
    </Background>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
