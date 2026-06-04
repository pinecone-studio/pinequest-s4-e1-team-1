'use client';

import { useRef, useState } from 'react';
import { transcribeAudio, processText, saveEntry } from '@/lib/api';

type ProcessResult = {
  tasks: { title: string; due: string }[];
  events: { title: string; datetime: string }[];
  summary: string;
};

type Status = 'idle' | 'recording' | 'processing' | 'done' | 'error';

export default function HomePage() {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setErrorMsg('');
    setResult(null);
    setTranscript('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setStatus('recording');
    } catch {
      setErrorMsg('Микрофоны зөвшөөрөл олгоно уу.');
      setStatus('error');
    }
  }

  async function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    setStatus('processing');

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });

    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });

      const { text } = await transcribeAudio(blob);
      setTranscript(text);

      const processed = await processText(text);
      setResult(processed);

      await saveEntry({ text, ...processed });

      setStatus('done');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Алдаа гарлаа.';
      setErrorMsg(msg);
      setStatus('error');
    }
  }

  const isRecording = status === 'recording';
  const isProcessing = status === 'processing';

  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-8 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">Дуу бичлэг</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isRecording
            ? 'Бичиж байна...'
            : isProcessing
            ? 'Боловсруулж байна...'
            : 'Товч дарж бичиж эхлэх'}
        </p>
      </div>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        aria-label={isRecording ? 'Зогсоох' : 'Бичих'}
        className={`relative w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-offset-2
          ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300 scale-110'
              : isProcessing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 focus:ring-indigo-300'
          }`}
      >
        {isProcessing ? (
          <svg
            className="w-10 h-10 text-white animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        ) : isRecording ? (
          <span className="w-10 h-10 bg-white rounded-sm" />
        ) : (
          <svg
            className="w-14 h-14 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 1a4 4 0 014 4v7a4 4 0 01-8 0V5a4 4 0 014-4zm0 2a2 2 0 00-2 2v7a2 2 0 004 0V5a2 2 0 00-2-2zm-7 9a1 1 0 012 0 5 5 0 0010 0 1 1 0 012 0 7 7 0 01-6 6.92V21h2a1 1 0 010 2H9a1 1 0 010-2h2v-2.08A7 7 0 015 12z" />
          </svg>
        )}
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-red-400 opacity-40 animate-ping" />
        )}
      </button>

      {status === 'error' && (
        <div className="w-full max-w-md bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {errorMsg}
        </div>
      )}

      {transcript && (
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
            Бичлэг
          </p>
          <p className="text-gray-700 text-sm leading-relaxed">{transcript}</p>
        </div>
      )}

      {result && status === 'done' && (
        <div className="w-full max-w-md flex flex-col gap-4">
          {result.summary && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-400 uppercase mb-1">
                Хураангуй
              </p>
              <p className="text-indigo-800 text-sm">{result.summary}</p>
            </div>
          )}

          {result.tasks.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Даалгавар ({result.tasks.length})
              </p>
              <ul className="flex flex-col gap-2">
                {result.tasks.map((t, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700">{t.title}</span>
                    {t.due && (
                      <span className="text-gray-400 text-xs">{t.due}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.events.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">
                Цаг товлол ({result.events.length})
              </p>
              <ul className="flex flex-col gap-2">
                {result.events.map((e, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700">{e.title}</span>
                    {e.datetime && (
                      <span className="text-gray-400 text-xs">
                        {e.datetime}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
