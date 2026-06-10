"use client";

import { useState, useRef, useEffect } from "react";
import { Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { setUsername as apiSetUsername } from "@/lib/api";
import Link from "next/link";

type Mode = "login" | "signup" | "forgot";

function MagButton({ children, onClick, disabled, className }: any) {
  const ref = useRef<HTMLButtonElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    el.style.transition = "transform .1s ease";
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0,0)";
    el.style.transition = "transform .55s cubic-bezier(.22,1,.36,1)";
  };

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
    >
      {children}
    </button>
  );
}

export default function LoginPage() {
  const { loginWithEmail, signupWithEmail, loginWithGoogle, resetPassword, setUsername: setCtxUsername } =
    useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsernameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (mode === "signup" && !/^[a-z0-9_]{3,20}$/.test(username)) {
      setError("Username 3-20 тэмдэгт, зөвхөн a-z, 0-9, _ байх ёстой");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else if (mode === "signup") {
        await signupWithEmail(email, password);
        const res = await apiSetUsername(username);
        setCtxUsername(res.username);
      } else {
        await resetPassword(email);
        setInfo("Нууц үг сэргээх линк илгээлээ.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Алдаа гарлаа.";
      setError(msg.replace("Firebase: ", "").replace(/\s*\(auth\/.*\)/, ""));
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (fn: () => Promise<void>) => {
    setError("");
    setLoading(true);
    try {
      await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Алдаа гарлаа.";
      setError(msg.replace("Firebase: ", "").replace(/\s*\(auth\/.*\)/, ""));
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden select-none"
      style={{ background: "#030309" }}
    >
      {/* Background layers */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="aurora-layer aurora-1" />
        <div className="aurora-layer aurora-2" />
        <div className="aurora-layer aurora-3" />

        {/* Dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,.05) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(ellipse 100% 100% at 50% 50%, black 30%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 100% 100% at 50% 50%, black 30%, transparent 100%)",
          }}
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 50% 0%, transparent 50%, #030309 100%)",
          }}
        />
      </div>

      <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 h-16 backdrop-blur-sm">
        <Link
          href="/landing"
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Буцах
        </Link>
        <div className="flex items-center gap-2 text-white/50 text-sm">
          <div
            className="w-5 h-5 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#7c3aed,#db2777)" }}
          >
            <Activity size={11} color="white" />
          </div>
          MonTask
        </div>
        <div className="w-16" />
      </div>

      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 pt-8">
        <div className="w-full max-w-md">
          <div
            className="text-center mb-10"
            style={{
              opacity: 1,
              transform: "none",
              animation: "fup .6s cubic-bezier(.22,1,.36,1)",
            }}
          >
            <h1 className="text-4xl font-black mb-2">
              {mode === "login"
                ? "Нэвтрэх"
                : mode === "signup"
                  ? "Бүртгүүлэх"
                  : "Нууц үг сэргээх"}
            </h1>
            <p className="text-white/40 text-sm">
              {mode === "login"
                ? "Өөрийн акаунтад нэвтэрнэ үү"
                : mode === "signup"
                  ? "Шинэ акаунт үүсгээд эхэлнэ үү"
                  : "Нээж эргүүлэх линк илгээе"}
            </p>
          </div>

          <div
            className="rounded-3xl border border-white/6 p-8 backdrop-blur-md"
            style={{
              background: "rgba(12,8,28,.6)",
              animation: "fup .8s cubic-bezier(.22,1,.36,1) .1s backwards",
            }}
          >
            {mode !== "forgot" && (
              <div className="flex flex-col gap-3 mb-6">
                <MagButton
                  onClick={() => handleSocial(loginWithGoogle)}
                  disabled={loading}
                  className="button-social flex items-center justify-center gap-3 w-full border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/8 bg-white/3 rounded-2xl px-4 py-3.5 text-sm font-medium text-white/80 hover:text-white transition-all duration-300"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google-аар {mode === "login" ? "нэвтрэх" : "бүртгүүлэх"}
                </MagButton>

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-white/30 font-medium">
                    эсвэл
                  </span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="group relative">
                <input
                  type="email"
                  placeholder="И-мэйл"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field w-full border border-white/10 bg-white/5 hover:bg-white/8 focus:bg-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all duration-300"
                />
              </div>

              {mode !== "forgot" && (
                <div className="group relative">
                  <input
                    type="password"
                    placeholder="Нууц үг"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-field w-full border border-white/10 bg-white/5 hover:bg-white/8 focus:bg-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all duration-300"
                  />
                </div>
              )}

              {mode === "signup" && (
                <div className="group relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm select-none">@</span>
                  <input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    maxLength={20}
                    required
                    className="input-field w-full border border-white/10 bg-white/5 hover:bg-white/8 focus:bg-white/10 rounded-2xl pl-8 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent transition-all duration-300"
                  />
                </div>
              )}

              {error && (
                <p className="text-red-400 text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  {error}
                </p>
              )}
              {info && (
                <p className="text-emerald-400 text-xs p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  {info}
                </p>
              )}

              <MagButton
                type="submit"
                disabled={loading}
                onClick={() => {}}
                className="button-submit group relative w-full font-semibold rounded-2xl px-4 py-3.5 text-sm overflow-hidden mt-2"
                style={{
                  background: loading
                    ? "linear-gradient(135deg,#6d28d9,#9333ea)"
                    : "linear-gradient(135deg,#7c3aed,#db2777)",
                  transitionDuration: loading ? "0s" : "0.3s",
                }}
              >
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-[.15] transition-opacity" />
                <span className="relative text-white flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Түр хүлээнэ үү...
                    </>
                  ) : mode === "login" ? (
                    "Нэвтрэх"
                  ) : mode === "signup" ? (
                    "Бүртгүүлэх"
                  ) : (
                    "Линк илгээх"
                  )}
                </span>
              </MagButton>
            </form>

            <div className="flex flex-col items-center gap-3 mt-7 pt-6 border-t border-white/5">
              {mode === "login" && (
                <>
                  <button
                    onClick={() => { setMode("signup"); setError(""); setUsernameInput(""); }}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                  >
                    Бүртгэл үүсгэх
                  </button>
                  <button
                    onClick={() => { setMode("forgot"); setError(""); }}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                  >
                    Нууц үг мартсан?
                  </button>
                </>
              )}
              {(mode === "signup" || mode === "forgot") && (
                <button
                  onClick={() => { setMode("login"); setError(""); setUsernameInput(""); }}
                  className="text-sm text-white/40 hover:text-white transition-colors duration-200 flex items-center gap-1"
                >
                  ← Нэвтрэх
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-white/20 mt-6">
            Бүртгүүлснээр та{" "}
            <a
              href="#"
              className="text-white/40 hover:text-white/60 transition-colors"
            >
              Нөхцөл
            </a>{" "}
            болон{" "}
            <a
              href="#"
              className="text-white/40 hover:text-white/60 transition-colors"
            >
              Нууцлалыг
            </a>{" "}
            зөвшөөрнө.
          </p>
        </div>
      </main>

      <style jsx>{`
        @keyframes buttonPulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(124, 58, 237, 0);
          }
        }

        .button-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(124, 58, 237, 0.3);
        }

        .button-social:hover {
          transform: translateY(-1px);
        }

        .input-field::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}
