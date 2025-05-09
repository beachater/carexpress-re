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
          tabBarLabel: 'Prescribe Medicines',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="qr-code-outline" color={color} size={size} />
          ),
        }}
      />
    
      
    </Tabs>
  );
}
