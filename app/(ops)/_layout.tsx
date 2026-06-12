import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { brand, useColors } from '@/theme';

export default function OpsTabsLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.navy,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { backgroundColor: c.bgSurface, borderTopColor: c.border },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hub',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'alert-circle' : 'alert-circle-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="job-cards"
        options={{
          title: 'Job Cards',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'construct' : 'construct-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
      {/* Reachable from the Hub, hidden from the tab bar */}
      <Tabs.Screen name="spare-parts" options={{ href: null }} />
      <Tabs.Screen name="tyres" options={{ href: null }} />
      <Tabs.Screen name="invoices" options={{ href: null }} />
      <Tabs.Screen name="maintenance" options={{ href: null }} />
      <Tabs.Screen name="trips" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
    </Tabs>
  );
}
