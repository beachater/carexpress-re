import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import Background from '../../components/Background';
import { WebView } from 'react-native-webview';

const screenWidth = Dimensions.get('window').width;

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        Alert.alert('Error', 'Unable to fetch user.');
        return;
      }

      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setPrescriptions(data || []);
      }

      setLoading(false);
    };

    fetchPrescriptions();
  }, []);

  const loadHtml = async (prescriptionId: string, url: string) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      setHtmlContent((prev) => ({ ...prev, [prescriptionId]: text }));
    } catch (err) {
      Alert.alert('Error', 'Could not load prescription HTML.');
    }
  };

  return (
    <Background>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Your Prescriptions</Text>

        {loading ? (
          <Text>Loading...</Text>
        ) : prescriptions.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ fontSize: 16, color: '#666' }}>🗂 No prescriptions found.</Text>
            <Text style={{ fontSize: 14, color: '#aaa', marginTop: 4 }}>
              Prescriptions will appear here once issued by your doctor.
            </Text>
          </View>
        ) : (
          prescriptions.map((p) => (
            <View key={p.id} style={styles.card}>
              <Text style={styles.issuedAt}>
                Issued on {new Date(p.created_at).toLocaleDateString()}
              </Text>

              {p.image_url && (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      const isExpanded = expanded === p.id;
                      setExpanded(isExpanded ? null : p.id);
                      if (!htmlContent[p.id] && !isExpanded) loadHtml(p.id, p.image_url);
                    }}
                  >
                    <Text style={styles.toggleBtn}>
                      {expanded === p.id ? 'Hide Prescription' : 'View Full Prescription'}
                    </Text>
                  </TouchableOpacity>

                  {expanded === p.id && (
  <View style={styles.webviewWrapper}>
    {htmlContent[p.id] ? (
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent[p.id] }}
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

                </>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    paddingTop: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#15BE77',
    marginBottom: 16,
  },
  issuedAt: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  toggleBtn: {
    color: '#53E88B',
    marginTop: 10,
    fontWeight: '600',
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
