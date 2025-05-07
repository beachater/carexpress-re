import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from '../context/CartContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </CartProvider>
    </SafeAreaProvider>
  );
}
