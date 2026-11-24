import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Image, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { BookCancelled } from '../../src/family-book';
import { generateSeasonBook } from '../../src/season-book';
import { seasons, seasonColors, seasonForDate, seasonTitle, todayLocal, validVisitDate, visitDateLabel, yearSummary } from '../../src/seasons';
import { photoFile, useJournal } from '../../src/store';
import { copy } from '../../src/text';
import { Button, Chip, colors, Page, styles } from '../../src/ui';

function Photo({ photo, label, onLoaded }: { photo: string; label: string; onLoaded?: () => void }) {
  const [failed, setFailed] = useState(false);
  const { journal: { language } } = useJournal();
  return failed ? <Text accessibilityRole="alert" style={styles.error}>{copy[language].seasonPhotoError}</Text> : <Image source={{ uri: photoFile(photo).uri }}
    accessibilityLabel={label} resizeMode="contain" style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 12, backgroundColor: 'white' }}
    onLoad={onLoaded} onError={() => setFailed(true)} />;
}
function discardFile(uri?: string) { if (uri) { try { const file = new File(uri); if (file.exists) file.delete(); } catch {} } }

export default function SeasonalPlacePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { journal: { language, profile, seasonalPlaces = [] }, activePlayerId, addSeasonalVisit, deleteSeasonalVisit, deleteSeasonalPlace, saveSeasonBook } = useJournal();
  const place = seasonalPlaces.find(item => item.id === id);
  const t = copy[language];
  const [year, setYear] = useState<number | undefined>(undefined);
  const [draft, setDraft] = useState<string>();
  const draftRef = useRef<string | undefined>(undefined);
  const [date, setDate] = useState(todayLocal());
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const alive = useRef(true);
  const generation = useRef(0);
  const [error, setError] = useState('');
  const [comparing, setComparing] = useState<string[]>([]);
  const [loaded, setLoaded] = useState<string[]>([]);
  const comparison = useRef<View>(null);
  const [visible, setVisible] = useState(20);
  const [pdf, setPDF] = useState<string>();
  const [pdfBusy, setPDFBusy] = useState(false);
  const timeline = [...(place?.visits ?? [])].sort((a, b) => b.date.localeCompare(a.date));
  const years = [...new Set([Number(todayLocal().slice(0, 4)), ...timeline.map(visit => Number(visit.date.slice(0, 4)))])].sort((a, b) => b - a);
  const summary = place ? yearSummary(place, year) : {};
  const compared = comparing.map(visitId => place?.visits.find(visit => visit.id === visitId)).filter(visit => visit !== undefined);
  const reference = place?.visits[0];
  const comparisonKey = comparing.join('-');
  const routeKey = `${activePlayerId}-${id}`;
  const route = useRef(routeKey);
  route.current = routeKey;
  const comparisonReady = compared.length === 2 && compared.every(visit => loaded.includes(`${comparisonKey}:${visit.id}`));

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; generation.current++; discardFile(draftRef.current); };
  }, []);
  useEffect(() => { setPDF(undefined); }, [year, place?.visits]);
  useEffect(() => {
    generation.current++;
    discardFile(draftRef.current); draftRef.current = undefined;
    setDraft(undefined); setNote(''); setDate(todayLocal()); setComparing([]); setLoaded([]); setPDF(undefined); setError(''); setVisible(20);
    setYear(undefined);
  }, [routeKey]);

  function goBack() { if (router.canGoBack()) router.back(); else router.replace('/seasonal-places'); }
  function leave() {
    if (lock.current) return;
    if (draftRef.current) Alert.alert(t.seasonDiscard, undefined, [
      { text: t.stay, style: 'cancel' }, { text: t.discard, style: 'destructive', onPress: goBack },
    ]);
    else goBack();
  }
  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      if (lock.current) return true;
      if (!draftRef.current) return false;
      leave(); return true;
    });
    return () => listener.remove();
  }, [language]));

  async function choose(camera: boolean) {
    if (lock.current || !place) return;
    lock.current = true; setBusy(true); setError('');
    const requestRoute = route.current;
    let fresh: string | undefined;
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError(t.cameraDenied);
          if (!permission.canAskAgain) Alert.alert(t.cameraDenied, undefined, [
            { text: t.cancel, style: 'cancel' }, { text: t.settings, onPress: () => { void Linking.openSettings().catch(() => {}); } },
          ]);
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.85, exif: false };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !alive.current || route.current !== requestRoute) return;
      const image = result.assets[0];
      const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
      const normalized = await manipulateAsync(image.uri, [{ resize: { width: Math.max(1, Math.round(image.width * scale)), height: Math.max(1, Math.round(image.height * scale)) } }], { format: SaveFormat.JPEG, compress: 0.85 });
      fresh = normalized.uri;
      if (!alive.current || route.current !== requestRoute) return;
      discardFile(draftRef.current);
      draftRef.current = fresh; setDraft(fresh); fresh = undefined;
    } catch { if (alive.current) setError(t.cameraError); }
    finally { discardFile(fresh); lock.current = false; if (alive.current) setBusy(false); }
  }
  async function save() {
    if (lock.current || !place || !draft) return;
    if (!validVisitDate(date)) { setError(t.seasonBadDate); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      await addSeasonalVisit(place.id, draft, date, note);
      discardFile(draft); draftRef.current = undefined;
      if (alive.current) { setDraft(undefined); setNote(''); setYear(previous => previous === undefined ? undefined : Number(date.slice(0, 4))); setDate(todayLocal()); }
    } catch { if (alive.current) setError(t.saveError); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  function toggleCompare(visitId: string) {
    if (lock.current) return;
    setLoaded([]);
    setComparing(previous => previous.includes(visitId) ? previous.filter(value => value !== visitId) : [...previous.slice(-1), visitId]);
  }
  function remove(visitId?: string) {
    if (lock.current || !place) return;
    Alert.alert(visitId ? t.seasonDeleteVisitConfirm : t.seasonDeletePlaceConfirm, undefined, [
      { text: t.cancel, style: 'cancel' }, { text: t.seasonDelete, style: 'destructive', onPress: () => {
        if (lock.current) return;
        lock.current = true; setBusy(true); setError('');
        const task = visitId ? deleteSeasonalVisit(place.id, visitId) : deleteSeasonalPlace(place.id);
        void task.then(() => { if (!alive.current) return; if (!visitId) goBack(); else setComparing(previous => previous.filter(value => value !== visitId)); })
          .catch(() => { if (alive.current) setError(t.saveError); })
          .finally(() => { lock.current = false; if (alive.current) setBusy(false); });
      } },
    ]);
  }
  async function shareComparison() {
    if (lock.current || !comparison.current || !comparisonReady) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (!await Sharing.isAvailableAsync()) throw new Error('Sharing unavailable');
      const uri = await captureRef(comparison, { format: 'png', result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t.seasonCompare });
    } catch { if (alive.current) setError(t.sharingError); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }
  async function createBook() {
    if (lock.current || !place || !profile || !activePlayerId) return;
    lock.current = true; setBusy(true); setPDFBusy(true); setError(''); setPDF(undefined);
    const token = ++generation.current;
    const active = () => alive.current && generation.current === token;
    let temporary: string | undefined;
    try {
      const result = await generateSeasonBook(place, year, profile.name, language, active);
      temporary = result.uri;
      if (!active()) throw new BookCancelled();
      const uri = await saveSeasonBook(temporary, activePlayerId, place.id, result.visitIds);
      if (active()) setPDF(uri);
    } catch (cause) { if (active() && !(cause instanceof BookCancelled)) setError(t.bookError); }
    finally { discardFile(temporary); lock.current = false; if (alive.current) { setBusy(false); setPDFBusy(false); } }
  }
  async function outputBook(print: boolean) {
    if (!pdf || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (print) await Print.printAsync({ uri: pdf });
      else {
        if (!await Sharing.isAvailableAsync()) throw new Error('Sharing unavailable');
        await Sharing.shareAsync(pdf, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: t.seasonPlaces });
      }
    } catch { if (alive.current) setError(t.bookError); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }

  return <Page>
    <Button title={t.back} icon="arrow-back" tone="quiet" disabled={busy} onPress={leave} />
    {!place ? <Text style={styles.body}>{t.seasonMissing}</Text> : <>
      <Text accessibilityRole="header" style={styles.title}>{place.name}</Text>
      {!!place.frameHint && <View style={styles.card}><Text style={styles.heading}>{t.seasonFrameHint}</Text><Text style={styles.body}>{place.frameHint}</Text></View>}
      {!!reference && <View style={styles.card}>
        <Text style={styles.heading}>{t.seasonReference}</Text>
        <Photo key={reference.photo} photo={reference.photo} label={t.seasonPhoto} />
        <Text style={styles.small}>{visitDateLabel(reference.date, language)}</Text>
        <Text style={styles.body}>{t.seasonReferenceHint}</Text>
      </View>}
      <Button title={t.seasonAddVisit} icon="camera-outline" disabled={busy} onPress={() => { void choose(true); }} />
      <Button title={t.seasonChoosePhoto} icon="images-outline" tone="quiet" disabled={busy} onPress={() => { void choose(false); }} />
      {!!draft && <View style={styles.card}>
        <Text style={styles.heading}>{t.seasonDraft}</Text>
        <Image source={{ uri: draft }} style={styles.image} resizeMode="contain" accessibilityLabel={t.seasonPhoto} />
        <TextInput accessibilityLabel={t.seasonDate} value={date} onChangeText={setDate} maxLength={10} editable={!busy}
          style={styles.input} placeholder="YYYY-MM-DD" autoCapitalize="none" />
        <Text style={styles.small}>{t.seasonDateHint}</Text>
        <Text style={styles.small}>{validVisitDate(date) ? seasonTitle(seasonForDate(date), language) : t.seasonBadDate}</Text>
        <TextInput accessibilityLabel={t.seasonNote} value={note} onChangeText={setNote} maxLength={400} editable={!busy}
          style={[styles.input, { minHeight: 110, paddingVertical: 12 }]} multiline textAlignVertical="top"
          placeholder={t.seasonNotePlaceholder} placeholderTextColor={colors.muted} />
        <Button title={busy ? t.seasonSaving : t.seasonSaveVisit} icon="save-outline" disabled={busy || !validVisitDate(date)} onPress={() => { void save(); }} />
        <Button title={t.cancel} icon="close-outline" tone="quiet" disabled={busy}
          onPress={() => { discardFile(draftRef.current); draftRef.current = undefined; setDraft(undefined); setNote(''); setDate(todayLocal()); }} />
      </View>}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Text style={styles.heading}>{t.seasonYear}</Text>
      <View style={styles.row}><Chip label={t.seasonAllYears} selected={year === undefined} onPress={() => { if (!busy) setYear(undefined); }} />{years.map(value => <Chip key={value} label={String(value)} selected={year === value} onPress={() => { if (!busy) setYear(value); }} />)}</View>
      <Text style={styles.heading}>{t.seasonProgress}: {Object.keys(summary).length} / 4 · {year ?? t.seasonAllYears}</Text>
      <View style={[styles.row, { alignItems: 'stretch' }]}>
        {seasons.map(season => <View key={season} style={[styles.card, { width: '48%', padding: 12, backgroundColor: seasonColors[season] }]}>
          <Text style={styles.heading}>{seasonTitle(season, language)}</Text>
          {summary[season] ? <>
            <Photo key={summary[season]!.photo} photo={summary[season]!.photo} label={t.seasonPhoto} />
            <Text style={styles.small}>{visitDateLabel(summary[season]!.date, language)}</Text>
            {!!summary[season]!.note && <Text numberOfLines={3} style={styles.body}>{summary[season]!.note}</Text>}
            <Pressable accessibilityRole="checkbox" accessibilityLabel={t.seasonCompareSelect}
              accessibilityState={{ checked: comparing.includes(summary[season]!.id), disabled: busy }} disabled={busy}
              style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.white }}
              onPress={() => toggleCompare(summary[season]!.id)}>
              <Text style={styles.small}>{comparing.includes(summary[season]!.id) ? '✓ ' : ''}{t.seasonCompareShort}</Text>
            </Pressable>
          </> : <Text style={styles.small}>{t.seasonEmptySlot}</Text>}
        </View>)}
      </View>
      <Text style={styles.small}>{t.seasonMonths}</Text>
      <Text style={styles.heading}>{t.seasonCompare}</Text>
      <Text style={styles.body}>{t.seasonCompareHint}</Text>
      {!!compared.length && <View key={comparisonKey} ref={comparison} collapsable={false} style={styles.card}>
        <Text style={styles.heading}>{place.name}</Text>
        <View style={[styles.row, { alignItems: 'flex-start' }]}>{compared.map(visit => <View key={visit.id} style={{ flex: 1, minWidth: 0 }}>
          <Photo photo={visit.photo} label={t.seasonPhoto} onLoaded={() => setLoaded(previous => previous.includes(`${comparisonKey}:${visit.id}`) ? previous : [...previous, `${comparisonKey}:${visit.id}`])} />
          <Text style={styles.small}>{seasonTitle(seasonForDate(visit.date), language)} · {visitDateLabel(visit.date, language)}</Text>
          {!!visit.note && <Text style={styles.body}>{visit.note}</Text>}
        </View>)}</View>
      </View>}
      <Button title={t.seasonShareCompare} icon="share-social-outline" disabled={busy || !comparisonReady} onPress={() => { void shareComparison(); }} />
      {!!compared.length && <Button title={t.seasonCompareClear} icon="close-outline" tone="quiet" disabled={busy} onPress={() => { setComparing([]); setLoaded([]); }} />}
      <Button title={t.seasonBook} icon="book-outline" tone="yellow" disabled={busy || !!draft || !Object.keys(summary).length} onPress={() => { void createBook(); }} />
      <Text style={styles.small}>{t.seasonBookHint}</Text>
      {pdfBusy && <View style={styles.card}><ActivityIndicator color={colors.forest} /><Text accessibilityLiveRegion="polite" style={styles.body}>{t.creatingBook}</Text></View>}
      {!!pdf && <View style={styles.card}>
        <Text style={styles.body}>{t.seasonBookReady}</Text>
        <Button title={t.shareBook} icon="share-social-outline" disabled={busy} onPress={() => { void outputBook(false); }} />
        <Button title={t.printBook} icon="print-outline" tone="yellow" disabled={busy} onPress={() => { void outputBook(true); }} />
      </View>}
      <Text style={styles.heading}>{t.seasonTimeline}</Text>
      {timeline.slice(0, visible).map(visit => <View key={visit.id} style={styles.card}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: comparing.includes(visit.id), disabled: busy }} disabled={busy} onPress={() => toggleCompare(visit.id)}>
          <Text style={styles.heading}>{comparing.includes(visit.id) ? '✓ ' : ''}{seasonTitle(seasonForDate(visit.date), language)}</Text>
          <Text style={styles.small}>{visitDateLabel(visit.date, language)}</Text>
          <Photo photo={visit.photo} label={t.seasonPhoto} />
          {!!visit.note && <Text style={styles.body}>{visit.note}</Text>}
          <Text style={styles.small}>{t.seasonCompareSelect}</Text>
        </Pressable>
        <Button title={t.seasonDeleteVisit} icon="trash-outline" tone="quiet" disabled={busy} onPress={() => remove(visit.id)} />
      </View>)}
      {timeline.length > visible && <Button title={t.seasonShowMore} icon="chevron-down-outline" disabled={busy} onPress={() => setVisible(previous => previous + 20)} />}
      <Button title={t.seasonDeletePlace} icon="trash-outline" tone="quiet" disabled={busy || !!draft} onPress={() => remove()} />
    </>}
  </Page>;
}
