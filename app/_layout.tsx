import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Text } from 'react-native';
import { JournalProvider, useJournal } from '../src/store';
import { copy } from '../src/text';
import { Button, colors, Page, styles } from '../src/ui';

function Routes() {
  const { status, journal, load } = useJournal();
  const t = copy[journal.language];
  if (status !== 'ready') {
    return <Page>{status === 'loading' ? <ActivityIndicator color={colors.forest} /> : <>
      <Text style={styles.body}>{t.storageError}</Text>
      <Button title={t.retry} icon="reload" onPress={() => { void load(); }} />
    </>}</Page>;
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.cream } }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={Boolean(journal.profile)}>
        <Stack.Screen name="mission" />
        <Stack.Screen name="book" />
        <Stack.Screen name="memory/[id]" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return <JournalProvider><StatusBar style="dark" /><Routes /></JournalProvider>;
}
