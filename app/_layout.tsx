import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Text, useWindowDimensions, View } from 'react-native';
import { ParentGateProvider } from '../src/parent-gate';
import { JournalProvider, useJournal } from '../src/store';
import { UpdatesProvider, useStartupUpdate } from '../src/updates';
import { appName, copy } from '../src/text';
import { Button, colors, Page, styles } from '../src/ui';

void SplashScreen.preventAutoHideAsync().catch(() => {});

function StartupScreen() {
  const { width, height } = useWindowDimensions();
  const size = Math.min(240, width * 0.64, height * 0.45);
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Image source={require('../assets/launcher.png')} resizeMode="contain"
        style={{ width: size, height: size, borderRadius: 34 }}
        onLoadEnd={() => { void SplashScreen.hideAsync().catch(() => {}); }} />
      <Text accessibilityRole="header" style={[styles.title, { textAlign: 'center' }]}>{appName}</Text>
    </View>
  );
}

function Routes() {
  const { status, journal, load } = useJournal();
  const t = copy[journal.language];
  const [showStartup, setShowStartup] = useState(true);
  useEffect(() => {
    const timeout = setTimeout(() => setShowStartup(false), 750);
    return () => clearTimeout(timeout);
  }, []);
  useEffect(() => {
    if (!showStartup && status !== 'loading') void SplashScreen.hideAsync().catch(() => {});
  }, [showStartup, status]);
  useStartupUpdate(status === 'ready' && !showStartup, journal.language);
  if (showStartup || status === 'loading') return <StartupScreen />;
  if (status !== 'ready') {
    return <Page>
      <Text style={styles.body}>{t.storageError}</Text>
      <Button title={t.retry} icon="reload" onPress={() => { void load(); }} />
    </Page>;
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={Boolean(journal.profile)}>
        <Stack.Screen name="mission" />
        <Stack.Screen name="book" />
        <Stack.Screen name="seasonal-places" />
        <Stack.Screen name="seasonal-place/[id]" />
        <Stack.Screen name="family-book" />
        <Stack.Screen name="artwork/[id]" />
        <Stack.Screen name="rewards" />
        <Stack.Screen name="discover-gothenburg" />
        <Stack.Screen name="discover-city/index" />
        <Stack.Screen name="discover-city/[countryId]" />
        <Stack.Screen name="city/[id]" />
        <Stack.Screen name="landmark-photo/[id]" />
        <Stack.Screen name="slideshow" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="memory/[id]" />
        <Stack.Screen name="coloring/[id]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return <JournalProvider><ParentGateProvider><UpdatesProvider><StatusBar style="dark" /><Routes /></UpdatesProvider></ParentGateProvider></JournalProvider>;
}
