import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Background from '../../components/Background';
import { useCart } from '../../context/CartContext';
import useCurrentLocation from '../../hooks/useCurrentLocation';
import { supabase } from '../../lib/supabase';

const deliveryOptions = [
  { label: '🚨 Express Now', value: 'critical' },
  { label: '⚡ Fast (within 4 hours)', value: 'urgent' },
  { label: '📦 Standard (today)', value: 'standard' },
];

export default function OrdersScreen() {
  const { cart, updateQuantity, removeItem } = useCart();
  const router = useRouter();

  const [routeParams, setRouteParams] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [urgency, setUrgency] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery' | ''>('');
  const [showSummary, setShowSummary] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(300))[0];
  const [deliveredModalVisible, setDeliveredModalVisible] = useState(false);
  const [age, setAge] = useState(0);

  const baseCharge = urgency === 'critical' ? 55 : urgency === 'urgent' ? 50 : urgency === 'standard' ? 40 : 0;
  const discount = age >= 60 ? 20 : 0;
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + deliveryFee - discount;
  const { location, error } = useCurrentLocation();

  useEffect(() => {
    const fetchAge = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('age')
          .eq('id', userData.user.id)
          .single();
        if (profile?.age) setAge(profile.age);
      }
    };
    fetchAge();
  }, []);

  useEffect(() => {
    if ((deliveryMethod === 'pickup') || (deliveryMethod === 'delivery' && urgency)) {
      setDeliveryFee(deliveryMethod === 'delivery' ? baseCharge : 0);
      setShowSummary(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      setShowSummary(false);
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [urgency, deliveryMethod]);

  const handleCheckout = async () => {
    if (deliveryMethod === 'pickup') {
      Alert.alert('Order Placed!', 'You will be notified if your medicine is ready pickup at the pharmacy.');
      return;
    }

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
        urgency,
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

    Alert.alert('Order Placed!', 'You can track your order now while its being processed');
  };

  const handleTrack = () => {
    if (!routeParams) {
      Alert.alert('Missing coordinates', 'You need to place an order first.');
      return;
    }

    router.push({ pathname: '/patient/track', params: routeParams });

    setTimeout(() => {
      setDeliveredModalVisible(true);
    }, 10000);
  };

  return (
    <Background>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.header}>Order details</Text>

          <Text style={styles.label}>Order Method</Text>
          <View style={styles.pickerWrapper}>
            <TouchableOpacity onPress={() => { setDeliveryMethod('pickup'); setUrgency(''); }}>
              <Text style={{ padding: 12, fontSize: 14, color: deliveryMethod === 'pickup' ? '#22C55E' : '#111' }}>🏪 Pick Up</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDeliveryMethod('delivery')}>
              <Text style={{ padding: 12, fontSize: 14, color: deliveryMethod === 'delivery' ? '#22C55E' : '#111' }}>🚚 Delivery</Text>
            </TouchableOpacity>
          </View>

          {deliveryMethod === 'delivery' && (
            <>
              <Text style={styles.label}>Choose Delivery Speed</Text>
              <TouchableOpacity style={styles.pickerWrapper} onPress={() => setModalVisible(true)}>
                <Text style={{ padding: 12, fontSize: 14, color: '#111' }}>
                  {urgency ? deliveryOptions.find(o => o.value === urgency)?.label : '-- Select Option --'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                {deliveryOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.modalItem}
                    onPress={() => {
                      setUrgency(option.value);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={{ color: '#EF4444', textAlign: 'center', marginTop: 12 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

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
                  <TouchableOpacity onPress={() => updateQuantity(item.name, -1)} style={styles.qtyButton}><Text style={styles.qtyText}>–</Text></TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.name, 1)} style={styles.qtyButton}><Text style={styles.qtyText}>+</Text></TouchableOpacity>
                  <TouchableOpacity onPress={() => removeItem(item.name)} style={styles.removeButton}><Text style={styles.removeText}>🗑</Text></TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {showSummary && (
          <Animated.View style={[styles.summaryBox, { transform: [{ translateY: slideAnim }] }]}>
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
          </Animated.View>
        )}
      </View>
    </Background>
  );
}


// append styles: label, pickerWrapper, summaryBox (already there)


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
  label: {
  fontSize: 14,
  fontWeight: '600',
  color: '#111827',
  marginBottom: 8,
  // paddingHorizontal: 20,
},
pickerWrapper: {
  backgroundColor: '#fff',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#D1D5DB',
  // marginHorizontal: 20,
  marginBottom: 16,
},
modalOverlay: {
  flex: 1,
  // backgroundColor: 'rgba(0,0,0,0.3)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalCard: {
  backgroundColor: '#fff',
  width: '80%',
  padding: 20,
  borderRadius: 16,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 4 },
  shadowRadius: 8,
  elevation: 5,
},
modalItem: {
  paddingVertical: 12,
},
modalText: {
  fontSize: 16,
  textAlign: 'center',
  color: '#111827',
},
deliveredOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.4)',
  justifyContent: 'center',
  alignItems: 'center',
},
deliveredCard: {
  backgroundColor: '#fff',
  padding: 24,
  borderRadius: 16,
  width: '80%',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: 3 },
  shadowRadius: 8,
  elevation: 5,
},
deliveredIcon: {
  fontSize: 48,
  marginBottom: 12,
},
deliveredTitle: {
  fontSize: 20,
  fontWeight: '700',
  color: '#16a34a',
  marginBottom: 6,
},
deliveredMsg: {
  fontSize: 14,
  textAlign: 'center',
  color: '#444',
  marginBottom: 16,
},
deliveredBtn: {
  backgroundColor: '#16a34a',
  paddingVertical: 10,
  paddingHorizontal: 24,
  borderRadius: 8,
},
deliveredBtnText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 14,
},

});
