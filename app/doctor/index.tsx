import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Picker } from '@react-native-picker/picker';
import Background from '@/components/Background';
import uuid from 'react-native-uuid';
import { generatePrescriptionHTML } from '@/utility/generatePrescriptionHTML';
import { WebView } from 'react-native-webview';


type MedicineInput = {
  medicine_name: string;
  dosage: string;
  duration: string;
  instructions: string;
};

export default function DoctorDashboard() {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState('');
  const [patients, setPatients] = useState<{ id: string; full_name: string }[]>([]);
  const [medications, setMedications] = useState<MedicineInput[]>([
    { medicine_name: '', dosage: '', duration: '', instructions: '' },
  ]);
  const [showPreview, setShowPreview] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const prescriptionId = uuid.v4() as string;

  useEffect(() => {
    const fetchData = async () => {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser?.user) {
        Alert.alert('Error', 'Could not fetch doctor user.');
        return;
      }
      setDoctorId(authUser.user.id);

      const { data: patientsData, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'patient');

      if (error) Alert.alert('Error', 'Could not fetch patients');
      else setPatients(patientsData || []);
    };
    fetchData();
  }, []);

  const handleChange = (index: number, field: keyof MedicineInput, value: string) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const addMedication = () => {
    setMedications((prev) => [
      ...prev,
      { medicine_name: '', dosage: '', duration: '', instructions: '' },
    ]);
  };

  const removeMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const sendPrescription = async () => {
    if (!doctorId || !patientId) {
      Alert.alert('Error', 'Please select a patient.');
      return;
    }

    const incomplete = medications.some((m) => !m.medicine_name || !m.dosage || !m.duration);
    if (incomplete) {
      Alert.alert('Error', 'Each medicine must have name, dosage, and duration.');
      return;
    }

    const html = generatePrescriptionHTML({
      patientName: patients.find((p) => p.id === patientId)?.full_name || 'Patient',
      age: '—',
      date: new Date().toLocaleDateString(),
      medications,
    });

    setHtmlContent(html);
    setShowPreview(true);
  };

  const confirmUpload = async () => {
    const toInsert = medications.map((m) => ({
      doctor_id: doctorId,
      patient_id: patientId,
      prescription_id: prescriptionId,
      ...m,
    }));

    const { error } = await supabase.from('prescriptions').insert(toInsert);

    if (error) {
      Alert.alert('Failed', error.message);
    } else {
      try {
        const fileName = `prescription_${prescriptionId}.html`;
        const { error: uploadError } = await supabase.storage
          .from('prescriptions')
          .upload(fileName, htmlContent, {
            contentType: 'text/html',
            upsert: true,
          });

        if (uploadError) {
          Alert.alert('Upload failed', uploadError.message);
          return;
        }

        const { data: publicURLData } = supabase
          .storage
          .from('prescriptions')
          .getPublicUrl(fileName);

        await supabase
          .from('prescriptions')
          .update({ image_url: publicURLData.publicUrl })
          .eq('prescription_id', prescriptionId);

        Alert.alert('Success', 'Prescription saved and HTML uploaded.');
        setPatientId('');
        setMedications([{ medicine_name: '', dosage: '', duration: '', instructions: '' }]);
        setShowPreview(false);
      } catch (uploadErr: any) {
        Alert.alert('Upload Error', uploadErr.message);
      }
    }
  };

  return (
    <Background>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>👨‍⚕️ Doctor Dashboard</Text>

        <Text style={styles.label}>Select Patient *</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={patientId}
            onValueChange={(value) => setPatientId(value)}
            style={styles.picker}
          >
            <Picker.Item label="-- Select Patient --" value="" />
            {patients.map((p) => (
              <Picker.Item key={p.id} label={p.full_name} value={p.id} />
            ))}
          </Picker>
        </View>

        {medications.map((med, index) => (
          <View key={index} style={styles.medCard}>
            <Text style={styles.label}>Medicine #{index + 1}</Text>
            <TextInput
              style={styles.input}
              placeholder="Medicine Name"
              value={med.medicine_name}
              onChangeText={(val) => handleChange(index, 'medicine_name', val)}
            />
            <TextInput
              style={styles.input}
              placeholder="Dosage"
              value={med.dosage}
              onChangeText={(val) => handleChange(index, 'dosage', val)}
            />
            <TextInput
              style={styles.input}
              placeholder="Duration"
              value={med.duration}
              onChangeText={(val) => handleChange(index, 'duration', val)}
            />
            <TextInput
              style={[styles.input, { height: 60 }]}
              placeholder="Instructions (optional)"
              value={med.instructions}
              onChangeText={(val) => handleChange(index, 'instructions', val)}
              multiline
            />

            {medications.length > 1 && (
              <TouchableOpacity onPress={() => removeMedication(index)}>
                <Text style={styles.removeBtn}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity onPress={addMedication}>
          <Text style={styles.addMore}>+ Add Another Medicine</Text>
        </TouchableOpacity>

        <Button title="Preview Prescription" onPress={sendPrescription} />

        <Modal visible={showPreview} animationType="slide">
          <View style={{ flex: 1 }}>
            <WebView originWhitelist={["*"]} source={{ html: htmlContent }} />
            <Button title="Confirm and Upload" onPress={confirmUpload} />
            <Button title="Cancel" onPress={() => setShowPreview(false)} color="grey" />
          </View>
        </Modal>
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginTop: 10,
  },
  input: {
    backgroundColor: '#f4f4f4',
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
    marginTop: 4,
  },
  pickerWrapper: {
    backgroundColor: '#f4f4f4',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  picker: {
    height: 60,
    width: '100%',
  },
  medCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    backgroundColor: '#f9f9f9',
  },
  addMore: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginVertical: 16,
  },
  removeBtn: {
    color: '#d11a2a',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'right',
  },
});
