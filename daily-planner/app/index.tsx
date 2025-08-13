import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  AccessibilityInfo,
} from 'react-native';
import { Link } from 'expo-router';
import { databaseService, DailyEntry } from '../lib/database';
import { summaryService } from '../lib/summaryService';

type SummaryStats = {
  weekly: number;
  monthly: number;
  yearly: number;
};

const COLORS = {
  bg: '#fff',
  text: '#333',
  subtext: '#666',
  muted: '#888',
  card: '#f8f9fa',
  border: '#e9ecef',
  primary: '#007AFF',
  warnBorder: '#f0e68c',
  warnBg: '#fff8dc',
  success: '#34C759',
  caution: '#FF9500',
  danger: '#FF3B30',
};

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentEntries, setRecentEntries] = useState<DailyEntry[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    weekly: 0,
    monthly: 0,
    yearly: 0,
  });
  const [todayEntry, setTodayEntry] = useState<DailyEntry | null>(null);

  // Stable "today" values for this render
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayHuman = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date()),
    []
  );

  // guard against setState on unmounted component
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const getRatingColor = useCallback((rating: number) => {
    if (rating >= 4) return COLORS.success;
    if (rating >= 3) return COLORS.caution;
    return COLORS.danger;
  }, []);

  const getEntryPreview = useCallback((entry: DailyEntry): string => {
    const text = entry.daily_text?.trim() ?? '';
    if (text.length > 0) {
      return text.length > 100 ? `${text.substring(0, 100)}...` : text;
    }
    const a = entry.accomplishments?.length ?? 0;
    const l = entry.things_learned?.length ?? 0;
    const g = entry.things_grateful?.length ?? 0;
    return `${a + l + g} items logged`;
  }, []);

  const formatEntryDate = useCallback((dateStr: string): string => {
    // assume dateStr is YYYY-MM-DD
    if (dateStr === todayISO) return 'Today';

    const today = new Date(todayISO);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yISO = yesterday.toISOString().split('T')[0];
    if (dateStr === yISO) return 'Yesterday';

    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
  }, [todayISO]);

  const loadData = useCallback(async () => {
    try {
      // initialize storage if needed
      await databaseService.initialize();

      const [entries, todaysEntry, stats] = await Promise.all([
        databaseService.getRecentEntries(7),
        databaseService.getDailyEntry(todayISO),
        summaryService.getSummaryStats(),
      ]);

      if (!mountedRef.current) return;

      setRecentEntries(entries);
      setTodayEntry(todaysEntry);
      setSummaryStats(stats);

      // fire & forget
      summaryService.checkAndGeneratePendingSummaries().catch(console.error);
    } catch (error) {
      console.error('Error loading data:', error);
      AccessibilityInfo.announceForAccessibility?.('Failed to load data');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [todayISO]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    if (mountedRef.current) setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading your journal...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.dateText}>{todayHuman}</Text>
        <Text style={styles.welcomeText}>
          {todayEntry ? "Ready to update today's entry?" : 'Ready to plan your day?'}
        </Text>
      </View>

      <View style={styles.quickActions}>
        <Link
          href={{
            pathname: '/daily-entry',
            params: { date: todayISO },
          }}
          asChild
        >
          <TouchableOpacity style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>
              {todayEntry ? "✏️ Edit Today's Entry" : '📝 New Daily Entry'}
            </Text>
          </TouchableOpacity>
        </Link>

        <Link href="/summaries" asChild>
          <TouchableOpacity
            style={styles.secondaryButton}
            accessibilityRole="button"
            accessibilityHint="View weekly, monthly, and yearly summaries"
          >
            <Text style={styles.secondaryButtonText}>📊 View Summaries</Text>
            <View style={styles.summaryBadges}>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>{summaryStats.weekly}W</Text>
              </View>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>{summaryStats.monthly}M</Text>
              </View>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>{summaryStats.yearly}Y</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Entries</Text>
        {recentEntries.length > 0 ? (
          <View>
            {recentEntries.map((entry) => (
              <RecentEntryCard
                key={entry.date}
                entry={entry}
                formatEntryDate={formatEntryDate}
                getRatingColor={getRatingColor}
                getEntryPreview={getEntryPreview}
              />
            ))}
          </View>
        ) : (
          <View style={styles.placeholder} accessibilityLiveRegion="polite">
            <Text style={styles.placeholderText}>No entries yet</Text>
            <Text style={styles.placeholderSubtext}>Tap "New Daily Entry" to get started!</Text>
          </View>
        )}
      </View>

      {recentEntries.length > 0 && (
        <View style={styles.streakSection}>
          <Text style={styles.streakTitle}>🔥 Journal Streak</Text>
          <Text style={styles.streakText}>
            {recentEntries.length} {recentEntries.length === 1 ? 'day' : 'days'} logged this week
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

/** --- Presentational card (memoized) --- */
const RecentEntryCard = React.memo(function RecentEntryCard({
  entry,
  formatEntryDate,
  getRatingColor,
  getEntryPreview,
}: {
  entry: DailyEntry;
  formatEntryDate: (dateStr: string) => string;
  getRatingColor: (rating: number) => string;
  getEntryPreview: (entry: DailyEntry) => string;
}) {
  return (
    <Link
      href={{
        pathname: '/daily-entry',
        params: { date: entry.date },
      }}
      asChild
    >
      <TouchableOpacity style={styles.entryCard} accessibilityRole="button">
        <View style={styles.entryHeader}>
          <Text style={styles.entryDate}>{formatEntryDate(entry.date)}</Text>
          <View style={styles.ratingDots} accessible accessibilityLabel="Ratings">
            <View style={[styles.ratingDot, { backgroundColor: getRatingColor(entry.ratings.productivity) }]} />
            <View style={[styles.ratingDot, { backgroundColor: getRatingColor(entry.ratings.mood) }]} />
            <View style={[styles.ratingDot, { backgroundColor: getRatingColor(entry.ratings.energy) }]} />
          </View>
        </View>
        <Text style={styles.entryPreview}>{getEntryPreview(entry)}</Text>
        <View style={styles.entryStats}>
          <Text style={styles.entryStat}>
            ✅ {entry.accomplishments.length} • 📚 {entry.things_learned.length} • 🙏 {entry.things_grateful.length}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.subtext,
  },
  header: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    color: COLORS.subtext,
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  quickActions: {
    padding: 20,
    gap: 15,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  summaryBadges: {
    flexDirection: 'row',
    gap: 5,
  },
  summaryBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
    marginLeft: 8,
  },
  summaryBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recentSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.text,
  },
  entryCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  ratingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  entryPreview: {
    fontSize: 14,
    color: COLORS.subtext,
    lineHeight: 20,
    marginBottom: 8,
  },
  entryStats: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  entryStat: {
    fontSize: 12,
    color: COLORS.muted,
  },
  placeholder: {
    backgroundColor: COLORS.card,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.subtext,
    marginBottom: 5,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  streakSection: {
    margin: 20,
    marginTop: 0,
    padding: 16,
    backgroundColor: COLORS.warnBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.warnBorder,
    alignItems: 'center',
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  streakText: {
    fontSize: 14,
    color: COLORS.subtext,
  },
});
