import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, SafeAreaView, StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';

import { BottomTabs, type TabKey } from './src/components/BottomTabs';
import { SKIMP_LOGO_SOURCE } from './src/components/Logo';
import {
  API_CURRENT_CHALLENGE_ID,
  API_CURRENT_GROUP_ID,
  API_CURRENT_USER_ID,
  apiSkimpAdapter,
} from './src/data/apiSkimpAdapter';
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
  const adapter = useMemo(() => apiSkimpAdapter, []);
  const slide = useRef(new Animated.Value(0)).current;
  const previousTabRef = useRef<TabKey>('home');

  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(SKIMP_LOGO_SOURCE);
        await asset.downloadAsync();
      } catch {
        // ignore failures and continue
      } finally {
        setLogoLoaded(true);
      }
    })();
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
              <HomeScreen adapter={adapter} currentUserId={API_CURRENT_USER_ID} />
            </View>
            <View style={[styles.screen, activeTab !== 'leaderboard' && styles.hiddenScreen]}>
              <LeaderboardScreen
                adapter={adapter}
                challengeId={API_CURRENT_CHALLENGE_ID}
                currentUserId={API_CURRENT_USER_ID}
                groupId={API_CURRENT_GROUP_ID}
              />
            </View>
            <View style={[styles.screen, activeTab !== 'profile' && styles.hiddenScreen]}>
              <ProfileScreen
                adapter={adapter}
                challengeId={API_CURRENT_CHALLENGE_ID}
                currentUserId={API_CURRENT_USER_ID}
                groupId={API_CURRENT_GROUP_ID}
                onOpenMemories={() => setActiveTab('memories')}
              />
            </View>
          </View>
          {activeTab === 'memories' ? (
            <MemoriesScreen
              adapter={adapter}
              currentUserId={API_CURRENT_USER_ID}
              groupId={API_CURRENT_GROUP_ID}
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
