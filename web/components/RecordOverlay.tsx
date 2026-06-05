'use client';

import { useRef, useState } from 'react';
import { X, Mic, Square, CheckCircle2, Calendar } from 'lucide-react';
import { transcribeAudio, processText, saveEntry } from '@/lib/api';

type Result = {
  tasks:  { title: string; due: string }[];
  events: { title: string; datetime: string }[];
  summary: string;
};
type Status = 'idle' | 'recording' | 'processing' | 'done' | 'error';

export default function RecordOverlay({ onClose }: { onClose: () => void }) {
  const [status, setStatus]         = useState<Status>('idle');
  const [transcript, setTranscript] = useState('');
  const [result, setResult]         = useState<Result | null>(null);
  const [errorMsg, setErrorMsg]     = useState('');
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
    await new Promise<void>((res) => {
      recorder.onstop = () => res();
      recorder.stop();
      recorder.stream.getTracks().forEach(t => t.stop());
    });
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const { text } = await transcribeAudio(blob);
      setTranscript(text);
      const processed = await processText(text);
      setResult(processed);
      await saveEntry({ text, ...processed });
      // Dashboard-г шинэчлэхийн тулд event дамжуулна
      window.dispatchEvent(new CustomEvent('tasks-updated'));
      setStatus('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Алдаа гарлаа.');
      setStatus('error');
    }
  }

  function reset() { setStatus('idle'); setTranscript(''); setResult(null); setErrorMsg(''); }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-slate-900 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Дуу бичих</h2>
        <button
          onClick={() => { if (isRecording) stopRecording(); onClose(); }}
          className="p-2 rounded-xl text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-6 py-12 max-w-lg mx-auto w-full gap-6">

        {/* Mic button */}
        <div className="flex flex-col items-center gap-5">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`relative w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 focus:outline-none disabled:opacity-50 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 scale-110'
                : isProcessing
                ? 'bg-gray-300 dark:bg-slate-600 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
            }`}
            style={isRecording
              ? { boxShadow: '0 0 40px rgba(239,68,68,0.5)' }
              : isProcessing ? {}
              : { boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}
          >
            {isProcessing ? (
              <div className="w-10 h-10 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
            ) : isRecording ? (
              <Square size={36} fill="white" className="text-white" />
            ) : (
              <Mic size={40} className="text-white" />
            )}
            {isRecording && (
              <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
            )}
          </button>

          <p className="text-base text-gray-500 dark:text-slate-400 text-center font-medium">
            {isRecording   ? 'Бичиж байна... зогсоохын тулд дахин дарна уу'
            : isProcessing ? 'Боловсруулж байна...'
            : status === 'done' ? '✓ Амжилттай хадгалагдлаа'
            : 'Товчийг дарж бичлэг эхлүүлнэ'}
          </p>
        </div>

        {/* Error */}
        {status === 'error' && (
          <div className="w-full bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-2xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Таних үр дүн</p>
            <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed">{transcript}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="w-full flex flex-col gap-3">
            {result.summary && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-2xl border border-indigo-100 dark:border-indigo-900 p-5">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Хураангуй</p>
                <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">{result.summary}</p>
              </div>
            )}

            {result.tasks.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Даалгаврууд ({result.tasks.length})</p>
                <div className="flex flex-col gap-2">
                  {result.tasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                      <span className="text-gray-700 dark:text-slate-200 flex-1">{t.title}</span>
                      {t.due && <span className="text-xs text-gray-400 shrink-0">{t.due}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.events.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Үйл явдлууд ({result.events.length})</p>
                <div className="flex flex-col gap-2">
                  {result.events.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Calendar size={15} className="text-indigo-500 shrink-0" />
                      <span className="text-gray-700 dark:text-slate-200 flex-1">{e.title}</span>
                      {e.datetime && <span className="text-xs text-gray-400 shrink-0">{e.datetime}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={reset} className="text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 text-center transition-colors py-2">
              Дахин бичих
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
