import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';
import { Tab, TABS } from './taskConstants';

const TAB_W = (Dimensions.get('window').width - 32 - 6) / 3;

type Props = {
  activeTab: Tab;
  counts: Record<Tab, number>;
  onSwitch: (tab: Tab) => void;
};

export default function TabFilter({ activeTab, counts, onSwitch }: Props) {
  const initialIdx = TABS.findIndex(t => t.key === activeTab);
  const pillAnim   = useRef(new Animated.Value(initialIdx * (TAB_W + 2))).current;

  const handleSwitch = (tab: Tab, idx: number) => {
    onSwitch(tab);
    Animated.spring(pillAnim, {
      toValue: idx * (TAB_W + 2),
      useNativeDriver: false,
      tension: 70,
      friction: 11,
    }).start();
  };

  return (
    <View style={s.wrapper}>
      <Animated.View style={[s.pill, { left: pillAnim, width: TAB_W }]} />
      {TABS.map((tab, i) => (
        <TouchableOpacity
          key={tab.key}
          style={[s.btn, { width: TAB_W }]}
          onPress={() => handleSwitch(tab.key, i)}
          activeOpacity={0.7}
        >
          <Text style={[s.text, activeTab === tab.key && s.textActive]}>
            {tab.label}
          </Text>
          {activeTab !== tab.key && counts[tab.key] > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{counts[tab.key]}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper:   { flexDirection: 'row', backgroundColor: '#E8E8F0', borderRadius: 14, padding: 3, marginBottom: 16, height: 44, position: 'relative' },
  pill:      { position: 'absolute', top: 3, bottom: 3, backgroundColor: '#fff', borderRadius: 11, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  btn:       { height: 38, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 4 },
  text:      { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  textActive:{ color: '#1A1A2E', fontWeight: '700' },
  badge:     { backgroundColor: '#6C47FF', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
