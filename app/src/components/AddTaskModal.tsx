import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TaskPriority } from '../api';
import { PRIO_COLOR, PRIO_LABEL } from './taskConstants';

type Props = {
  visible:    boolean;
  categories: string[];
  onClose:    () => void;
  onSave:     (title: string, due: string, priority: TaskPriority, category: string) => Promise<void>;
};

export default function AddTaskModal({ visible, categories, onClose, onSave }: Props) {
  const [title,    setTitle]    = useState('');
  const [due,      setDue]      = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState('');
  const [saving,   setSaving]   = useState(false);

  const reset = () => { setTitle(''); setDue(''); setPriority('medium'); setCategory(''); };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try { await onSave(title.trim(), due.trim(), priority, category); reset(); }
    finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.title}>Шинэ даалгавар</Text>

          <TextInput style={s.input} placeholder="Даалгаврын нэр" placeholderTextColor="#9CA3AF" value={title} onChangeText={setTitle} autoFocus />
          <TextInput style={s.input} placeholder="Дуусах огноо (2026-07-01)" placeholderTextColor="#9CA3AF" value={due} onChangeText={setDue} />

          <Text style={s.label}>АЧ ХОЛБОГДОЛ</Text>
          <View style={s.row}>
            {(['high', 'medium', 'low'] as TaskPriority[]).map(p => (
              <TouchableOpacity key={p} style={[s.optBtn, priority === p && { borderColor: PRIO_COLOR[p], backgroundColor: PRIO_COLOR[p] + '18' }]} onPress={() => setPriority(p)}>
                <View style={[s.dot, { backgroundColor: PRIO_COLOR[p] }]} />
                <Text style={[s.optText, priority === p && { color: PRIO_COLOR[p], fontWeight: '700' }]}>{PRIO_LABEL[p]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>АНГИЛАЛ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={s.row}>
              {['', ...categories].map(cat => (
                <TouchableOpacity key={cat || '__none'} style={[s.optBtn, category === cat && s.optActive]} onPress={() => setCategory(cat)}>
                  <Text style={[s.optText, category === cat && s.optTextActive]}>{cat || 'Байхгүй'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={s.btns}>
            <TouchableOpacity style={s.cancelBtn} onPress={handleClose}>
              <Text style={s.cancelText}>Болих</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.addBtn, !title.trim() && { opacity: 0.5 }]} onPress={handleSave} disabled={!title.trim() || saving}>
              <LinearGradient colors={['#6C47FF', '#9747FF']} style={s.addGrad}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.addText}>Нэмэх</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet:       { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB', alignSelf: 'center', marginBottom: 20 },
  title:       { fontSize: 20, fontWeight: '800', color: '#1A1A2E', marginBottom: 20 },
  input:       { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 14, color: '#111' },
  label:       { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginBottom: 10, letterSpacing: 0.8 },
  row:         { flexDirection: 'row', gap: 8 },
  optBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F9FAFB' },
  optActive:   { borderColor: '#6C47FF', backgroundColor: '#6C47FF18' },
  optText:     { fontSize: 13, color: '#374151', fontWeight: '500' },
  optTextActive: { color: '#6C47FF', fontWeight: '700' },
  dot:         { width: 7, height: 7, borderRadius: 3.5 },
  btns:        { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:   { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, padding: 15, alignItems: 'center' },
  cancelText:  { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  addBtn:      { flex: 1, borderRadius: 14, overflow: 'hidden' },
  addGrad:     { padding: 15, alignItems: 'center' },
  addText:     { fontSize: 15, color: '#fff', fontWeight: '700' },
});
