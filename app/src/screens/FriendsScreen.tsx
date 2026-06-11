import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import {
  getMe, setUsername, searchUsers,
  getFriends, getFriendRequests, sendFriendRequest,
  acceptFriendRequest, rejectFriendRequest, removeFriend,
  getFriendCalendar,
  Friend, FriendRequest, DayAvailability,
} from '../api';

const MONTHS_MN = ['1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар',
  '7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'];
const DAYS_MN = ['Ня','Да','Мя','Лх','Пү','Ба','Бя'];

function toYYYYMM(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

function busyLevel(count: number): 'none' | 'low' | 'medium' | 'high' {
  if (count === 0) return 'none';
  if (count <= 2) return 'low';
  if (count <= 4) return 'medium';
  return 'high';
}

const BUSY_COLOR: Record<'low' | 'medium' | 'high', string> = {
  low: '#4ade80',
  medium: '#fbbf24',
  high: '#f43f5e',
};

export default function FriendsScreen() {
  const { colors: C, isDark } = useTheme();
  const cellSize = Math.floor((Dimensions.get('window').width - 32 - 12) / 7);

  // Username
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameSaving, setUsernameSaving] = useState(false);

  // Friends & requests
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<{ uid: string; username: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [sendingUid, setSendingUid] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calendar
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [calendar, setCalendar] = useState<Record<string, DayAvailability>>({});
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [calLoading, setCalLoading] = useState(false);

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchQ.trim();
    if (!q) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try { setSearchResults(await searchUsers(q)); }
      catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQ]);

  async function loadAll() {
    setLoading(true);
    try {
      const [me, f, r] = await Promise.all([getMe(), getFriends(), getFriendRequests()]);
      setMyUsername(me.username);
      if (!me.username) setShowUsernameModal(true);
      setFriends(f);
      setRequests(r);
    } catch (err: any) {
      Alert.alert('Алдаа', err?.response?.data?.error ?? err.message ?? 'Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveUsername() {
    const u = usernameInput.trim().toLowerCase();
    if (!u) return;
    setUsernameSaving(true);
    try {
      const res = await setUsername(u);
      setMyUsername(res.username);
      setShowUsernameModal(false);
    } catch (err: any) {
      Alert.alert('Алдаа', err?.response?.data?.error ?? 'Username-г хадгалж чадсангүй');
    } finally {
      setUsernameSaving(false);
    }
  }

  async function handleSend(username: string, uid: string) {
    setSendingUid(uid);
    try {
      await sendFriendRequest(username);
      setSentTo(prev => new Set([...prev, uid]));
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? '';
      if (msg.includes('найзууд')) {
        setSentTo(prev => new Set([...prev, uid]));
      } else if (msg.includes('Хүсэлт аль хэдийн')) {
        setSentTo(prev => new Set([...prev, uid]));
      } else {
        Alert.alert('Алдаа', msg || 'Хүсэлт явуулж чадсангүй. Дахин оролдоно уу.');
      }
    } finally {
      setSendingUid(null);
    }
  }

  async function handleAccept(id: string) {
    await acceptFriendRequest(id);
    loadAll();
  }

  async function handleReject(id: string) {
    await rejectFriendRequest(id);
    setRequests(prev => prev.filter(r => r.id !== id));
  }

  async function handleRemove(uid: string) {
    Alert.alert('Найзаас хасах', 'Найзаас хасах уу?', [
      { text: 'Болих', style: 'cancel' },
      {
        text: 'Хасах', style: 'destructive',
        onPress: async () => {
          await removeFriend(uid);
          setFriends(prev => prev.filter(f => f.uid !== uid));
          if (selectedFriend?.uid === uid) setSelectedFriend(null);
        },
      },
    ]);
  }

  async function selectFriend(friend: Friend) {
    setSelectedFriend(friend);
    setSelectedDay(null);
    loadCalendar(friend.uid, calYear, calMonth);
  }

  async function loadCalendar(uid: string, y: number, m: number) {
    setCalLoading(true);
    try { setCalendar(await getFriendCalendar(uid, toYYYYMM(y, m))); }
    catch { setCalendar({}); }
    finally { setCalLoading(false); }
  }

  function changeMonth(delta: number) {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    setCalMonth(m); setCalYear(y); setSelectedDay(null);
    if (selectedFriend) loadCalendar(selectedFriend.uid, y, m);
  }

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  return (
    <SafeAreaView style={[s.root, { backgroundColor: C.bg }]} edges={['top']}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={[s.pageTitle, { color: C.text }]}>Найзууд</Text>
          {myUsername ? (
            <Text style={[s.myTag, { color: C.textMuted }]}>@{myUsername}</Text>
          ) : (
            <TouchableOpacity onPress={() => setShowUsernameModal(true)}>
              <Text style={[s.setUsernameLink, { color: C.accent }]}>Username тохируулах</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info banner */}
        <View style={[s.infoBanner, { backgroundColor: C.accentLight, borderColor: C.accentMid }]}>
          <Ionicons name="information-circle-outline" size={16} color={C.accent} style={{ marginTop: 1 }} />
          <Text style={[s.infoText, { color: C.accent }]}>
            Найзаа нэмээд тэдний ажлын ачааллыг хуанлигаар харах боломжтой. Ногоон — сул, шар — дунд, улаан — завгүй гэсэн утгатай.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={C.accent} />
        ) : (
          <>
            {/* ── Search ── */}
            <View style={[s.card, { backgroundColor: C.surface }]}>
              <Text style={[s.cardTitle, { color: C.text }]}>
                <Ionicons name="person-add-outline" size={14} color={C.accent} /> Найз нэмэх
              </Text>
              <View style={[s.searchRow, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
                <Text style={[s.atSign, { color: C.textMuted }]}>@</Text>
                <TextInput
                  style={[s.searchInput, { color: C.text }]}
                  placeholder="username хайх..."
                  placeholderTextColor={C.textMuted}
                  value={searchQ}
                  onChangeText={t => setSearchQ(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searching && <ActivityIndicator size="small" color={C.textMuted} style={{ marginRight: 8 }} />}
              </View>

              {searchResults.length > 0 && (
                <View style={[s.dropdown, { borderColor: C.border }]}>
                  {searchResults.map((u, idx) => {
                    const isSent    = sentTo.has(u.uid);
                    const isSending = sendingUid === u.uid;
                    const isFriend  = friends.some(f => f.uid === u.uid);
                    return (
                      <View
                        key={u.uid}
                        style={[s.dropdownItem, idx < searchResults.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border }]}
                      >
                        <View style={[s.avatar, { backgroundColor: C.accentLight }]}>
                          <Text style={[s.avatarText, { color: C.accent }]}>{u.username[0].toUpperCase()}</Text>
                        </View>
                        <Text style={[s.dropUser, { color: C.text }]}>@{u.username}</Text>
                        {isFriend ? (
                          <Text style={[s.statusBadge, { color: '#22c55e' }]}>Найз</Text>
                        ) : isSent ? (
                          <Text style={[s.statusBadge, { color: C.accent }]}>Явуулсан</Text>
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleSend(u.username, u.uid)}
                            disabled={isSending}
                            style={[s.addBtn, { backgroundColor: C.accent }]}
                          >
                            {isSending
                              ? <ActivityIndicator size="small" color="#fff" />
                              : <Text style={s.addBtnText}>Нэмэх</Text>
                            }
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
              {searchQ.trim() && !searching && searchResults.length === 0 && (
                <Text style={[s.emptyText, { color: C.textMuted, marginTop: 10 }]}>Хэрэглэгч олдсонгүй</Text>
              )}
            </View>

            {/* ── Incoming requests ── */}
            {requests.length > 0 && (
              <View style={[s.card, { backgroundColor: C.surface }]}>
                <View style={s.cardTitleRow}>
                  <Text style={[s.cardTitle, { color: C.text }]}>Ирсэн хүсэлтүүд</Text>
                  <View style={s.reqBadge}>
                    <Text style={s.reqBadgeText}>{requests.length}</Text>
                  </View>
                </View>
                {requests.map(r => (
                  <View key={r.id} style={[s.listItem, { backgroundColor: C.surfaceAlt }]}>
                    <View style={[s.avatar, { backgroundColor: C.accentLight }]}>
                      <Text style={[s.avatarText, { color: C.accent }]}>{r.username[0].toUpperCase()}</Text>
                    </View>
                    <Text style={[s.itemName, { color: C.text }]}>@{r.username}</Text>
                    <TouchableOpacity
                      onPress={() => handleAccept(r.id)}
                      style={[s.iconBtn, { backgroundColor: '#dcfce7' }]}
                    >
                      <Ionicons name="checkmark" size={16} color="#16a34a" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleReject(r.id)}
                      style={[s.iconBtn, { backgroundColor: '#fee2e2' }]}
                    >
                      <Ionicons name="close" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* ── Friends list ── */}
            <View style={[s.card, { backgroundColor: C.surface }]}>
              <Text style={[s.cardTitle, { color: C.text }]}>Найзуудын жагсаалт</Text>
              {friends.length === 0 ? (
                <Text style={[s.emptyText, { color: C.textMuted }]}>Найз байхгүй байна</Text>
              ) : (
                friends.map(f => (
                  <TouchableOpacity
                    key={f.uid}
                    onPress={() => selectFriend(f)}
                    style={[
                      s.listItem,
                      { backgroundColor: selectedFriend?.uid === f.uid ? C.accentLight : C.surfaceAlt },
                      selectedFriend?.uid === f.uid && { borderWidth: 1, borderColor: C.accentMid },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={[s.avatar, { backgroundColor: C.accentLight }]}>
                      <Text style={[s.avatarText, { color: C.accent }]}>{f.username[0].toUpperCase()}</Text>
                    </View>
                    <Text style={[s.itemName, { color: C.text, flex: 1 }]}>@{f.username}</Text>
                    {selectedFriend?.uid === f.uid && (
                      <Ionicons name="chevron-forward" size={14} color={C.accent} style={{ marginRight: 4 }} />
                    )}
                    <TouchableOpacity
                      onPress={() => handleRemove(f.uid)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="person-remove-outline" size={16} color={C.textMuted} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* ── Friend calendar ── */}
            {selectedFriend && (
              <View style={[s.card, { backgroundColor: C.surface }]}>
                {/* Calendar header */}
                <View style={s.calHeaderRow}>
                  <View>
                    <Text style={[s.cardTitle, { color: C.text }]}>@{selectedFriend.username}</Text>
                    <Text style={[s.calSub, { color: C.textMuted }]}>Хэзээ завтай вэ?</Text>
                  </View>
                  <View style={s.monthNav}>
                    <TouchableOpacity onPress={() => changeMonth(-1)} style={s.monthBtn}>
                      <Ionicons name="chevron-back" size={18} color={C.accent} />
                    </TouchableOpacity>
                    <Text style={[s.monthLabel, { color: C.text }]}>{calYear} {MONTHS_MN[calMonth]}</Text>
                    <TouchableOpacity onPress={() => changeMonth(1)} style={s.monthBtn}>
                      <Ionicons name="chevron-forward" size={18} color={C.accent} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Day headers */}
                <View style={s.calGrid}>
                  {DAYS_MN.map(d => (
                    <View key={d} style={[s.calCell, { width: cellSize, height: 28 }]}>
                      <Text style={[s.calDayHeader, { color: C.textMuted }]}>{d}</Text>
                    </View>
                  ))}
                </View>

                {calLoading ? (
                  <ActivityIndicator style={{ margin: 20 }} color={C.accent} />
                ) : (
                  <>
                    <View style={s.calGrid}>
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <View key={`e${i}`} style={{ width: cellSize, height: cellSize }} />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, idx) => {
                        const day = idx + 1;
                        const dk = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const info = calendar[dk];
                        const level = busyLevel(info?.taskCount ?? 0);
                        const isSel = selectedDay === dk;
                        return (
                          <TouchableOpacity
                            key={dk}
                            style={[
                              s.calCell,
                              { width: cellSize, height: cellSize, borderRadius: cellSize / 2 },
                              isSel && { backgroundColor: C.accent },
                            ]}
                            onPress={() => setSelectedDay(isSel ? null : dk)}
                            activeOpacity={0.7}
                          >
                            <Text style={[s.calDayNum, { color: isSel ? '#fff' : C.text }]}>{day}</Text>
                            {level !== 'none' && !isSel && (
                              <View style={[s.busyDot, { backgroundColor: BUSY_COLOR[level] }]} />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Selected day detail */}
                    {selectedDay && (() => {
                      const info = calendar[selectedDay];
                      const d = selectedDay.split('-')[2];
                      return (
                        <View style={[s.dayDetail, { backgroundColor: C.surfaceAlt }]}>
                          {!info || info.taskCount === 0 ? (
                            <Text style={[s.dayDetailText, { color: C.textMuted }]}>{d}-нд завтай байна</Text>
                          ) : (
                            <>
                              <Text style={[s.dayDetailText, { color: C.text }]}>
                                {d}-нд{' '}
                                <Text style={{ color: C.accent }}>{info.taskCount} ажил</Text>
                                {' '}байна
                              </Text>
                              {info.busyTimes.length > 0 && (
                                <View style={s.busyTimes}>
                                  {[...info.busyTimes].sort().map((t, i) => (
                                    <View key={i} style={s.timePill}>
                                      <Text style={s.timePillText}>{t} завгүй</Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </>
                          )}
                        </View>
                      );
                    })()}

                    {/* Legend */}
                    <View style={s.legend}>
                      {(['low','medium','high'] as const).map(lvl => (
                        <View key={lvl} style={s.legendItem}>
                          <View style={[s.legendDot, { backgroundColor: BUSY_COLOR[lvl] }]} />
                          <Text style={[s.legendText, { color: C.textMuted }]}>
                            {lvl === 'low' ? '1-2 ажил' : lvl === 'medium' ? '3-4 ажил' : '5+ ажил'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Username setup modal ── */}
      <Modal visible={showUsernameModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modal, { backgroundColor: C.surface }]}>
            <Text style={[s.modalTitle, { color: C.text }]}>Username тохируулах</Text>
            <Text style={[s.modalSub, { color: C.textMuted }]}>
              Найзуудад хайгдахын тулд username оруулна уу
            </Text>
            <View style={[s.searchRow, { backgroundColor: C.surfaceAlt, borderColor: C.border, marginTop: 16 }]}>
              <Text style={[s.atSign, { color: C.textMuted }]}>@</Text>
              <TextInput
                style={[s.searchInput, { color: C.text }]}
                placeholder="username"
                placeholderTextColor={C.textMuted}
                value={usernameInput}
                onChangeText={t => setUsernameInput(t.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>
            <TouchableOpacity
              onPress={handleSaveUsername}
              disabled={!usernameInput.trim() || usernameSaving}
              style={[s.modalBtn, { backgroundColor: C.accent, opacity: usernameInput.trim() ? 1 : 0.5 }]}
            >
              {usernameSaving
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.modalBtnText}>Хадгалах</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 8 },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '500' },
  pageTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  myTag: { fontSize: 13, fontWeight: '600' },
  setUsernameLink: { fontSize: 13, fontWeight: '600' },

  card: {
    borderRadius: 18, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 12, paddingLeft: 10, paddingRight: 4,
    height: 44,
  },
  atSign: { fontSize: 15, fontWeight: '600', marginRight: 2 },
  searchInput: { flex: 1, fontSize: 15, height: 44 },

  dropdown: {
    borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginTop: 8,
  },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  dropUser: { flex: 1, fontSize: 14, fontWeight: '500' },
  statusBadge: { fontSize: 12, fontWeight: '600' },
  addBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, minWidth: 60, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  reqBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  reqBadgeText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },

  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6,
  },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800' },
  itemName: { fontSize: 14, fontWeight: '500' },
  iconBtn: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  emptyText: { fontSize: 13, textAlign: 'center', paddingVertical: 12 },

  // Calendar
  calHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  calSub: { fontSize: 12, marginTop: 2 },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthBtn: { padding: 6 },
  monthLabel: { fontSize: 13, fontWeight: '700', minWidth: 80, textAlign: 'center' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  calDayHeader: { fontSize: 11, fontWeight: '600' },
  calDayNum: { fontSize: 13, fontWeight: '600' },
  busyDot: { width: 5, height: 5, borderRadius: 2.5, position: 'absolute', bottom: 3 },
  dayDetail: { borderRadius: 14, padding: 14, marginTop: 10 },
  dayDetailText: { fontSize: 14, fontWeight: '600' },
  busyTimes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  timePill: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  timePillText: { color: '#ef4444', fontSize: 12, fontWeight: '500' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },

  // Username modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 32 },
  modal: {
    borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  modalSub: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
  modalBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
