"use client";

/**
 * SocialStatsSignInSheet — "Conversion Prompt B (Social + Stats)"
 *
 * A faithful production port of the chosen design direction from Claude Design
 * (claude.ai/design handoff bundle). It reframes *why* to sign up rather than
 * restyling buttons: social proof ("people breathing right now") leads, and the
 * visitor's own week (blurred personal stats) gives a private reason to finish.
 *
 * This is a sibling to {@link SignInSheet}, not a replacement. The live funnel
 * (SessionCompletePrompt -> SignInSheet in Resonance.tsx) is intentionally left
 * untouched. Wiring this in should go through docs/PRODUCT-EXPERIMENTS.md with a
 * baseline + pre-committed success criteria, per the project CLAUDE.md.
 *
 * Honest adaptations from the prototype:
 *  - Google sign-in redirects away (real OAuth), so the in-page "unblur -> You're
 *    in" flourish only fires on the email magic-link path, mirroring the real
 *    sheet's `sent` state.
 *  - Copy is English literals via props. i18n follow-up: route through
 *    runtime-phrases like SignInSheet does (see handoff note).
 *  - Only `yourMinutes` maps to real data (the existing `totalMinutes` prop on
 *    SignInSheet). `liveCount`, `dayStreak`, and the avatars are placeholders to
 *    swap for a real source before shipping.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Lock, Check, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { Sheet, SheetContent } from "@/components/ui/sheet";

function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", name, params);
  }
}

interface SocialStatsSignInSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** Real data: minutes the visitor has logged this week (maps to existing `totalMinutes`). */
  yourMinutes?: number;
  /** Placeholder until a real streak source exists. */
  dayStreak?: number;
  /** Placeholder concurrent-user count. Ticks gently when present. */
  liveCount?: number;
  /** Show the personal stats block. Gate on real data (yourMinutes > 0) so we
   *  never blur a "0". Social proof still leads when this is false. */
  showStats?: boolean;
  /** Copy overrides (i18n follow-up). */
  headline?: string;
  subtitle?: string;
}

const PREFIX = "cps"; // conversion-prompt social

// The 12 per-breathing-style accent colors (src/components/resonance/constants.ts).
// The social-proof avatars draw a random 4 of these on each open so the faces feel
// varied and tie back to the rest of the app's color language.
const ACCENT_COLORS = [
  "#e11d48", "#4f46e5", "#059669", "#0ea5e9", "#f97316", "#10b981",
  "#8b5cf6", "#0891b2", "#f59e0b", "#38bdf8", "#dc2626", "#ea580c",
];

