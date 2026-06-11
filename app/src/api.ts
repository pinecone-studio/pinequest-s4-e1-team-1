import axios from 'axios';
import { Platform } from 'react-native';
import { API_BASE_URL } from './config';
import { auth } from './firebase';

const api = axios.create({ baseURL: API_BASE_URL });

async function authHeader() {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function transcribeAudio(uri: string) {
  const form = new FormData();
  const isIOS = Platform.OS === 'ios';
  form.append('audio', { uri, name: isIOS ? 'recording.wav' : 'recording.m4a', type: isIOS ? 'audio/wav' : 'audio/m4a' } as any);
  const { data } = await api.post('/api/transcribe', form, {
    headers: { 'Content-Type': 'multipart/form-data', ...(await authHeader()) },
  });
  return data as { text: string };
}

export type RecurringPattern = { type: 'monthly_days' | 'weekly_days'; days: number[]; confirmed?: boolean };

export async function processText(text: string) {
  const { data } = await api.post('/api/process', { text }, { headers: await authHeader() });
  return data as {
    tasks: { title: string; due: string; category: string; recurring?: RecurringPattern }[];
    events: { title: string; datetime: string }[];
    summary: string;
  };
}

export async function saveEntry(body: {
  text: string;
  tasks: { title: string; due: string; priority?: string; category?: string }[];
  events: { title: string; datetime: string }[];
  summary: string;
}) {
  const { data } = await api.post('/api/entries', body, { headers: await authHeader() });
  return data;
}

export async function parseDatetime(text: string) {
  const { data } = await api.post('/api/parse-datetime', { text }, { headers: await authHeader() });
  return data as { due: string };
}

export type TaskPriority = 'high' | 'medium' | 'low';
export type Task = { _id: string; title: string; due: string; status: string; priority: TaskPriority; category: string };

export async function fetchTasks() {
  const { data } = await api.get('/api/tasks', { headers: await authHeader() });
  return data as Task[];
}

export async function createTask(title: string, due = '', priority: TaskPriority = 'medium', category = '') {
  const { data } = await api.post('/api/tasks', { title, due, priority, category }, { headers: await authHeader() });
  return data as Task;
}

export async function updateTask(id: string, fields: { status?: 'pending' | 'done'; priority?: TaskPriority; category?: string; title?: string; due?: string }) {
  const { data } = await api.patch(`/api/tasks/${id}`, fields, { headers: await authHeader() });
  return data as Task;
}

export async function deleteTask(id: string) {
  await api.delete(`/api/tasks/${id}`, { headers: await authHeader() });
}

export async function shareTask(taskId: string, toUid: string) {
  const { data } = await api.post(`/api/tasks/${taskId}/share`, { toUid }, { headers: await authHeader() });
  return data as { success: boolean };
}

export async function deleteUserData() {
  await api.delete('/api/user', { headers: await authHeader() });
}

export type ReportPeriod = 'day' | 'week' | 'month';
export type ReportType = 'general' | 'work';

// ── User / username ──────────────────────────────────────────────────
export async function getMe() {
  const { data } = await api.get('/api/user/me', { headers: await authHeader() });
  return data as { username: string | null };
}

export async function setUsername(username: string) {
  const { data } = await api.post('/api/user/username', { username }, { headers: await authHeader() });
  return data as { username: string };
}

export async function searchUsers(username: string) {
  const { data } = await api.get('/api/user/search', { params: { username }, headers: await authHeader() });
  return data as { uid: string; username: string }[];
}

// ── Friends ──────────────────────────────────────────────────────────
export type Friend = { uid: string; username: string };
export type FriendRequest = { id: string; fromUid: string; username: string };
export type DayAvailability = { taskCount: number; busyTimes: string[]; sharedTasks?: string[] };

export async function getFriends() {
  const { data } = await api.get('/api/friends', { headers: await authHeader() });
  return data as Friend[];
}

export async function sendFriendRequest(username: string) {
  const { data } = await api.post('/api/friends/request', { username }, { headers: await authHeader() });
  return data as { success: boolean };
}

export async function getFriendRequests() {
  const { data } = await api.get('/api/friends/requests', { headers: await authHeader() });
  return data as FriendRequest[];
}

export async function acceptFriendRequest(id: string) {
  const { data } = await api.post(`/api/friends/accept/${id}`, {}, { headers: await authHeader() });
  return data as { success: boolean };
}

export async function rejectFriendRequest(id: string) {
  const { data } = await api.post(`/api/friends/reject/${id}`, {}, { headers: await authHeader() });
  return data as { success: boolean };
}

export async function removeFriend(friendUid: string) {
  const { data } = await api.delete(`/api/friends/${friendUid}`, { headers: await authHeader() });
  return data as { success: boolean };
}

export async function getFriendCalendar(friendUid: string, month: string) {
  const { data } = await api.get(`/api/friends/${friendUid}/calendar`, { params: { month }, headers: await authHeader() });
  return data as Record<string, DayAvailability>;
}

export async function fetchReport(date: string, period: ReportPeriod = 'day', type: ReportType = 'general') {
  const { data } = await api.post('/api/report', { date, period, type }, { headers: await authHeader() });
  return data as {
    period: ReportPeriod;
    type: ReportType;
    label: string;
    startDate: string;
    endDate: string;
    entryCount: number;
    taskCount: number;
    completedTaskCount: number;
    pendingTaskCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    eventCount: number;
    summary: string;
    executiveSummary: string;
    insights: string;
    risks: string;
    recommendations: string;
    workloadSignal: 'overload' | 'ok' | 'underload';
    workloadAdvice: string;
  };
}
