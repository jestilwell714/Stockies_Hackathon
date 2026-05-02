import { Bell, Gift, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '../theme';
import { GiftLessonModal } from './GiftLessonModal';
import { Logo } from './Logo';

export function AppHeader() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showGift, setShowGift] = useState(false);

  return (
    <View style={styles.header}>
      <Logo width={92} height={38} />
      <View style={styles.actionsRow}>
        <Pressable
          accessibilityLabel="Daily finance lesson"
          accessibilityRole="button"
          onPress={() => setShowGift(true)}
          style={styles.iconButton}
        >
          <Gift color={colors.text} size={21} strokeWidth={2.4} />
          <View style={styles.giftDot} />
        </Pressable>
        <Pressable
          accessibilityLabel="Notifications"
          accessibilityRole="button"
          onPress={() => setShowNotifications(true)}
          style={styles.iconButton}
        >
          <Bell color={colors.text} size={21} strokeWidth={2.4} />
          <View style={styles.notificationDot} />
        </Pressable>
      </View>

      <Modal animationType="fade" transparent visible={showNotifications} onRequestClose={() => setShowNotifications(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowNotifications(false)}>
          <Pressable style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <Text style={styles.notificationTitle}>Notifications</Text>
              <Pressable accessibilityLabel="Close notifications" accessibilityRole="button" onPress={() => setShowNotifications(false)} style={styles.closeButton}>
                <X color={colors.text} size={18} strokeWidth={2.4} />
              </Pressable>
            </View>
            <View style={styles.notificationItem}>
              <View style={styles.messageDot} />
              <View style={styles.messageCopy}>
                <Text style={styles.messageTitle}>Hi from the developers</Text>
                <Text style={styles.messageBody}>Thanks for trying Skimp.</Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <GiftLessonModal visible={showGift} onClose={() => setShowGift(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  actionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    position: 'relative',
    width: 40,
  },
  notificationDot: {
    backgroundColor: colors.coral,
    borderColor: colors.surface,
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    right: 8,
    top: 8,
    width: 10,
  },
  giftDot: {
    backgroundColor: colors.mintStrong,
    borderColor: colors.surface,
    borderRadius: 999,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    right: 8,
    top: 8,
    width: 10,
  },
  modalBackdrop: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(18, 18, 18, 0.18)',
    flex: 1,
    padding: spacing.lg,
    paddingTop: 78,
  },
  notificationCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    maxWidth: 360,
    padding: spacing.lg,
    shadowColor: '#121212',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    width: '100%',
  },
  notificationHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  notificationTitle: {
    color: colors.text,
    fontFamily: fonts.headingSemi,
    fontSize: 19,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  notificationItem: {
    alignItems: 'center',
    backgroundColor: '#F0FFF7',
    borderRadius: 18,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  messageDot: {
    backgroundColor: colors.mintStrong,
    borderRadius: 999,
    height: 12,
    width: 12,
  },
  messageCopy: {
    flex: 1,
  },
  messageTitle: {
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
  },
  messageBody: {
    color: colors.textSoft,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    marginTop: 2,
  },
});
