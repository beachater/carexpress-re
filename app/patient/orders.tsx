import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import Background from '../../components/Background';
import { useRouter } from 'expo-router';
import useCurrentLocation from '../../hooks/useCurrentLocation';
import { supabase } from '../../lib/supabase';

export default function OrdersScreen() {
  const { cart, updateQuantity, removeItem } = useCart();
  const router = useRouter();

  const [routeParams, setRouteParams] = useState<null | {
    pLat: string;
    pLng: string;
    dLat: string;
    dLng: string;
  }>(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const discount = 20;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + deliveryFee - discount;
  const { location, error } = useCurrentLocation();

  useEffect(() => {
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const toRad = (value: number) => (value * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const updateDeliveryFee = async () => {
      if (!location || cart.length === 0) return;
      const { latitude, longitude } = location;

      const { data: pharmacyData } = await supabase
        .from('pharmacies')
        .select('latitude, longitude')
        .eq('id', cart[0].pharmacy_id)
        .single();

      if (pharmacyData) {
        const dist = calculateDistance(latitude, longitude, pharmacyData.latitude, pharmacyData.longitude);
        const fee = dist <= 4 ? 40 : 40 + Math.ceil(dist - 4) * 3;
        setDeliveryFee(Math.round(fee));
      }
    };

    updateDeliveryFee();
  }, [location, cart]);

  const handleCheckout = async () => {
    if (!location) {
      Alert.alert('Location not ready', error || 'Please wait and try again.');
      return;
    }

    const { latitude, longitude } = location;

    const { data: pharmacyData, error: pharmacyError } = await supabase
      .from('pharmacies')
      .select('latitude, longitude')
      .eq('id', cart[0].pharmacy_id)
      .single();

    if (pharmacyError || !pharmacyData) {
      Alert.alert('Error', 'Could not fetch pharmacy location.');
      return;
    }

    const { latitude: pLat, longitude: pLng } = pharmacyData;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('User not authenticated');
      return;
    }

    const { data: latestPrescription } = await supabase
      .from('prescriptions')
      .select('prescription_id')
      .eq('patient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error: insertError } = await supabase.from('orders').insert([
      {
        patient_id: user.id,
        pharmacy_id: cart[0].pharmacy_id,
        medicine_data: cart.map(({ name, price, quantity }) => ({ name, price, quantity })),
        delivery_lat: latitude,
        delivery_lng: longitude,
        pharmacy_lat: pLat,
        pharmacy_lng: pLng,
        total,
        delivery_fee: deliveryFee,
        status: 'pending',
        prescription_id: latestPrescription?.prescription_id || null,
      },
    ]);

    if (insertError) {
      Alert.alert('Order failed', insertError.message);
      return;
    }

    setRouteParams({
      pLat: pLat.toString(),
      pLng: pLng.toString(),
      dLat: latitude.toString(),
      dLng: longitude.toString(),
    });

    Alert.alert('Order Placed!', 'You can now track your delivery route.');
  };

  const handleTrack = () => {
    if (!routeParams) {
      Alert.alert('Missing coordinates', 'You need to place an order first.');
      return;
    }

    router.push({
      pathname: '/patient/track',
      params: routeParams,
    });
  };

  return (
    <Background>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.header}>Order details</Text>

          {cart.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ fontSize: 16, color: '#666' }}>🛒 Your cart is empty.</Text>
              <Text style={{ fontSize: 14, color: '#aaa', marginTop: 4 }}>Add items to place an order.</Text>
            </View>
          ) : (
            cart.map((item, index) => (
              <View key={index} style={styles.card}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.subtext}>{item.pharmacy_name}</Text>
                  </View>
                  <Text style={styles.price}>₱{item.price}</Text>
                </View>

                <View style={styles.quantityRow}>
                  <TouchableOpacity onPress={() => updateQuantity(item.name, -1)} style={styles.qtyButton}>
                    <Text style={styles.qtyText}>–</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.name, 1)} style={styles.qtyButton}>
                    <Text style={styles.qtyText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeItem(item.name)} style={styles.removeButton}>
                    <Text style={styles.removeText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {cart.length > 0 && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>Sub-Total <Text style={styles.alignRight}>₱{subtotal}</Text></Text>
            <Text style={styles.summaryText}>Delivery Charge <Text style={styles.alignRight}>₱{deliveryFee}</Text></Text>
            <Text style={styles.summaryText}>Discount <Text style={styles.alignRight}>₱{discount}</Text></Text>
            <View style={styles.divider} />
            <Text style={styles.totalText}>Total <Text style={styles.alignRight}>₱{total}</Text></Text>

            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>Check Out</Text>
            </TouchableOpacity>

            {routeParams && (
              <TouchableOpacity style={styles.trackBtn} onPress={handleTrack}>
                <Text style={styles.trackText}>Track Delivery</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 120,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  subtext: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  qtyButton: {
    backgroundColor: '#E0F9EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  removeButton: {
    marginLeft: 'auto',
  },
  removeText: {
    fontSize: 16,
    color: '#EF4444',
  },
  summaryBox: {
    backgroundColor: '#00C58E10',
    padding: 16,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 8,
  },
  alignRight: {
    textAlign: 'right',
    float: 'right',
  },
  checkoutBtn: {
    marginTop: 16,
    backgroundColor: '#00C58E',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  trackBtn: {
    marginTop: 12,
    backgroundColor: '#00584E',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  trackText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
