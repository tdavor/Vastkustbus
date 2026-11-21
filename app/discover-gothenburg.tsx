import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import { landmarks, landmarkMapURL, restoreLandmarkVisits, type Landmark } from '../src/landmarks';
import { useJournal } from '../src/store';
import { Button, colors, Page, styles } from '../src/ui';

export default function DiscoverGothenburg() {
  const { journal, activePlayerId, checkInLandmark } = useJournal();
  const [saving, setSaving] = useState<string>();
  const inFlight = useRef(false);
  const [notice, setNotice] = useState<{ playerId: string; placeId: string; text: string; error: boolean }>();
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
        playerId, placeId: place.id, error: false,
        text: earned ? 'Hurra! Ni har upptäckt ' + place.name + ' och fått +50 XP!' : 'Platsen är redan besökt.',
      });
    } catch {
      setNotice({ playerId, placeId: place.id, error: true, text: 'Besöket kunde inte sparas. Försök igen.' });
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
      await Linking.openURL(landmarkMapURL(place, Platform.OS));
    } catch {
      setNotice({ playerId, placeId: place.id, error: true, text: 'Kartan kunde inte öppnas. Försök igen.' });
    }
  }

  if (!journal.profile) return null;
  return (
    <Page>
      <Button title="Tillbaka" icon="arrow-back" tone="quiet" onPress={() => router.back()} />
      <View style={styles.row}>
        <Ionicons name="compass-outline" size={36} color={colors.forest} accessible={false} />
        <Text accessibilityRole="header" style={[styles.title, { flex: 1 }]}>Upptäck Göteborg</Text>
      </View>
      <Text style={styles.body}>Små upptäckter för dig och ditt barn. Läs tillsammans, prova en mini-utmaning och checka in när ni är där!</Text>
      <View style={[styles.card, { backgroundColor: colors.paleBlue }]}>
        <Text accessibilityLiveRegion="polite" style={styles.heading}>Upptäckta platser: {visits.length} / 8</Text>
        <Text style={styles.small}>Varje plats ger 50 XP första gången för {journal.profile.name}.</Text>
      </View>
      {landmarks.map(place => {
        const visited = visits.includes(place.id);
        const message = notice && notice.playerId === activePlayerId && notice.placeId === place.id ? notice : undefined;
        return (
          <View key={place.id} style={[styles.card, { backgroundColor: place.color, borderColor: colors.white }]}>
            <View style={styles.row}>
              <Ionicons name={place.icon} size={32} color={colors.deep} accessible={false} />
              <Text accessibilityRole="header" style={[styles.heading, { flex: 1 }]}>{place.name}</Text>
            </View>
            <Text style={styles.small}>{place.neighborhood}</Text>
            {visited && (
              <View style={{ alignSelf: 'flex-start', backgroundColor: colors.forest, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 9, transform: [{ rotate: '-3deg' }] }}>
                <Text style={[styles.buttonText, { color: colors.white }]}>★ Besökt!</Text>
              </View>
            )}
            <Text style={styles.brand}>Visste du att...</Text>
            <Text style={styles.body}>{place.fact}</Text>
            <View style={[styles.card, { padding: 14, backgroundColor: colors.white }]}>
              <Text style={styles.brand}>Mini-utmaning</Text>
              <Text style={styles.body}>{place.challenge}</Text>
            </View>
            <Button title="Öppna i kartan" icon="map-outline" tone="quiet" onPress={() => { void openMap(place); }} />
            <Button
              title={visited ? 'Redan besökt' : saving === place.id ? 'Sparar besöket...' : 'Checka in (+50 XP)'}
              icon={visited ? 'checkmark-circle' : 'location-outline'}
              tone={visited ? 'green' : 'yellow'}
              disabled={visited || saving !== undefined}
              onPress={() => { void checkIn(place); }}
            />
            {message && <Text accessibilityLiveRegion="polite" accessibilityRole={message.error ? 'alert' : undefined}
              style={message.error ? styles.error : styles.body}>{message.text}</Text>}
          </View>
        );
      })}
    </Page>
  );
}
