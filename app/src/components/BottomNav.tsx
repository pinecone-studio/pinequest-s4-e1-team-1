import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';

type Props = { navigation: any };

export default function BottomNav({ navigation }: Props) {
  const { colors: C } = useTheme();
  const route = navigation.getState?.()?.routes?.[navigation.getState?.()?.index]?.name;

  const items = [
    { name: 'home', icon: 'home-outline' as const, iconActive: 'home' as const, route: 'Record' },
    { name: 'tasks', icon: 'checkbox-outline' as const, iconActive: 'checkbox' as const, route: 'Tasks' },
    { name: 'mic', icon: 'mic' as const, iconActive: 'mic' as const, route: 'Record', center: true },
    { name: 'chart', icon: 'bar-chart-outline' as const, iconActive: 'bar-chart' as const, route: 'Report' },
    { name: 'person', icon: 'person-circle-outline' as const, iconActive: 'person-circle' as const, route: 'Settings' },
  ];

  return (
    <View style={[s.nav, { backgroundColor: C.tabBg, borderTopColor: C.tabBorder }]}>
      {items.map((item) => {
        const isActive = route === item.route;

        if (item.center) {
          return (
            <TouchableOpacity
              key={item.name}
              style={s.centerWrap}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#6366f1', '#818cf8']} style={s.micBtn}>
                <Ionicons name="mic" size={26} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={item.name}
            style={s.item}
            onPress={() => navigation.navigate(item.route)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? item.iconActive : item.icon}
              size={24}
              color={isActive ? C.accent : C.textMuted}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  nav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 80,
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: 12, paddingHorizontal: 8,
    borderTopWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 12, shadowOffset: { width: 0, height: -3 },
  },
  item: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8,
  },
  centerWrap: {
    flex: 1, alignItems: 'center', marginTop: -24,
  },
  micBtn: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6366f1', shadowOpacity: 0.5,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
});
