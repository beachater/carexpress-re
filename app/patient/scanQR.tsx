import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { supabase } from '../../lib/supabase';

export default function QRScreen() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    fetchUser();
  }, []);

  if (!userId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Your CareXpress QR Code</Text>

      <View style={styles.qrBox}>
        <QRCode value={userId} size={200} />
      </View>

      <Text style={styles.instructions}>
            
        {'\n\n'}
        Show this QR code to your doctor during consultation. They will scan it to upload your prescription directly to your CareXpress profile.
      </Text>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="doctor" size={24} color="#22C55E" />
          <Text style={styles.infoText}>
            Your doctor scans this to send your prescription to the system instantly.
          </Text>
        </View>

        <View style={styles.infoRow}>
          <FontAwesome5 name="user-shield" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            Prescriptions are viewable by you, your doctor, and the pharmacist.
          </Text>
        </View>

        <View style={styles.infoRow}>
          <FontAwesome5 name="lock" size={20} color="#F59E0B" />
          <Text style={styles.infoText}>
            All prescriptions are securely stored and access is restricted.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
    textAlign: 'center',
  },
  qrBox: {
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#22C55E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    marginBottom: 24,
  },
  instructions: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoContainer: {
    width: '100%',
    paddingHorizontal: 8,
    gap: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});
