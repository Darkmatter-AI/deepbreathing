"use client";

/**
 * NonBlockingSignInBanner — PROTOTYPE
 *
 * A non-blocking version of the post-session signup prompt. Instead of a modal
 * sheet that covers the screen (Conversion Prompt C), this anchors to the bottom
 * of the viewport, leaves the breathing orb fully interactive behind it, and
 * tucks itself away the moment the user starts another session (listens to the
 * `resonance:run-state` event the orb already emits).
 *
 * Two layouts: "card" (rich — session card + Google + email) and "pill"
 * (compact one-liner). Same honest loss-aversion framing/copy as Prompt C.
 *
 * NOT wired into the live experiment. It only renders when SessionCompletePrompt
 * sees a `?promptui=card|pill` query param, so the production default (Prompt C)
 * is untouched.
 */

import React, { useEffect, useRef, useState } from "react";
import { X, Check, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";

function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", name, params);
  }
}

export type BannerLayout = "card" | "pill";

interface NonBlockingSignInBannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  sessionMode: string;
  sessionSeconds: number;
  accentColor?: string;
  layout?: BannerLayout;
}

const PREFIX = "nbb"; // non-blocking banner

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function NonBlockingSignInBanner({
  open,
  onOpenChange,
  onSuccess,
  sessionMode,
  sessionSeconds,
  accentColor = "#f6743b",
  layout = "card",
}: NonBlockingSignInBannerProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailOpen, setEmailOpen] = useState(false);
  // Once the orb starts again, the banner tucks away and stays gone for this
  // session — "disappears on play". It is not a dismissal (the user didn't
  // reject it, they kept breathing), so it does NOT fire the dismiss event.
  const [hiddenByPlay, setHiddenByPlay] = useState(false);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setHiddenByPlay(false);
      trackEvent("signin_prompt_view", { variant: "loss_aversion", surface: "banner" });
    }
  }, [open]);

  // Tuck away when the breathing session starts again.
  useEffect(() => {
    const onRun = (e: Event) => {
      const running = (e as CustomEvent).detail?.running;
      if (running) setHiddenByPlay(true);
    };
    window.addEventListener("resonance:run-state", onRun as EventListener);
    return () => window.removeEventListener("resonance:run-state", onRun as EventListener);
  }, []);

  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setStatus("idle");
      setEmail("");
      setEmailOpen(false);
    }, 300);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(
    () => () => {
      if (swapTimer.current) clearTimeout(swapTimer.current);
    },
    []
  );

  const handleClose = () => onOpenChange(false);

  const handleGoogle = async () => {
    trackEvent("signin_google_clicked", { variant: "loss_aversion", surface: "banner" });
    try {
      await signIn.social({ provider: "google", callbackURL: "/" });
      onSuccess?.();
    } catch {
      /* Google OAuth redirects; errors are rare here. */
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    trackEvent("signin_magic_link_sent", { variant: "loss_aversion", surface: "banner" });
    try {
      await signIn.magicLink({ email, callbackURL: "/" });
      onSuccess?.();
      swapTimer.current = setTimeout(() => setStatus("sent"), 300);
    } catch {
      setStatus("error");
    }
  };

  const visible = open && !hiddenByPlay;
  const sending = status === "sending";
  const sent = status === "sent";
  const duration = formatDuration(sessionSeconds);

  const GoogleLogo = (
    <svg viewBox="0 0 24 24" className={`${PREFIX}-g-logo`} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  const SessionCard = (
    <div className={`${PREFIX}-card`}>
      <div className={`${PREFIX}-blob-wrap`}>
        <span className={`${PREFIX}-blob-glow`} style={{ background: accentColor }} aria-hidden="true" />
        <span className={`${PREFIX}-blob`} style={{ background: accentColor }} aria-hidden="true" />
      </div>
      <div className={`${PREFIX}-card-text`}>
        <div className={`${PREFIX}-eyebrow`}>✓ SESSION COMPLETE</div>
        <div className={`${PREFIX}-mode`}>{sessionMode}</div>
        <div className={`${PREFIX}-meta`}>
          <span className={`${PREFIX}-dur`}>{duration}</span>
          <span className={`${PREFIX}-dot`} aria-hidden="true">·</span>
          <span>just now</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${PREFIX}-root ${PREFIX}-${layout}${visible ? " open" : ""}`} aria-hidden={!visible}>
      <style>{CSS}</style>
      <div className={`${PREFIX}-panel`} role="dialog" aria-label="Save your session">
        {layout === "pill" ? (
          <>
            {SessionCard}
            <div className={`${PREFIX}-pill-copy`}>
              <div className={`${PREFIX}-pill-head`}>Keep tonight&apos;s calm</div>
              <div className={`${PREFIX}-pill-sub`}>It only lives on this device</div>
            </div>
            <button className={`${PREFIX}-google ${PREFIX}-google-compact`} onClick={handleGoogle}>
              {GoogleLogo}
              <span>Save it</span>
            </button>
            <button className={`${PREFIX}-x ${PREFIX}-x-pill`} onClick={handleClose} aria-label="Dismiss">
              <X size={16} />
            </button>
          </>
        ) : sent ? (
          <div className={`${PREFIX}-success`}>
            <div className={`${PREFIX}-check-ring`}>
              <Check size={24} />
            </div>
            <h3>Check your email</h3>
            <p>
              We sent a link to <b>{email.trim() || "you"}</b>
            </p>
          </div>
        ) : (
          <>
            <button className={`${PREFIX}-x ${PREFIX}-x-card`} onClick={handleClose} aria-label="Close">
              <X size={16} />
            </button>
            <h2 className={`${PREFIX}-title`}>Save your breathing practice journey</h2>
            {SessionCard}
            <button className={`${PREFIX}-google`} onClick={handleGoogle}>
              {GoogleLogo}
              <span className={`${PREFIX}-g-text`}>
                <span className={`${PREFIX}-g-label`}>Continue with Google</span>
                <span className={`${PREFIX}-g-sub`}>One tap. No password.</span>
              </span>
            </button>

            <div className={`${PREFIX}-email-wrap${emailOpen ? " open" : ""}`}>
              <form className={`${PREFIX}-email-row`} onSubmit={handleMagicLink}>
                <input
                  className={`${PREFIX}-email-input`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  aria-label="Email address"
                  required
                />
                <button className={`${PREFIX}-magic`} type="submit" disabled={sending || !email.trim()}>
                  {sending ? <Loader2 size={15} className={`${PREFIX}-spin`} /> : "Send link"}
                </button>
              </form>
              {status === "error" && <p className={`${PREFIX}-err`}>Something went wrong. Please try again.</p>}
            </div>

            <div className={`${PREFIX}-row2`}>
              <button className={`${PREFIX}-textbtn`} onClick={() => setEmailOpen((v) => !v)} aria-expanded={emailOpen}>
                or save with email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const CSS = `
.${PREFIX}-root{
  --cream:#fbeede;--cream-80:rgba(251,238,222,0.82);--cream-58:rgba(251,238,222,0.58);
  --cream-40:rgba(251,238,222,0.40);--cream-26:rgba(251,238,222,0.26);
  --coral:#f6743b;--line:rgba(255,255,255,0.10);--ease:cubic-bezier(0.22,1,0.36,1);
  position:fixed;left:50%;top:max(14px,env(safe-area-inset-top));z-index:60;
  transform:translate(-50%,-160%);opacity:0;pointer-events:none;
  transition:transform .5s var(--ease),opacity .4s var(--ease);
  font-family:var(--font-sans),"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
}
.${PREFIX}-root.open{transform:translate(-50%,0);opacity:1;pointer-events:auto;}

.${PREFIX}-panel{
  position:relative;background:rgba(44,29,20,0.82);
  -webkit-backdrop-filter:blur(26px) saturate(1.2);backdrop-filter:blur(26px) saturate(1.2);
  border:1px solid var(--line);color:var(--cream);
  box-shadow:0 28px 70px -22px rgba(0,0,0,0.62),0 0 40px 0 rgba(255,133,158,0.10),inset 0 1px 0 rgba(255,255,255,0.06);
}
.${PREFIX}-card-only .${PREFIX}-panel{}

/* layout: card */
.${PREFIX}-card .${PREFIX}-panel{width:min(360px,calc(100vw - 28px));border-radius:24px;padding:16px 16px 15px;}
/* layout: pill */
.${PREFIX}-pill .${PREFIX}-panel{display:flex;align-items:center;gap:13px;width:min(460px,calc(100vw - 24px));border-radius:20px;padding:10px 12px 10px 14px;}

.${PREFIX}-x{position:absolute;border:none;background:none;color:var(--cream-40);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:color .2s,background .2s;}
.${PREFIX}-x:hover{color:var(--cream-80);background:rgba(255,255,255,0.08);}
.${PREFIX}-x-card{top:11px;right:11px;width:28px;height:28px;}
.${PREFIX}-x-pill{position:static;width:26px;height:26px;flex:none;}

.${PREFIX}-card-block{}
.${PREFIX}-card{display:flex;align-items:center;gap:12px;}
.${PREFIX}-card .${PREFIX}-card{}
.${PREFIX}-card-text{flex:1;min-width:0;}
.${PREFIX}-card .${PREFIX}-card{margin-bottom:15px;background:rgba(29,19,13,0.5);border:1px solid var(--line);border-radius:16px;padding:12px 14px;}
.${PREFIX}-pill .${PREFIX}-card{flex:none;}
.${PREFIX}-blob-wrap{position:relative;width:42px;height:42px;flex:none;display:flex;align-items:center;justify-content:center;}
.${PREFIX}-blob-glow{position:absolute;inset:-5px;border-radius:50%;filter:blur(13px);opacity:0.34;}
.${PREFIX}-blob{position:relative;width:42px;height:42px;box-shadow:inset 0 0 14px rgba(255,255,255,0.32);animation:${PREFIX}-morph 20s ease-in-out infinite;}
@keyframes ${PREFIX}-morph{0%{border-radius:60% 40% 30% 70% / 60% 30% 70% 40%;}50%{border-radius:30% 60% 70% 40% / 50% 60% 30% 60%;}100%{border-radius:60% 40% 30% 70% / 60% 30% 70% 40%;}}
.${PREFIX}-eyebrow{font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--cream-40);margin:0 0 2px;}
.${PREFIX}-mode{font-size:13.5px;font-weight:600;color:var(--cream);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.15;}
.${PREFIX}-meta{display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--cream-58);margin-top:3px;}
.${PREFIX}-dur{font-variant-numeric:tabular-nums;font-weight:500;}
.${PREFIX}-dot{opacity:0.5;}

.${PREFIX}-title{font-size:16.5px;font-weight:600;letter-spacing:-0.01em;line-height:1.25;margin:1px 0 13px;padding-right:32px;text-wrap:balance;}

.${PREFIX}-pill-copy{flex:1;min-width:0;}
.${PREFIX}-pill-head{font-size:13.5px;font-weight:600;color:var(--cream);line-height:1.2;}
.${PREFIX}-pill-sub{font-size:11.5px;color:var(--cream-58);margin-top:2px;}

.${PREFIX}-google{width:100%;min-height:48px;border-radius:999px;border:none;cursor:pointer;background:#fff;color:#241a13;font-family:inherit;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:10px;padding:0 18px;transition:transform .18s var(--ease),filter .2s;}
.${PREFIX}-google:hover{filter:brightness(1.04);transform:translateY(-1px);}
.${PREFIX}-google-compact{width:auto;min-height:42px;flex:none;padding:0 16px;font-size:13px;gap:8px;white-space:nowrap;}
.${PREFIX}-g-logo{width:18px;height:18px;flex:none;}
.${PREFIX}-g-text{display:flex;flex-direction:column;align-items:flex-start;}
.${PREFIX}-g-label{font-size:14px;font-weight:600;line-height:1.2;}
.${PREFIX}-g-sub{font-size:11px;font-weight:400;color:#5c4033;line-height:1.2;}

.${PREFIX}-email-wrap{overflow:hidden;max-height:0;opacity:0;transition:max-height .4s var(--ease),opacity .3s var(--ease),margin .4s var(--ease);}
.${PREFIX}-email-wrap.open{max-height:120px;opacity:1;margin-top:11px;}
.${PREFIX}-email-row{display:flex;gap:8px;}
.${PREFIX}-email-input{flex:1;min-width:0;height:44px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,0.05);color:var(--cream);font-family:inherit;font-size:14px;padding:0 16px;outline:none;transition:border-color .2s;}
.${PREFIX}-email-input::placeholder{color:var(--cream-40);}
.${PREFIX}-email-input:focus{border-color:rgba(255,255,255,0.32);}
.${PREFIX}-magic{height:44px;border-radius:999px;border:none;cursor:pointer;background:var(--coral);color:#241006;font-family:inherit;font-weight:600;font-size:13px;padding:0 15px;white-space:nowrap;display:flex;align-items:center;justify-content:center;transition:filter .2s,transform .18s var(--ease);}
.${PREFIX}-magic:hover:not(:disabled){filter:brightness(1.05);transform:translateY(-1px);}
.${PREFIX}-magic:disabled{opacity:.55;cursor:default;}
.${PREFIX}-err{font-size:12px;color:#ff9e7a;text-align:center;margin:9px 0 0;}

.${PREFIX}-row2{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:11px;}
.${PREFIX}-row2-sep{color:var(--cream-26);font-size:12px;}
.${PREFIX}-textbtn{background:none;border:none;cursor:pointer;font-family:inherit;font-size:12.5px;color:var(--cream-58);padding:3px 0;transition:color .2s;}
.${PREFIX}-textbtn:hover{color:var(--cream);}

.${PREFIX}-success{display:flex;flex-direction:column;align-items:center;text-align:center;padding:8px 0 4px;}
.${PREFIX}-check-ring{width:52px;height:52px;border-radius:50%;background:#46d39b;display:flex;align-items:center;justify-content:center;color:#241006;box-shadow:0 12px 30px -10px rgba(70,211,155,0.45);margin-bottom:14px;}
.${PREFIX}-success h3{font-size:19px;font-weight:600;letter-spacing:-0.015em;color:var(--cream);margin:0 0 7px;}
.${PREFIX}-success p{font-size:13.5px;line-height:1.5;color:var(--cream-58);margin:0;}
.${PREFIX}-success p b{color:var(--cream-80);font-weight:600;}

.${PREFIX}-spin{animation:${PREFIX}-spin .8s linear infinite;}
@keyframes ${PREFIX}-spin{to{transform:rotate(360deg);}}
@media (prefers-reduced-motion:reduce){.${PREFIX}-root{transition:opacity .2s;}.${PREFIX}-spin{animation:none;}.${PREFIX}-blob{animation:none;}}
`;
