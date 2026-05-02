import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, SafeAreaView, StyleSheet, View } from 'react-native';

import { BottomTabs, type TabKey } from './src/components/BottomTabs';
import { apiSkimpAdapter } from './src/data/apiSkimpAdapter';
import type { DemoSession } from './src/data/types';
import { colors } from './src/theme';
import { HomeScreen } from './src/screens/HomeScreen';
import { JoinDemoScreen } from './src/screens/JoinDemoScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { MemoriesScreen } from './src/screens/MemoriesScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

const DEMO_SESSION_KEY = 'skimp-demo-session';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [session, setSession] = useState<DemoSession>();
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
        const stored = await AsyncStorage.getItem(DEMO_SESSION_KEY);
        if (stored) {
          setSession(JSON.parse(stored) as DemoSession);
        }
      } catch {
        await AsyncStorage.removeItem(DEMO_SESSION_KEY);
      } finally {
        setSessionLoaded(true);
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

  if (!fontsLoaded || !sessionLoaded) {
    return <View style={styles.root} />;
  }

  const joinDemo = async (nextSession: DemoSession) => {
    await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  };

  const resetSession = async () => {
    await AsyncStorage.removeItem(DEMO_SESSION_KEY);
    setActiveTab('home');
    setSession(undefined);
  };

  if (!session) {
    return (
      <View style={styles.root}>
        <StatusBar style="dark" />
        <JoinDemoScreen adapter={adapter} onJoin={joinDemo} onResetSession={resetSession} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.screen, { transform: [{ translateX: slide }] }]}>
          <View style={[styles.screen, activeTab === 'memories' && styles.hiddenScreen]}>
            <View style={[styles.screen, activeTab !== 'home' && styles.hiddenScreen]}>
              <HomeScreen adapter={adapter} currentUserId={session.userId} onResetSession={resetSession} />
            </View>
            <View style={[styles.screen, activeTab !== 'leaderboard' && styles.hiddenScreen]}>
              <LeaderboardScreen
                adapter={adapter}
                challengeId={session.challengeId}
                currentUserId={session.userId}
                groupId={session.groupId}
                onResetSession={resetSession}
              />
            </View>
            <View style={[styles.screen, activeTab !== 'profile' && styles.hiddenScreen]}>
              <ProfileScreen
                adapter={adapter}
                challengeId={session.challengeId}
                currentUserId={session.userId}
                groupId={session.groupId}
                onOpenMemories={() => setActiveTab('memories')}
                onResetSession={resetSession}
              />
            </View>
          </View>
          {activeTab === 'memories' ? (
            <MemoriesScreen
              adapter={adapter}
              currentUserId={session.userId}
              groupId={session.groupId}
              onBack={() => setActiveTab('profile')}
              onResetSession={resetSession}
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
