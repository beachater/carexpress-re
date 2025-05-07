import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { useCart } from '../../../context/CartContext';
import Background from '../../../components/Background';

type Medicine = {
  id: string;
  name: string;
  price: number;
  pharmacy_id: string;
};

export default function PharmacyDetails() {
  const { id } = useLocalSearchParams();
  const { addToCart, cart } = useCart();

  const [pharmacy, setPharmacy] = useState<any>(null);
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data: pharmacyData } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', id)
        .single();

      const { data: medsData } = await supabase
        .from('medicines')
        .select('id, name, price, pharmacy_id')
        .eq('pharmacy_id', id);

      setPharmacy(pharmacyData);
      setMeds(medsData || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleAddToCart = (med: Medicine) => {
    if (cart.length > 0 && cart[0].pharmacy_id !== med.pharmacy_id) {
      Alert.alert(
        "Cart Conflict",
        "Your cart contains items from another pharmacy. Please clear it before adding new items."
      );
      return;
    }

    addToCart({
      name: med.name,
      price: med.price,
      pharmacy_id: med.pharmacy_id,
      pharmacy_name: pharmacy.name,
    });
    
    Alert.alert("Added to Cart", `${med.name} has been added.`);
  };

  const filteredMeds = meds.filter((med) =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Background>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Browse the Meds{'\n'}You Need</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <TextInput
            placeholder="What do you want to order?"
            placeholderTextColor="#aaa"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tag */}
        {searchQuery ? (
          <View style={styles.filterTag}>
            <Text style={styles.filterText}>{searchQuery}</Text>
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.header}>{pharmacy?.name}</Text>

        {/* Medicine List */}
        {filteredMeds.length === 0 ? (
          <Text style={styles.detailText}>No medicines found.</Text>
        ) : (
          filteredMeds.map((med) => (
            <View key={med.id} style={styles.medCard}>
              
              <View>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.pharmName}>{pharmacy?.name}</Text>
              </View>
              <View style={styles.sideRow}>
                <Text style={styles.price}>₱{med.price.toFixed(2)}</Text>
                <TouchableOpacity
                  style={styles.cartButton}
                  onPress={() => handleAddToCart(med)}
                >
                  <Text style={styles.cartButtonText}>Add to Cart</Text>
                </TouchableOpacity>
              </View>
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
    paddingBottom: 60,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  searchBar: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    fontSize: 14,
    color: '#333',
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00C58E',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  filterText: {
    color: '#fff',
    fontSize: 13,
  },
  clearText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  medCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  medName: {
    fontSize: 14,
    fontWeight: '600',
  },
  pharmName: {
    fontSize: 12,
    color: '#888',
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C58E',
    marginBottom: 6,
    textAlign: 'right',
  },
  sideRow: {
    alignItems: 'flex-end',
  },
  cartButton: {
    backgroundColor: '#00C58E',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailText: {
    fontSize: 14,
    color: '#444',
  },
});
