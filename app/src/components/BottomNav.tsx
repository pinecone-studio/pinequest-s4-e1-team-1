import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type NavItem = { icon: string; label: string; active?: boolean; onPress: () => void };

type Props = { navigation: any };

export default function BottomNav({ navigation }: Props) {
  const left: NavItem[] = [
    { icon: '⌂', label: 'Home',  onPress: () => {} },
    { icon: '☑', label: 'Tasks', active: true, onPress: () => {} },
  ];
  const right: NavItem[] = [
    { icon: '◎', label: 'Insights', onPress: () => navigation.navigate('Report') },
    { icon: '○', label: 'You',      onPress: () => {} },
  ];

  const NavBtn = ({ item }: { item: NavItem }) => (
    <TouchableOpacity style={s.item} onPress={item.onPress} activeOpacity={0.7}>
      <Text style={[s.icon, item.active && s.iconActive]}>{item.icon}</Text>
      <Text style={[s.label, item.active && s.labelActive]}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={s.nav}>
      {left.map(item => <NavBtn key={item.label} item={item} />)}

      <View style={s.centerWrap}>
        <TouchableOpacity onPress={() => navigation.navigate('Record')} activeOpacity={0.85}>
          <LinearGradient colors={['#6C47FF', '#9747FF']} style={s.mic}>
            <Text style={s.micIcon}>🎙</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {right.map(item => <NavBtn key={item.label} item={item} />)}
    </View>
  );
}

const s = StyleSheet.create({
  nav:        { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingBottom: 10, paddingHorizontal: 10, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: -4 }, elevation: 10 },
  item:       { flex: 1, alignItems: 'center', paddingTop: 8 },
  icon:       { fontSize: 22, color: '#C4C4D4', marginBottom: 2 },
  iconActive: { color: '#6C47FF' },
  label:      { fontSize: 10, color: '#C4C4D4', fontWeight: '600' },
  labelActive:{ color: '#6C47FF' },
  centerWrap: { flex: 1, alignItems: 'center', marginTop: -22 },
  mic:        { width: 58, height: 58, borderRadius: 29, justifyContent: 'center', alignItems: 'center', shadowColor: '#6C47FF', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  micIcon:    { fontSize: 26 },
});
