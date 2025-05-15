import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import Background from '../../components/Background';

type OfflinePrescription = {
  id: string;
  html: string;
};

export default function OfflinePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<OfflinePrescription[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const loadOfflinePrescriptions = async () => {
      try {
        const files = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory);
        const htmlFiles = files.filter((f) => f.endsWith('.html'));

        const loaded: OfflinePrescription[] = [];

        for (const file of htmlFiles) {
          const html = await FileSystem.readAsStringAsync(`${FileSystem.documentDirectory}${file}`);
          loaded.push({ id: file.replace('.html', ''), html });
        }

        setPrescriptions(loaded);
      } catch (err) {
        console.log('Error reading offline prescriptions:', err);
      }
    };

    loadOfflinePrescriptions();
  }, []);

  return (
    <Background>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>📁 Offline Prescriptions</Text>

        {prescriptions.length === 0 ? (
          <Text style={styles.empty}>No saved prescriptions available offline.</Text>
        ) : (
          prescriptions.map((p) => (
            <View key={p.id} style={styles.card}>
              <TouchableOpacity onPress={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                <Text style={styles.title}>
                  {expandedId === p.id ? 'Hide' : 'View'} Prescription: {p.id}
                </Text>
              </TouchableOpacity>

              {expandedId === p.id && (
                <View style={styles.webviewWrapper}>
                  <WebView
                    originWhitelist={['*']}
                    source={{ html: p.html }}
                    style={styles.webview}
                    javaScriptEnabled={true}
                  />
                </View>
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
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#111827',
  },
  empty: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6B7280',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  webviewWrapper: {
    width: '100%',
    height: 400,
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});
