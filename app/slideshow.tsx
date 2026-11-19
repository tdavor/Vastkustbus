import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rewardsCopy } from '../src/rewards';
import { photoFile, useJournal } from '../src/store';
import { copy } from '../src/text';
import { Button, colors, styles } from '../src/ui';

export default function Slideshow() {
  const { journal: { memories, rewards, language } } = useJournal();
  const r = rewardsCopy[language];
  const t = copy[language];
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const stars = useRef(new Animated.Value(0)).current;
  const photos = [...memories].reverse();
  const photo = photos[index];
  const unlocked = rewards.unlocked.includes(300);

  function step(direction: number) {
    if (photos.length) setIndex(current => (current + direction + photos.length) % photos.length);
  }

  useEffect(() => {
    if (!unlocked || !playing || photos.length < 2) return;
    const timer = setInterval(() => setIndex(current => (current + 1) % photos.length), 3800);
    return () => clearInterval(timer);
  }, [unlocked, playing, photos.length]);

  useEffect(() => {
    stars.setValue(1);
    const animation = Animated.timing(stars, { toValue: 0, duration: 850, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [stars, index]);

  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.deep, padding: 12, gap: 12 }}>
    <Button title={t.back} icon="arrow-back" tone="quiet" onPress={() => router.back()} />
    {unlocked && photo ? <>
      <View style={{ flex: 1, justifyContent: 'center', overflow: 'hidden' }}>
        <Image key={photo.id} source={{ uri: photoFile(photo.photo).uri }} resizeMode="contain"
          accessibilityLabel={t.photo} style={{ width: '100%', height: '100%' }} />
        <Animated.View pointerEvents="none" accessible={false} style={{
          position: 'absolute', alignSelf: 'center', opacity: stars,
          transform: [{ scale: stars.interpolate({ inputRange: [0, 1], outputRange: [2.2, 0.6] }) }],
        }}>
          <Text style={{ color: colors.gold, fontSize: 48 }}>✦ ★ ✦</Text>
        </Animated.View>
      </View>
      <Text style={[styles.small, { color: colors.white, textAlign: 'center' }]}>{index + 1} / {photos.length}</Text>
      {photos.length > 1 && <View style={[styles.row, { justifyContent: 'center' }]}>
        <Button title={r.previous} icon="chevron-back" tone="quiet" onPress={() => { setPlaying(false); step(-1); }} />
        <Button title={playing ? r.pause : r.play} icon={playing ? 'pause' : 'play'} tone="yellow" onPress={() => setPlaying(!playing)} />
        <Button title={r.nextPhoto} icon="chevron-forward" tone="quiet" onPress={() => { setPlaying(false); step(1); }} />
      </View>}
    </> : <Text style={[styles.body, { color: colors.white }]}>{unlocked ? t.empty : r.locked}</Text>}
  </SafeAreaView>;
}
