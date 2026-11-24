import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { cities, countries, cityProgress } from '../../src/cities';
import { useJournal } from '../../src/store';
import { Button, colors, Page, styles } from '../../src/ui';

export default function CountryGuide() {
  const { countryId } = useLocalSearchParams<{ countryId: string }>();
  const country = countries.find(item => item.id === countryId);
  const { journal } = useJournal();
  return <Page>
    <Button title="Tillbaka" icon="arrow-back" tone="quiet" onPress={() => router.back()} />
    <Text accessibilityRole="header" style={styles.title}>{country?.name ?? 'Landet hittades inte'}</Text>
    {country && <>
      <Text style={styles.body}>{country.description}</Text>
      {cities.filter(city => city.countryId === country.id).map(city => <View key={city.id} style={[styles.card, { backgroundColor: city.color }]}>
        <View style={styles.row}>
          <Ionicons name={city.icon} size={32} color={colors.forest} accessible={false} />
          <Text accessibilityRole="header" style={[styles.heading, { flex: 1 }]}>{city.name}</Text>
        </View>
        <Text style={styles.body}>{city.description}</Text>
        <Text style={styles.small}>Upptäckta platser: {cityProgress(city, journal.visitedLandmarks)} / {city.landmarkIds.length}</Text>
        <Button title={'Upptäck ' + city.name} icon="compass-outline" onPress={() => router.push({ pathname: '/city/[id]', params: { id: city.id } })} />
      </View>)}
    </>}
  </Page>;
}
