import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function AuthIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/auth/signup'); // or '/auth/login'
  }, []);

  return null;
}
