import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import uuid from 'react-native-uuid';
import { WebView } from 'react-native-webview';
import Background from '../../components/Background';
import { supabase } from '../../lib/supabase';
import { generatePrescriptionHTML } from '../../utility/generatePrescriptionHTML';


type MedicineInput = {
  medicine_name: string;
  dosage: string;
  duration: string;
  instructions: string;
};

export default function DoctorDashboard() {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patients, setPatients] = useState<{ id: string; full_name: string; age?: number }[]>([]);
  const [medications, setMedications] = useState<MedicineInput[]>([
    { medicine_name: '', dosage: '', duration: '', instructions: '' },
  ]);
  const [showPreview, setShowPreview] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [showDatePickerIndex, setShowDatePickerIndex] = useState<number | null>(null);

  const prescriptionId = uuid.v4() as string;

  useEffect(() => {
    const fetchData = async () => {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser?.user) {
        Alert.alert('Error', 'Could not fetch doctor user.');
        return;
      }

      const doctorId = authUser.user.id;
      setDoctorId(doctorId);

      const { data: doctorProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', doctorId)
        .single();

      setDoctorName(doctorProfile?.full_name || '');

      const { data: linkedPatients, error: linkError } = await supabase
        .from('doctor_patients')
        .select('patient_id')
        .eq('doctor_id', doctorId);

      if (linkError) {
        Alert.alert('Error', 'Could not fetch linked patients');
        return;
      }

      const patientIds = linkedPatients?.map((entry) => entry.patient_id) || [];

      if (patientIds.length === 0) {
        setPatients([]);
        return;
      }

      const { data: patientProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, age')
        .in('id', patientIds);

      if (profileError) {
        Alert.alert('Error', 'Could not fetch patient profiles');
      } else {
        setPatients(patientProfiles || []);
      }
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

    const selectedPatient = patients.find((p) => p.id === patientId);

    const html = generatePrescriptionHTML({
      patientName: selectedPatient?.full_name || 'Patient',
      age: selectedPatient?.age?.toString() || '—',
      date: new Date().toLocaleDateString(),
      medications,
      doctorName: doctorName || 'Unknown',
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

        const { data: publicURLData } = supabase.storage
          .from('prescriptions')
          .getPublicUrl(fileName);

        await supabase
          .from('prescriptions')
          .update({ image_url: publicURLData.publicUrl })
          .eq('prescription_id', prescriptionId);

        Alert.alert('Success', 'Prescription uploaded.');
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

        <Text style={styles.label}>Select Patient</Text>
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

    <Text style={styles.label}>Name</Text>
    <TextInput
      style={styles.input}
      placeholder="e.g. Paracetamol"
      value={med.medicine_name}
      onChangeText={(val) => handleChange(index, 'medicine_name', val)}
    />

    <Text style={styles.label}>Dosage</Text>
    <TextInput
      style={styles.input}
      placeholder="e.g. 500mg"
      value={med.dosage}
      onChangeText={(val) => handleChange(index, 'dosage', val)}
    />

    <Text style={styles.label}>Duration (End Date)</Text>
<TouchableOpacity
  style={styles.input}
  onPress={() => setShowDatePickerIndex(index)}
>
  <Text>
    {med.duration
      ? new Date(med.duration).toLocaleDateString()
      : 'Select end date'}
  </Text>
</TouchableOpacity>

{showDatePickerIndex === index && (
  <DateTimePicker
    value={med.duration ? new Date(med.duration) : new Date()}
    mode="date"
    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
    onChange={(_, selectedDate) => {
      setShowDatePickerIndex(null); // Close after selection
      if (selectedDate) {
        handleChange(index, 'duration', selectedDate.toISOString());
      }
    }}
  />
)}

    <Text style={styles.label}>Instructions</Text>
    <TextInput
      style={[styles.input, { height: 60 }]}
      placeholder="Optional instructions"
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

        <TouchableOpacity style={styles.button} onPress={sendPrescription}>
          <Text style={styles.buttonText}>Preview Prescription</Text>
        </TouchableOpacity>

        <Modal visible={showPreview} animationType="slide">
          <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
            <View style={{ flex: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              <WebView originWhitelist={['*']} source={{ html: htmlContent }} />
            </View>
            <TouchableOpacity style={styles.button} onPress={confirmUpload}>
              <Text style={styles.buttonText}>Upload</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#999', marginTop: 10 }]}
              onPress={() => setShowPreview(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
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
  fontSize: 13,
  fontWeight: '600',
  color: '#111', // Strong black
  marginTop: 10,
  marginBottom: 4,
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
  button: {
    backgroundColor: '#15BE77',
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
});
