import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { supabase } from '../../../lib/supabase';
import Background from '../../../components/Background';
import { WebView } from 'react-native-webview';

const screenWidth = Dimensions.get('window').width;

export default function PrescriptionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [prescriptionMeta, setPrescriptionMeta] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPrescription = async () => {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('prescription_id, patient:patient_id(full_name)')
        .eq('id', id)
        .single();

      if (orderError || !order?.prescription_id) {
        Alert.alert('Error', 'Prescription not linked to this order.');
        return;
      }

      const { data: prescriptions, error: rxError } = await supabase
        .from('prescriptions')
        .select('image_url, created_at, doctor:doctor_id(full_name)')
        .eq('prescription_id', order.prescription_id)
        .limit(1)
        .maybeSingle();

      if (rxError || !prescriptions) {
        Alert.alert('Error', 'Could not fetch prescription data.');
        return;
      }

      setPrescriptionMeta({
        doctor: prescriptions.doctor?.full_name || 'Unknown',
        patient: order.patient?.full_name || 'Unknown',
        date: prescriptions.created_at,
        image_url: prescriptions.image_url,
        id: order.prescription_id,
      });
    };

    fetchPrescription();
  }, [id]);

  useEffect(() => {
    const loadHtml = async () => {
      if (prescriptionMeta?.image_url) {
        try {
          const response = await fetch(prescriptionMeta.image_url);
          const text = await response.text();
          setHtmlContent(text);
        } catch (err) {
          Alert.alert('Error', 'Could not load prescription HTML.');
        }
      }
      setLoading(false);
    };
    loadHtml();
  }, [prescriptionMeta]);

  return (
    <Background>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Prescription Details</Text>

        {loading ? (
          <Text>Loading...</Text>
        ) : prescriptionMeta ? (
          <View style={styles.card}>
            {/* <Text style={styles.label}>Patient:</Text>
            <Text>{prescriptionMeta.patient}</Text>

            <Text style={styles.label}>Doctor:</Text>
            <Text>{prescriptionMeta.doctor}</Text> */}

            <Text style={styles.label}>Issued on:</Text>
            <Text>{new Date(prescriptionMeta.date).toLocaleDateString()}</Text>

            <View style={styles.webviewWrapper}>
              {htmlContent ? (
                <WebView
                  originWhitelist={['*']}
                  source={{ html: htmlContent }}
                  style={styles.webview}
                  javaScriptEnabled={true}
                  scalesPageToFit={false}
                  automaticallyAdjustContentInsets={true}
                />
              ) : (
                <ActivityIndicator size="large" color="#2563eb" />
              )}
            </View>
          </View>
        ) : (
          <Text>No prescription found.</Text>
        )}
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
  },
  webviewWrapper: {
    width: '100%',
    height: 400,
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});
