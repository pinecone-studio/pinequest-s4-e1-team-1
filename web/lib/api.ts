import axios from 'axios';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

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
