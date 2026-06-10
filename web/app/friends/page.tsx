'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getFriends, getFriendRequests, sendFriendRequest, searchUsers,
  acceptFriendRequest, rejectFriendRequest, removeFriend,
  getFriendCalendar,
  Friend, FriendRequest, DayAvailability,
} from '@/lib/api';
import { Users, UserPlus, Check, X, ChevronLeft, ChevronRight, UserMinus, Loader2 } from 'lucide-react';

const MONTHS_MN = ['1-р сар','2-р сар','3-р сар','4-р сар','5-р сар','6-р сар',
  '7-р сар','8-р сар','9-р сар','10-р сар','11-р сар','12-р сар'];
const DAYS_MN = ['Ня','Да','Мя','Лх','Пү','Ба','Бя'];

function toYYYYMM(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

function busyLevel(count: number) {
  if (count === 0) return 'none';
  if (count <= 2) return 'low';
  if (count <= 4) return 'medium';
  return 'high';
}

export default function FriendsPage() {
  const [friends, setFriends]         = useState<Friend[]>([]);
  const [requests, setRequests]       = useState<FriendRequest[]>([]);
  const [searchQ, setSearchQ]         = useState('');
  const [searchResults, setSearchResults] = useState<{ uid: string; username: string }[]>([]);
  const [searching, setSearching]     = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sentTo, setSentTo]           = useState<Set<string>>(new Set());
  const [sendingUid, setSendingUid]   = useState<string | null>(null);
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);
  const successTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef                     = useRef<HTMLDivElement>(null);
  const debounceRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [calendar, setCalendar]       = useState<Record<string, DayAvailability>>({});
  const [calYear, setCalYear]         = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth]       = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [calLoading, setCalLoading]   = useState(false);

  useEffect(() => { loadAll(); }, []);

  // Debounced live search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchQ.trim();
    if (!q) { setSearchResults([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsers(q);
        setSearchResults(results);
        setShowDropdown(true);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQ]);

  // Outside click → close dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function loadAll() {
    const [f, r] = await Promise.all([getFriends(), getFriendRequests()]);
    setFriends(f);
    setRequests(r);
  }

  async function handleSend(username: string, uid: string) {
    setSendingUid(uid);
    try {
      await sendFriendRequest(username);
      setSentTo(prev => new Set([...prev, uid]));
      setSuccessMsg(`@${username}-д найзын хүсэлт амжилттай илгээгдлээ`);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      // ignore — already sent or error
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
    await removeFriend(uid);
    setFriends(prev => prev.filter(f => f.uid !== uid));
    if (selectedFriend?.uid === uid) setSelectedFriend(null);
  }

  async function selectFriend(friend: Friend) {
    setSelectedFriend(friend);
    setSelectedDay(null);
    loadCalendar(friend.uid, calYear, calMonth);
  }

  async function loadCalendar(uid: string, y: number, m: number) {
    setCalLoading(true);
    try {
      const data = await getFriendCalendar(uid, toYYYYMM(y, m));
      setCalendar(data);
    } finally {
      setCalLoading(false);
    }
  }

  function changeMonth(delta: number) {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCalMonth(m); setCalYear(y); setSelectedDay(null);
    if (selectedFriend) loadCalendar(selectedFriend.uid, y, m);
  }

  // Build calendar grid
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6">
      {/* Success toast */}
      {successMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-500 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Check size={16} />
          {successMsg}
        </div>
      )}

      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
          <Users size={24} className="text-indigo-500" /> Найзууд
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Left panel */}
          <div className="flex flex-col gap-4">

            {/* Send request */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
              <p className="text-sm font-bold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <UserPlus size={15} className="text-indigo-500" /> Найз нэмэх
              </p>
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs select-none">@</span>
                  <input
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                    placeholder="username хайх..."
                    className="w-full pl-6 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  />
                  {searching && (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                  )}
                </div>

                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden z-10">
                    {searchResults.length === 0 ? (
                      <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4">Хэрэглэгч олдсонгүй</p>
                    ) : (
                      searchResults.map(u => {
                        const isSent    = sentTo.has(u.uid);
                        const isSending = sendingUid === u.uid;
                        const isFriend  = friends.some(f => f.uid === u.uid);
                        return (
                          <div key={u.uid} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-sm font-bold shrink-0">
                              {u.username[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-800 dark:text-slate-200 flex-1">@{u.username}</span>
                            {isFriend ? (
                              <span className="text-xs text-green-500 font-semibold">Найз</span>
                            ) : isSent ? (
                              <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
                                <Check size={12} /> Явуулсан
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSend(u.username, u.uid)}
                                disabled={isSending}
                                className="text-xs font-semibold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1"
                              >
                                {isSending ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />}
                                Нэмэх
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Incoming requests */}
            {requests.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
                <p className="text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">
                  Ирсэн хүсэлтүүд
                  <span className="ml-2 text-xs bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full">{requests.length}</span>
                </p>
                <div className="flex flex-col gap-2">
                  {requests.map(r => (
                    <div key={r.id} className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl px-3 py-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-xs font-bold shrink-0">
                        {r.username[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-800 dark:text-slate-200 flex-1 font-medium">@{r.username}</span>
                      <button onClick={() => handleAccept(r.id)} className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 hover:bg-green-200 transition-colors">
                        <Check size={13} />
                      </button>
                      <button onClick={() => handleReject(r.id)} className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-500 dark:text-red-400 hover:bg-red-200 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends list */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
              <p className="text-sm font-bold text-gray-700 dark:text-slate-200 mb-3">Найзуудын жагсаалт</p>
              {friends.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">Найз байхгүй байна</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {friends.map(f => (
                    <div
                      key={f.uid}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all group ${
                        selectedFriend?.uid === f.uid
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                      onClick={() => selectFriend(f)}
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-sm font-bold shrink-0">
                        {f.username[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-800 dark:text-slate-200 flex-1">@{f.username}</span>
                      <button
                        onClick={e => { e.stopPropagation(); handleRemove(f.uid); }}
                        className="p-1 rounded-lg text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <UserMinus size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: friend calendar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
            {!selectedFriend ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-slate-500 py-20">
                <Users size={40} className="opacity-20" />
                <p className="text-sm">Найзаа сонгож календарийг харна уу</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold text-gray-800 dark:text-white">@{selectedFriend.username}</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Хэзээ завтай вэ?</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-500 dark:text-slate-400">
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-semibold text-gray-700 dark:text-slate-200 min-w-24 text-center">
                      {calYear} {MONTHS_MN[calMonth]}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-500 dark:text-slate-400">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_MN.map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 dark:text-slate-500 py-1">{d}</div>
                  ))}
                </div>

                {/* Calendar cells */}
                {calLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {cells.map((day, i) => {
                      if (!day) return <div key={i} />;
                      const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const info = calendar[dateKey];
                      const level = busyLevel(info?.taskCount ?? 0);
                      const isSelected = selectedDay === dateKey;

                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedDay(isSelected ? null : dateKey)}
                          className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-indigo-500 text-white shadow-sm'
                              : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                          }`}
                        >
                          {day}
                          {level !== 'none' && !isSelected && (
                            <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                              level === 'low' ? 'bg-green-400' :
                              level === 'medium' ? 'bg-amber-400' : 'bg-rose-500'
                            }`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Selected day detail */}
                {selectedDay && (
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-700">
                    {(() => {
                      const info = calendar[selectedDay];
                      const [, , d] = selectedDay.split('-');
                      if (!info || info.taskCount === 0) {
                        return <p className="text-sm text-gray-500 dark:text-slate-400">{d}-нд завтай байна</p>;
                      }
                      return (
                        <div className="flex flex-col gap-2">
                          <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                            {d}-нд <span className="text-indigo-500">{info.taskCount} ажил</span> байна
                          </p>
                          {info.busyTimes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {info.busyTimes.sort().map((t, i) => (
                                <span key={i} className="text-xs bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-medium">
                                  {t} завгүй
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500 justify-center">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> 1-2 ажил</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> 3-4 ажил</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> 5+ ажил</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