/** Pick `n` distinct accent colors at random (client-only — keep out of render). */
function pickAvatarColors(n: number): string[] {
  const pool = [...ACCENT_COLORS];
  const out: string[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

export function SocialStatsSignInSheet({
  open,
  onOpenChange,
  onSuccess,
  yourMinutes = 37,
  dayStreak = 4,
  liveCount = 1240,
  showStats = true,
  headline = "You're in good company.",
  subtitle = "Thousands are breathing deep, and your own minutes are adding up too. Sign up free to save your journey.",
}: SocialStatsSignInSheetProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailOpen, setEmailOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [count, setCount] = useState(liveCount);
  // Deterministic default keeps SSR/first paint stable; re-randomized on each open below.
  const [avatarColors, setAvatarColors] = useState<string[]>(() => ACCENT_COLORS.slice(0, 4));
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track view once per open.
  useEffect(() => {
    if (open) trackEvent("signin_prompt_view", { variant: "social_stats" });
  }, [open]);

  // Fresh random accent colors each time the sheet opens (decorative, client-only).
  useEffect(() => {
    if (open) setAvatarColors(pickAvatarColors(4));
  }, [open]);

  // Reset to a clean form shortly after the sheet closes.
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setStatus("idle");
      setEmail("");
      setEmailOpen(false);
      setUnlocked(false);
      setCount(liveCount);
    }, 300);
    return () => clearTimeout(t);
  }, [open, liveCount]);

  // Gentle life on the live count, paused for reduced motion and while closed.
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setCount((n) => {
        let next = n + (Math.floor(Math.random() * 9) - 4);
        const lo = liveCount - 60;
        const hi = liveCount + 80;
        if (next < lo) next = lo;
        if (next > hi) next = hi;
        return next;
      });
    }, 3200);
    return () => clearInterval(id);
  }, [open, liveCount]);

  useEffect(() => () => {
    if (swapTimer.current) clearTimeout(swapTimer.current);
  }, []);

  const handleClose = () => onOpenChange(false);

  const handleGoogle = async () => {
    trackEvent("signin_google_clicked", { variant: "social_stats" });
    try {
      // Real OAuth redirects away — the page navigates, so no in-page success here.
      await signIn.social({ provider: "google", callbackURL: "/" });
      onSuccess?.();
    } catch {
      // Google OAuth redirects; errors are rare here.
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "sending") return;
    setStatus("sending");
    trackEvent("signin_magic_link_sent", { variant: "social_stats" });
    try {
      await signIn.magicLink({ email, callbackURL: "/" });
      onSuccess?.();
      // Endowment payoff: reveal the stats that were theirs all along, then
      // resolve to the "check your email" state (matches SignInSheet's `sent`).
      setUnlocked(true);
      swapTimer.current = setTimeout(() => setStatus("sent"), 560);
    } catch {
      setStatus("error");
    }
  };

  const sending = status === "sending";
  const sent = status === "sent";

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="inset-0 flex items-center justify-center border-0 bg-transparent p-4 shadow-none outline-none"
      >
        <style>{CSS}</style>
        <div className={`${PREFIX}-sheet`} role="dialog" aria-label="Create a free account">
          <button className={`${PREFIX}-x`} onClick={handleClose} aria-label="Close">
            <X size={17} />
          </button>

          {sent ? (
            <div className={`${PREFIX}-success`}>
              <div className={`${PREFIX}-ring`}>
                <Check size={26} />
              </div>
              <h3>Check your email</h3>
              <p>
                We sent a link to{" "}
                <b>{email.trim() || "you"}</b>
              </p>
            </div>
          ) : (
            <>
              <div className={`${PREFIX}-live`}>
                <span className={`${PREFIX}-pulse`} aria-hidden="true" />
                <span className={`${PREFIX}-lt`}>
                  <b>{count.toLocaleString()}</b> breathing right now
                </span>
                <span className={`${PREFIX}-avatars`} aria-hidden="true">
                  {avatarColors.map((c, i) => (
                    <span key={`${c}-${i}`} style={{ background: c }} />
                  ))}
                </span>
              </div>

              <h2 className={`${PREFIX}-title`}>{headline}</h2>
              <p className={`${PREFIX}-sub`}>{subtitle}</p>

              {showStats && (
                <div className={`${PREFIX}-stats${unlocked ? " unlocked" : ""}`}>
                  <div className={`${PREFIX}-s`}>
                    <div className={`${PREFIX}-n`}>{yourMinutes}</div>
                    <div className={`${PREFIX}-l`}>Your minutes</div>
                  </div>
                  <div className={`${PREFIX}-s`}>
                    <div className={`${PREFIX}-n`}>{dayStreak}</div>
                    <div className={`${PREFIX}-l`}>Day streak</div>
                  </div>
                  <div className={`${PREFIX}-lock`} aria-hidden="true">
                    <span className={`${PREFIX}-ld`}>
                      <Lock size={14} />
                    </span>
                  </div>
                </div>
              )}

              <button className={`${PREFIX}-google`} onClick={handleGoogle}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
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
                {status === "error" && (
                  <p className={`${PREFIX}-err`}>Something went wrong. Please try again.</p>
                )}
              </div>

              <button
                className={`${PREFIX}-email-link`}
                onClick={() => setEmailOpen((v) => !v)}
                aria-expanded={emailOpen}
              >
                <span className={`${PREFIX}-u`}>or use email</span>
              </button>
              <button className={`${PREFIX}-dismiss`} onClick={handleClose}>
                Not now
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* Bespoke, namespaced styles ported verbatim from the design prototype so the
   look is pixel-faithful (the default semantic tokens don't reproduce the
   frosted-cocoa + coral-glow treatment). Values match the app's dark theme
   family: coral #f6743b ~= --primary, and the glow equals --card-glow. */
const CSS = `
.${PREFIX}-sheet{
  --cream:#fbeede;--cream-80:rgba(251,238,222,0.82);--cream-58:rgba(251,238,222,0.58);
  --cream-40:rgba(251,238,222,0.40);--cream-26:rgba(251,238,222,0.26);
  --coral:#f6743b;--coral-lt:#ff9e7a;--rose:#e11d48;--line:rgba(255,255,255,0.10);
  --ease:cubic-bezier(0.22,1,0.36,1);
  position:relative;width:min(362px,calc(100vw - 32px));
  background:rgba(44,29,20,0.72);
  -webkit-backdrop-filter:blur(28px) saturate(1.2);backdrop-filter:blur(28px) saturate(1.2);
  border:1px solid var(--line);border-radius:30px;color:var(--cream);
  /* extra top room so the close button has its own band and never sits on the live row */
  padding:44px 28px 22px;
  /* Pin Inter (the brand face). The app loads it as --font-sans via next/font
     but does not apply it globally, so inherit alone would fall back to
     system-ui. Children below use font-family:inherit and pick this up. */
  font-family:var(--font-sans),"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  box-shadow:0 36px 90px -20px rgba(0,0,0,0.6),0 0 50px 0 rgba(255,133,158,0.14),inset 0 1px 0 rgba(255,255,255,0.07);
}
.${PREFIX}-x{position:absolute;top:14px;right:16px;width:28px;height:28px;border:none;background:none;color:var(--cream-40);cursor:pointer;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:color .2s,background .2s;}
.${PREFIX}-x:hover{color:var(--cream-80);background:rgba(255,255,255,0.08);}

.${PREFIX}-live{display:flex;align-items:center;gap:9px;padding:0 2px;margin:0 0 18px;}
.${PREFIX}-pulse{width:9px;height:9px;border-radius:50%;background:#46d39b;flex:none;position:relative;animation:${PREFIX}-av-morph 7s ease-in-out infinite;}
.${PREFIX}-pulse::after{content:"";position:absolute;inset:-5px;border-radius:50%;border:1px solid rgba(70,211,155,0.5);animation:${PREFIX}-ping 2.4s var(--ease) infinite;}
.${PREFIX}-lt{font-size:13px;color:var(--cream-80);line-height:1.3;white-space:nowrap;}
.${PREFIX}-lt b{color:var(--cream);font-weight:600;font-variant-numeric:tabular-nums;}
.${PREFIX}-avatars{display:flex;margin-left:auto;}
.${PREFIX}-avatars span{width:26px;height:26px;border-radius:50%;margin-left:-9px;}
.${PREFIX}-avatars span:first-child{margin-left:0;}
/* Avatar colors are a random 4 of the per-breathing-style accents, set inline from
   state on each open (see ACCENT_COLORS). Avatars plop in one at a time, then
   continuously morph through the breathing orb's border-radius shape
   (tailwind.config.ts morph keyframe) so they read as the same design language.
   Entrance animates transform/opacity, morph animates border-radius — different
   properties, so they run concurrently. Two-value animation-delay desyncs them:
   first value is the entrance stagger (clearly sequential), second seeds each
   morph at a different phase so they don't pulse in lockstep. */
.${PREFIX}-avatars span{animation:${PREFIX}-av-in .52s var(--ease) both,${PREFIX}-av-morph 9s ease-in-out infinite;}
.${PREFIX}-avatars span:nth-child(1){animation-delay:0s,0s;}
.${PREFIX}-avatars span:nth-child(2){animation-delay:.12s,-2.5s;animation-duration:.52s,10s;}
.${PREFIX}-avatars span:nth-child(3){animation-delay:.24s,-5s;animation-duration:.52s,8.5s;}
.${PREFIX}-avatars span:nth-child(4){animation-delay:.36s,-7s;animation-duration:.52s,11s;}

.${PREFIX}-title{font-size:23px;font-weight:600;letter-spacing:-0.015em;line-height:1.14;margin:0 0 10px;color:var(--cream);text-wrap:balance;}
.${PREFIX}-sub{font-size:14px;line-height:1.55;color:var(--cream-58);margin:0 0 21px;text-wrap:pretty;}

.${PREFIX}-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--line);position:relative;margin:0 0 20px;}
.${PREFIX}-s{background:#231710;padding:16px 10px;text-align:center;}
.${PREFIX}-n{font-size:25px;font-weight:600;color:var(--cream);filter:blur(7px);font-variant-numeric:tabular-nums;line-height:1;user-select:none;transition:filter .5s var(--ease);}
.${PREFIX}-stats.unlocked .${PREFIX}-n{filter:blur(0);}
.${PREFIX}-l{font-size:10.5px;letter-spacing:0.08em;text-transform:uppercase;color:var(--cream-40);margin-top:7px;font-weight:600;}
.${PREFIX}-lock{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:9px;background:rgba(29,19,13,0.34);transition:opacity .4s var(--ease);}
.${PREFIX}-stats.unlocked .${PREFIX}-lock{opacity:0;pointer-events:none;}
.${PREFIX}-ld{width:32px;height:32px;border-radius:50%;background:rgba(29,19,13,0.9);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--coral-lt);}

.${PREFIX}-google{width:100%;height:50px;border-radius:999px;border:none;cursor:pointer;background:#fff;color:#241a13;font-family:inherit;font-size:14.5px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:11px;transition:transform .18s var(--ease),box-shadow .2s,filter .2s;}
.${PREFIX}-google:hover{filter:brightness(1.04);transform:translateY(-1px);box-shadow:0 10px 24px -10px rgba(0,0,0,0.55);}
.${PREFIX}-google svg{width:18px;height:18px;}

.${PREFIX}-email-wrap{overflow:hidden;max-height:0;opacity:0;transition:max-height .4s var(--ease),opacity .3s var(--ease),margin .4s var(--ease);}
.${PREFIX}-email-wrap.open{max-height:140px;opacity:1;margin-top:12px;}
.${PREFIX}-email-row{display:flex;gap:8px;}
.${PREFIX}-email-input{flex:1;min-width:0;height:46px;border-radius:999px;border:1px solid var(--line);background:rgba(255,255,255,0.05);color:var(--cream);font-family:inherit;font-size:14px;padding:0 18px;outline:none;transition:border-color .2s;}
.${PREFIX}-email-input::placeholder{color:var(--cream-40);}
.${PREFIX}-email-input:focus{border-color:rgba(255,255,255,0.32);}
.${PREFIX}-magic{height:46px;border-radius:999px;border:none;cursor:pointer;background:var(--coral);color:#241006;font-family:inherit;font-weight:600;font-size:13.5px;padding:0 16px;white-space:nowrap;display:flex;align-items:center;justify-content:center;transition:filter .2s,transform .18s var(--ease);}
.${PREFIX}-magic:hover:not(:disabled){filter:brightness(1.05);transform:translateY(-1px);}
.${PREFIX}-magic:disabled{opacity:.55;cursor:default;}
.${PREFIX}-err{font-size:12px;color:#ff9e7a;text-align:center;margin:10px 0 0;}

.${PREFIX}-email-link{display:block;width:100%;text-align:center;background:none;border:none;cursor:pointer;font-family:inherit;font-size:13px;color:var(--cream-58);margin-top:14px;padding:6px 0;transition:color .2s;}
.${PREFIX}-email-link:hover{color:var(--cream);}
.${PREFIX}-u{position:relative;}
.${PREFIX}-u::after{content:"";position:absolute;left:50%;right:50%;bottom:-2px;height:1px;background:currentColor;transition:left .25s,right .25s;}
.${PREFIX}-email-link:hover .${PREFIX}-u::after{left:0;right:0;}
.${PREFIX}-dismiss{display:block;width:100%;text-align:center;background:none;border:none;cursor:pointer;font-family:inherit;font-size:12px;color:var(--cream-26);margin-top:12px;padding:4px 0;transition:color .2s;}
.${PREFIX}-dismiss:hover{color:var(--cream-58);}

.${PREFIX}-success{display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px 0 6px;}
.${PREFIX}-ring{width:58px;height:58px;border-radius:50%;background:#46d39b;display:flex;align-items:center;justify-content:center;color:#241006;box-shadow:0 12px 30px -10px rgba(70,211,155,0.45);margin-bottom:18px;}
.${PREFIX}-success h3{font-size:21px;font-weight:600;letter-spacing:-0.015em;color:var(--cream);margin:0 0 9px;}
.${PREFIX}-success p{font-size:14px;line-height:1.5;color:var(--cream-58);margin:0;}
.${PREFIX}-success p b{color:var(--cream-80);font-weight:600;}

.${PREFIX}-spin{animation:${PREFIX}-spin .8s linear infinite;}
@keyframes ${PREFIX}-ping{0%{transform:scale(0.6);opacity:0.9;}100%{transform:scale(1.8);opacity:0;}}
@keyframes ${PREFIX}-spin{to{transform:rotate(360deg);}}
@keyframes ${PREFIX}-av-in{0%{opacity:0;transform:scale(0);}60%{opacity:1;transform:scale(1.18);}100%{opacity:1;transform:scale(1);}}
@keyframes ${PREFIX}-av-morph{
  0%,100%{border-radius:60% 40% 30% 70% / 60% 30% 70% 40%;}
  25%{border-radius:45% 55% 50% 50% / 55% 45% 55% 45%;}
  50%{border-radius:30% 60% 70% 40% / 50% 60% 30% 60%;}
  75%{border-radius:45% 55% 40% 60% / 40% 60% 40% 60%;}
}
@media (prefers-reduced-motion:reduce){
  .${PREFIX}-pulse{animation:none;border-radius:50%;}
  .${PREFIX}-pulse::after{animation:none;}
  .${PREFIX}-spin{animation:none;}
  .${PREFIX}-avatars span{animation:none;opacity:1;transform:none;border-radius:50%;}
}
`;
