// UPDATED PHARMACY ORDERS SCREEN WITH URGENCY SORT + LABEL + BORDER

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Background from '../../components/Background';
import { supabase } from '../../lib/supabase';

export default function PharmacyOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [htmlContentMap, setHtmlContentMap] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Authentication error', authError?.message || 'Login required');
        return;
      }

      const { data: ordersData, error: ordersError } = await supabase
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
          prescription_id,
          pharmacies ( name ),
          patient:patient_id ( full_name )
        `)
        .eq('status', 'pending');

      if (ordersError || !ordersData) {
        console.error('Error fetching orders:', ordersError?.message);
        return;
      }

      const prescriptionIds = ordersData.map((o) => o.prescription_id).filter(Boolean);

      const { data: prescriptionData, error: prescriptionError } = await supabase
        .from('prescriptions')
        .select('prescription_id, image_url')
        .in('prescription_id', prescriptionIds);

      if (prescriptionError) {
        console.error('Error fetching prescriptions:', prescriptionError.message);
        return;
      }

      const imageMap = Object.fromEntries(prescriptionData.map((rx) => [rx.prescription_id, rx.image_url]));

      const ordersWithImages = ordersData.map((order) => ({
        ...order,
        prescription_url: imageMap[order.prescription_id] || null,
      }));

      const urgencyOrder = { critical: 0, urgent: 1, standard: 2 };
      const sortedOrders = ordersWithImages.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

      setOrders(sortedOrders);
    };

    fetchOrders();
  }, []);

  const handleAccept = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'pharmacy_accepted' })
      .eq('id', orderId);

    if (error) {
      Alert.alert('Failed to accept order', error.message);
      return;
    }

    Alert.alert('Order confirmed', 'The order is now visible to drivers.');
  };

  const handleDecline = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    if (error) {
      Alert.alert('Failed to decline order', error.message);
      return;
    }

    Alert.alert('Order declined', 'The order has been cancelled.');
    setOrders((prev) => prev.filter((order) => order.id !== orderId));
  };

  const toggleDetails = async (orderId: string, prescriptionUrl: string | null) => {
    const isExpanded = expandedOrderId === orderId;
    setExpandedOrderId(isExpanded ? null : orderId);
    if (!isExpanded && prescriptionUrl && !htmlContentMap[orderId]) {
      try {
        const response = await fetch(prescriptionUrl);
        const html = await response.text();
        setHtmlContentMap((prev) => ({ ...prev, [orderId]: html }));
      } catch {
        Alert.alert('Error', 'Could not load prescription HTML.');
      }
    }
  };

  return (
    <Background>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Orders</Text>

        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          const html = htmlContentMap[order.id];
          const urgencyColor =
            order.urgency === 'critical'
              ? '#dc2626'
              : order.urgency === 'urgent'
              ? '#f97316'
              : '#22c55e';

          return (
            <View
              key={order.id}
              style={[styles.card, { borderLeftWidth: 5, borderLeftColor: urgencyColor }]}
            >
              <TouchableOpacity activeOpacity={0.8} onPress={() => toggleDetails(order.id, order.prescription_url)}>
                <View style={styles.detailsSection}>
                  <Text style={styles.pharmacy}>{order.pharmacies?.name || 'Pharmacy'}</Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: urgencyColor,
                      marginBottom: 4,
                    }}
                  >
                    {order.urgency?.toUpperCase()}
                  </Text>
                  <Text style={styles.patientName}>{order.patient?.full_name || 'Unknown'}</Text>
                  <Text style={styles.medicineLabel}>Medicine:</Text>
                  {order.medicine_data?.map((med: any, idx: number) => (
                    <Text key={idx} style={styles.medicineItem}>• {med.name} × {med.quantity}</Text>
                  ))}
                  <Text style={styles.info}>Date & Time: {new Date(order.created_at).toLocaleString()}</Text>
                  <Text style={styles.info}>Delivery Fee: ₱{order.delivery_fee}</Text>
                </View>
              </TouchableOpacity>

              {isExpanded && order.prescription_url && (
                <View style={styles.expandedSection}>
                  {html ? (
                    <WebView
                      originWhitelist={['*']}
                      source={{ html }}
                      style={styles.webview}
                      javaScriptEnabled={true}
                      scalesPageToFit={false}
                      automaticallyAdjustContentInsets={true}
                    />
                  ) : (
                    <ActivityIndicator size="large" color="#2563eb" />
                  )}
                </View>
              )}

              <View style={styles.divider} />
              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={() => handleAccept(order.id)}>
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDecline(order.id)}>
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
    marginBottom: 2,
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
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});
