import Ionicons from '@expo/vector-icons/Ionicons';
import { randomUUID } from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Image, Linking, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { locate } from '../src/location';
import { areas, categories, missions, quickTags } from '../src/missions';
import { savePhoto, useJournal, type Coordinates, type Place } from '../src/store';
import { milestones, missionXP, rewardsCopy, type Milestone } from '../src/rewards';
import { copy } from '../src/text';
import { Button, Chip, colors, Page, styles, type Icon } from '../src/ui';

type Filter = keyof typeof categories;
type Draft = { id: string; date: string; uri: string; filename: string };
const camp: Record<Exclude<Filter, 'all'>, { icon: Icon; color: string }> = {
  forest: { icon: 'leaf', color: colors.paleGreen },
  sea: { icon: 'water', color: colors.paleBlue },
  city: { icon: 'home', color: '#FFE8A3' },
  legendary: { icon: 'star', color: colors.gold },
};

function choose(available: typeof missions, filter: Filter, except?: number) {
  const options = available.filter(item => item.id !== except && (filter === 'all' || item.category === filter));
  return options[Math.floor(Math.random() * options.length)];
}

export default function MissionScreen() {
  const { journal: { language, rewards }, activeMemories, addMemory } = useJournal();
  const t = copy[language];
  const r = rewardsCopy[language];
  const legendary = rewards.unlocked.includes(1000);
  const available = missions.filter(item => legendary || item.category !== 'legendary');
  const [earned, setEarned] = useState(0);
  const [newRewards, setNewRewards] = useState<Milestone[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [mission, setMission] = useState(() => choose(available, 'all'));
  const [browsing, setBrowsing] = useState(false);
  const [draft, setDraft] = useState<Draft>();
  const [completed, setCompleted] = useState(false);
  const [place, setPlace] = useState<Place>();
  const edited = useRef(false);
  const coordinates = useRef<Coordinates | undefined>(undefined);
  const request = useRef(0);
  const locationAsked = useRef(false);
  const locked = useRef(false);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => { request.current += 1; }, []);

  useEffect(() => {
    if (!browsing) return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      setBrowsing(false);
      return true;
    });
    return () => listener.remove();
  }, [browsing]);

  async function suggestLocation() {
    const token = ++request.current;
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && permission.canAskAgain && !locationAsked.current) {
        locationAsked.current = true;
        const allow = await new Promise<boolean>(resolve => Alert.alert(t.locationTitle, t.locationBody, [
          { text: t.later, style: 'cancel', onPress: () => resolve(false) },
          { text: t.allow, onPress: () => resolve(true) },
        ], { cancelable: true, onDismiss: () => resolve(false) }));
        if (!allow || token !== request.current) return;
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (!permission.granted || token !== request.current) return;
      setLocating(true);
      const suggestion = await locate(value => {
        if (token === request.current) coordinates.current = value;
      });
      if (suggestion && token === request.current && !edited.current && !locked.current) {
        setPlace({ text: suggestion.slice(0, 48) });
      }
    } catch {
      // Manual place tags remain available when Android location is unavailable.
    } finally {
      if (token === request.current) setLocating(false);
    }
  }

  async function takePhoto() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    let captured = false;
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError(t.cameraDenied);
        if (!permission.canAskAgain) Alert.alert(t.cameraDenied, undefined, [
          { text: t.cancel, style: 'cancel' },
          { text: t.settings, onPress: () => { void Linking.openSettings().catch(() => {}); } },
        ]);
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, exif: false });
      if (result.canceled) return;
      const image = result.assets[0];
      const id = randomUUID();
      const suffix = image.mimeType === 'image/png' ? 'png' : image.mimeType === 'image/webp' ? 'webp' : 'jpg';
      coordinates.current = undefined;
      edited.current = false;
      setPlace(undefined);
      setLocating(false);
      setDraft({ id, date: new Date().toISOString(), uri: image.uri, filename: `${id}.${suffix}` });
      captured = true;
    } catch {
      setError(t.cameraError);
    } finally {
      locked.current = false;
      setBusy(false);
    }
    if (captured) void suggestLocation();
  }

  async function save() {
    if (!draft || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      savePhoto(draft.uri, draft.filename);
      const confirmed = place && 'text' in place ? place.text.trim() ? { text: place.text.trim() } : undefined : place;
      const result = await addMemory({
        id: draft.id, date: draft.date, missionId: mission.id,
        photo: draft.filename, place: confirmed, coordinates: coordinates.current,
      });
      request.current += 1;
      setEarned(result.earned);
      setNewRewards(result.unlocked);
      setCompleted(true);
    } catch {
      setError(t.saveError);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  if (browsing) {
    return (
      <Page key="catalog">
        <Button title={t.back} icon="arrow-back" tone="quiet" onPress={() => setBrowsing(false)} />
        <Text style={styles.title}>{t.browseMissions}</Text>
        {(Object.keys(camp) as Array<keyof typeof camp>).filter(item => legendary || item !== 'legendary').map(category => (
          <View key={category} style={{ gap: 10 }}>
            <View style={styles.row}>
              <Ionicons name={camp[category].icon} size={24} color={colors.forest} />
              <Text accessibilityRole="header" style={styles.heading}>{categories[category][language]}</Text>
            </View>
            {available.filter(item => item.category === category).map(item => (
              <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: item.id === mission.id }}
                style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  setFilter(current => current === 'all' ? current : item.category);
                  setMission(item);
                  setError('');
                  setBrowsing(false);
                }}>
                <View style={[styles.row, { justifyContent: 'space-between' }]}>
                  <Text style={[styles.brand, { flexShrink: 1 }]}>{item.title[language]}</Text>
                  <Text style={styles.small}>+{missionXP(activeMemories, item.id, item.xp)} XP</Text>
                </View>
                <Text style={styles.body}>{item.description[language]}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </Page>
    );
  }

  return (
    <Page key="mission">
      <Button title={completed ? t.home : t.back} icon="arrow-back" tone="quiet" onPress={() => router.back()} disabled={busy} />
      <Modal transparent visible={newRewards.length > 0} animationType="fade" onRequestClose={() => setNewRewards([])}>
        <View style={{ flex: 1, backgroundColor: '#173D30B0', justifyContent: 'center', padding: 24 }}>
          <View accessibilityViewIsModal style={[styles.card, { borderColor: colors.gold, borderWidth: 4 }]}>
            <Text style={{ fontSize: 44, textAlign: 'center' }}>✨ 🏆 ✨</Text>
            <Text style={styles.title}>{r.celebrate}</Text>
            {newRewards.map(mark => <Text key={mark} style={styles.body}>
              {mark} XP · {r.summaries[milestones.indexOf(mark)]}
            </Text>)}
            <Button title={r.chest} icon="gift-outline" tone="yellow" onPress={() => {
              setNewRewards([]);
              router.push('/rewards');
            }} />
            <Button title={r.dismiss} icon="compass-outline" tone="quiet" onPress={() => setNewRewards([])} />
          </View>
        </View>
      </Modal>
      {completed ? <>
        <View style={[styles.card, { alignItems: 'center', backgroundColor: '#FFE8A3', paddingVertical: 36 }]}>
          <View style={styles.row}>
            <Ionicons name="sparkles" size={32} color={colors.forest} />
            <Ionicons name="star" size={66} color={colors.forest} />
            <Ionicons name="sparkles" size={32} color={colors.forest} />
          </View>
          <Text style={[styles.title, { textAlign: 'center' }]}>{t.saved}</Text>
          <Text style={styles.heading}>+{earned} {t.earned}</Text>
        </View>
        <Button title={t.book} icon="book-outline" onPress={() => router.replace('/book')} />
        <Button title={t.start} icon="compass-outline" tone="yellow" onPress={() => {
          setCompleted(false);
          setDraft(undefined);
          setMission(choose(available, filter, mission.id));
        }} />
      </> : draft ? <>
        <Text style={styles.title}>{t.where}</Text>
        <Image source={{ uri: draft.uri }} style={styles.image} accessibilityLabel={t.photo} />
        <Text style={styles.small}>{locating ? t.locating : t.noGps}</Text>
        <TextInput style={styles.input} accessibilityLabel={t.place} placeholder={t.place}
          placeholderTextColor={colors.muted} maxLength={48} editable={!busy}
          value={place ? 'tag' in place ? quickTags[place.tag][language] : place.text : ''}
          onChangeText={value => { edited.current = true; setPlace({ text: value }); }} />
        <View style={styles.row}>
          {Object.entries(quickTags).map(([tag, label]) => (
            <Chip key={tag} label={label[language]} selected={Boolean(place && 'tag' in place && place.tag === tag)}
              onPress={() => {
                if (locked.current) return;
                edited.current = true;
                setPlace(place && 'tag' in place && place.tag === tag ? undefined : { tag });
              }} />
          ))}
        </View>
        <Button title={place && ('tag' in place || place.text.trim()) ? t.save : t.skip}
          icon="checkmark-circle-outline" onPress={() => { void save(); }} disabled={busy} />
        <Button title={t.retake} icon="camera-outline" tone="quiet" disabled={busy} onPress={() => { void takePhoto(); }} />
      </> : <>
        <Text style={styles.title}>{t.mission}</Text>
        <View style={styles.row}>
          {(Object.keys(categories) as Filter[]).filter(item => legendary || item !== 'legendary').map(item => (
            <Chip key={item} label={categories[item][language]} selected={item === filter} gold={item === 'legendary'}
              onPress={() => {
                if (locked.current || filter === item) return;
                setFilter(item);
                setMission(choose(available, item));
              }} />
          ))}
        </View>
        <View style={[styles.card, { backgroundColor: camp[mission.category].color }]}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Ionicons name={camp[mission.category].icon} size={37} color={colors.forest} />
            <Text style={styles.brand}>+{missionXP(activeMemories, mission.id, mission.xp)} XP</Text>
          </View>
          <Text style={styles.heading}>{mission.title[language]}</Text>
          <Text style={styles.body}>{mission.description[language]}</Text>
          <Text style={styles.small}>{areas[mission.category][language]}</Text>
        </View>
        <Button title={t.camera} icon="camera-outline" tone="yellow" disabled={busy} onPress={() => { void takePhoto(); }} />
        <Button title={t.browseMissions} icon="list-outline" tone="quiet" disabled={busy} onPress={() => setBrowsing(true)} />
        <Button title={t.shuffle} icon="shuffle" tone="quiet" disabled={busy} onPress={() => setMission(choose(available, filter, mission.id))} />
      </>}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </Page>
  );
}
