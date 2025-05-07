import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { signInWithEmail, supabase } from '@/lib/supabase';
import Background from '../../components/Background';

export default function LoginScreen() {
  const router = useRouter();
  const { role: initialRole } = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState((initialRole as string) || 'patient');

  const handleLogin = async () => {
    const { error } = await signInWithEmail(email, password);
    if (error) return Alert.alert('Login failed', error.message);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Alert.alert('Error', 'User not found');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) return;

    switch (profile.role) {
      case 'doctor':
        router.replace('/doctor');
        break;
      case 'pharmacist':
        router.replace('/pharmacist');
        break;
      case 'driver':
        router.replace('/driver');
        break;
      default:
        router.replace('/patient');
    }
  };

  return (
    <Background>   
    <SafeAreaView style={styles.container}>
      <View style={styles.logoWrapper}>
          <Image
              source={require('@/assets/images/carexpress-logo.png')}
              style={styles.logo}
              resizeMode="contain"
          />
          </View>

      <Text style={styles.heading}>Login To Your Account</Text>

      <View style={styles.inputWrapper}>
        <Icon name="mail" size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Icon name="lock" size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />
      </View>

      <View style={styles.checkRow}>
        <View style={styles.circleCheck}><Icon name="check" size={12} color="#fff" /></View>
        <Text style={styles.checkLabel}>Keep Me Signed In</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/auth/signup')}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    // backgroundColor: '#fff',
  },
  logoWrapper: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: '200%',
    height: undefined,
    aspectRatio: 2.5, // Adjust this to match your logo's shape
    // alignSelf: 'center',
    // marginBottom: 24,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    color: '#111827',
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  inputIcon: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 1,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingLeft: 44,
    fontSize: 16,
    color: '#111827',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  circleCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#15BE77',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkLabel: {
    fontSize: 14,
    color: '#111',
  },
  button: {
    backgroundColor: '#15BE77',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    color: '#22c55e',
    marginTop: 16,
    fontSize: 14,
  },
});
