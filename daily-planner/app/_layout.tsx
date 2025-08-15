// daily-planner/app/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * RootLayout
 *
 * App-wide navigation + status bar configuration for Expo Router.
 * Screens:
 * - `index`           → Home (Daily Planner)
 * - `daily-entry`     → Create/Edit a single day's entry (modal presentation)
 * - `summaries`       → Summary hub (lists counts and shortcuts)
 * - `summaries/[type]`→ Summary details by type (weekly/monthly/yearly)
 */
export default function RootLayout() {
  return (
    <>
      {/* System status bar styling (auto adapts to theme) */}
      <StatusBar style="auto" />

      {/* Stack navigator defines top-level routes */}
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Daily Planner',
            headerStyle: { backgroundColor: '#f8f9fa' },
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        />
        <Stack.Screen
          name="daily-entry"
          options={{
            title: 'Daily Entry',
            presentation: 'modal', // slide-up modal for focused editing
          }}
        />
        <Stack.Screen
          name="summaries"
          options={{
            title: 'Summaries',
          }}
        />
        <Stack.Screen
          name="summaries/[type]"
          options={{
            title: 'Summary Details',
            presentation: 'card', // standard push-style transition
          }}
        />
      </Stack>
    </>
  );
}
