import axios from 'axios';
import { API_BASE_URL } from './config';

const api = axios.create({ baseURL: API_BASE_URL });

export async function transcribeAudio(uri: string) {
  const form = new FormData();
  form.append('audio', { uri, name: 'recording.m4a', type: 'audio/m4a' } as any);
  const { data } = await api.post('/api/transcribe', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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

export async function fetchTasks() {
  const { data } = await api.get('/api/tasks');
  return data as { _id: string; title: string; due: string; status: string }[];
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
