// Preserve existing links while Göteborg moves under Sweden in the city guide.
import { cities } from '../src/cities';
import { CityGuide } from '../src/city-guide';
export default function DiscoverGothenburg() {
  return <CityGuide city={cities.find(city => city.id === 'gothenburg')!} />;
}
