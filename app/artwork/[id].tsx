import { useParentalGate } from '../../src/parent-gate';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Image, Linking, Text } from 'react-native';
import { photoFile, useJournal } from '../../src/store';
import { printImage } from '../../src/printing';
import { copy } from '../../src/text';
import { Button, Page, styles } from '../../src/ui';

export default function ArtworkPage() {
  const { authorize } = useParentalGate();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { journal: { language, memories }, saveArtwork } = useJournal();
  const memory = memories.find(item => item.id === id);
  const t = copy[language];
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState<string>();
  const [ratio, setRatio] = useState(3 / 4);
  const uri = memory?.coloredPhoto ? photoFile(memory.coloredPhoto).uri : undefined;

  async function capture(camera: boolean) {
    if (!memory || locked.current) return;
    locked.current = true; setBusy(true); setError(''); setSaved(false);
    let temporary: string | undefined;
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setError(t.cameraDenied);
          if (!permission.canAskAgain) Alert.alert(t.cameraDenied, undefined, [
            { text: t.cancel, style: 'cancel' },
            { text: t.settings, onPress: () => { void Linking.openSettings().catch(() => {}); } },
          ]);
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.85, exif: false };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      const asset = result.assets[0];
      const scale = Math.min(1, 1600 / Math.max(asset.width, asset.height));
      const normalized = await manipulateAsync(asset.uri, [{ resize: {
        width: Math.max(1, Math.round(asset.width * scale)), height: Math.max(1, Math.round(asset.height * scale)),
      } }], { format: SaveFormat.JPEG, compress: 0.85 });
      temporary = normalized.uri;
      await saveArtwork(memory.id, normalized.uri);
      setSaved(true);
    } catch { setError(t.artworkError); }
    finally {
      if (temporary) { try { const file = new File(temporary); if (file.exists) file.delete(); } catch {} }
      locked.current = false; setBusy(false);
    }
  }

  async function output(print: boolean) {
    if (!uri || loaded !== uri || locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try {
      if (!await authorize('sharing')) return;
      if (print) await printImage(uri);
      else {
        if (!await Sharing.isAvailableAsync()) throw new Error('Sharing unavailable');
        await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: t.coloredArtwork });
      }
    } catch { setError(print ? t.printError : t.sharingError); }
    finally { locked.current = false; setBusy(false); }
  }

  return <Page>
    <Button title={t.back} icon="arrow-back" tone="quiet" disabled={busy}
      onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/book'); }} />
    {memory ? <>
      <Text accessibilityRole="header" style={styles.title}>{t.coloredArtwork}</Text>
      <Text style={styles.body}>{t.artworkIntro}</Text>
      {uri && <Image key={uri} source={{ uri }} resizeMode="contain" accessibilityLabel={t.artworkPhoto}
        style={[styles.image, { aspectRatio: ratio }]}
        onLoad={event => { const image = event.nativeEvent.source; setRatio(image.width / image.height); setLoaded(uri); }}
        onError={() => { setLoaded(undefined); setError(t.artworkMissing); }} />}
      <Button title={uri ? t.replaceArtwork : t.takeArtwork} icon="camera-outline" disabled={busy}
        onPress={() => { void capture(true); }} />
      <Button title={t.chooseArtwork} icon="images-outline" tone="quiet" disabled={busy}
        onPress={() => { void capture(false); }} />
      {saved && <Text accessibilityLiveRegion="polite" style={styles.small}>{t.artworkSaved}</Text>}
      {uri && <>
        <Button title={t.shareArtwork} icon="share-social-outline" tone="yellow" disabled={busy || loaded !== uri}
          onPress={() => { void output(false); }} />
        <Button title={t.printArtwork} icon="print-outline" tone="quiet" disabled={busy || loaded !== uri}
          onPress={() => { void output(true); }} />
      </>}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </> : <Text style={styles.body}>{t.missing}</Text>}
  </Page>;
}
