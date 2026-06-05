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
  body: { status?: 'pending' | 'done'; priority?: string; category?: string }
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

export async function processText(text: string) {
  const { data } = await api.post('/api/process', { text });
  return data as {
    tasks: { title: string; due: string }[];
    events: { title: string; datetime: string }[];
    summary: string;
  };
}

export async function saveEntry(body: {
  text: string;
  tasks: { title: string; due: string }[];
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
  // work-only
  highCount?: number; mediumCount?: number; lowCount?: number;
  executiveSummary?: string; insights?: string; risks?: string; recommendations?: string;
};

export async function fetchReport(date: string, period: ReportPeriod = 'day', type: ReportType = 'general') {
  const { data } = await api.post('/api/report', { date, period, type });
  return data as ReportData;
}
