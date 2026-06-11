'use client';

import { useRef, useState } from 'react';
import { Mic, Square, CheckCircle2, Calendar, Clock, Flame, RefreshCw, Send, Sparkles } from 'lucide-react';
import { transcribeAudio, processText, saveEntry, parseDatetime, RecurringPattern } from '@/lib/api';

type Result = {
  tasks:  { title: string; due: string }[];
  events: { title: string; datetime: string }[];
  summary: string;
};

type InputMode = 'pick' | 'voice';
type TaskVoiceStatus = 'idle' | 'recording' | 'processing';

const CATEGORIES = ['Ажил', 'Хувийн', 'Эрүүл мэнд', 'Гэр бүл', 'Сурлага', 'Хобби', 'Бусад'];

type ClarifyTask = {
  title: string;
  date: string;
  time: string;
  urgent: boolean;
  inputMode: InputMode;
  category: string;
  recurring?: RecurringPattern;
  recurConfirmed?: boolean;
};

const WEEKDAY_NAMES = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];

function recurringLabel(r: RecurringPattern): string {
  if (r.type === 'weekly_days') {
    return `7 хоног бүр · ${r.days.map(d => WEEKDAY_NAMES[d]).join(', ')}`;
  }
  return `Сар бүр · ${r.days.join(', ')}-нд`;
}

function countInstances(r: RecurringPattern): number {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let n = 0;
  if (r.type === 'weekly_days') {
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      if (r.days.includes(d.getDay())) n++;
    }
  } else {
    for (let m = 0; m < 12; m++) {
      for (const day of r.days) {
        const d = new Date(today.getFullYear(), today.getMonth() + m, day);
        if (d >= today && d.getDate() === day) n++;
      }
    }
  }
  return n;
}

type SaveableTask = { title: string; due: string; priority: string; category: string };

function expandTask(t: ClarifyTask): SaveableTask[] {
  const base = { title: t.title, priority: t.urgent ? 'high' : 'medium', category: t.category };
  const mkDue = (dateStr: string) => t.time ? `${dateStr}T${t.time}:00` : dateStr;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  if (!t.recurring || t.recurConfirmed === false) {
    // Not recurring or user declined: one task per weekday (next occurrence each)
    if (t.recurring?.type === 'weekly_days' && t.recurConfirmed === false) {
      return t.recurring.days.map(wd => {
        const d = new Date(today);
        const until = (wd - today.getDay() + 7) % 7 || 7;
        d.setDate(today.getDate() + until);
        return { ...base, due: mkDue(d.toISOString().split('T')[0]) };
      });
    }
    return [{ ...base, due: t.date ? mkDue(t.date) : '' }];
  }

  const results: SaveableTask[] = [];
  if (t.recurring.type === 'weekly_days') {
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      if (t.recurring.days.includes(d.getDay()))
        results.push({ ...base, due: mkDue(d.toISOString().split('T')[0]) });
    }
  } else {
    for (let m = 0; m < 12; m++) {
      for (const day of t.recurring.days) {
        const d = new Date(today.getFullYear(), today.getMonth() + m, day);
        if (d >= today && d.getDate() === day)
          results.push({ ...base, due: mkDue(d.toISOString().split('T')[0]) });
      }
    }
  }
  return results.length ? results : [{ ...base, due: '' }];
}

type Status = 'idle' | 'recording' | 'processing' | 'clarifying' | 'saving' | 'done' | 'error';
type InputTab = 'voice' | 'chat';
type ChatMsg = { id: number; role: 'user' | 'ai'; text: string; tasks?: ClarifyTask[]; saved?: boolean };
let _wid = 0;

function parseDue(due: string): { date: string; time: string } {
  if (!due) return { date: '', time: '' };
  if (due.includes('T')) {
    const [date, timePart] = due.split('T');
    return { date, time: timePart.slice(0, 5) };
  }
  return { date: due, time: '' };
}

