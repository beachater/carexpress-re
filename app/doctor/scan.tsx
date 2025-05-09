import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ScanPatientScreen() {
  const [hasCameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [hasAudioPermission, setAudioPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);

  useEffect(() => {
    const requestPermissions = async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const audioPermission = await Camera.requestMicrophonePermissionsAsync();

      setCameraPermission(cameraPermission.status === 'granted');
      setAudioPermission(audioPermission.status === 'granted');
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    if (hasCameraPermission === false || hasAudioPermission === false) {
      Alert.alert(
        'Camera Permissions Required',
        'You must grant access to your camera to scan QR codes',
        [
          { text: 'Go to Settings', onPress: () => Linking.openSettings() },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [hasCameraPermission, hasAudioPermission]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
  if (scanned) return;
  setScanned(true);
  Vibration.vibrate();

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error('Doctor not logged in');

    const doctorId = userData.user.id;
    const patientId = data;

    // Fetch patient profile
    const { data: patientProfile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', patientId)
      .single();

    if (profileError || !patientProfile) {
      Alert.alert('Error', 'Patient not found or invalid QR code.');
      setScanned(false);
      return;
    }

    Alert.alert(
      'Connect with Patient?',
      `Do you want to connect with ${patientProfile.full_name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setScanned(false),
        },
        {
          text: 'Confirm',
          onPress: async () => {
            const { error: insertError } = await supabase
              .from('doctor_patients')
              .insert([{ doctor_id: doctorId, patient_id: patientId }]);

            if (insertError) Alert.alert('Error', insertError.message);
            else Alert.alert('Success', 'Patient added!');
          },
        },
      ]
    );
  } catch (err: any) {
    Alert.alert('Error', err.message);
    setScanned(false);
  }
};

  if (!hasCameraPermission || !hasAudioPermission) {
    return (
      <View style={styles.center}>
        <Text>Waiting for camera permission...</Text>
      </View>
    );
  }

  if (cameraVisible) {
    return (
      <View style={{ flex: 1 }}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          style={StyleSheet.absoluteFillObject}
        />
        {scanned && (
          <View style={styles.buttonContainer}>
            <Button title="Scan Again" onPress={() => setScanned(false)} />
          </View>
        )}
        <TouchableOpacity style={styles.closeButton} onPress={() => setCameraVisible(false)}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan patients QR Code</Text>
      <Text style={styles.subtitle}>Make sure to scan in a well lit area</Text>

      <TouchableOpacity style={styles.dashedBox} onPress={() => setCameraVisible(true)}>
        <Ionicons name="cloud-outline" size={48} color="#4B5563" />
        <Text style={styles.boxText}>Click to open camera</Text>
      </TouchableOpacity>

      {/* <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Connect with Patient</Text>
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 32,
  },
  dashedBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    width: '100%',
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  boxText: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 24,
    backgroundColor: '#00000080',
    padding: 8,
    borderRadius: 24,
  },
});
