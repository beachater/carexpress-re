import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { supabase } from '../../lib/supabase';
import Background from '../../components/Background';
import { useRouter } from 'expo-router';

export default function DriverTrackScreen() {
  const [routeCoords, setRouteCoords] = useState([]);
  const [order, setOrder] = useState<any>(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchOrder = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          delivery_lat,
          delivery_lng,
          pharmacies (
            name,
            latitude,
            longitude
          ),
          patient:patient_id (
            full_name,
            phone
          )
        `)
        .eq('driver_id', user.id)
        .eq('status', 'driver_accepted')
        .single();

      if (error) {
        console.error('No accepted order found', error.message);
        return;
      }

      setOrder(data);
      fetchRoute(data);
    };

    const fetchRoute = async (orderData: any) => {
      const pLat = parseFloat(orderData.pharmacies.latitude);
      const pLng = parseFloat(orderData.pharmacies.longitude);
      const dLat = parseFloat(orderData.delivery_lat);
      const dLng = parseFloat(orderData.delivery_lng);

      try {
        const res = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
          method: 'POST',
          headers: {
            'Authorization': '5b3ce3597851110001cf6248dc16e5bf92dd4d239be5e0bcbfe2f1af',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: [
              [pLng, pLat],
              [dLng, dLat],
            ],
          }),
        });

        const json = await res.json();
        const coords = json.features[0].geometry.coordinates.map(([lng, lat]) => ({
          latitude: lat,
          longitude: lng,
        }));

        const props = json.features[0].properties.segments[0];
        setDistance((props.distance / 1000).toFixed(1)); // in km
        setDuration(Math.round(props.duration / 60).toString()); // in minutes
        setRouteCoords(coords);
      } catch (err) {
        console.error('Route fetch error:', err);
      }
    };

    fetchOrder();
  }, []);

  const handleConfirmDelivery = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', order.id);

      if (error) {
        console.error('Failed to update order status:', error.message);
        return;
      }

      router.push({ pathname: '/driver/confirmed', params: { name: order.patient?.full_name || '' } });
    } catch (err) {
      console.error('Error confirming delivery:', err);
    }
  };

  if (!order) {
    return (
      <Background>
        <View style={styles.center}>
          <Text>No active delivery</Text>
        </View>
      </Background>
    );
  }

  const pharmacy = {
    latitude: parseFloat(order.pharmacies.latitude),
    longitude: parseFloat(order.pharmacies.longitude),
  };

  const patient = {
    latitude: parseFloat(order.delivery_lat),
    longitude: parseFloat(order.delivery_lng),
  };

  return (
    <Background>
      {Platform.OS !== 'web' && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: (pharmacy.latitude + patient.latitude) / 2,
            longitude: (pharmacy.longitude + patient.longitude) / 2,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
        >
          <Marker coordinate={pharmacy} title="Pharmacy" pinColor="green" />
          <Marker coordinate={patient} title="Patient" pinColor="red" />
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeColor="#00C58E" strokeWidth={4} />
          )}
        </MapView>
      )}

      <View style={styles.infoCard}>
        <Image
          source={require('../../assets/images/favicon.png')}
          style={styles.avatar}
        />
        <View style={styles.detailsRow}>
          <View>
            <Text style={styles.label}>Store</Text>
            <Text style={styles.value}>{order.pharmacies.name}</Text>
          </View>
          <View>
            <Text style={styles.label}>Call</Text>
            <Text style={styles.value}>{order.patient?.phone || '-'}</Text>
          </View>
        </View>
        <View style={styles.detailsRow}>
          <View>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{distance} km</Text>
          </View>
          <View>
            <Text style={styles.label}>Delivery Time</Text>
            <Text style={styles.value}>{duration} minutes</Text>
          </View>
        </View>
        <View style={styles.btnGroup}>
          <TouchableOpacity style={styles.cancelBtn}>
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmDelivery}>
            <Text style={styles.btnText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    position: 'absolute',
    top: -35,
    borderWidth: 3,
    borderColor: '#fff',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#00C58E',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
