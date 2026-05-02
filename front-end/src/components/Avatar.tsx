import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../theme';

type AvatarProps = {
  name: string;
  uri?: string;
  color: string;
  size?: number;
};

export function Avatar({ name, uri, color, size = 44 }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          accessibilityLabel={`${name} profile image`}
        />
      ) : (
        <Text style={[styles.initials, { fontSize: Math.max(12, size * 0.32) }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderColor: colors.surface,
    borderWidth: 3,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: colors.text,
    fontFamily: fonts.headingSemi,
  },
});
