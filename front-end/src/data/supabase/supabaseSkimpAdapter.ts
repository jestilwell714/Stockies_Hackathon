import type { SkimpDataAdapter } from '../types';
import { hasSupabaseConfig, supabase } from './supabaseClient';

const configurationError = () =>
  new Error(
    'Skimp Supabase project is not configured. Create the project, apply supabase/schema.sql, generate database types, then set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  );

const ensureSupabase = () => {
  if (!hasSupabaseConfig || !supabase) {
    throw configurationError();
  }

  return supabase;
};

export const supabaseSkimpAdapter: SkimpDataAdapter = {
  async getHomeDashboard() {
    ensureSupabase();
    throw configurationError();
  },
  async getWeeklyLeaderboard() {
    ensureSupabase();
    throw configurationError();
  },
  async getPointsLeaderboard() {
    ensureSupabase();
    throw configurationError();
  },
  async getWeeklyCumulativeSpend() {
    ensureSupabase();
    throw configurationError();
  },
  async getActivityFeed() {
    ensureSupabase();
    throw configurationError();
  },
  async getProfileSummary() {
    ensureSupabase();
    throw configurationError();
  },
  async getUserTransactions() {
    ensureSupabase();
    throw configurationError();
  },
  async getWeeklyRecaps() {
    ensureSupabase();
    throw configurationError();
  },
  async getWeeklyRecap() {
    ensureSupabase();
    throw configurationError();
  },
};
