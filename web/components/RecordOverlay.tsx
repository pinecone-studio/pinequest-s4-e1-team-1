'use client';

import { useRef, useState } from 'react';
import { X, Mic, Square, CheckCircle2, Calendar, Clock, Flame } from 'lucide-react';
import { transcribeAudio, processText, saveEntry, parseDatetime } from '@/lib/api';

type Result = {
  tasks:  { title: string; due: string }[];
  events: { title: string; datetime: string }[];
  summary: string;
};

type InputMode = 'pick' | 'voice';
type TaskVoiceStatus = 'idle' | 'recording' | 'processing';

type ClarifyTask = {
  title: string;
  date: string;
  time: string;
  urgent: boolean;
  inputMode: InputMode;
};

type Status = 'idle' | 'recording' | 'processing' | 'clarifying' | 'saving' | 'done' | 'error';

function parseDue(due: string): { date: string; time: string } {
  if (!due) return { date: '', time: '' };
  if (due.includes('T')) {
    const [date, timePart] = due.split('T');
    return { date, time: timePart.slice(0, 5) };
  }
  return { date: due, time: '' };
}

export default function RecordOverlay({ onClose }: { onClose: () => void }) {
  const [status, setStatus]             = useState<Status>('idle');
  const [transcript, setTranscript]     = useState('');
  const [result, setResult]             = useState<Result | null>(null);
  const [clarifyTasks, setClarifyTasks] = useState<ClarifyTask[]>([]);
  const [errorMsg, setErrorMsg]         = useState('');

  // Per-task voice recording
  const [taskVoiceIdx, setTaskVoiceIdx]       = useState<number | null>(null);
  const [taskVoiceStatus, setTaskVoiceStatus] = useState<TaskVoiceStatus>('idle');
  const taskRecorderRef = useRef<MediaRecorder | null>(null);
  const taskChunksRef   = useRef<Blob[]>([]);

  // Main recording
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);

  const isRecording  = status === 'recording';
  const isProcessing = status === 'processing';
  const isSaving     = status === 'saving';

  async function startRecording() {
    setErrorMsg(''); setResult(null); setTranscript(''); setClarifyTasks([]);
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

      if (processed.tasks.length > 0) {
        setClarifyTasks(processed.tasks.map(t => {
          const { date, time } = parseDue(t.due);
          return { title: t.title, date, time, urgent: false, inputMode: date ? 'pick' : 'voice' };
        }));
        setStatus('clarifying');
      } else {
        await saveEntry({ text, ...processed });
        window.dispatchEvent(new CustomEvent('tasks-updated'));
        setStatus('done');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Алдаа гарлаа.');
      setStatus('error');
    }
  }

  // Per-task voice: start
  async function startTaskVoice(i: number) {
    if (taskVoiceIdx !== null) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      taskChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) taskChunksRef.current.push(e.data); };
      recorder.start();
      taskRecorderRef.current = recorder;
      setTaskVoiceIdx(i);
      setTaskVoiceStatus('recording');
    } catch {
      setErrorMsg('Микрофоны зөвшөөрөл олгоно уу.');
    }
  }

  // Per-task voice: stop + extract date
  async function stopTaskVoice(i: number) {
    const recorder = taskRecorderRef.current;
    if (!recorder) return;
    setTaskVoiceStatus('processing');
    await new Promise<void>((res) => {
      recorder.onstop = () => res();
      recorder.stop();
      recorder.stream.getTracks().forEach(t => t.stop());
    });
    try {
      const blob = new Blob(taskChunksRef.current, { type: 'audio/webm' });
      const { text } = await transcribeAudio(blob);
      const { due } = await parseDatetime(text);
      const { date, time } = parseDue(due);
      updateTask(i, { date, time, inputMode: 'pick' });
    } catch {
      // keep voice mode, user can retry
    } finally {
      setTaskVoiceIdx(null);
      setTaskVoiceStatus('idle');
      taskRecorderRef.current = null;
    }
  }

  async function handleSave() {
    if (!result) return;
    setStatus('saving');
    try {
      const updatedTasks = clarifyTasks.map(t => ({
        title: t.title,
        due: t.date ? (t.time ? `${t.date}T${t.time}:00` : t.date) : '',
        priority: t.urgent ? 'high' : 'medium',
      }));
      await saveEntry({ text: transcript, tasks: updatedTasks, events: result.events, summary: result.summary });
      window.dispatchEvent(new CustomEvent('tasks-updated'));
      setStatus('done');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Хадгалахад алдаа гарлаа.');
      setStatus('error');
    }
  }

  function updateTask(i: number, fields: Partial<ClarifyTask>) {
    setClarifyTasks(prev => prev.map((t, idx) => idx === i ? { ...t, ...fields } : t));
  }

  function reset() {
    setStatus('idle'); setTranscript(''); setResult(null); setErrorMsg(''); setClarifyTasks([]);
    setTaskVoiceIdx(null); setTaskVoiceStatus('idle');
  }

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

      <div className="flex-1 flex flex-col items-center px-6 py-12 max-w-lg mx-auto w-full gap-6">

        {/* Mic button */}
        {(status === 'idle' || isRecording || isProcessing) && (
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
              : 'Товчийг дарж бичлэг эхлүүлнэ'}
            </p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="w-full bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-2xl px-4 py-3 text-red-600 dark:text-red-400 text-sm">
            {errorMsg}
            <button onClick={reset} className="block mt-2 text-xs underline">Дахин оролдох</button>
          </div>
        )}

        {/* Transcript */}
        {transcript && status !== 'idle' && (
          <div className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Таних үр дүн</p>
            <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed">{transcript}</p>
          </div>
        )}

        {/* Clarification */}
        {status === 'clarifying' && (
          <div className="w-full flex flex-col gap-4">
            <div className="text-center">
              <p className="text-base font-bold text-gray-800 dark:text-white">Даалгавруудыг тодотгоно уу</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Огноо, цаг болон яаралтай эсэхийг оруулна уу</p>
            </div>

            {clarifyTasks.map((task, i) => {
              const isThisRecording = taskVoiceIdx === i && taskVoiceStatus === 'recording';
              const isThisProcessing = taskVoiceIdx === i && taskVoiceStatus === 'processing';
              const otherRecording = taskVoiceIdx !== null && taskVoiceIdx !== i;

              return (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm flex flex-col gap-4">
                  {/* Title */}
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{task.title}</p>
                  </div>

                  {/* If AI already recognized date → just show it, no input needed */}
                  {task.date ? (
                    <div className="flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl px-3 py-2">
                      <Calendar size={11} />
                      <span>{task.date}{task.time ? ` · ${task.time}` : ''}</span>
                      <button
                        onClick={() => updateTask(i, { date: '', time: '', inputMode: 'pick' })}
                        className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                      >
                        <Clock size={11} /> <span className="text-[10px]">өөрчлөх</span>
                      </button>
                    </div>
                  ) : (
                    <>
                  {/* Mode toggle */}
                  <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600">
                    <button
                      onClick={() => updateTask(i, { inputMode: 'pick' })}
                      className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        task.inputMode === 'pick'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Calendar size={12} /> Өдөр сонгох
                    </button>
                    <button
                      onClick={() => updateTask(i, { inputMode: 'voice' })}
                      className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border-l border-gray-200 dark:border-slate-600 ${
                        task.inputMode === 'voice'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Mic size={12} /> Дуугаар хэлэх
                    </button>
                  </div>

                  {/* Pick mode */}
                  {task.inputMode === 'pick' && (
                    <div className="flex gap-3">
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar size={11} /> Өдөр
                        </label>
                        <input
                          type="date"
                          value={task.date}
                          onChange={e => updateTask(i, { date: e.target.value })}
                          className="text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock size={11} /> Цаг
                        </label>
                        <input
                          type="time"
                          value={task.time}
                          onChange={e => updateTask(i, { time: e.target.value })}
                          className="text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Voice mode */}
                  {task.inputMode === 'voice' && (
                    <div className="flex flex-col items-center gap-3">
                      <button
                        onClick={() => isThisRecording ? stopTaskVoice(i) : startTaskVoice(i)}
                        disabled={isThisProcessing || otherRecording}
                        className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 focus:outline-none disabled:opacity-40 ${
                          isThisRecording
                            ? 'bg-red-500 hover:bg-red-600 scale-110'
                            : isThisProcessing
                            ? 'bg-gray-300 dark:bg-slate-600 cursor-not-allowed'
                            : 'bg-indigo-500 hover:bg-indigo-600 hover:scale-105'
                        }`}
                        style={isThisRecording ? { boxShadow: '0 0 20px rgba(239,68,68,0.5)' } : {}}
                      >
                        {isThisProcessing ? (
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isThisRecording ? (
                          <Square size={20} fill="white" className="text-white" />
                        ) : (
                          <Mic size={22} className="text-white" />
                        )}
                        {isThisRecording && (
                          <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
                        )}
                      </button>
                      <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
                        {isThisProcessing
                          ? 'Огноо таних...'
                          : isThisRecording
                          ? '"Маргааш 3 цагт" гэх мэт хэлж зогсооно уу'
                          : task.date
                          ? `${task.date}${task.time ? ` ${task.time}` : ''} — дахин бичихийн тулд дарна уу`
                          : 'Дарж огноо, цагаа хэлнэ үү'}
                      </p>
                    </div>
                  )}
                  </>
                  )}

                  {/* Urgency - always shown */}
                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-slate-400 flex items-center gap-1">
                      <Flame size={11} /> Яаралтай уу?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateTask(i, { urgent: true })}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                          task.urgent
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                        }`}
                      >
                        Тийм, яаралтай
                      </button>
                      <button
                        onClick={() => updateTask(i, { urgent: false })}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                          !task.urgent
                            ? 'bg-indigo-500 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
                        }`}
                      >
                        Тийм биш
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              onClick={handleSave}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors"
            >
              Хадгалах
            </button>
          </div>
        )}

        {/* Saving */}
        {isSaving && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Хадгалж байна...</p>
          </div>
        )}

        {/* Done */}
        {status === 'done' && result && (
          <div className="w-full flex flex-col gap-3">
            <div className="flex items-center justify-center gap-2 py-2">
              <CheckCircle2 size={20} className="text-green-500" />
              <p className="text-base font-bold text-gray-800 dark:text-white">Амжилттай хадгалагдлаа</p>
            </div>

            {result.summary && (
              <div className="bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-2xl border border-indigo-100 dark:border-indigo-900 p-5">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Хураангуй</p>
                <p className="text-sm text-indigo-900 dark:text-indigo-200 leading-relaxed">{result.summary}</p>
              </div>
            )}

            {clarifyTasks.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Даалгаврууд ({clarifyTasks.length})</p>
                <div className="flex flex-col gap-2">
                  {clarifyTasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={15} className="text-green-500 shrink-0" />
                      <span className="text-gray-700 dark:text-slate-200 flex-1">{t.title}</span>
                      {t.urgent && <Flame size={13} className="text-rose-500 shrink-0" />}
                      {t.date && <span className="text-xs text-gray-400 shrink-0">{t.date}{t.time ? ` ${t.time}` : ''}</span>}
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
