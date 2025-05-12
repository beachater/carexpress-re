// Final merged HomeScreen.tsx — includes original layout + medicine search bar functionality

import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Background from '../../components/Background';
import useNearestPharmacies from '../../hooks/useNearestPharmacies';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const [healthTip, setHealthTip] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedPharmacies, setSearchedPharmacies] = useState([]);
  const [searching, setSearching] = useState(false);
  const [noMatches, setNoMatches] = useState(false);
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { nearestPharmacies, loading, error } = useNearestPharmacies();
  const scaleRefs = useRef<Animated.Value[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);

  const tips = [
    '💡 Stay hydrated! Drink 8 glasses of water daily.',
    '🧘‍♀️ Take 10 minutes a day to relax and breathe deeply.',
    '🥦 Eat green vegetables daily for essential vitamins.',
    '🏃‍♂️ Walk at least 30 minutes a day to stay active.',
    '😴 Get 7–9 hours of sleep every night.',
  ];

  useEffect(() => {
    const shuffleTip = () => {
      const randomIndex = Math.floor(Math.random() * tips.length);
      setHealthTip(tips[randomIndex]);
      slideAnim.setValue(50);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    };
    shuffleTip();
    const intervalId = setInterval(shuffleTip, 8000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (nearestPharmacies.length) {
      scaleRefs.current = nearestPharmacies.map(() => new Animated.Value(1));
    }
  }, [nearestPharmacies]);

  const handleSearchMedicine = async () => {
  if (!searchQuery.trim()) return;
  setSearching(true);
  setNoMatches(false);
  try {
    const { data: meds } = await supabase
      .from('medicines')
      .select('pharmacy_id')
      .ilike('name', `%${searchQuery.trim()}%`);

    if (!meds || meds.length === 0) {
      setNoMatches(true);
      setSearchedPharmacies([]);
      setShowOverlay(true);
      return;
    }

    const matchingPharmacyIds = meds.map((m) => m.pharmacy_id);
    const filtered = nearestPharmacies.filter((pharm) =>
      matchingPharmacyIds.includes(pharm.id)
    );
    setSearchedPharmacies(filtered);
    setShowOverlay(true);
  } catch (err) {
    console.error('Search error:', err);
  } finally {
    setSearching(false);
  }
};

  const getUrgencyStyle = (daysLeft: number) => {
    if (daysLeft <= 1) return { color: '#DC2626', fontWeight: '700' };
    if (daysLeft <= 3) return { color: '#F97316', fontWeight: '600' };
    return {};
  };
  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft <= 1) return '#DC2626';
    if (daysLeft <= 3) return '#F97316';
    return '#22c55e';
  };

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>Find the{' '}Care You Need</Text>

          {/* Medicine Search */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Search for a Medicine</Text>
            <TextInput
              placeholder="What do you want to order?"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchMedicine}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {searchQuery !== '' && noMatches && (
              <Text style={styles.detailText}>No pharmacies found for that medicine.</Text>
            )}
          </View>

          {/* Health Tip */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🩺 Health Tip</Text>
            <Animated.Text style={[styles.healthTip, { transform: [{ translateX: slideAnim }], opacity: opacityAnim }]}> {healthTip} </Animated.Text>
          </View>

          {/* Refill Reminders */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Refill Reminders</Text>
            <View style={styles.reminderList}>
              {[{ name: 'Metformin', daysLeft: 3 }, { name: 'Amlodipine', daysLeft: 6 }].map((item, index) => (
                <View
                  key={index}
                  style={[styles.reminderCard, { borderLeftColor: getUrgencyColor(item.daysLeft) }]}
                >
                  <View style={styles.iconBubble}><Text style={styles.iconText}>⏰</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderName}>{item.name}</Text>
                    <Text style={[styles.daysLeft, getUrgencyStyle(item.daysLeft)]}>{item.daysLeft} {item.daysLeft === 1 ? 'day' : 'days'} left</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Search Results */}
          {/* {searchQuery && searchedPharmacies.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>📍 Pharmacies with "{searchQuery}"</Text>
              {searchedPharmacies.map((pharm, index) => (
                <TouchableOpacity
                  key={pharm.id}
                  style={styles.pharmacyCard}
                  onPress={() => router.push({ pathname: '/patient/pharmacy/[id]', params: { id: pharm.id } })}
                >
                  <Text style={styles.pharmacyName}>{pharm.name}</Text>
                  <Text style={styles.distanceText}>{pharm.distance?.toFixed(2)} km away</Text>
                </TouchableOpacity>
              ))}
            </View>
          )} */}

          {/* Nearest Pharmacies */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Nearest Pharmacies</Text>
              <TouchableOpacity></TouchableOpacity>
            </View>
            {loading ? (
              <Text style={styles.detailText}>Getting your location...</Text>
            ) : error ? (
              <Text style={styles.detailText}>Error: {error}</Text>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
                  {nearestPharmacies.slice(0, 5).map((pharm, index) => {
                    const scale = scaleRefs.current[index] || new Animated.Value(1);
                    return (
                      <TouchableWithoutFeedback
                        key={pharm.id || index}
                        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()}
                        onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }).start()}
                        onPress={() => router.push({ pathname: '/patient/pharmacy/[id]', params: { id: pharm.id } })}
                      >
                        <Animated.View
                          style={[styles.pharmacyCard, {
                            transform: [{ scale }],
                            marginRight: index !== nearestPharmacies.length - 1 ? 12 : 0,
                            marginLeft: index === 0 ? 8 : 0,
                          }]}
                        >
                          <View style={styles.logoWrapper}>
                            {pharm.logo_url ? (
                              <Image source={{ uri: pharm.logo_url }} style={styles.pharmacyImage} resizeMode="contain" />
                            ) : (
                              <Text style={styles.placeholderIcon}>🏥</Text>
                            )}
                          </View>
                          <Text style={styles.pharmacyName}>{pharm.name}</Text>
                          <Text style={styles.distanceText}>{pharm.distance?.toFixed(2)} km away</Text>
                        </Animated.View>
                      </TouchableWithoutFeedback>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity style={styles.mapButton} onPress={() => router.push('/patient/map.modal')}>
                  <Text style={styles.mapButtonText}>View Pharmacies on Map</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Guidance Message */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🧾 Browse Medicines</Text>
            <Text style={styles.detailText}>
              Select a pharmacy above to view and order available medicines.
            </Text>
          </View>

          <Modal
  visible={showOverlay}
  transparent
  animationType="fade"
  onRequestClose={() => setShowOverlay(false)}
>
  <View style={styles.overlayContainer}>
    <View style={styles.overlayCard}>
      <Text style={styles.sectionTitle}>📍 Pharmacies with "{searchQuery}"</Text>
      <ScrollView showsVerticalScrollIndicator={false}>
        {searchedPharmacies.length === 0 ? (
          <Text style={styles.detailText}>No pharmacies found.</Text>
        ) : (
          searchedPharmacies.map((pharm, index) => (
            <TouchableWithoutFeedback
              key={pharm.id}
              onPress={() => {
                setShowOverlay(false);
                router.push({ pathname: '/patient/pharmacy/[id]', params: { id: pharm.id } });
              }}
            >
              <View style={styles.overlayPharmacyCard}>
                <View style={styles.logoWrapper}>
                  {pharm.logo_url ? (
                    <Image
                      source={{ uri: pharm.logo_url }}
                      style={styles.pharmacyImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.placeholderIcon}>🏥</Text>
                  )}
                </View>
                <View style={styles.overlayTextContainer}>
                  <Text style={styles.pharmacyName}>{pharm.name}</Text>
                  <Text style={styles.distanceText}>{pharm.distance?.toFixed(2)} km away</Text>
                </View>
              </View>
            </TouchableWithoutFeedback>
          ))
        )}
      </ScrollView>
      <TouchableOpacity style={styles.mapButton} onPress={() => setShowOverlay(false)}>
        <Text style={styles.mapButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}


/* ... rest of your HomeScreen component code remains unchanged ... */

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
    paddingTop: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
    lineHeight: 34,
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#065F46',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  healthTip: {
    fontSize: 14,
    color: '#555',
  },
  detailText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
  },
  horizontalList: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  pharmacyCard: {
    width: 140,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  logoWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pharmacyImage: {
    width: 72,
    height: 72,
  },
  placeholderIcon: {
    fontSize: 24,
    color: '#22c55e',
  },
  pharmacyName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#6B7280',
  },
  mapButton: {
    backgroundColor: '#15BE77',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  reminderList: {
    gap: 12,
    marginTop: 8,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
    color: '#16a34a',
  },
  reminderName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  daysLeft: {
    fontSize: 12,
    color: '#6B7280',
  },
 overlayContainer: {
  flex: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(4px)', // this works only on web, use expo-blur for native
  justifyContent: 'center',
  alignItems: 'center',
},

overlayCard: {
  width: '90%',
  backgroundColor: '#fff',
  padding: 20,
  borderRadius: 20,
  maxHeight: '80%',
},
overlayPharmacyCard: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#fff',
  padding: 12,
  borderRadius: 16,
  marginTop: 12,
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowOffset: { width: 0, height: 1 },
  shadowRadius: 4,
  elevation: 1,
},
overlayTextContainer: {
  // flex: 0,
  marginLeft: 12,
  // justifyContent: 'flex-start'
},
});

