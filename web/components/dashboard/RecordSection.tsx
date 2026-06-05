'use client';

import { useRef, useState } from 'react';
import { Mic, Square, CheckCircle2, Calendar } from 'lucide-react';
import { transcribeAudio, processText, saveEntry } from '@/lib/api';

type Result = {
  tasks:  { title: string; due: string }[];
  events: { title: string; datetime: string }[];
  summary: string;
};

type Status = 'idle' | 'recording' | 'processing' | 'done' | 'error';

export default function RecordSection() {
  const [status, setStatus]       = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [result, setResult]       = useState<Result | null>(null);
  const [errorMsg, setErrorMsg]   = useState('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);

  const isRecording  = status === 'recording';
  const isProcessing = status === 'processing';

  async function startRecording() {
    setErrorMsg(''); setResult(null); setTranscript('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start();
      recorderRef.current = recorder;
      setStatus('recording');
    } catch {
      setErrorMsg('Микрофоны зөвшөөрөл олгоно уу.');
      setStatus('error');
    }
  }

  async function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    setStatus('processing');
    await new Promise<void>((res) => { recorder.onstop = () => res(); recorder.stop(); recorder.stream.getTracks().forEach(t => t.stop()); });
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const { text } = await transcribeAudio(blob);
      setTranscript(text);
      const processed = await processText(text);
      setResult(processed);
      await saveEntry({ text, ...processed });
      setStatus('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Алдаа гарлаа.');
      setStatus('error');
    }
  }

  function reset() { setStatus('idle'); setTranscript(''); setResult(null); setErrorMsg(''); }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-5">Дуу бичих</h2>

      {/* Mic button */}
      <div className="flex flex-col items-center gap-4 mb-5">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 focus:outline-none disabled:opacity-50 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 scale-110'
              : isProcessing
              ? 'bg-gray-300 dark:bg-slate-600 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
          }`}
        >
          {isProcessing ? (
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
          ) : isRecording ? (
            <Square size={28} fill="white" className="text-white" />
          ) : (
            <Mic size={32} className="text-white" />
          )}
          {isRecording && (
            <span className="absolute inset-0 rounded-full bg-red-400 opacity-40 animate-ping" />
          )}
        </button>

        <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
          {isRecording   ? 'Бичиж байна... зогсоохын тулд дахин дарна уу'
          : isProcessing ? 'Боловсруулж байна...'
          : status === 'done' ? 'Амжилттай хадгалагдлаа ✓'
          : 'Дарж бичлэг эхлүүлнэ'}
        </p>
      </div>

      {/* Error */}
      {status === 'error' && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm mb-4">
          {errorMsg}
        </div>
      )}

      {/* Transcript */}
      {transcript && (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 mb-3 border border-gray-100 dark:border-slate-700">
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">Таних үр дүн</p>
          <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed">{transcript}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="flex flex-col gap-3">
          {result.summary && (
            <div className="bg-indigo-50 dark:bg-indigo-950 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1.5">Хураангуй</p>
              <p className="text-sm text-indigo-800 dark:text-indigo-200">{result.summary}</p>
            </div>
          )}

          {result.tasks.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Даалгаврууд ({result.tasks.length})</p>
              <div className="flex flex-col gap-1.5">
                {result.tasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    <span className="text-gray-700 dark:text-slate-200">{t.title}</span>
                    {t.due && <span className="text-xs text-gray-400 ml-auto">{t.due}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.events.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Үйл явдлууд ({result.events.length})</p>
              <div className="flex flex-col gap-1.5">
                {result.events.map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-indigo-500 shrink-0" />
                    <span className="text-gray-700 dark:text-slate-200">{e.title}</span>
                    {e.datetime && <span className="text-xs text-gray-400 ml-auto">{e.datetime}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={reset} className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 text-center transition-colors py-1">
            Дахин бичих
          </button>
        </div>
      )}
    </div>
  );
}
