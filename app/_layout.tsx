import { Stack } from 'expo-router';
import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BabyProvider } from '@/contexts/BabyContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';

function RootNavigator() {
  const router = useRouter();

  useEffect(() => {
    // Handle deep links (when app is already open)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 Deep link received:', url);
      handleDeepLink(url);
    });

    // Handle initial URL (when app opens via link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial URL:', url);
        handleDeepLink(url);
      }
    });

    return () => subscription.remove();
  }, []);

  const handleDeepLink = (url: string) => {
    // Parse babycare://watch/1234
    const match = url.match(/babycare:\/\/watch\/(\d{4})/);
    if (match && match[1]) {
      const streamKey = match[1];
      console.log('✅ Navigating to stream:', streamKey);
      router.push(`/watch/${streamKey}`);
    } else {
      console.log('❌ Invalid deep link format:', url);
    }
  };

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="watch/[key]" 
        options={{ 
          headerShown: true,
          title: 'Baby Monitor Stream',
          presentation: 'card'
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <SettingsProvider>
          <BabyProvider>
            <RootNavigator />
          </BabyProvider>
        </SettingsProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
