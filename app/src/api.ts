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

export async function processText(text: string) {
  const { data } = await api.post('/api/process', { text }, { headers: await authHeader() });
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
  const { data } = await api.post('/api/entries', body, { headers: await authHeader() });
  return data;
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

export async function updateTask(id: string, fields: { status?: 'pending' | 'done'; priority?: TaskPriority; category?: string }) {
  const { data } = await api.patch(`/api/tasks/${id}`, fields, { headers: await authHeader() });
  return data as Task;
}

export async function deleteTask(id: string) {
  await api.delete(`/api/tasks/${id}`, { headers: await authHeader() });
}

export async function fetchReport(date: string) {
  const { data } = await api.post('/api/report', { date }, { headers: await authHeader() });
  return data as {
    date: string;
    entryCount: number;
    taskCount: number;
    eventCount: number;
    summary: string;
  };
}
