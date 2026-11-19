import Ionicons from '@expo/vector-icons/Ionicons';
import { randomUUID } from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, Text, TextInput, View } from 'react-native';
import { locate } from '../src/location';
import { areas, categories, missions, quickTags } from '../src/missions';
import { savePhoto, useJournal, type Coordinates, type Place } from '../src/store';
import { copy } from '../src/text';
import { Button, Chip, colors, Page, styles, type Icon } from '../src/ui';

type Filter = keyof typeof categories;
type Draft = { id: string; date: string; uri: string; filename: string };
const camp: Record<Exclude<Filter, 'all'>, { icon: Icon; color: string }> = {
  forest: { icon: 'leaf', color: colors.paleGreen },
  sea: { icon: 'water', color: colors.paleBlue },
  city: { icon: 'home', color: '#FFE8A3' },
};

function choose(filter: Filter, except?: number) {
  const options = missions.filter(item => item.id !== except && (filter === 'all' || item.category === filter));
  return options[Math.floor(Math.random() * options.length)];
}

export default function MissionScreen() {
  const { journal: { language }, addMemory } = useJournal();
  const t = copy[language];
  const [filter, setFilter] = useState<Filter>('all');
  const [mission, setMission] = useState(() => choose('all'));
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
      await addMemory({
        id: draft.id, date: draft.date, missionId: mission.id, xp: mission.xp,
        photo: draft.filename, place: confirmed, coordinates: coordinates.current,
      });
      request.current += 1;
      setCompleted(true);
    } catch {
      setError(t.saveError);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return (
    <Page>
      <Button title={completed ? t.home : t.back} icon="arrow-back" tone="quiet" onPress={() => router.back()} disabled={busy} />
      {completed ? <>
        <View style={[styles.card, { alignItems: 'center', backgroundColor: '#FFE8A3', paddingVertical: 36 }]}>
          <View style={styles.row}>
            <Ionicons name="sparkles" size={32} color={colors.forest} />
            <Ionicons name="star" size={66} color={colors.forest} />
            <Ionicons name="sparkles" size={32} color={colors.forest} />
          </View>
          <Text style={[styles.title, { textAlign: 'center' }]}>{t.saved}</Text>
          <Text style={styles.heading}>+{mission.xp} {t.earned}</Text>
        </View>
        <Button title={t.book} icon="book-outline" onPress={() => router.replace('/book')} />
        <Button title={t.start} icon="compass-outline" tone="yellow" onPress={() => {
          setCompleted(false);
          setDraft(undefined);
          setMission(choose(filter, mission.id));
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
          {(Object.keys(categories) as Filter[]).map(item => (
            <Chip key={item} label={categories[item][language]} selected={item === filter}
              onPress={() => {
                if (locked.current || filter === item) return;
                setFilter(item);
                setMission(choose(item));
              }} />
          ))}
        </View>
        <View style={[styles.card, { backgroundColor: camp[mission.category].color }]}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Ionicons name={camp[mission.category].icon} size={37} color={colors.forest} />
            <Text style={styles.brand}>+{mission.xp} XP</Text>
          </View>
          <Text style={styles.heading}>{mission.title[language]}</Text>
          <Text style={styles.body}>{mission.description[language]}</Text>
          <Text style={styles.small}>{areas[mission.category][language]}</Text>
        </View>
        <Button title={t.camera} icon="camera-outline" tone="yellow" disabled={busy} onPress={() => { void takePhoto(); }} />
        <Button title={t.shuffle} icon="shuffle" tone="quiet" disabled={busy} onPress={() => setMission(choose(filter, mission.id))} />
      </>}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </Page>
  );
}
