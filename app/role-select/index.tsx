import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Background from '../../components/Background';



const roles = [
  { label: 'Doctor', value: 'doctor', icon: '🩺' },
  { label: 'Pharmacist', value: 'pharmacist', icon: '💊' },
  { label: 'Driver', value: 'driver', icon: '🏍️' },
  { label: 'Customer', value: 'patient', icon: '👤' },
];

export default function RoleSelect() {
  const router = useRouter();

  return (
   
    <Background>
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.innerContent}>
      <Text style={styles.title}>Welcome to CareXpress</Text>
      <Text style={styles.subtitle}>What brings you here today?</Text>

      <View style={styles.buttonGroup}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.value}
            style={styles.buttonWrapper}
            onPress={() => router.push({ pathname: '/auth', params: { role: role.value } })}
          >
            <LinearGradient
              colors={['#53E88B', '#15BE77']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.icon}></Text>
              <Text style={styles.buttonText}>{role.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  </SafeAreaView>
</Background>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#fff',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonGroup: {
    
    width: '90%',
    marginTop: 24,
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden', // ensures gradient corners don't overflow
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },  
  icon: {
    fontSize: 20,
    marginRight: 10,
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
  },
  innerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
});
