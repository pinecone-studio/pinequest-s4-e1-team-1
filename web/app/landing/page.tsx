import Link from 'next/link';
import { Mic, Bell, Sparkles, BarChart2, CheckCircle2, Circle, ArrowRight } from 'lucide-react';

const features = [
  { icon: Mic,       title: 'Дуут сануулагч',     desc: 'Байгалийн хэлээр ярь. AI нэр, огноо, цаг, чухал байдлыг автоматаар ялган таньдаг.' },
  { icon: Bell,      title: 'Ухаалаг мэдэгдэл',   desc: 'Цаг тухайд нь сануулга, дуусах хугацааны анхааруулга, зөөлөн дагаж мөрдөлт.' },
  { icon: Sparkles,  title: 'AI ухаалаг санал',   desc: 'Оргил цагийг тань илрүүлж, аширгүй хэв маягийг таслан зогсооно.' },
  { icon: BarChart2, title: 'Тайлан & Шинжилгээ', desc: 'Үзэсгэлэнтэй график, долоо хоног бүрийн дүгнэлт.' },
];

const tasks = [
  { title: 'Математикийн даалгавар дуусгах', time: '20:00', done: false },
  { title: 'Дизайн багтай уулзалт',          time: '15:30', done: false },
  { title: 'Өглөөний дасгал',               time: '07:00', done: true  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">

      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <Sparkles size={15} color="white" />
          </div>
          <span className="font-bold text-lg">SmartTask AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Нэвтрэх</Link>
          <Link href="/login" className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full transition-colors">Үнэгүй эхлэх</Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="flex flex-col items-center text-center px-6 pt-20 pb-16">
          <div className="flex items-center gap-2 text-xs text-gray-500 border border-gray-200 rounded-full px-3 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            AI-ийн тусламжтай бүтээмж, шинэчлэгдсэн байдлаар
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6 max-w-3xl">
            Чухал зүйлсийг{' '}
            <span className="text-indigo-600">хэзээ ч</span>
            {' '}мартахгүй.
          </h1>

          <p className="text-lg text-gray-500 max-w-xl leading-relaxed mb-10">
            Текст эсвэл дуугаар сануулагч үүсгэж, бүтээмжтэй байж, AI амьдралыг тань зохион байгуулаг — ухаалаг мэдэгдэл, санал, үзэсгэлэнтэй тайлангуудаар.
          </p>

          <div className="flex items-center gap-3">
            <Link href="/login"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors shadow-md shadow-indigo-200">
              Үнэгүй эхлэх <ArrowRight size={16} />
            </Link>
            <a href="#features"
              className="text-sm font-medium text-gray-700 border border-gray-200 hover:border-gray-300 px-6 py-3 rounded-full transition-colors">
              Жишээ үзэх
            </a>
          </div>
        </section>

        {/* App preview */}
        <section className="px-6 pb-20 flex justify-center">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
              {[
                { val: '12',  label: 'Өнөөдрийн даалгавар', color: 'text-indigo-600' },
                { val: '87%', label: 'Гүйцэтгэлийн хувь',  color: 'text-green-600'  },
                { val: '5',   label: 'Удахгүй сануулагч',  color: 'text-gray-900'   },
              ].map(({ val, label, color }) => (
                <div key={label} className="flex flex-col px-6 py-5">
                  <span className={`text-3xl font-bold ${color}`}>{val}</span>
                  <span className="text-xs text-gray-400 mt-1">{label}</span>
                </div>
              ))}
            </div>

            {/* Task list */}
            <div className="divide-y divide-gray-100">
              {tasks.map(({ title, time, done }) => (
                <div key={title} className="flex items-center gap-3 px-6 py-4">
                  {done
                    ? <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                    : <Circle      size={20} className="text-gray-300 shrink-0" />}
                  <span className={`flex-1 text-sm ${done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{title}</span>
                  <span className="text-xs text-gray-400">{time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 pb-24 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 px-8 py-6 text-center text-xs text-gray-400">
        © 2026 SmartTask AI. Бүх эрх хуулиар хамгаалагдсан.
      </footer>
    </div>
  );
}
