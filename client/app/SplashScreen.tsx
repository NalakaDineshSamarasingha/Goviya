import { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2000); // Show splash for 2 seconds
    return () => clearTimeout(timer);
  }, []);
  return (
    <View style={styles.container}>
      <Image source={require('../assets/images/goviya.png')} style={styles.logo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
});
