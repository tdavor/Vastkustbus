import { memoryTitle } from '../src/memory-labels';
import { useParentalGate } from '../src/parent-gate';
import { File } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { drawingEngineAvailable } from '../src/coloring';
import { BookCancelled, generateFamilyBook } from '../src/family-book';
import { maxBookMemories } from '../src/family-book-html';
import { dateLabel } from '../src/memory';
import { photoFile, useJournal } from '../src/store';
import { copy } from '../src/text';
import { Button, colors, Page, styles } from '../src/ui';

export default function FamilyBookPage() {
  const { authorize } = useParentalGate();
  const { journal: { language, memories, profile }, activePlayerId, saveFamilyBook } = useJournal();
  const t = copy[language];
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [drawings, setDrawings] = useState(false);
  const [artwork, setArtwork] = useState(true);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; generation.current++; }; }, []);
  const [progress, setProgress] = useState<string>();
  const [pdf, setPDF] = useState<string>();
  const [error, setError] = useState(false);
  const [limit, setLimit] = useState(false);
  const [created, setCreated] = useState(false);
  const choices = [...memories].sort((a, b) => b.date.localeCompare(a.date));

  useEffect(() => {
    generation.current++;
    setSelected([]); setPDF(undefined); setTitle(''); setCreated(false); setError(false);
    return () => { generation.current++; };
  }, [activePlayerId]);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => locked.current);
    return () => listener.remove();
  }, []);

  function toggle(id: string) {
    if (locked.current) return;
    setCreated(false); setLimit(!selected.includes(id) && selected.length >= maxBookMemories);
    setSelected(previous => {
      if (previous.includes(id)) return previous.filter(item => item !== id);
      if (previous.length >= maxBookMemories) return previous;
      return [...previous, id];
    });
  }

  async function create() {
    if (locked.current || !profile || !activePlayerId || !selected.length) return;
    locked.current = true; setBusy(true); setError(false); setCreated(false); setPDF(undefined);
    const token = ++generation.current;
    const active = () => generation.current === token;
    let temporary: string | undefined;
    try {
      // Chronological order makes the exported book read like a family story.
      const chosen = memories.filter(memory => selected.includes(memory.id)).sort((a, b) => a.date.localeCompare(b.date));
      temporary = await generateFamilyBook({ memories: chosen, title, name: profile.name, language, drawings, artwork, active,
        progress: (current, total) => { if (active()) setProgress(current ? t.bookProgress.replace('{current}', String(current)).replace('{total}', String(total)) : t.bookPreparingPdf); },
      });
      if (!active()) throw new BookCancelled();
      const uri = await saveFamilyBook(temporary, activePlayerId, chosen.map(memory => memory.id));
      if (active()) { setPDF(uri); setCreated(true); }
    } catch (cause) { if (active() && !(cause instanceof BookCancelled)) setError(true); }
    finally {
      if (temporary) { try { const file = new File(temporary); if (file.exists) file.delete(); } catch {} }
      locked.current = false;
      if (mounted.current) { setBusy(false); setProgress(undefined); }
    }
  }

  async function output(print: boolean) {
    if (!pdf || locked.current) return;
    locked.current = true; setBusy(true); setError(false);
    try {
      if (!await authorize('sharing')) return;
      if (print) await Print.printAsync({ uri: pdf });
      else {
        if (!await Sharing.isAvailableAsync()) throw new Error('Sharing unavailable');
        await Sharing.shareAsync(pdf, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: t.familyBook });
      }
    } catch { setError(true); }
    finally { locked.current = false; setBusy(false); }
  }

  return <Page>
    <Button title={t.back} icon="arrow-back" tone="quiet" disabled={busy} onPress={() => router.back()} />
    <Text accessibilityRole="header" style={styles.title}>{t.familyBook}</Text>
    <Text style={styles.body}>{t.familyBookIntro}</Text>
    <TextInput accessibilityLabel={t.bookTitle} style={styles.input} placeholder={t.defaultBookTitle}
      placeholderTextColor={colors.muted} maxLength={80} editable={!busy} value={title}
      onChangeText={value => { setTitle(value); setCreated(false); }} />
    <View style={styles.card}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text style={[styles.body, { flex: 1 }]}>{t.includeDrawings}</Text>
        <Switch accessibilityLabel={t.includeDrawings} value={drawings} disabled={busy || !drawingEngineAvailable}
          onValueChange={value => { setDrawings(value); setCreated(false); }} trackColor={{ true: colors.forest }} />
      </View>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <Text style={[styles.body, { flex: 1 }]}>{t.includeArtwork}</Text>
        <Switch accessibilityLabel={t.includeArtwork} value={artwork} disabled={busy}
          onValueChange={value => { setArtwork(value); setCreated(false); }} trackColor={{ true: colors.forest }} />
      </View>
    </View>
    <Text style={styles.heading}>{t.bookSelection}: {selected.length} / {maxBookMemories}</Text>
    <View style={styles.row}>
      <Button title={t.selectAllBook} icon="checkmark-done-outline" tone="quiet" disabled={busy || !choices.length}
        onPress={() => { setSelected(choices.slice(0, maxBookMemories).map(memory => memory.id)); setCreated(false); setLimit(false); }} />
      <Button title={t.clearBookSelection} icon="close-outline" tone="quiet" disabled={busy || !selected.length}
        onPress={() => { setSelected([]); setCreated(false); setLimit(false); }} />
    </View>
    {limit && <Text accessibilityRole="alert" style={styles.small}>{t.bookLimit}</Text>}
    {choices.map(memory => <Pressable key={memory.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(memory.id), disabled: busy }}
      disabled={busy} onPress={() => toggle(memory.id)} style={[styles.card, selected.includes(memory.id) && { borderColor: colors.forest, backgroundColor: colors.paleGreen }]}>
      <Image source={{ uri: photoFile(memory.photo).uri }} style={{ width: 92, height: 92, borderRadius: 12 }} accessibilityLabel={t.photo} />
      <Text style={styles.heading}>{selected.includes(memory.id) ? '✓ ' : ''}{memoryTitle(memory, language)}</Text>
      <Text style={styles.small}>{dateLabel(memory, language)}</Text>
      {!!memory.story && <Text numberOfLines={2} style={styles.body}>{memory.story}</Text>}
    </Pressable>)}
    {!choices.length && <Text style={styles.body}>{t.empty}</Text>}
    <Button title={busy && progress ? t.creatingBook : t.createBook} icon="document-outline" disabled={busy || !selected.length}
      onPress={() => { void create(); }} />
    {busy && !!progress && <View style={styles.card}><ActivityIndicator color={colors.forest} /><Text accessibilityLiveRegion="polite" style={styles.body}>{progress}</Text></View>}
    {created && pdf && <View style={styles.card}>
      <Text accessibilityLiveRegion="polite" style={styles.body}>{t.bookReady}</Text>
      <Button title={t.shareBook} icon="share-social-outline" disabled={busy} onPress={() => { void output(false); }} />
      <Button title={t.printBook} icon="print-outline" tone="yellow" disabled={busy} onPress={() => { void output(true); }} />
    </View>}
    {error && <Text accessibilityRole="alert" style={styles.error}>{t.bookError}</Text>}
  </Page>;
}
