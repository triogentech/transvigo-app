import { Stack } from 'expo-router';

/** The Hub's modules (spare parts, tyres, vendors, ...). A real stack: hidden tab screens could not be opened from the Hub on Android. */
export default function OpsMoreLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
