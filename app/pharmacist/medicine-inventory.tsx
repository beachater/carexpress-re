// screens/pharmacy/medicine.tsx

import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Background from '../../components/Background';
import { supabase } from '../../lib/supabase';

export default function PharmacyMedicineScreen() {
  const [medicines, setMedicines] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [pharmacyId, setPharmacyId] = useState('');

  useEffect(() => {
    const fetchPharmacyId = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('pharmacy_id')
          .eq('id', userData.user.id)
          .single();

        if (profile?.pharmacy_id) {
          setPharmacyId(profile.pharmacy_id);
          fetchMedicines(profile.pharmacy_id);
        }
      }
    };

    const fetchMedicines = async (id) => {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .eq('pharmacy_id', id)
        .order('created_at', { ascending: false });

      if (!error && data) setMedicines(data);
    };

    fetchPharmacyId();
  }, []);

  const handleAddMedicine = async () => {
    if (!name || !price || !pharmacyId) {
      Alert.alert('Error', 'Name, price, and pharmacy must be filled.');
      return;
    }

    const { error } = await supabase.from('medicines').insert({
      name,
      price: parseFloat(price),
      description,
      pharmacy_id: pharmacyId,
    });

    if (error) {
      Alert.alert('Failed to add medicine', error.message);
    } else {
      setName('');
      setPrice('');
      setDescription('');
      Alert.alert('Success', 'Medicine added.');
      const { data } = await supabase
        .from('medicines')
        .select('*')
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false });
      setMedicines(data);
    }
  };

  return (
    <Background>
      <View style={styles.container}>
        <Text style={styles.title}>Add Medicine</Text>
        <TextInput
          style={styles.input}
          placeholder="Medicine Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TouchableOpacity style={styles.button} onPress={handleAddMedicine}>
          <Text style={styles.buttonText}>Add Medicine</Text>
        </TouchableOpacity>

        <Text style={styles.listTitle}>Your Medicines</Text>
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.medicineCard}>
              <Text style={styles.medicineName}>{item.name}</Text>
              <Text style={styles.medicineInfo}>₱{item.price}</Text>
              {item.description ? (
                <Text style={styles.medicineInfo}>{item.description}</Text>
              ) : null}
            </View>
          )}
        />
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#15BE77',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  medicineCard: {
    padding: 14,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    marginTop: 8,
  },
  medicineName: {
    fontWeight: '700',
    fontSize: 16,
  },
  medicineInfo: {
    fontSize: 14,
    color: '#555',
  },
});
