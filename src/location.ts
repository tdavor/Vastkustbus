import * as Location from 'expo-location';
import * as Network from 'expo-network';
import type { Coordinates } from './store';

export async function locate(onCoordinates: (coordinates: Coordinates) => void): Promise<string | undefined> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let expired = false;
  const deadline = new Promise<undefined>(resolve => {
    timeout = setTimeout(() => {
      expired = true;
      resolve(undefined);
    }, 5000);
  });
  const lookup = async () => {
    try {
      const fix = await Location.getLastKnownPositionAsync({ maxAge: 30000, requiredAccuracy: 150 })
        ?? await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: false,
        });
      if (expired) return;
      const coordinates = { latitude: fix.coords.latitude, longitude: fix.coords.longitude };
      onCoordinates(coordinates);
      const network = await Network.getNetworkStateAsync();
      if (expired || !network.isConnected || network.isInternetReachable === false) return;
      const [address] = await Location.reverseGeocodeAsync(coordinates);
      return address?.district || address?.subregion || address?.city || undefined;
    } catch {
      return undefined;
    }
  };
  try {
    return await Promise.race([lookup(), deadline]);
  } finally {
    clearTimeout(timeout);
  }
}
