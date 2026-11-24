import { guideCopy, localizeCity, localizeLandmark } from './city-copy';
import { cityLandmarks, cityProgress, type City } from './cities';
import { useParentalGate } from './parent-gate';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { landmarkMapURL, restoreLandmarkVisits, type Landmark } from './landmarks';
import { useJournal } from './store';
import { Button, colors, Page, styles } from './ui';

export function CityGuide({ city }: { city: City }) {
  const { authorize } = useParentalGate();
  const { journal, activePlayerId, checkInLandmark } = useJournal();
  const t = guideCopy[journal.language];
  const content = localizeCity(city, journal.language);
  const places = cityLandmarks(city).map(place => localizeLandmark(place, journal.language));
  const [saving, setSaving] = useState<string>();
  const inFlight = useRef(false);
  const [notice, setNotice] = useState<{ playerId: string; placeId: string; kind: 'earned' | 'visitedNotice' | 'saveError' | 'mapError' }>();
  const visits = restoreLandmarkVisits(journal.visitedLandmarks);

  async function checkIn(place: Landmark) {
    if (inFlight.current || !activePlayerId) return;
    const playerId = activePlayerId;
    inFlight.current = true;
    setSaving(place.id);
    setNotice(undefined);
    try {
      const earned = await checkInLandmark(place.id);
      setNotice({
        playerId, placeId: place.id, kind: earned ? 'earned' : 'visitedNotice',
      });
    } catch {
      setNotice({ playerId, placeId: place.id, kind: 'saveError' });
    } finally {
      inFlight.current = false;
      setSaving(undefined);
    }
  }

  async function openMap(place: Landmark) {
    if (!activePlayerId) return;
    const playerId = activePlayerId;
    setNotice(undefined);
    try {
      if (!await authorize('external')) return;
      await Linking.openURL(landmarkMapURL(place, Platform.OS));
    } catch {
      setNotice({ playerId, placeId: place.id, kind: 'mapError' });
    }
  }

  if (!journal.profile) return null;
  return (
    <Page>
      <Button title={t.back} icon="arrow-back" tone="quiet" onPress={() => router.back()} />
      <View style={styles.row}>
        <Ionicons name="compass-outline" size={36} color={colors.forest} accessible={false} />
        <Text accessibilityRole="header" style={[styles.title, { flex: 1 }]}>{content.name}</Text>
      </View>
      <Text style={styles.body}>{content.description}</Text>
      <Text style={styles.small}>{t.hint}</Text>
      <View style={[styles.card, { backgroundColor: colors.paleBlue }]}>
        <Text accessibilityLiveRegion="polite" style={styles.heading}>{t.progress(cityProgress(city, visits), places.length)}</Text>
        <Text style={styles.small}>{t.firstVisit(journal.profile.name)}</Text>
      </View>
      {places.map(place => {
        const visited = visits.includes(place.id);
        const message = notice && notice.playerId === activePlayerId && notice.placeId === place.id ? notice : undefined;
        const error = message?.kind === 'saveError' || message?.kind === 'mapError';
        return (
          <View key={place.id} style={[styles.card, { backgroundColor: place.color, borderColor: colors.white }]}>
            <View style={styles.row}>
              <Ionicons name={place.icon} size={32} color={colors.deep} accessible={false} />
              <Text accessibilityRole="header" style={[styles.heading, { flex: 1 }]}>{place.name}</Text>
            </View>
            <Text style={styles.small}>{place.neighborhood}</Text>
            {visited && (
              <View style={{ alignSelf: 'flex-start', backgroundColor: colors.forest, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 9, transform: [{ rotate: '-3deg' }] }}>
                <Text style={[styles.buttonText, { color: colors.white }]}>{t.stamp}</Text>
              </View>
            )}
            <Text style={styles.brand}>{t.fact}</Text>
            <Text style={styles.body}>{place.fact}</Text>
            <View style={[styles.card, { padding: 14, backgroundColor: colors.white }]}>
              <Text style={styles.brand}>{t.challenge}</Text>
              <Text style={styles.body}>{place.challenge}</Text>
            </View>
            <Button title={t.map} icon="map-outline" tone="quiet" onPress={() => { void openMap(place); }} />
            <Button
              title={visited ? t.visited : saving === place.id ? t.saving : t.checkIn}
              icon={visited ? 'checkmark-circle' : 'location-outline'}
              tone={visited ? 'green' : 'yellow'}
              disabled={visited || saving !== undefined}
              onPress={() => { void checkIn(place); }}
            />
            <Button title={t.photo} icon="camera-outline" tone="quiet" disabled={saving !== undefined}
              onPress={() => router.push({ pathname: '/landmark-photo/[id]', params: { id: place.id } })} />
            {journal.memories.filter(memory => memory.landmarkId === place.id).length > 0 && <>
              <Text style={styles.small}>{t.photoCount(journal.memories.filter(memory => memory.landmarkId === place.id).length)}</Text>
              <Button title={t.album} icon="book-outline" tone="quiet" onPress={() => router.push('/book')} />
            </>}
            {message && <Text accessibilityLiveRegion="polite" accessibilityRole={error ? 'alert' : undefined}
              style={error ? styles.error : styles.body}>{message.kind === 'earned' ? t.earned(place.name) : t[message.kind]}</Text>}
          </View>
        );
      })}
    </Page>
  );
}
