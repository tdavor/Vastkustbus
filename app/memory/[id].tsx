import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { dateLabel, MemoryPhoto, placeLabel } from '../../src/memory';
import { avatars, levelFor, missions } from '../../src/missions';
import { photoFile, useJournal } from '../../src/store';
import { printImage } from '../../src/printing';
import { rewardsCopy } from '../../src/rewards';
import { appName, copy } from '../../src/text';
import { Animal, Button, colors, Page, styles } from '../../src/ui';

export default function MemoryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { journal: { language, memories, profile, rewards }, xp, updateRewards } = useJournal();
  const memory = memories.find(item => item.id === id);
  const t = copy[language];
  const r = rewardsCopy[language];
  const preview = useRef<View>(null);
  const sharing = useRef(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [printError, setPrintError] = useState(false);
  const [favoriteError, setFavoriteError] = useState(false);

  async function share() {
    if (!preview.current || sharing.current || !ready) return;
    sharing.current = true;
    setBusy(true);
    setError(false);
    try {
      if (!await Sharing.isAvailableAsync()) throw new Error('Sharing unavailable');
      const uri = await captureRef(preview, { format: 'png', result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: appName });
    } catch {
      setError(true);
    } finally {
      sharing.current = false;
      setBusy(false);
    }
  }

  async function printPhoto() {
    if (!memory || !ready || sharing.current) return;
    sharing.current = true;
    setBusy(true);
    setPrintError(false);
    try { await printImage(photoFile(memory.photo).uri); }
    catch { setPrintError(true); }
    finally { sharing.current = false; setBusy(false); }
  }

  const place = memory && placeLabel(memory, language);
  return (
    <Page>
      <Button title={t.back} icon="arrow-back" tone="quiet" disabled={busy}
        onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/book'); }} />
      {memory && profile ? <>
        <View ref={preview} collapsable={false} style={[styles.card, { backgroundColor: colors.paleGreen, borderWidth: 6, borderColor: colors.forest }]}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.heading}>{appName}</Text>
              <Text style={styles.small}>{t.postcard}</Text>
            </View>
            <Ionicons name="compass" size={27} color={colors.forest} />
          </View>
          <MemoryPhoto key={memory.id} memory={memory} language={language} onLoaded={() => setReady(true)} />
          <Text style={styles.heading}>{missions.find(item => item.id === memory.missionId)?.title[language] ?? t.mission}</Text>
          <Text style={styles.small}>{place && place !== t.city ? `${place} · ` : ''}{t.city} · {dateLabel(memory, language)}</Text>
          <View style={styles.row}>
            <Animal avatar={profile.avatar} size={45} />
            <Text style={styles.brand}>{avatars[profile.avatar][language]} · {t.level} {levelFor(xp)}</Text>
          </View>
        </View>
        <Button title={t.share} icon="share-social-outline" tone="yellow" disabled={!ready || busy}
          onPress={() => { void share(); }} />
        <Button title={t.makeColoring} icon="color-palette-outline" disabled={!ready || busy}
          onPress={() => router.push({ pathname: '/coloring/[id]', params: { id: memory.id } })} />
        <Button title={t.printPhoto} icon="print-outline" tone="quiet" disabled={!ready || busy}
          onPress={() => { void printPhoto(); }} />
        {printError && <Text accessibilityRole="alert" style={styles.error}>{t.printError}</Text>}
        {rewards.unlocked.includes(1500) && <Button title={rewards.favorite === memory.id ? r.chosen : r.favorite}
          icon={rewards.favorite === memory.id ? 'star' : 'star-outline'} tone="quiet" disabled={rewards.favorite === memory.id}
          onPress={() => {
            setFavoriteError(false);
            void updateRewards(previous => ({ ...previous, favorite: memory.id })).catch(() => setFavoriteError(true));
          }} />}
        {favoriteError && <Text accessibilityRole="alert" style={styles.error}>{t.saveError}</Text>}
        <Text style={styles.small}>{t.offline}</Text>
        {error && <Text accessibilityRole="alert" style={styles.error}>{t.sharingError}</Text>}
      </> : <Text style={styles.body}>{t.missing}</Text>}
    </Page>
  );
}