export default function RecordSection() {
  const [status, setStatus]             = useState<Status>('idle');
  const [transcript, setTranscript]     = useState('');
  const [result, setResult]             = useState<Result | null>(null);
  const [clarifyTasks, setClarifyTasks] = useState<ClarifyTask[]>([]);
  const [errorMsg, setErrorMsg]         = useState('');
  const [inputTab, setInputTab]         = useState<InputTab>('voice');
  const [chatMsgs, setChatMsgs]         = useState<ChatMsg[]>([{ id: 0, role: 'ai', text: 'Юу хийхийг тэмдэглэх вэ? Товч байдлаар бичнэ үү.' }]);
  const [chatInput, setChatInput]       = useState('');
  const [chatLoading, setChatLoading]   = useState(false);

  const [taskVoiceIdx, setTaskVoiceIdx]       = useState<number | null>(null);
  const [taskVoiceStatus, setTaskVoiceStatus] = useState<TaskVoiceStatus>('idle');
  const taskRecorderRef = useRef<MediaRecorder | null>(null);
  const taskChunksRef   = useRef<Blob[]>([]);

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
    await new Promise<void>((res) => { recorder.onstop = () => res(); recorder.stop(); recorder.stream.getTracks().forEach(t => t.stop()); });
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const { text } = await transcribeAudio(blob);
      setTranscript(text);
      const processed = await processText(text);
      setResult(processed);

      if (processed.tasks.length > 0) {
        setClarifyTasks(processed.tasks.map(t => {
          const { date, time } = parseDue(t.due);
          return { title: t.title, date, time, urgent: false, inputMode: date ? 'pick' : 'voice', category: t.category || 'Бусад', recurring: t.recurring, recurConfirmed: t.recurring?.confirmed === true ? true : undefined };
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
      // keep voice mode
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
      const updatedTasks = clarifyTasks.flatMap(expandTask);
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

  async function handleChatSend() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    setChatMsgs(prev => [...prev, { id: ++_wid, role: 'user', text }]);
    setChatLoading(true);
    try {
      const processed = await processText(text);
      const tasks: ClarifyTask[] = processed.tasks.map(t => {
        const { date, time } = parseDue(t.due);
        return { title: t.title, date, time, urgent: false, inputMode: 'pick', category: t.category || 'Бусад', recurring: t.recurring, recurConfirmed: t.recurring?.confirmed ? true : undefined };
      });
      const aiText = tasks.length > 0
        ? `${tasks.length} даалгавар олдлоо. Хадгалах уу?`
        : (processed.summary || 'Даалгавар олдсонгүй. Тодорхойлон дахин бичнэ үү.');
      setChatMsgs(prev => [...prev, { id: ++_wid, role: 'ai', text: aiText, tasks: tasks.length ? tasks : undefined }]);
    } catch {
      setChatMsgs(prev => [...prev, { id: ++_wid, role: 'ai', text: 'Алдаа гарлаа. Дахин оролдоно уу.' }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleChatSave(msgId: number, tasks: ClarifyTask[]) {
    try {
      await saveEntry({ text: '', tasks: tasks.flatMap(expandTask), events: [], summary: '' });
      window.dispatchEvent(new CustomEvent('tasks-updated'));
      setChatMsgs(prev => prev.map(m => m.id === msgId ? { ...m, saved: true } : m));
    } catch {
      // silent fail for now
    }
  }

  function reset() {
    setStatus('idle'); setTranscript(''); setResult(null); setErrorMsg(''); setClarifyTasks([]);
    setTaskVoiceIdx(null); setTaskVoiceStatus('idle');
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
      <h2 className="font-bold text-gray-900 dark:text-white text-lg mb-4">Бичих</h2>

      {/* Tab switcher */}
      {status === 'idle' && (
        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 mb-5">
          <button
            onClick={() => setInputTab('voice')}
            className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${inputTab === 'voice' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            <Mic size={12} /> Дуу бичих
          </button>
          <button
            onClick={() => setInputTab('chat')}
            className={`flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border-l border-gray-200 dark:border-slate-600 ${inputTab === 'chat' ? 'bg-indigo-500 text-white' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
          >
            <Sparkles size={12} /> AI Чат
          </button>
        </div>
      )}

      {/* Chat mode */}
      {inputTab === 'chat' && status === 'idle' && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            {chatMsgs.slice(-12).map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' ? (
                  <div className="max-w-[85%] bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 rounded-2xl rounded-tl-sm px-4 py-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Sparkles size={10} className="text-indigo-500" />
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">MonTask AI</span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-slate-100">{msg.text}</p>
                    {msg.tasks && !msg.saved && (
                      <div className="flex flex-col gap-1.5 mt-1">
                        {msg.tasks.map((t, ti) => (
                          <div key={ti} className="flex items-start gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-800">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-800 dark:text-slate-100">{t.title}</p>
                              {t.date && <p className="text-[11px] text-gray-400">{t.date}{t.time ? ` · ${t.time}` : ''}</p>}
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => handleChatSave(msg.id, msg.tasks!)}
                          className="mt-1 self-start flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          <CheckCircle2 size={12} /> Хадгалах
                        </button>
                      </div>
                    )}
                    {msg.saved && <p className="text-xs text-emerald-500 font-semibold mt-1 flex items-center gap-1"><CheckCircle2 size={11} /> Хадгалагдлаа</p>}
                  </div>
                ) : (
                  <div className="max-w-[75%] bg-indigo-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5">
                    <p className="text-sm">{msg.text}</p>
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-end gap-2 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2">
            <textarea
              className="flex-1 text-sm text-gray-800 dark:text-slate-100 bg-transparent resize-none focus:outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500 max-h-20"
              placeholder="Даалгавраа бичнэ үү..."
              rows={1}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); }}}
            />
            <button
              onClick={handleChatSend}
              disabled={!chatInput.trim() || chatLoading}
              className="w-8 h-8 rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-200 dark:disabled:bg-slate-600 text-white flex items-center justify-center transition-colors shrink-0"
            >
              <Send size={14} />
            </button>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 text-center">Enter дарж илгээнэ үү</p>
        </div>
      )}

      {/* Mic button */}
      {inputTab === 'voice' && (status === 'idle' || isRecording || isProcessing) && (
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
              <div className="w-8 h-8 border-white border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
            ) : isRecording ? (
              <Square size={28} fill="white" className="text-white" />
            ) : (
              <Mic size={32} className="text-white" />
            )}
            {isRecording && <span className="absolute inset-0 rounded-full bg-red-400 opacity-40 animate-ping" />}
          </button>
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
            {isRecording ? 'Бичиж байна... зогсоохын тулд дахин дарна уу'
            : isProcessing ? 'Боловсруулж байна...'
            : 'Дарж бичлэг эхлүүлнэ'}
          </p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl px-4 py-3 text-red-600 dark:text-red-400 text-sm mb-4">
          {errorMsg}
          <button onClick={reset} className="block mt-1.5 text-xs underline">Дахин оролдох</button>
        </div>
      )}

      {/* Transcript */}
      {transcript && status !== 'idle' && (
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4 border border-gray-100 dark:border-slate-700">
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">Таних үр дүн</p>
          <p className="text-sm text-gray-700 dark:text-slate-200 leading-relaxed">{transcript}</p>
        </div>
      )}

      {/* Clarification */}
      {status === 'clarifying' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-bold text-gray-700 dark:text-slate-200">Даалгавруудыг тодотгоно уу</p>

          {clarifyTasks.map((task, i) => {
            const isThisRecording  = taskVoiceIdx === i && taskVoiceStatus === 'recording';
            const isThisProcessing = taskVoiceIdx === i && taskVoiceStatus === 'processing';
            const otherRecording   = taskVoiceIdx !== null && taskVoiceIdx !== i;

            return (
              <div key={i} className="flex flex-col gap-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 border border-gray-100 dark:border-slate-600">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{task.title}</p>
                    {task.recurring && task.recurConfirmed === undefined && (
                      <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-xs">
                        <RefreshCw size={11} className="text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-amber-700 dark:text-amber-300 font-medium flex-1">7 хоног бүр давтагдах уу?</span>
                        <button onClick={() => updateTask(i, { recurConfirmed: true })} className="px-2.5 py-1 rounded-lg bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors">Тийм · 30 хоног</button>
                        <button onClick={() => updateTask(i, { recurConfirmed: false })} className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">Үгүй</button>
                      </div>
                    )}
                    {task.recurring && task.recurConfirmed === true && (
                      <div className="flex items-center gap-1.5 text-xs bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-300 border border-violet-200 dark:border-violet-800 rounded-full px-2.5 py-0.5 w-fit">
                        <RefreshCw size={10} />
                        <span>{recurringLabel(task.recurring)}</span>
                        <span className="opacity-60">· {countInstances(task.recurring)} удаа</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recurring confirmed: time-only picker */}
                {task.recurring && task.recurConfirmed === true ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock size={10} /> Цаг (нэмэлт)
                    </label>
                    <input
                      type="time"
                      value={task.time}
                      onChange={e => updateTask(i, { time: e.target.value })}
                      className="text-xs rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 w-36"
                    />
                  </div>
                ) : task.date ? (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg px-3 py-2">
                    <Calendar size={10} />
                    <span>{task.date}{task.time ? ` · ${task.time}` : ''}</span>
                    <button
                      onClick={() => updateTask(i, { date: '', time: '', inputMode: 'pick' })}
                      className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors text-[10px]"
                    >
                      өөрчлөх
                    </button>
                  </div>
                ) : (
                  <>
                {/* Mode toggle */}
                <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600">
                  <button
                    onClick={() => updateTask(i, { inputMode: 'pick' })}
                    className={`flex-1 py-1.5 text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                      task.inputMode === 'pick'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                    }`}
                  >
                    <Calendar size={11} /> Өдөр сонгох
                  </button>
                  <button
                    onClick={() => updateTask(i, { inputMode: 'voice' })}
                    className={`flex-1 py-1.5 text-xs font-semibold flex items-center justify-center gap-1 transition-all border-l border-gray-200 dark:border-slate-600 ${
                      task.inputMode === 'voice'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                    }`}
                  >
                    <Mic size={11} /> Дуугаар хэлэх
                  </button>
                </div>

                {/* Pick mode */}
                {task.inputMode === 'pick' && (
                  <div className="flex gap-2">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <Calendar size={10} /> Өдөр
                      </label>
                      <input
                        type="date"
                        value={task.date}
                        onChange={e => updateTask(i, { date: e.target.value })}
                        className="text-xs rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock size={10} /> Цаг
                      </label>
                      <input
                        type="time"
                        value={task.time}
                        onChange={e => updateTask(i, { time: e.target.value })}
                        className="text-xs rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-200 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                  </div>
                )}

                {/* Voice mode */}
                {task.inputMode === 'voice' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => isThisRecording ? stopTaskVoice(i) : startTaskVoice(i)}
                      disabled={isThisProcessing || otherRecording}
                      className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all duration-200 focus:outline-none disabled:opacity-40 shrink-0 ${
                        isThisRecording
                          ? 'bg-red-500 scale-110'
                          : isThisProcessing
                          ? 'bg-gray-300 dark:bg-slate-600 cursor-not-allowed'
                          : 'bg-indigo-500 hover:bg-indigo-600 hover:scale-105'
                      }`}
                    >
                      {isThisProcessing ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : isThisRecording ? (
                        <Square size={16} fill="white" className="text-white" />
                      ) : (
                        <Mic size={18} className="text-white" />
                      )}
                      {isThisRecording && <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-snug">
                      {isThisProcessing
                        ? 'Огноо таних...'
                        : isThisRecording
                        ? '"Маргааш 3 цагт" гэж хэлж зогсооно уу'
                        : task.date
                        ? `${task.date}${task.time ? ` ${task.time}` : ''} — дахин бичихийн тулд дарна уу`
                        : 'Дарж огноо, цагаа хэлнэ үү'}
                    </p>
                  </div>
                )}
                  </>
                )}

                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold">Ангилал</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => updateTask(i, { category: cat })}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          task.category === cat
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold'
                            : 'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:border-gray-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Urgency - always shown */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                    <Flame size={10} /> Яаралтай уу?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateTask(i, { urgent: true })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        task.urgent ? 'bg-rose-500 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      Тийм
                    </button>
                    <button
                      onClick={() => updateTask(i, { urgent: false })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        !task.urgent ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400'
                      }`}
                    >
                      Үгүй
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={handleSave}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
          >
            Хадгалах
          </button>
        </div>
      )}

      {/* Saving */}
      {isSaving && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-slate-400">Хадгалж байна...</p>
        </div>
      )}

      {/* Done */}
      {status === 'done' && result && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-center text-green-600 dark:text-green-400 font-semibold">Амжилттай хадгалагдлаа ✓</p>

          {result.summary && (
            <div className="bg-indigo-50 dark:bg-indigo-950 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900">
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-1.5">Хураангуй</p>
              <p className="text-sm text-indigo-800 dark:text-indigo-200">{result.summary}</p>
            </div>
          )}

          {clarifyTasks.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Даалгаврууд ({clarifyTasks.length})</p>
              <div className="flex flex-col gap-1.5">
                {clarifyTasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                    <span className="text-gray-700 dark:text-slate-200 flex-1">{t.title}</span>
                    {t.urgent && <Flame size={12} className="text-rose-500 shrink-0" />}
                    {t.date && <span className="text-xs text-gray-400">{t.date}{t.time ? ` ${t.time}` : ''}</span>}
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
