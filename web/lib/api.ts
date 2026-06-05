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

export async function fetchReport(date: string) {
  const { data } = await api.post('/api/report', { date });
  return data as {
    date: string;
    entryCount: number;
    taskCount: number;
    eventCount: number;
    summary: string;
  };
}
