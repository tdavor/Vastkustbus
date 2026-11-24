import { randomUUID } from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Image, Linking, Text } from 'react-native';
import { guideCopy, localizeLandmark } from '../../src/city-copy';
import { landmarks } from '../../src/landmarks';
import { useJournal } from '../../src/store';
import { copy } from '../../src/text';
import { Button, Page, styles } from '../../src/ui';
import type { CityPhotoDraft } from '../../src/city-photo';

type Draft = CityPhotoDraft & { uri: string };
export default function LandmarkPhoto() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { journal, activePlayerId, saveCityPhoto } = useJournal();
  const target = useRef(id).current;
  const currentTarget = useRef(id); currentTarget.current = id;
  const owner = useRef(activePlayerId).current;
  const currentOwner = useRef(activePlayerId); currentOwner.current = activePlayerId;
  const alive = useRef(true), locked = useRef(false);
  const [draft, setDraft] = useState<Draft>();
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<{ earned: number }>();
  const [error, setError] = useState<'cameraDenied' | 'cameraError' | 'saveError' | 'pickerError'>();
  const t = guideCopy[journal.language], common = copy[journal.language];
  const place = landmarks.find(item => item.id === id);
  const valid = () => alive.current && Boolean(owner) && currentOwner.current === owner && currentTarget.current === target;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => locked.current);
    return () => listener.remove();
  }, []);

  async function pick(camera: boolean) {
    if (!place || !valid() || locked.current) return;
    locked.current = true; setBusy(true); setError(undefined);
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!valid()) return;
        if (!permission.granted) {
          setError('cameraDenied');
          if (!permission.canAskAgain) Alert.alert(common.cameraDenied, undefined, [
            { text: common.cancel, style: 'cancel' },
            { text: common.settings, onPress: () => { void Linking.openSettings().catch(() => {}); } },
          ]);
          return;
        }
      }
      const options = { mediaTypes: ['images'] as ['images'], quality: 0.8, exif: false };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (!valid() || result.canceled) return;
      const image = result.assets[0];
      if (!image?.uri) throw new Error('No photo');
      const photoId = randomUUID();
      const suffix = image.mimeType === 'image/png' ? 'png' : image.mimeType === 'image/webp' ? 'webp' : 'jpg';
      setDraft({ id: photoId, date: new Date().toISOString(), uri: image.uri, photo: `city-${photoId}.${suffix}` });
    } catch { if (valid()) setError(camera ? 'cameraError' : 'pickerError'); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  }

  async function save() {
    if (!draft || !place || !owner || !valid() || locked.current) return;
    locked.current = true; setBusy(true); setError(undefined);
    try {
      const result = await saveCityPhoto(owner, place.id, draft.uri, { id: draft.id, date: draft.date, photo: draft.photo });
      if (valid()) { setSaved({ earned: result.earned }); setDraft(undefined); }
    } catch { if (valid()) setError('saveError'); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  }

  return <Page>
    <Button title={common.back} icon="arrow-back" tone="quiet" disabled={busy} onPress={() => router.back()} />
    {place && id === target && activePlayerId === owner ? <>
      <Text style={styles.title}>{localizeLandmark(place, journal.language).name}</Text>
      {saved ? <>
        <Text accessibilityLiveRegion="polite" style={styles.heading}>{t.photoSaved}</Text>
        <Text style={styles.body}>{t.savedXP(saved.earned)}</Text>
        <Button title={t.album} icon="book-outline" onPress={() => router.replace('/book')} />
      </> : <>
        <Text style={styles.body}>{t.photoIntro}</Text>
        {draft && <Image source={{ uri: draft.uri }} accessibilityLabel={common.photo} style={styles.image} />}
        {draft && <Button title={busy ? t.photoSaving : t.photoSave} icon="checkmark-circle-outline" disabled={busy} onPress={() => { void save(); }} />}
        <Button title={draft ? common.retake : t.photo} icon="camera-outline" tone="yellow" disabled={busy} onPress={() => { void pick(true); }} />
        <Button title={t.choosePhoto} icon="images-outline" tone="quiet" disabled={busy} onPress={() => { void pick(false); }} />
      </>}
      {error && <Text accessibilityRole="alert" style={styles.error}>{error === 'pickerError' ? t.pickerError : common[error]}</Text>}
    </> : <Text style={styles.body}>{common.missing}</Text>}
  </Page>;
}
