import axios from 'axios';
import { auth } from '@/lib/firebase';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type BackendTask = {
  _id: string;
  title: string;
  due: string;
  status: 'pending' | 'done';
  priority: 'high' | 'medium' | 'low';
  category: string;
};

export async function fetchTasks() {
  const { data } = await api.get('/api/tasks');
  return data as BackendTask[];
}

export async function createTask(body: {
  title: string;
  due?: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
}) {
  const { data } = await api.post('/api/tasks', body);
  return data as BackendTask;
}

export async function updateTask(
  id: string,
  body: { status?: 'pending' | 'done'; priority?: string; category?: string; title?: string; due?: string }
) {
  const { data } = await api.patch(`/api/tasks/${id}`, body);
  return data as BackendTask;
}

export async function deleteTask(id: string) {
  const { data } = await api.delete(`/api/tasks/${id}`);
  return data as { success: boolean };
}

export async function transcribeAudio(blob: Blob) {
  const form = new FormData();
  form.append('audio', blob, 'recording.webm');
  const { data } = await api.post('/api/transcribe', form);
  return data as { text: string };
}

export type RecurringPattern = { type: 'monthly_days' | 'weekly_days'; days: number[]; confirmed?: boolean };

export async function processText(text: string) {
  const { data } = await api.post('/api/process', { text });
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
  const { data } = await api.post('/api/entries', body);
  return data;
}

export type ReportPeriod = 'day' | 'week' | 'month';
export type ReportType   = 'general' | 'work';

export type ReportData = {
  period: ReportPeriod; type: ReportType; label: string;
  startDate: string; endDate: string;
  entryCount: number; taskCount: number;
  completedTaskCount: number; pendingTaskCount: number; eventCount: number;
  summary?: string;
  workloadSignal?: 'overload' | 'ok' | 'underload';
  workloadAdvice?: string;
  // work-only
  highCount?: number; mediumCount?: number; lowCount?: number;
  executiveSummary?: string; insights?: string; risks?: string; recommendations?: string;
};

export async function parseDatetime(text: string) {
  const { data } = await api.post('/api/parse-datetime', { text });
  return data as { due: string };
}

export async function fetchReport(date: string, period: ReportPeriod = 'day', type: ReportType = 'general') {
  const { data } = await api.post('/api/report', { date, period, type });
  return data as ReportData;
}

// ── User / username ──────────────────────────────────────────────────
export async function getMe() {
  const { data } = await api.get('/api/user/me');
  return data as { username: string | null };
}

export async function setUsername(username: string) {
  const { data } = await api.post('/api/user/username', { username });
  return data as { username: string };
}

export async function searchUsers(username: string) {
  const { data } = await api.get('/api/user/search', { params: { username } });
  return data as { uid: string; username: string }[];
}

// ── Friends ──────────────────────────────────────────────────────────
export type Friend = { uid: string; username: string };
export type FriendRequest = { id: string; fromUid: string; username: string };
export type DayAvailability = { taskCount: number; busyTimes: string[] };

export async function getFriends() {
  const { data } = await api.get('/api/friends');
  return data as Friend[];
}

export async function sendFriendRequest(username: string) {
  const { data } = await api.post('/api/friends/request', { username });
  return data as { success: boolean };
}

export async function getFriendRequests() {
  const { data } = await api.get('/api/friends/requests');
  return data as FriendRequest[];
}

export async function acceptFriendRequest(id: string) {
  const { data } = await api.post(`/api/friends/accept/${id}`);
  return data as { success: boolean };
}

export async function rejectFriendRequest(id: string) {
  const { data } = await api.post(`/api/friends/reject/${id}`);
  return data as { success: boolean };
}

export async function removeFriend(friendUid: string) {
  const { data } = await api.delete(`/api/friends/${friendUid}`);
  return data as { success: boolean };
}

export async function getFriendCalendar(friendUid: string, month: string) {
  const { data } = await api.get(`/api/friends/${friendUid}/calendar`, { params: { month } });
  return data as Record<string, DayAvailability>;
}

export async function shareTask(taskId: string, toUid: string) {
  const { data } = await api.post(`/api/tasks/${taskId}/share`, { toUid });
  return data as { success: boolean };
}
