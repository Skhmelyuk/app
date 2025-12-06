import { useAuth } from '@clerk/clerk-expo';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

export default function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  const segmants = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthScreen = segmants[0] === '(auth)';
    if (!isSignedIn && !inAuthScreen) {
      router.replace('/(auth)/login');
    } else if (isSignedIn && inAuthScreen) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn, isLoaded, segmants, router]);

  if (!isLoaded) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
