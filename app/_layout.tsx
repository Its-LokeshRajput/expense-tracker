import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Text } from 'react-native';
import { initDB } from '../constants/db';
import { UserProvider } from '../hooks/UserContext';


export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDB().then(() => setReady(true));
  }, []);

  if (Platform.OS === 'web') return null;

  if (!ready) {
    return <Text>Loading database...</Text>;
  }

  return (
    <UserProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </UserProvider>
  );
}
