import { useParentalGate } from '../../src/parent-gate';
import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { createColoring, discardColoring, drawingEngineAvailable, normalizeDetail } from '../../src/coloring';
import { printImage } from '../../src/printing';
import { useJournal } from '../../src/store';
import { copy } from '../../src/text';
import { Button, colors, Page, styles } from '../../src/ui';

export default function ColoringPage() {
  const { authorize } = useParentalGate();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { journal: { memories, language } } = useJournal();
  const memory = memories.find(item => item.id === id);
  const t = copy[language];
  const [detail, setDetail] = useState(100);
  const [renderDetail, setRenderDetail] = useState(100);
  const [displayDetail, setDisplayDetail] = useState<number>();
  const [uri, setURI] = useState<string>();
  const [processing, setProcessing] = useState(true);
  const [loadedURI, setLoadedURI] = useState<string>();
  const ready = Boolean(uri && loadedURI === uri);
  const [ratio, setRatio] = useState(3 / 4);
  const [operation, setOperation] = useState(false);
  const working = useRef(false);
  const [error, setError] = useState<'coloringError' | 'printError' | 'coloringShareError'>();
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(0);
  const pendingAdjustment = detail !== displayDetail;

  useEffect(() => {
    setURI(undefined);
    setLoadedURI(undefined);
    setDisplayDetail(undefined);
    setDetail(100);
    setRenderDetail(100);
  }, [memory?.photo]);

  useEffect(() => {
    const request = ++latest.current;
    setError(undefined);
    setProcessing(true);
    if (!memory || !drawingEngineAvailable) { setProcessing(false); return; }
    // Debounce only the inexpensive adjustment. Model inference is cached once.
    const timer = setTimeout(() => {
      void createColoring(memory.photo, renderDetail).then(result => {
        if (latest.current !== request) return;
        setURI(result.uri);
        setDisplayDetail(renderDetail);
        if (result.width && result.height) setRatio(result.width / result.height);
        setProcessing(false);
      }).catch(() => {
        if (latest.current === request) { setProcessing(false); setError('coloringError'); }
      });
    }, renderDetail === 100 ? 0 : 180);
    return () => { clearTimeout(timer); latest.current++; };
  }, [memory?.photo, renderDetail, attempt]);

  async function output(print: boolean) {
    if (!uri || !ready || processing || pendingAdjustment || working.current) return;
    working.current = true;
    setOperation(true);
    setError(undefined);
    try {
      if (!await authorize('sharing')) return;
      if (print) await printImage(uri);
      else {
        if (!await Sharing.isAvailableAsync()) throw new Error('Sharing unavailable');
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t.coloring });
      }
    } catch { setError(print ? 'printError' : 'coloringShareError'); }
    finally { working.current = false; setOperation(false); }
  }

  function retry() {
    if (!memory || operation || processing) return;
    try {
      discardColoring(memory.photo, renderDetail);
      // If an adjusted PNG failed, rebuild from a fresh model result too.
      if (renderDetail !== 100) discardColoring(memory.photo, 100);
      setURI(undefined);
      setLoadedURI(undefined);
      setAttempt(previous => previous + 1);
    } catch { setError('coloringError'); }
  }

  return <Page>
    <Button title={t.back} icon="arrow-back" tone="quiet" disabled={operation}
      onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/book'); }} />
    {memory ? <>
      <Text accessibilityRole="header" style={styles.title}>{t.coloring}</Text>
      <Text style={styles.body}>{t.coloringDescription}</Text>
      {!drawingEngineAvailable ? <Text accessibilityRole="alert" style={styles.error}>{t.coloringNeedsBuild}</Text> : <>
        <View style={styles.card}>
          <Text style={styles.heading}>{t.detailControl}: {detail}%</Text>
          <Slider accessibilityLabel={t.detailControl} accessibilityHint={t.detailHint}
            minimumValue={0} maximumValue={100} step={5} value={detail}
            disabled={operation || !uri || (processing && !uri)}
            minimumTrackTintColor={colors.forest} maximumTrackTintColor="#CBD5C6" thumbTintColor={colors.forest}
            onValueChange={value => { const next = normalizeDetail(value); setDetail(next); setRenderDetail(next); }}
            onSlidingComplete={value => { const next = normalizeDetail(value); setDetail(next); setRenderDetail(next); }} />
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <Text style={styles.small}>{t.fewerDetails}</Text><Text style={styles.small}>{t.moreDetails}</Text>
          </View>
          <Text style={styles.small}>{t.detailHint}</Text>
          {uri && processing && <View style={styles.row}>
            <ActivityIndicator color={colors.forest} /><Text accessibilityLiveRegion="polite" style={styles.small}>{t.adjustingColoring}</Text>
          </View>}
          <Button title={t.originalDrawing} icon="refresh-outline" tone="quiet" disabled={operation || !uri}
            onPress={() => { setDetail(100); setRenderDetail(100); }} />
        </View>
        {processing && !uri && <View style={styles.card}>
          <ActivityIndicator color={colors.forest} size="large" />
          <Text accessibilityLiveRegion="polite" style={styles.body}>{uri ? t.adjustingColoring : t.creatingColoring}</Text>
        </View>}
        {uri && <Image key={uri + '-' + attempt} source={{ uri }} resizeMode="contain" accessibilityLabel={t.coloring}
          style={[styles.image, { aspectRatio: ratio, backgroundColor: 'white' }]}
          onLoad={event => { const size = event.nativeEvent.source; setRatio(size.width / size.height); setLoadedURI(uri); }}
          onError={() => { setLoadedURI(undefined); setError('coloringError'); }} />}
        {error && <Text accessibilityRole="alert" style={styles.error}>{t[error]}</Text>}
        {error === 'coloringError' && <Button title={t.retry} icon="refresh" disabled={operation || processing} onPress={retry} />}
        <Button title={t.printColoring} icon="print-outline" tone="yellow" disabled={!ready || processing || pendingAdjustment || operation}
          onPress={() => { void output(true); }} />
        <Button title={t.shareColoring} icon="share-social-outline" disabled={!ready || processing || pendingAdjustment || operation}
          onPress={() => { void output(false); }} />
        <Button title={t.takeArtwork} icon="camera-outline" tone="quiet" disabled={operation || processing}
          onPress={() => router.push({ pathname: '/artwork/[id]', params: { id: memory.id } })} />
        <Text style={styles.small}>{t.drawingCredit}</Text>
      </>}
    </> : <Text style={styles.body}>{t.missing}</Text>}
  </Page>;
}
