import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Background from '../../components/Background';

export default function PatientTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00C58E',
        tabBarInactiveTintColor: '#aaa',
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="map.modal"
        options={{
          href: null, // hides it from tabs
        }}
      />

<Tabs.Screen
        name="pharmacy/[id]"
        options={{
          href: null, // hides it from tabs
        }}
      />

<Tabs.Screen
        name="track"
        options={{
          href: null, // hides it from tabs
        }}
      />

      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanQR"
        options={{
          tabBarLabel: 'Scan QR',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="qr-code-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="cart-outline" color={color} size={size} />
          ),
        }}
      />
      
    
      
    </Tabs>
  );
}
