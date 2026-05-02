import { Image, StyleSheet } from 'react-native';

export const SKIMP_LOGO_SOURCE = require('../../assets/skimp-logo.png');

type LogoProps = {
  width?: number;
  height?: number;
};

export function Logo({ width = 150, height = 62 }: LogoProps) {
  return (
    <Image
      accessibilityLabel="Skimp"
      fadeDuration={0}
      resizeMode="contain"
      source={SKIMP_LOGO_SOURCE}
      style={[styles.logo, { width, height }]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    marginLeft: -8,
  },
});
