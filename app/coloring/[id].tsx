import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { ColoringProcessor, coloringFile, saveColoring, type ColoringResult } from '../../src/coloring';
import { printImage } from '../../src/printing';
import { photoFile, useJournal } from '../../src/store';
import { copy } from '../../src/text';
import { Button, Chip, colors, Page, styles } from '../../src/ui';

export default function ColoringPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { journal: { memories, language } } = useJournal();
  const memory = memories.find(item => item.id === id);
  const t = copy[language];
  const [detailed, setDetailed] = useState(false);
  const [uri, setURI] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const [ready, setReady] = useState(false);
  const [ratio, setRatio] = useState(3 / 4);
  const [operation, setOperation] = useState(false);
  const working = useRef(false);
  const [error, setError] = useState<'coloringError' | 'printError' | 'coloringShareError'>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setURI(undefined);
    setReady(false);
    setError(undefined);
    if (!memory) { setProcessing(false); return; }
    try {
      const cached = coloringFile(memory.photo, detailed);
      if (cached.exists && cached.size > 0 && attempt === 0) {
        setURI(cached.uri);
        setProcessing(false);
      } else {
        if (cached.exists) cached.delete();
        setProcessing(true);
      }
    } catch { setProcessing(false); setError('coloringError'); }
  }, [memory?.photo, detailed, attempt]);

  function completed(result: ColoringResult) {
    if (!memory) return;
    try {
      setURI(saveColoring(memory.photo, detailed, result));
      setRatio(result.width / result.height);
    } catch { setError('coloringError'); }
    finally { setProcessing(false); }
  }

  async function output(print: boolean) {
    if (!uri || !ready || working.current) return;
    working.current = true;
    setOperation(true);
    setError(undefined);
    try {
      if (print) await printImage(uri);
      else {
        if (!await Sharing.isAvailableAsync()) throw new Error('Sharing unavailable');
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t.coloring });
      }
    } catch { setError(print ? 'printError' : 'coloringShareError'); }
    finally { working.current = false; setOperation(false); }
  }

  return <Page>
    <Button title={t.back} icon="arrow-back" tone="quiet" disabled={operation}
      onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/book'); }} />
    {memory ? <>
      <Text accessibilityRole="header" style={styles.title}>{t.coloring}</Text>
      <Text style={styles.body}>{t.coloringDescription}</Text>
      <View style={styles.row}>
        <Chip label={t.simpleLines} selected={!detailed} onPress={() => { if (!processing && !operation) { setAttempt(0); setDetailed(false); } }} />
        <Chip label={t.moreDetails} selected={detailed} onPress={() => { if (!processing && !operation) { setAttempt(0); setDetailed(true); } }} />
      </View>
      {processing && <View style={styles.card}>
        <ActivityIndicator color={colors.forest} size="large" />
        <Text accessibilityLiveRegion="polite" style={styles.body}>{t.creatingColoring}</Text>
        <ColoringProcessor key={memory.id + '-' + detailed + '-' + attempt}
          source={photoFile(memory.photo).uri} detailed={detailed} onComplete={completed}
          onError={() => { setProcessing(false); setError('coloringError'); }} />
      </View>}
      {uri && <Image source={{ uri }} resizeMode="contain" accessibilityLabel={t.coloring}
        style={[styles.image, { aspectRatio: ratio, backgroundColor: 'white' }]}
        onLoad={event => { const size = event.nativeEvent.source; setRatio(size.width / size.height); setReady(true); }}
        onError={() => { setReady(false); setError('coloringError'); }} />}
      {error && <Text accessibilityRole="alert" style={styles.error}>{t[error]}</Text>}
      {error === 'coloringError' && <Button title={t.retry} icon="refresh" disabled={operation}
        onPress={() => setAttempt(previous => previous + 1)} />}
      <Button title={t.printColoring} icon="print-outline" tone="yellow" disabled={!ready || processing || operation}
        onPress={() => { void output(true); }} />
      <Button title={t.shareColoring} icon="share-social-outline" disabled={!ready || processing || operation}
        onPress={() => { void output(false); }} />
    </> : <Text style={styles.body}>{t.missing}</Text>}
  </Page>;
}
