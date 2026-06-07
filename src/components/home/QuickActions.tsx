import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { fontSize, fontWeight, radius, spacing, status as st, useColors } from '@/theme';

interface QuickActionsProps {
  onReportIssue: () => void;
  onLogFuel: () => void;
  onLogToll: () => void;
  onMyTrips: () => void;
  hasCriticalTicket?: boolean;
}

type IconLib = 'ion' | 'mci';
interface Tile {
  key: string;
  label: string;
  lib: IconLib;
  icon: string;
  color: string;
  tint: string;
  onPress: () => void;
  danger?: boolean;
}

export function QuickActions({
  onReportIssue,
  onLogFuel,
  onLogToll,
  onMyTrips,
  hasCriticalTicket,
}: QuickActionsProps) {
  const c = useColors();

  const tiles: Tile[] = [
    { key: 'issue', label: 'Report Issue', lib: 'ion', icon: 'warning-outline', color: '#EA580C', tint: '#FEF1E6', onPress: onReportIssue, danger: hasCriticalTicket },
    { key: 'fuel', label: 'Log Fuel', lib: 'mci', icon: 'gas-station', color: '#2563EB', tint: '#EAF1FE', onPress: onLogFuel },
    { key: 'toll', label: 'Log Toll', lib: 'mci', icon: 'boom-gate', color: '#16A34A', tint: '#E9F8EF', onPress: onLogToll },
    { key: 'trips', label: 'My Trips', lib: 'mci', icon: 'history', color: '#7C3AED', tint: '#F1ECFE', onPress: onMyTrips },
  ];

  const handle = (fn: () => void) => () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fn();
  };

  return (
    <View style={styles.grid}>
      {tiles.map((t) => (
        <Pressable
          key={t.key}
          onPress={handle(t.onPress)}
          style={({ pressed }) => [
            styles.tile,
            {
              backgroundColor: c.bgCard,
              borderColor: t.danger ? st.danger : c.border,
              borderWidth: t.danger ? 1.5 : 1,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <View style={[styles.iconTile, { backgroundColor: t.tint }]}>
            {t.lib === 'ion' ? (
              <Ionicons name={t.icon as keyof typeof Ionicons.glyphMap} size={22} color={t.color} />
            ) : (
              <MaterialCommunityIcons name={t.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={22} color={t.color} />
            )}
          </View>
          <Text style={[styles.label, { color: c.textPrimary }]}>{t.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    width: '47.5%',
    flexGrow: 1,
    minHeight: 116,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    shadowColor: '#1B2D6B',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: fontSize.md, fontWeight: fontWeight.bold, marginTop: spacing.md },
});
