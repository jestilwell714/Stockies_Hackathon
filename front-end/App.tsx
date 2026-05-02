import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, SafeAreaView, StyleSheet, View } from 'react-native';

import { BottomTabs, type TabKey } from './src/components/BottomTabs';
import { SKIMP_LOGO_SOURCE } from './src/components/Logo';
import {
  MOCK_CURRENT_CHALLENGE_ID,
  MOCK_CURRENT_GROUP_ID,
  MOCK_CURRENT_USER_ID,
  mockSkimpAdapter,
} from './src/data/mockSkimpAdapter';
import { colors } from './src/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { MemoriesScreen } from './src/screens/MemoriesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Sora_600SemiBold,
    Sora_700Bold,
  });
  const adapter = useMemo(() => mockSkimpAdapter, []);
  const slide = useRef(new Animated.Value(0)).current;
  const previousTabRef = useRef<TabKey>('home');

  useEffect(() => {
    const logoUri = Image.resolveAssetSource(SKIMP_LOGO_SOURCE).uri;
    Image.prefetch(logoUri)
      .catch(() => undefined)
      .finally(() => setLogoLoaded(true));
  }, []);

  useEffect(() => {
    const previousTab = previousTabRef.current;
    if (previousTab === activeTab) {
      return;
    }

    const tabOrder: Record<TabKey, number> = { home: 0, leaderboard: 1, profile: 2, memories: 3 };
    const direction = tabOrder[activeTab] > tabOrder[previousTab] ? 40 : -40;
    slide.setValue(direction);
    Animated.spring(slide, {
      toValue: 0,
      damping: 18,
      mass: 0.7,
      stiffness: 180,
      useNativeDriver: true,
    }).start();
    previousTabRef.current = activeTab;
  }, [activeTab, slide]);

  if (!fontsLoaded || !logoLoaded) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.screen, { transform: [{ translateX: slide }] }]}>
          <View style={[styles.screen, activeTab === 'memories' && styles.hiddenScreen]}>
            <View style={[styles.screen, activeTab !== 'home' && styles.hiddenScreen]}>
              <HomeScreen adapter={adapter} currentUserId={MOCK_CURRENT_USER_ID} />
            </View>
            <View style={[styles.screen, activeTab !== 'leaderboard' && styles.hiddenScreen]}>
              <LeaderboardScreen
                adapter={adapter}
                challengeId={MOCK_CURRENT_CHALLENGE_ID}
                currentUserId={MOCK_CURRENT_USER_ID}
                groupId={MOCK_CURRENT_GROUP_ID}
              />
            </View>
            <View style={[styles.screen, activeTab !== 'profile' && styles.hiddenScreen]}>
              <ProfileScreen
                adapter={adapter}
                challengeId={MOCK_CURRENT_CHALLENGE_ID}
                currentUserId={MOCK_CURRENT_USER_ID}
                groupId={MOCK_CURRENT_GROUP_ID}
                onOpenMemories={() => setActiveTab('memories')}
              />
            </View>
          </View>
          {activeTab === 'memories' ? (
            <MemoriesScreen
              adapter={adapter}
              currentUserId={MOCK_CURRENT_USER_ID}
              groupId={MOCK_CURRENT_GROUP_ID}
              onBack={() => setActiveTab('profile')}
            />
          ) : null}
        </Animated.View>
      </SafeAreaView>
      {activeTab !== 'memories' ? <BottomTabs activeTab={activeTab} onChange={setActiveTab} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  hiddenScreen: {
    display: 'none',
  },
});
