import { guideCopy, localizeCity, localizeCountry } from '../../src/city-copy';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { cities, countries, cityProgress } from '../../src/cities';
import { useJournal } from '../../src/store';
import { Button, colors, Page, styles } from '../../src/ui';

export default function CountryGuide() {
  const { countryId } = useLocalSearchParams<{ countryId: string }>();
  const { journal } = useJournal();
  const t = guideCopy[journal.language];
  const item = countries.find(item => item.id === countryId);
  const country = item ? localizeCountry(item, journal.language) : undefined;
  return <Page>
    <Button title={t.back} icon="arrow-back" tone="quiet" onPress={() => router.back()} />
    <Text accessibilityRole="header" style={styles.title}>{country?.name ?? t.countryMissing}</Text>
    {country && <>
      <Text style={styles.body}>{country.description}</Text>
      {cities.filter(city => city.countryId === country.id).map(item => localizeCity(item, journal.language)).map(city => <View key={city.id} style={[styles.card, { backgroundColor: city.color }]}>
        <View style={styles.row}>
          <Ionicons name={city.icon} size={32} color={colors.forest} accessible={false} />
          <Text accessibilityRole="header" style={[styles.heading, { flex: 1 }]}>{city.name}</Text>
        </View>
        <Text style={styles.body}>{city.description}</Text>
        <Text style={styles.small}>{t.progress(cityProgress(city, journal.visitedLandmarks), city.landmarkIds.length)}</Text>
        <Button title={t.discover(city.name)} icon="compass-outline" onPress={() => router.push({ pathname: '/city/[id]', params: { id: city.id } })} />
      </View>)}
    </>}
  </Page>;
}
