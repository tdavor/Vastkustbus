import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Avatar } from './missions';

export const colors = {
  forest: '#2D6A4F', deep: '#173D30', yellow: '#FFB703', cream: '#FEFAE0',
  sky: '#219EBC', paleBlue: '#DDF3F6', paleGreen: '#E0EDDD', white: '#FFFDF5',
  line: '#DDDCC3', muted: '#4D6559', danger: '#9A302D',
};

export type Icon = ComponentProps<typeof Ionicons>['name'];

export function Page({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
        <View style={styles.page}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Button({ title, icon, onPress, tone = 'green', disabled = false }: {
  title: string; icon: Icon; onPress: () => void; tone?: 'green' | 'yellow' | 'quiet'; disabled?: boolean;
}) {
  const color = tone === 'green' ? colors.white : colors.deep;
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, styles[tone], (pressed || disabled) && styles.faded]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.buttonText, { color }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={[styles.chip, selected && styles.selected]}>
      <Text style={[styles.chipText, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const art = {
  moose: require('../assets/moose.png'),
  seal: require('../assets/seal.png'),
  fox: require('../assets/fox.png'),
  puffin: require('../assets/puffin.png'),
};

export function Animal({ avatar, size = 88 }: { avatar: Avatar; size?: number }) {
  return <Image source={art[avatar]} style={{ width: size, height: size }} accessible={false} />;
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 28 },
  page: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 16 },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '900', color: colors.deep },
  heading: { fontSize: 23, lineHeight: 30, fontWeight: '900', color: colors.deep },
  body: { fontSize: 17, lineHeight: 25, color: colors.deep },
  small: { fontSize: 14, lineHeight: 20, color: colors.muted, fontWeight: '600' },
  brand: { fontSize: 17, fontWeight: '900', letterSpacing: 0.4, color: colors.forest },
  card: { borderRadius: 26, padding: 20, gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  input: { minHeight: 54, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 16, paddingHorizontal: 14, color: colors.deep, fontSize: 18 },
  button: { minHeight: 55, borderRadius: 17, paddingHorizontal: 15, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  green: { backgroundColor: colors.forest },
  yellow: { backgroundColor: colors.yellow },
  quiet: { backgroundColor: colors.paleBlue },
  faded: { opacity: 0.65 },
  buttonText: { fontSize: 17, fontWeight: '800', flexShrink: 1, textAlign: 'center' },
  chip: { minHeight: 46, borderRadius: 24, justifyContent: 'center', paddingHorizontal: 13, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  selected: { backgroundColor: colors.forest, borderColor: colors.forest },
  chipText: { fontSize: 14, fontWeight: '800', color: colors.deep },
  selectedText: { color: colors.white },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: 18, backgroundColor: colors.paleGreen },
  error: { fontSize: 15, color: colors.danger },
});
