import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useJournal } from '../src/store';
import { copy } from '../src/text';
import { Button, colors, Page, styles } from '../src/ui';

export default function SeasonalPlaces() {
  const { journal: { language, seasonalPlaces = [] }, addSeasonalPlace } = useJournal();
  const t = copy[language];
  const [name, setName] = useState('');
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const lock = useRef(false);
  async function add() {
    if (lock.current || !name.trim()) return;
    lock.current = true; setBusy(true); setError(false);
    try {
      const id = await addSeasonalPlace(name, hint);
      setName(''); setHint('');
      router.push({ pathname: '/seasonal-place/[id]', params: { id } });
    } catch { setError(true); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Page>
    <Button title={t.back} icon="arrow-back" tone="quiet" disabled={busy} onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/'); }} />
    <Text accessibilityRole="header" style={styles.title}>{t.seasonPlaces}</Text>
    <Text style={styles.body}>{t.seasonIntro}</Text>
    {seasonalPlaces.map(place => <Pressable key={place.id} style={styles.card} accessibilityRole="button" disabled={busy}
      onPress={() => router.push({ pathname: '/seasonal-place/[id]', params: { id: place.id } })}>
      <Text style={styles.heading}>{place.name}</Text>
      {!!place.frameHint && <Text style={styles.body}>{place.frameHint}</Text>}
      <Text style={styles.small}>{place.visits.length} {t.seasonVisits}</Text>
    </Pressable>)}
    {!seasonalPlaces.length && <Text style={styles.body}>{t.seasonNoPlaces}</Text>}
    <View style={styles.card}>
      <Text style={styles.heading}>{t.seasonAddPlace}</Text>
      <TextInput accessibilityLabel={t.seasonPlaceName} value={name} onChangeText={setName} maxLength={60}
        editable={!busy} style={styles.input} placeholder={t.seasonNamePlaceholder} placeholderTextColor={colors.muted} />
      <TextInput accessibilityLabel={t.seasonFrameHint} value={hint} onChangeText={setHint} maxLength={160}
        editable={!busy} style={[styles.input, { minHeight: 85, paddingVertical: 12 }]} multiline textAlignVertical="top"
        placeholder={t.seasonFramePlaceholder} placeholderTextColor={colors.muted} />
      <Button title={t.seasonAddPlace} icon="add-circle-outline" disabled={busy || !name.trim()} onPress={() => { void add(); }} />
      {error && <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>}
    </View>
  </Page>;
}
