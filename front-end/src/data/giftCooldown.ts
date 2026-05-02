import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@skimp/last_daily_gift_unboxed_at_ms';

/** One gift unwrap per rolling 24h window. */
export const GIFT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export async function getLastGiftUnboxedAtMs(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null || raw === '') {
      return null;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function getGiftCooldownRemainingMs(lastUnboxedAtMs: number | null): number {
  if (lastUnboxedAtMs === null) {
    return 0;
  }
  return Math.max(0, GIFT_COOLDOWN_MS - (Date.now() - lastUnboxedAtMs));
}

export async function setLastGiftUnboxedAtMs(timestampMs: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(timestampMs));
  } catch {
    /* ignore persistence failures; cooldown will not stick until retry */
  }
}
