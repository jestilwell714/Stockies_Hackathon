import { Home, Trophy, User } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '../theme';

export type TabKey = 'home' | 'leaderboard' | 'memories' | 'profile';

type BottomTabsProps = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

const tabs = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { key: 'profile', label: 'Profile', icon: User },
] satisfies { key: TabKey; label: string; icon: typeof Home }[];

export function BottomTabs({ activeTab, onChange }: BottomTabsProps) {
  return (
    <View style={styles.wrap}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.key === activeTab;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
          >
            <Icon color={active ? colors.green : colors.muted} size={24} strokeWidth={2.4} />
            <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    minHeight: 78,
    paddingBottom: spacing.md,
    paddingTop: spacing.md,
  },
  tab: {
    alignItems: 'center',
    gap: 4,
    minWidth: 88,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  activeLabel: {
    color: colors.green,
  },
});
