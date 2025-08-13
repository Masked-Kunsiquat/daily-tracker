import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Daily Planner',
            headerStyle: { backgroundColor: '#f8f9fa' },
            headerTitleStyle: { fontWeight: 'bold' }
          }} 
        />
        <Stack.Screen 
          name="daily-entry" 
          options={{ 
            title: 'Daily Entry',
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="summaries" 
          options={{ 
            title: 'Summaries'
          }} 
        />
      </Stack>
    </>
  );
}