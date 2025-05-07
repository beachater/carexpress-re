import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import useNearestPharmacies from '../../hooks/useNearestPharmacies';
import Background from '../../components/Background';

export default function HomeScreen() {
  const router = useRouter();
  const healthTip = '💡 Stay hydrated! Drink 8 glasses of water daily.';

  const refillReminders = [
    { name: 'Metformin', daysLeft: 3 },
    { name: 'Amlodipine', daysLeft: 6 },
  ];

  const { nearestPharmacies, loading, error } = useNearestPharmacies();
  const scaleRefs = useRef<Animated.Value[]>([]);

  useEffect(() => {
    if (nearestPharmacies.length) {
      scaleRefs.current = nearestPharmacies.map(() => new Animated.Value(1));
    }
  }, [nearestPharmacies]);

  const getUrgencyStyle = (daysLeft: number) => {
    if (daysLeft <= 1) return { color: '#DC2626', fontWeight: '700' }; // Red
    if (daysLeft <= 3) return { color: '#F97316', fontWeight: '600' }; // Orange
    return {}; // Default style
  };
  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft <= 1) return '#DC2626'; // red
    if (daysLeft <= 3) return '#F97316'; // orange
    return '#22c55e'; // green
  };
  


  

  return (
    <Background>
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <Text style={styles.header}>Find the{'\n'}Care You Need</Text>

          {/* Health Tip */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🩺 Health Tip</Text>
            <Text style={styles.healthTip}>{healthTip}</Text>
          </View>

          {/* Refill Reminders */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>💊 Refill Reminders</Text>
            <View style={styles.reminderList}>
            {refillReminders.map((item, index) => (
              <View
              key={index}
              style={[
                styles.reminderCard,
                { borderLeftColor: getUrgencyColor(item.daysLeft) },
              ]}
            >
            
                <View style={styles.iconBubble}>
                  <Text style={styles.iconText}>⏰</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderName}>{item.name}</Text>
                  <Text style={[styles.daysLeft, getUrgencyStyle(item.daysLeft)]}>
  {item.daysLeft} {item.daysLeft === 1 ? 'day' : 'days'} left
</Text>
                </View>
              </View>
            ))}
          </View>

          </View>

          {/* Nearest Pharmacies */}
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>📍 Nearest Pharmacies</Text>
              {/* <TouchableOpacity onPress={() => router.push('/patient/pharmacy-list')}> */}
              <TouchableOpacity>
                <Text style={styles.viewMoreBtn}>View More</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <Text style={styles.detailText}>Getting your location...</Text>
            ) : error ? (
              <Text style={styles.detailText}>Error: {error}</Text>
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalList}
                >
                  {nearestPharmacies.slice(0, 5).map((pharm, index) => {
                    const scale = scaleRefs.current[index] || new Animated.Value(1);

                    const handlePressIn = () => {
                      Animated.spring(scale, {
                        toValue: 0.96,
                        useNativeDriver: true,
                      }).start();
                    };

                    const handlePressOut = () => {
                      Animated.spring(scale, {
                        toValue: 1,
                        friction: 3,
                        useNativeDriver: true,
                      }).start();
                    };

                    return (
                      <TouchableWithoutFeedback
                        key={pharm.id || index}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        onPress={() =>
                          router.push({
                            pathname: '/patient/pharmacy/[id]',
                            params: { id: pharm.id },
                          })
                        }
                      >
                        <Animated.View
                          style={[
                            styles.pharmacyCard,
                            {
                              transform: [{ scale }],
                              marginRight:
                                index !== nearestPharmacies.length - 1 ? 12 : 0,
                              marginLeft: index === 0 ? 8 : 0,
                            },
                          ]}
                        >
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
                          <Text style={styles.pharmacyName}>{pharm.name}</Text>
                          <Text style={styles.distanceText}>
                            {pharm.distance?.toFixed(2)} km away
                          </Text>
                        </Animated.View>
                      </TouchableWithoutFeedback>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity
                  style={styles.mapButton}
                  onPress={() => router.push('/patient/map.modal')}
                >
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
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

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
  viewMoreBtn: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
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
  accent: {
    color: '#22c55e',
    fontWeight: '600',
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
  
});
