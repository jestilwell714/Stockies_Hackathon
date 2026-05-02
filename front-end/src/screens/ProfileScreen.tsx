import { CalendarDays, ChevronRight, Expand, Info, Medal, Settings, Trophy, UserCircle, Users, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';
import { ProfileStatCard } from '../components/ProfileStatCard';
import { ServerUnavailable } from '../components/ServerUnavailable';
import { TransactionCard } from '../components/TransactionCard';
import { TransactionsListModal } from '../components/TransactionsListModal';
import type { ProfileSummary, SkimpDataAdapter, Transaction } from '../data/types';
import { colors, fonts, spacing } from '../theme';
import { formatCurrency } from '../utils/format';

type ProfileScreenProps = {
  adapter: SkimpDataAdapter;
  currentUserId: string;
  groupId: string;
  challengeId: string;
  onOpenMemories: () => void;
};

export function ProfileScreen({ adapter, currentUserId, groupId, challengeId, onOpenMemories }: ProfileScreenProps) {
  const [summary, setSummary] = useState<ProfileSummary>();
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [serverError, setServerError] = useState<unknown>();
  const [showTransactions, setShowTransactions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    Promise.all([
      adapter.getProfileSummary(currentUserId, groupId, challengeId),
      adapter.getUserTransactions(currentUserId),
    ])
      .then(([nextSummary, nextTransactions]) => {
        setSummary(nextSummary);
        setAllTransactions(nextTransactions);
        setServerError(undefined);
      })
      .catch((error) => setServerError(error));
  }, [adapter, challengeId, currentUserId, groupId]);

  if (serverError) {
    return <ServerUnavailable error={serverError} />;
  }

  if (!summary) {
    return <Loading />;
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.profileHeader}>
            <Avatar
              color={summary.profile.avatarColor}
              name={summary.profile.displayName}
              uri={summary.profile.avatarUrl}
              size={86}
            />
            <View style={styles.profileText}>
              <Text style={styles.name}>{summary.profile.displayName}</Text>
              <Text style={styles.username}>@{summary.profile.username}</Text>
            </View>
            <Pressable accessibilityLabel="Open settings" accessibilityRole="button" onPress={() => setShowSettings(true)} style={styles.settingsButton}>
              <Settings color={colors.text} size={19} strokeWidth={2.4} />
            </Pressable>
          </View>
          <View style={styles.profileDivider} />
          <View style={styles.medalRow}>
            <MedalBadge count={summary.medals.gold} label="Gold" tone="#F1B84B" />
            <MedalBadge count={summary.medals.silver} label="Silver" tone="#AEB8C6" />
            <MedalBadge count={summary.medals.bronze} label="Bronze" tone="#E58B51" />
            <View style={styles.pointsWrap}>
              <Text style={styles.points}>{summary.profile.totalPoints}</Text>
              <Text style={styles.pointsLabel}>Points</Text>
            </View>
          </View>
        </Card>

        <View style={styles.statsRow}>
          <ProfileStatCard label="Daily Average" tone="mint" value={formatCurrency(summary.averageDailySpend)} />
          <ProfileStatCard label="Weekly Spend" tone="blue" value={formatCurrency(summary.weeklySpend)} />
          <ProfileStatCard label="Leaderboard" tone="peach" value={formatRank(summary.currentRank)} />
        </View>

        <Pressable accessibilityRole="button" onPress={onOpenMemories} style={({ pressed }) => pressed && styles.pressed}>
          <Card>
            <View style={styles.memoriesCard}>
              <View style={styles.memoriesIcon}>
                <CalendarDays color={colors.green} size={22} strokeWidth={2.4} />
              </View>
              <View style={styles.memoriesCopy}>
                <Text style={styles.memoriesTitle}>Weekly Memories</Text>
                <Text style={styles.memoriesSubtitle}>View previous recaps and final boards</Text>
              </View>
              <ChevronRight color={colors.textSoft} size={22} strokeWidth={2.4} />
            </View>
          </Card>
        </Pressable>

        <Card>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Pressable accessibilityRole="button" onPress={() => setShowTransactions(true)} style={styles.expandButton}>
              <Expand color={colors.textSoft} size={17} strokeWidth={2.4} />
            </Pressable>
          </View>
          {summary.recentTransactions.map((transaction) => (
            <TransactionCard key={transaction.id} onPress={() => setShowTransactions(true)} transaction={transaction} />
          ))}
        </Card>
      </ScrollView>
      <TransactionsListModal transactions={allTransactions} visible={showTransactions} onClose={() => setShowTransactions(false)} />
      <SettingsModal summary={summary} visible={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}

function formatRank(rank: number) {
  if (rank === 1) return '1st';
  if (rank === 2) return '2nd';
  if (rank === 3) return '3rd';
  return `${rank}th`;
}

function MedalBadge({ count, label, tone }: { count: number; label: string; tone: string }) {
  return (
    <View style={styles.medalBadge}>
      <View style={[styles.medalIcon, { backgroundColor: tone }]}> 
        {label === 'Gold' ? (
          <Trophy color={colors.surface} size={18} strokeWidth={2.5} />
        ) : (
          <Medal color={colors.surface} size={18} strokeWidth={2.5} />
        )}
      </View>
      <Text style={styles.medalCount}>{count}</Text>
    </View>
  );
}

function SettingsModal({ visible, summary, onClose }: { visible: boolean; summary: ProfileSummary; onClose: () => void }) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.settingsModal}>
          <View style={styles.settingsHeader}>
            <View>
              <Text style={styles.settingsTitle}>Settings</Text>
              <Text style={styles.settingsSubtitle}>Team, account, and app info</Text>
            </View>
            <Pressable accessibilityLabel="Close settings" accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
              <X color={colors.text} size={20} strokeWidth={2.4} />
            </Pressable>
          </View>

          <SettingsSection
            icon={<Users color={colors.green} size={21} strokeWidth={2.4} />}
            title="Friends Team"
            primary="Skimp Squad"
            secondary="Invite code SKIMP8 · 8 members"
            action="Change team"
          />
          <SettingsSection
            icon={<UserCircle color={colors.blueStrong} size={21} strokeWidth={2.4} />}
            title="Account"
            primary={summary.profile.displayName}
            secondary={`@${summary.profile.username} · ${summary.profile.totalPoints} points`}
            action="Edit account"
          />
          <SettingsSection
            icon={<Info color={colors.coral} size={21} strokeWidth={2.4} />}
            title="About Skimp"
            primary="Bad spend categories, privacy, and support"
            secondary="Manage notifications and connected accounts"
            action="View info"
          />
        </View>
      </View>
    </Modal>
  );
}

