import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
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

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<{ [id: string]: string }>({});
  const [offlineIds, setOfflineIds] = useState<string[]>([]);
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
        if (data?.length > 0) {
          setExpanded(data[0].id);
          if (data[0].image_url) {
            loadHtml(data[0].id, data[0].image_url);
          }
        }
      }

      setLoading(false);
    };

    const checkOfflineFiles = async () => {
      const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
      const htmlFiles = files.filter((f) => f.endsWith('.html')).map((f) => f.replace('.html', ''));
      setOfflineIds(htmlFiles);
    };

    fetchPrescriptions();
    checkOfflineFiles();
  }, []);

  const loadHtml = async (prescriptionId: string, url: string) => {
    const filePath = `${FileSystem.documentDirectory}${prescriptionId}.html`;

    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(filePath);
        setHtmlContent((prev) => ({ ...prev, [prescriptionId]: content }));
        return;
      }

      const response = await fetch(url);
      const html = await response.text();

      await FileSystem.writeAsStringAsync(filePath, html, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      setOfflineIds((prev) => [...prev, prescriptionId]); // update UI with new cached entry
      setHtmlContent((prev) => ({ ...prev, [prescriptionId]: html }));
    } catch (err) {
      Alert.alert('Error', 'Could not load prescription HTML.');
    }
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const activePrescriptions = prescriptions.filter((p) => {
    const durationDate = new Date(p.duration);
    durationDate.setHours(23, 59, 59, 999);
    return durationDate >= now;
  });

  const expiredPrescriptions = prescriptions.filter((p) => {
    const durationDate = new Date(p.duration);
    durationDate.setHours(23, 59, 59, 999);
    return durationDate < now;
  });

  const renderPrescriptionCard = (p: any, isExpired: boolean) => (
    <View
      key={p.id}
      style={[
        styles.card,
        {
          borderLeftColor: isExpired ? '#EF4444' : '#15BE77',
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.issuedAt}>
          Issued on {new Date(p.created_at).toLocaleDateString()}
        </Text>
        {offlineIds.includes(p.id) && (
          <Text style={styles.offlineTag}>✔ Saved for Offline</Text>
        )}
      </View>

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
                  javaScriptEnabled
                />
              ) : (
                <ActivityIndicator size="large" color="#2563eb" />
              )}
            </View>
          )}
        </>
      )}
    </View>
  );

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
          <>
            {activePrescriptions.length > 0 && (
              <>
                <Text style={styles.subheader}>Active Prescriptions</Text>
                {activePrescriptions.map((p) => renderPrescriptionCard(p, false))}
              </>
            )}
            {expiredPrescriptions.length > 0 && (
              <>
                <Text style={styles.subheader}>Expired Prescriptions</Text>
                {expiredPrescriptions.map((p) => renderPrescriptionCard(p, true))}
              </>
            )}
          </>
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
  subheader: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 20,
    color: '#374151',
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
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issuedAt: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  offlineTag: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
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
