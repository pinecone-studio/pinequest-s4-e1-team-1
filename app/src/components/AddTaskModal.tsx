import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TaskPriority } from '../api';
import { PRIO_COLOR, PRIO_LABEL } from './taskConstants';
import { useTheme } from '../theme/ThemeContext';

type Props = {
  visible:    boolean;
  categories: string[];
  onClose:    () => void;
  onSave:     (title: string, due: string, priority: TaskPriority, category: string) => Promise<void>;
};

export default function AddTaskModal({ visible, categories, onClose, onSave }: Props) {
  const { colors: C } = useTheme();
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
        <View style={[s.sheet, { backgroundColor: C.surface }]}>
          <View style={[s.handle, { backgroundColor: C.border }]} />
          <Text style={[s.title, { color: C.text }]}>Шинэ даалгавар</Text>

          <TextInput
            style={[s.input, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
            placeholder="Даалгаврын нэр"
            placeholderTextColor={C.textMuted}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
          <TextInput
            style={[s.input, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
            placeholder="Дуусах огноо (2026-07-01)"
            placeholderTextColor={C.textMuted}
            value={due}
            onChangeText={setDue}
          />

          <Text style={[s.label, { color: C.textMuted }]}>АЧ ХОЛБОГДОЛ</Text>
          <View style={s.row}>
            {(['high', 'medium', 'low'] as TaskPriority[]).map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  s.optBtn,
                  { borderColor: C.border, backgroundColor: C.surfaceAlt },
                  priority === p && { borderColor: PRIO_COLOR[p], backgroundColor: PRIO_COLOR[p] + '18' },
                ]}
                onPress={() => setPriority(p)}
              >
                <View style={[s.dot, { backgroundColor: PRIO_COLOR[p] }]} />
                <Text style={[s.optText, { color: C.textSec }, priority === p && { color: PRIO_COLOR[p], fontWeight: '700' }]}>
                  {PRIO_LABEL[p]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, { color: C.textMuted }]}>АНГИЛАЛ</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            <View style={s.row}>
              {['', ...categories].map(cat => (
                <TouchableOpacity
                  key={cat || '__none'}
                  style={[
                    s.optBtn,
                    { borderColor: C.border, backgroundColor: C.surfaceAlt },
                    category === cat && [s.optActive, { borderColor: C.accent, backgroundColor: C.accentLight }],
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[s.optText, { color: C.textSec }, category === cat && { color: C.accent, fontWeight: '700' }]}>
                    {cat || 'Байхгүй'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={s.btns}>
            <TouchableOpacity style={[s.cancelBtn, { borderColor: C.border }]} onPress={handleClose}>
              <Text style={[s.cancelText, { color: C.textSec }]}>Болих</Text>
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
  sheet:       { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  handle:      { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title:       { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  input:       { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 14 },
  label:       { fontSize: 12, fontWeight: '700', marginBottom: 10, letterSpacing: 0.8 },
  row:         { flexDirection: 'row', gap: 8 },
  optBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  optActive:   {},
  optText:     { fontSize: 13, fontWeight: '500' },
  dot:         { width: 7, height: 7, borderRadius: 3.5 },
  btns:        { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn:   { flex: 1, borderWidth: 1.5, borderRadius: 14, padding: 15, alignItems: 'center' },
  cancelText:  { fontSize: 15, fontWeight: '600' },
  addBtn:      { flex: 1, borderRadius: 14, overflow: 'hidden' },
  addGrad:     { padding: 15, alignItems: 'center' },
  addText:     { fontSize: 15, color: '#fff', fontWeight: '700' },
});
