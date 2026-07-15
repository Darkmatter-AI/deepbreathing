"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Check, Loader2, X } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  createRuntimePhraseResolver,
  type RuntimePhraseKey,
} from "@/components/resonance/runtime-phrases";

function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", name, params);
  }
}

interface KeepPracticeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  sessionMode: string;
  sessionSeconds: number;
  accentColor?: string;
  sessionsCompleted: number;
  dayStreak: number;
  locale?: string;
}

const PREFIX = "cpk";

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function getAuthCallbackURL() {
  if (typeof window === "undefined") return "/";
  return `${window.location.pathname}${window.location.search}`;
}

export function KeepPracticeSheet({
  open,
  onOpenChange,
  onSuccess,
  sessionMode,
  sessionSeconds,
  accentColor = "#f6743b",
  sessionsCompleted,
  dayStreak,
  locale = "en",
}: KeepPracticeSheetProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailOpen, setEmailOpen] = useState(false);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phrases = useMemo(() => createRuntimePhraseResolver(locale), [locale]);
  const t = (key: RuntimePhraseKey, vars?: Record<string, string | number>) =>
    phrases.resolve(key, vars).text;

  useEffect(() => {
    if (open) trackEvent("signin_prompt_view", { variant: "keep_practice" });
  }, [open]);

  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => {
      setStatus("idle");
      setEmail("");
      setEmailOpen(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(
    () => () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
    },
    []
  );

  const handleClose = () => onOpenChange(false);
  const handleApple = async () => {
    trackEvent("signin_apple_clicked", { variant: "keep_practice" });
    try {
      await signIn.social({ provider: "apple", callbackURL: getAuthCallbackURL() });
      onSuccess?.();
    } catch {
      // Apple OAuth redirects; errors are shown by the provider callback.
    }
  };
  const handleGoogle = async () => {
    trackEvent("signin_google_clicked", { variant: "keep_practice" });
    try {
      await signIn.social({ provider: "google", callbackURL: getAuthCallbackURL() });
      onSuccess?.();
    } catch {
      // Google OAuth redirects; errors are rare here.
    }
  };
  const handleMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    trackEvent("signin_magic_link_sent", { variant: "keep_practice" });
    try {
      await signIn.magicLink({ email, callbackURL: getAuthCallbackURL() });
      onSuccess?.();
      swapTimer.current = setTimeout(() => setStatus("sent"), 300);
    } catch {
      setStatus("error");
    }
  };

  const headline =
    sessionsCompleted >= 2
      ? t("auth.sessions_keep", { n: sessionsCompleted })
      : dayStreak >= 2
        ? t("auth.streak_keep", { n: dayStreak })
        : t("auth.save_progress_question");
  const sessionCount = sessionsCompleted > 0
    ? t(sessionsCompleted === 1 ? "auth.session_count" : "auth.sessions_count", { n: sessionsCompleted })
    : null;
  const sending = status === "sending";
  const sent = status === "sent";
  const circumference = 100.53;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <SheetContent
        side="bottom"
        className="inset-0 flex items-center justify-center border-0 bg-transparent p-4 shadow-none outline-none"
      >
        <style>{CSS}</style>
        <div className={`${PREFIX}-sheet`} role="dialog" aria-label={t("auth.create_free_account")}>
          <button className={`${PREFIX}-x`} onClick={handleClose} aria-label={t("ui.close")}>
            <X size={17} />
          </button>
          {sent ? (
            <div className={`${PREFIX}-success`}>
              <div className={`${PREFIX}-check-ring`}><Check size={26} /></div>
              <h3>{t("auth.check_email")}</h3>
              <p>{t("auth.sent_link_to")} <b>{email.trim() || t("auth.you")}</b></p>
            </div>
          ) : (
            <>
              <div className={`${PREFIX}-card`}>
                <div className={`${PREFIX}-ring-wrap`}>
                  <svg viewBox="0 0 40 40" className={`${PREFIX}-svg`} aria-hidden="true">
                    <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.5" />
                    <circle cx="20" cy="20" r="16" fill="none" stroke={accentColor} strokeWidth="2.5" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 20 20)" />
                  </svg>
                  <Activity size={13} className={`${PREFIX}-glyph`} style={{ color: accentColor }} />
                </div>
                <div className={`${PREFIX}-card-text`}>
                  <div className={`${PREFIX}-eyebrow`}>✓ {t("session.complete")}</div>
                  <div className={`${PREFIX}-mode`}>{sessionMode}</div>
                  <div className={`${PREFIX}-meta`}>
                    <span className={`${PREFIX}-dur`}>{formatDuration(sessionSeconds)}</span>
                    <span className={`${PREFIX}-dot`} aria-hidden="true">·</span>
                    <span>{t("auth.just_now")}</span>
                  </div>
                  {sessionCount ? <p className={`${PREFIX}-stats`}>{sessionCount}</p> : null}
                </div>
              </div>
              <h2 className={`${PREFIX}-title`}>{headline}</h2>
              <p className={`${PREFIX}-sub`}>{t("auth.local_only")}</p>
              <button className={`${PREFIX}-apple`} onClick={handleApple}>
                <span className={`${PREFIX}-apple-logo`} aria-hidden="true"></span>
                <span>{t("auth.continue_apple")}</span>
              </button>
              <button className={`${PREFIX}-google`} onClick={handleGoogle}>
                <svg viewBox="0 0 24 24" className={`${PREFIX}-g-logo`} aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>{t("auth.continue_google")}</span>
              </button>
              <div className={`${PREFIX}-email-wrap${emailOpen ? " open" : ""}`}>
                <form className={`${PREFIX}-email-row`} onSubmit={handleMagicLink}>
                  <input className={`${PREFIX}-email-input`} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("auth.enter_email")} aria-label={t("auth.email_address")} required />
                  <button className={`${PREFIX}-magic`} type="submit" disabled={sending || !email.trim()}>
                    {sending ? <Loader2 size={15} className={`${PREFIX}-spin`} /> : t("auth.send_link")}
                  </button>
                </form>
                {status === "error" && <p className={`${PREFIX}-err`}>{t("auth.something_went_wrong")}</p>}
              </div>
              <button className={`${PREFIX}-email-link`} onClick={() => setEmailOpen((value) => !value)} aria-expanded={emailOpen}>
                <span className={`${PREFIX}-u`}>{t("auth.save_with_email")}</span>
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const CSS = `
.${PREFIX}-sheet{--cream:#fbeede;--cream-80:rgba(251,238,222,.82);--cream-58:rgba(251,238,222,.58);--cream-40:rgba(251,238,222,.40);--coral:#f6743b;--line:rgba(255,255,255,.10);--ease:cubic-bezier(.22,1,.36,1);position:relative;width:min(362px,calc(100vw - 32px));background:rgba(44,29,20,.72);-webkit-backdrop-filter:blur(28px) saturate(1.2);backdrop-filter:blur(28px) saturate(1.2);border:1px solid var(--line);border-radius:30px;color:var(--cream);padding:44px 28px 22px;font-family:var(--font-sans),"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;box-shadow:0 36px 90px -20px rgba(0,0,0,.6),0 0 50px rgba(255,133,158,.14),inset 0 1px 0 rgba(255,255,255,.07)}
.${PREFIX}-x{position:absolute;top:14px;right:16px;width:28px;height:28px;border:0;background:none;color:var(--cream-40);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:color .2s,background .2s}.${PREFIX}-x:hover{color:var(--cream-80);background:rgba(255,255,255,.08)}
.${PREFIX}-card{display:flex;align-items:center;gap:14px;background:rgba(29,19,13,.55);border:1px solid var(--line);border-radius:18px;padding:14px 16px;margin:0 0 20px}.${PREFIX}-ring-wrap{position:relative;width:44px;height:44px;flex:none;display:flex;align-items:center;justify-content:center}.${PREFIX}-svg{position:absolute;inset:0;width:44px;height:44px}.${PREFIX}-glyph{position:relative;z-index:1}.${PREFIX}-card-text{flex:1;min-width:0}.${PREFIX}-eyebrow{font-size:10px;font-weight:700;letter-spacing:.1em;color:var(--cream-40);margin:0 0 3px}.${PREFIX}-mode{font-size:15px;font-weight:600;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}.${PREFIX}-meta{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--cream-58);margin-top:4px}.${PREFIX}-dur{font-variant-numeric:tabular-nums;font-weight:500}.${PREFIX}-dot{opacity:.5}
.${PREFIX}-title{font-size:23px;font-weight:600;letter-spacing:-.015em;line-height:1.14;margin:0 0 9px;color:var(--cream);text-wrap:balance}.${PREFIX}-stats{font-size:11px;line-height:1.3;font-weight:400;font-variant-numeric:tabular-nums;color:var(--cream-40);margin:4px 0 0}.${PREFIX}-sub{font-size:14px;line-height:1.55;color:var(--cream-58);margin:0 0 27px;text-wrap:pretty}
.${PREFIX}-apple{width:100%;min-height:54px;border-radius:999px;border:0;cursor:pointer;background:#050505;color:#fff;font-family:inherit;font-size:15px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px;padding:0 20px;transition:transform .18s var(--ease),box-shadow .2s,filter .2s}.${PREFIX}-apple:hover{filter:brightness(1.12);transform:translateY(-1px);box-shadow:0 10px 24px -10px rgba(0,0,0,.6)}.${PREFIX}-apple-logo{font-size:21px;line-height:1}
.${PREFIX}-google{width:100%;min-height:50px;margin-top:9px;border-radius:999px;border:1px solid rgba(255,255,255,.2);cursor:pointer;background:rgba(255,255,255,.08);color:var(--cream);font-family:inherit;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:11px;padding:0 20px;transition:transform .18s var(--ease),background .2s}.${PREFIX}-google:hover{background:rgba(255,255,255,.13);transform:translateY(-1px)}.${PREFIX}-g-logo{width:18px;height:18px;flex:none}
.${PREFIX}-email-wrap{overflow:hidden;max-height:0;opacity:0;transition:max-height .4s var(--ease),opacity .3s var(--ease),margin .4s var(--ease)}.${PREFIX}-email-wrap.open{max-height:140px;opacity:1;margin-top:12px}.${PREFIX}-email-row{display:flex;gap:8px}.${PREFIX}-email-input{flex:1;min-width:0;height:46px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,.05);color:var(--cream);font-family:inherit;font-size:14px;padding:0 18px;outline:none}.${PREFIX}-email-input::placeholder{color:var(--cream-40)}.${PREFIX}-magic{height:46px;border-radius:999px;border:0;cursor:pointer;background:var(--coral);color:#241006;font-family:inherit;font-weight:600;font-size:13.5px;padding:0 16px;white-space:nowrap;display:flex;align-items:center;justify-content:center}.${PREFIX}-magic:disabled{opacity:.55;cursor:default}.${PREFIX}-err{font-size:12px;color:#ff9e7a;text-align:center;margin:10px 0 0}
.${PREFIX}-email-link{display:block;width:100%;text-align:center;background:none;border:0;cursor:pointer;font-family:inherit;font-size:13px;color:var(--cream-58);margin-top:14px;padding:6px 0}.${PREFIX}-email-link:hover{color:var(--cream)}.${PREFIX}-u{position:relative}.${PREFIX}-u::after{content:"";position:absolute;left:50%;right:50%;bottom:-2px;height:1px;background:currentColor;transition:left .25s,right .25s}.${PREFIX}-email-link:hover .${PREFIX}-u::after{left:0;right:0}
.${PREFIX}-success{display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px 0 6px}.${PREFIX}-check-ring{width:58px;height:58px;border-radius:50%;background:#46d39b;display:flex;align-items:center;justify-content:center;color:#241006;box-shadow:0 12px 30px -10px rgba(70,211,155,.45);margin-bottom:18px}.${PREFIX}-success h3{font-size:21px;font-weight:600;color:var(--cream);margin:0 0 9px}.${PREFIX}-success p{font-size:14px;line-height:1.5;color:var(--cream-58);margin:0}.${PREFIX}-success p b{color:var(--cream-80);font-weight:600}.${PREFIX}-spin{animation:${PREFIX}-spin .8s linear infinite}@keyframes ${PREFIX}-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.${PREFIX}-spin{animation:none}}
`;
