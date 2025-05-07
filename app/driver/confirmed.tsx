import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import Background from '../../components/Background';
import { useLocalSearchParams } from 'expo-router';

export default function ConfirmDeliveryScreen() {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [receipt, setReceipt] = useState(null);
  const { name } = useLocalSearchParams();

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setReceipt(result.assets[0].uri);
    }
  };

  return (
    <Background>
      <View style={styles.container}>
        <Text style={styles.title}>Confirm Delivery</Text>
        <Text style={styles.subtext}>
          After filling, users receive a proof of delivery (POD) and invoice/receipt if applicable.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Recipient's Name</Text>
          <View style={styles.outlinedBox}><Text>{name}</Text></View>

          <View style={styles.row}>
            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>Delivery Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.outlinedBox}>
                <Text>{date.toDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  onChange={(_, selected) => {
                    const currentDate = selected || date;
                    setShowDatePicker(Platform.OS === 'ios');
                    setDate(currentDate);
                  }}
                />
              )}
            </View>

            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>Delivery Time</Text>
              <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.outlinedBox}>
                <Text>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="default"
                  onChange={(_, selected) => {
                    const currentTime = selected || time;
                    setShowTimePicker(Platform.OS === 'ios');
                    setTime(currentTime);
                  }}
                />
              )}
            </View>
          </View>

          <Text style={styles.label}>Confirmation Number</Text>
          <TextInput
            value={confirmationNumber}
            onChangeText={setConfirmationNumber}
            style={styles.outlinedBox}
            placeholder="Enter confirmation number"
          />

          <Text style={styles.label}>Invoice or Receipt</Text>
          <TouchableOpacity onPress={handlePickImage} style={styles.outlinedBox}>
            {receipt ? (
              <Image source={{ uri: receipt }} style={styles.receiptImage} />
            ) : (
              <Text style={{ color: '#888' }}>Upload Invoice or Receipt</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitBtn}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtext: { color: '#555', marginBottom: 16 },
  form: {
    borderWidth: 1,
    borderColor: '#00C58E',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  label: { fontWeight: '600', marginBottom: 4 },
  outlinedBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  row: { flexDirection: 'row', gap: 12 },
  halfInputGroup: { flex: 1 },
  receiptImage: { width: '100%', height: 100, borderRadius: 8 },
  submitBtn: {
    backgroundColor: '#00C58E',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