function SettingsSection({
  icon,
  title,
  primary,
  secondary,
  action,
}: {
  icon: ReactNode;
  title: string;
  primary: string;
  secondary: string;
  action: string;
}) {
  return (
    <View style={styles.settingsSection}>
      <View style={styles.settingsIcon}>{icon}</View>
      <View style={styles.settingsCopy}>
        <Text style={styles.settingsSectionTitle}>{title}</Text>
        <Text style={styles.settingsPrimary}>{primary}</Text>
        <Text style={styles.settingsSecondary}>{secondary}</Text>
      </View>
      <Pressable accessibilityRole="button" style={styles.settingsAction}>
        <Text style={styles.settingsActionText}>{action}</Text>
      </Pressable>
    </View>
  );
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.green} />
    </View>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  content: {
    gap: spacing.screenGap,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  profileText: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 26,
  },
  username: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  profileDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.lg,
  },
  medalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  medalBadge: {
    alignItems: 'center',
    flex: 1,
  },
  medalIcon: {
    alignItems: 'center',
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  medalCount: {
    color: colors.text,
    fontFamily: fonts.headingSemi,
    fontSize: 16,
    marginTop: 4,
  },
  pointsWrap: {
    alignItems: 'flex-end',
    flex: 1.2,
  },
  points: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 24,
  },
  pointsLabel: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
  memoriesCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  memoriesIcon: {
    alignItems: 'center',
    backgroundColor: colors.mint,
    borderRadius: 20,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  memoriesCopy: {
    flex: 1,
  },
  memoriesTitle: {
    color: colors.text,
    fontFamily: fonts.headingSemi,
    fontSize: 19,
  },
  memoriesSubtitle: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  expandButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 21,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 18, 0.34)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  settingsModal: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    gap: spacing.md,
    maxWidth: 430,
    padding: spacing.lg,
    width: '100%',
  },
  settingsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  settingsTitle: {
    color: colors.text,
    fontFamily: fonts.heading,
    fontSize: 25,
  },
  settingsSubtitle: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  settingsSection: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  settingsIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  settingsCopy: {
    flex: 1,
  },
  settingsSectionTitle: {
    color: colors.textSoft,
    fontFamily: fonts.bodySemi,
    fontSize: 11,
  },
  settingsPrimary: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    marginTop: 2,
  },
  settingsSecondary: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    marginTop: 1,
  },
  settingsAction: {
    backgroundColor: colors.mint,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  settingsActionText: {
    color: colors.green,
    fontFamily: fonts.bodySemi,
    fontSize: 11,
  },
});
