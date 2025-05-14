import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function DoctorTabsLayout() {
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
        name="index"
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="medicine-inventory"
        options={{
          tabBarLabel: 'Inventory',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="cart-outline" color={color} size={size} />
          ),
        }}
      />
{/* 
      <Tabs.Screen
        name="/prescription/[id]"
        options={{
          href: null, // hides it from tabs
        }}
      /> */}
    
      
    </Tabs>
  );
}
