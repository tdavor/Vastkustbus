import { useParentalGate } from '../src/parent-gate';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { MemoryPhoto } from '../src/memory';
import { milestones, rewardsCopy, type Accessory, type RewardText } from '../src/rewards';
import { useJournal } from '../src/store';
import { copy } from '../src/text';
import { Button, Chip, colors, ExplorerAvatar, Page, styles } from '../src/ui';

export default function RewardsScreen() {
  const { authorize } = useParentalGate();
  const { journal: { rewards, profile, memories, language }, xp, activeMemories, updateRewards } = useJournal();
  const r = rewardsCopy[language];
  const t = copy[language];
  const capture = useRef<View>(null);
  const [edit, setEdit] = useState<RewardText>();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadedPhoto, setLoadedPhoto] = useState<string>();
  const favorite = memories.find(memory => memory.id === rewards.favorite) ?? memories[0];

  async function save(action: () => Promise<void>) {
    setError('');
    try { await action(); } catch { setError(t.saveError); }
  }

  function accessory(item: Accessory) {
    const on = rewards.accessories.includes(item);
    return <Chip label={`${on ? r.equipped : r.equip} · ${r.accessories[item]}`} selected={on} gold
      onPress={() => void save(() => updateRewards(previous => ({
        ...previous, accessories: previous.accessories.includes(item)
          ? previous.accessories.filter(value => value !== item) : [...previous.accessories, item],
      })))} />;
  }

  function coupon(kind: RewardText) {
    const label = kind === 'fika' ? r.fika : r.ticket;
    const text = rewards.texts[kind] || (kind === 'fika' ? r.fikaDefault : r.ticketDefault);
    return <View style={[styles.card, { backgroundColor: '#FFF4AE' }]}>
      <Text style={styles.heading}>{label}</Text>
      {edit === kind ? <>
        <TextInput multiline maxLength={240} accessibilityLabel={label} style={styles.input} value={draft} onChangeText={setDraft} />
        <Button title={r.save} icon="checkmark" onPress={() => void save(async () => {
          await updateRewards(previous => ({ ...previous, texts: { ...previous.texts, [kind]: draft.trim() } }));
          setEdit(undefined);
        })} />
        <Button title={t.cancel} icon="close" tone="quiet" onPress={() => setEdit(undefined)} />
      </> : <>
        <Text style={styles.body}>{text}</Text>
        <Pressable delayLongPress={3000} accessibilityRole="button"
          accessibilityActions={[{ name: 'longpress', label: r.edit }]}
          onAccessibilityAction={event => {
            if (event.nativeEvent.actionName === 'longpress') { setDraft(text); setEdit(kind); }
          }}
          onLongPress={() => { setDraft(text); setEdit(kind); }}
          style={[styles.button, styles.quiet]}>
          <Ionicons name="pencil" size={20} color={colors.deep} />
          <Text style={styles.small}>{r.edit}</Text>
        </Pressable>
      </>}
    </View>;
  }

  async function shareDiploma() {
    if (!capture.current || busy) return;
    setBusy(true);
    setError('');
    try {
      if (!await authorize('sharing')) return;
      if (!await Sharing.isAvailableAsync()) throw new Error('Sharing unavailable');
      const uri = await captureRef(capture, { format: 'png', result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: r.diploma });
    } catch { setError(r.sharingError); }
    finally { setBusy(false); }
  }

  if (!profile) return null;
  return (
    <Page>
      <Button title={t.back} icon="arrow-back" tone="quiet" onPress={() => router.back()} />
      <Text style={styles.title}>{r.chest}</Text>
      <Text style={styles.brand}>{xp} XP</Text>
      {milestones.map((mark, index) => {
        const open = rewards.unlocked.includes(mark);
        return <View key={mark} style={[styles.card, { borderLeftWidth: 7, borderLeftColor: open ? colors.gold : colors.line }]}>
          <View style={styles.row}>
            <Ionicons name={open ? 'star' : 'lock-closed-outline'} size={24} color={colors.forest} />
            <Text style={styles.brand}>{mark} XP · {open ? r.unlocked : r.locked}</Text>
          </View>
          <Text style={styles.heading}>{r.titles[index]}</Text>
          <Text style={styles.body}>{r.summaries[index]}</Text>
          {open && mark === 300 && <>
            {accessory('binoculars')}
            <Button title={r.slideshow} icon="images-outline" tone="quiet" disabled={!memories.length}
              onPress={() => router.push('/slideshow')} />
          </>}
          {open && mark === 600 && <>{accessory('backpack')}{coupon('fika')}</>}
          {open && mark === 1000 && <View style={styles.card}>
            <Text style={styles.heading}>{r.gear}</Text><Text style={styles.body}>{r.gearText}</Text>
          </View>}
          {open && mark === 1500 && <>
            <Chip label={`${rewards.captain ? r.equipped : r.equip} · ${r.captain}`} selected={rewards.captain} gold
              onPress={() => void save(() => updateRewards(previous => ({ ...previous, captain: !previous.captain })))} />
            {accessory('hat')}
            <View ref={capture} collapsable={false} style={[styles.card, { alignItems: 'center', borderWidth: 5, borderColor: colors.gold }]}>
              <Text style={{ fontSize: 28 }}>★ ★ ★</Text>
              <Text style={[styles.heading, { textAlign: 'center' }]}>{r.diploma}</Text>
              <ExplorerAvatar avatar={profile.avatar} rewards={rewards} />
              <Text style={[styles.title, { textAlign: 'center' }]}>{profile.name}</Text>
              <Text style={styles.small}>{r.count} · {activeMemories.length}</Text>
              <Text style={styles.small}>{new Date().toLocaleDateString(language === 'sv' ? 'sv-SE' : 'en-GB')}</Text>
              {favorite && <MemoryPhoto key={favorite.id} memory={favorite} language={language}
                onLoaded={() => setLoadedPhoto(favorite.id)} />}
            </View>
            <Button title={r.print} icon="share-outline" disabled={busy || Boolean(favorite && loadedPhoto !== favorite.id)}
              onPress={() => void shareDiploma()} />
            <Button title={t.book} icon="book-outline" tone="quiet" onPress={() => router.push('/book')} />
            {coupon('ticket')}
          </>}
        </View>;
      })}
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </Page>
  );
}
