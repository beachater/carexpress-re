import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Background from '../../components/Background';
import { supabase } from '../../lib/supabase';

export default function DriverOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [addressMap, setAddressMap] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to fetch addresses.');
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          medicine_data,
          delivery_lat,
          delivery_lng,
          total,
          delivery_fee,
          created_at,
          urgency,
          pharmacies (
            name,
            latitude,
            longitude 
          ),
          patient:patient_id (
            full_name
          )
        `)
        .eq('status', 'pharmacy_accepted');

      if (error) {
        console.error('Error fetching orders:', error.message);
        return;
      }

      const urgencyOrder = { critical: 0, urgent: 1, standard: 2 };
      const sortedOrders = (data || []).sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

      setOrders(sortedOrders);

      for (const order of sortedOrders) {
        try {
          const geocode = await Location.reverseGeocodeAsync({
            latitude: parseFloat(order.delivery_lat),
            longitude: parseFloat(order.delivery_lng),
          });
          const loc = geocode[0];
          const formatted = [
            loc.street || loc.name || 'Unnamed location',
            loc.city || loc.subregion || loc.region || '',
            loc.country || ''
          ].filter(Boolean).join(', ');
          setAddressMap((prev) => ({ ...prev, [order.id]: formatted }));
        } catch (err) {
          console.warn('Geocoding failed', err);
        }
      }
    })();
  }, []);

  const handleAccept = async (orderId: string) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Authentication error', authError?.message || 'Login required');
      return;
    }

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'driver_accepted',
        driver_id: user.id,
      })
      .eq('id', orderId);

    if (error) {
      Alert.alert('Failed to accept order', error.message);
      return;
    }

    router.push('/driver/track');
  };

  const toggleDetails = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <Background>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Orders</Text>

        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          const urgencyColor =
            order.urgency === 'critical'
              ? '#dc2626'
              : order.urgency === 'urgent'
              ? '#f97316'
              : '#22c55e';

          return (
            <View key={order.id} style={[styles.card, { borderLeftWidth: 5, borderLeftColor: urgencyColor }]}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => toggleDetails(order.id)}>
                <View style={styles.detailsSection}>
                  <Text style={styles.pharmacy}>{order.pharmacies?.name || 'Pharmacy'}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: urgencyColor, marginBottom: 4 }}>
                    {order.urgency?.toUpperCase()}
                  </Text>
                  <Text style={styles.patientName}>{order.patient?.full_name || 'Unknown'}</Text>
                  <Text style={styles.medicineLabel}>Medicine:</Text>
                  {order.medicine_data?.map((med: any, idx: number) => (
                    <Text key={idx} style={styles.medicineItem}>• {med.name} × {med.quantity}</Text>
                  ))}
                  <Text style={styles.info}>Date & Time: {new Date(order.created_at).toLocaleString()}</Text>
                  <Text style={styles.info}>Delivery Fee: ₱{order.delivery_fee}</Text>
                  <Text style={styles.info}>Location: {addressMap[order.id] || `${order.delivery_lat}, ${order.delivery_lng}`}</Text>
                </View>
              </TouchableOpacity>

              {isExpanded && Platform.OS !== 'web' && order.pharmacies?.latitude && order.pharmacies?.longitude && (
                <View style={styles.expandedSection}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: (parseFloat(order.delivery_lat) + parseFloat(order.pharmacies.latitude)) / 2,
                      longitude: (parseFloat(order.delivery_lng) + parseFloat(order.pharmacies.longitude)) / 2,
                      latitudeDelta: 0.04,
                      longitudeDelta: 0.04,
                    }}
                    scrollEnabled={true}
                    zoomEnabled={true}
                    pitchEnabled={true}
                    rotateEnabled={true}
                  >
                    <Marker
                      coordinate={{
                        latitude: parseFloat(order.pharmacies.latitude),
                        longitude: parseFloat(order.pharmacies.longitude),
                      }}
                      title="Pharmacy"
                      pinColor="green"
                    />

                    <Marker
                      coordinate={{
                        latitude: parseFloat(order.delivery_lat),
                        longitude: parseFloat(order.delivery_lng),
                      }}
                      title="Patient"
                      pinColor="red"
                    />
                  </MapView>
                </View>
              )}

              <View style={styles.divider} />
              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={() => handleAccept(order.id)}>
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  detailsSection: {
    paddingBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 12,
  },
  pharmacy: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    color: '#222',
  },
  patientName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#444',
  },
  medicineLabel: {
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  medicineItem: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  info: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
  },
  acceptText: {
    color: '#22c55e',
    fontWeight: '700',
    fontSize: 14,
  },
  declineText: {
    color: '#f87171',
    fontWeight: '700',
    fontSize: 14,
  },
  expandedSection: {
    marginTop: 16,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});
