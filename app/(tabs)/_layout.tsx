import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { brand, useColors } from '@/theme';
import * as ticketsApi from '@/api/tickets.api';

export default function TabsLayout() {
  const c = useColors();
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    let active = true;
    ticketsApi
      .getTicketsPage({ status: 'open', pageSize: 1 })
      .then((r) => {
        if (active) setOpenCount(r.pagination.total);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const badge = openCount > 0 ? openCount : undefined;

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
          title: 'Home',
          tabBarBadge: badge,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarBadge: badge,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'alert-circle' : 'alert-circle-outline'} size={size} color={color} />
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
    </Tabs>
  );
}
