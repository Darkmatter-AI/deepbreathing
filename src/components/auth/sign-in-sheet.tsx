"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, Mail, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  createRuntimePhraseResolver,
  detectRuntimeLocale,
  RuntimePhraseKey,
} from "@/components/resonance/runtime-phrases";

function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", name, params);
  }
}

interface SignInSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  headline?: string;
  subtitle?: string;
  totalMinutes?: number;
}

export function SignInSheet({
  open,
  onOpenChange,
  onSuccess,
  headline,
  subtitle,
  totalMinutes,
}: SignInSheetProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [locale, setLocale] = useState("en");

  useEffect(() => {
    setLocale(detectRuntimeLocale());
  }, [open]);

  const phrases = useMemo(() => createRuntimePhraseResolver(locale), [locale]);
  const t = (key: RuntimePhraseKey, vars?: Record<string, string | number>) =>
    phrases.resolve(key, vars).text;

  const resolvedHeadline = headline ?? t("auth.save_progress");
  const resolvedSubtitle = subtitle ?? t("auth.sync_subtitle");

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("sending");
    trackEvent("signin_magic_link_sent", {});
    try {
      await signIn.magicLink({ email, callbackURL: "/" });
      setStatus("sent");
      onSuccess?.();
    } catch {
      setStatus("error");
    }
  };

  const handleGoogle = async () => {
    trackEvent("signin_google_clicked", {});
    try {
      await signIn.social({ provider: "google", callbackURL: "/" });
      onSuccess?.();
    } catch {
      // Google OAuth redirects — errors are rare here
    }
  };

  const handleApple = async () => {
    trackEvent("signin_apple_clicked", {});
    try {
      await signIn.social({ provider: "apple", callbackURL: "/" });
      onSuccess?.();
    } catch {
      // Apple OAuth redirects — errors are shown by the callback.
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStatus("idle");
      setEmail("");
    }, 300);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="inset-0 flex items-center justify-center border-0 bg-transparent p-4 shadow-none outline-none"
      >
        <div className="w-full max-w-md rounded-[28px] border border-border/70 bg-background/95 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.25)] backdrop-blur-2xl">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-card-foreground">
                {resolvedHeadline}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{resolvedSubtitle}</p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-card-foreground"
            >
              <X size={18} />
            </button>
          </div>

          {totalMinutes != null && totalMinutes > 0 && (
            <div className="mb-4 rounded-2xl bg-card/70 p-3 text-center shadow-inner dark:bg-card/30">
              <p className="text-2xl font-semibold tabular-nums text-card-foreground">
                {t("auth.total_minutes", { n: totalMinutes })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("auth.of_breathing_logged")}
              </p>
            </div>
          )}

          {status === "sent" ? (
            <div className="rounded-2xl bg-card/70 p-5 text-center shadow-inner dark:bg-card/30">
              <Mail className="mx-auto mb-2 text-primary" size={28} />
              <p className="font-semibold text-card-foreground">
                {t("auth.check_email")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("auth.sent_link_to")}{" "}
                <span className="font-medium text-card-foreground">
                  {email}
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleApple}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                <span className="text-xl leading-none" aria-hidden="true"></span>
                Continue with Apple
              </button>
              <button
                onClick={handleGoogle}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-medium text-card-foreground shadow-sm transition-colors hover:bg-card/80 dark:border-border/40"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {t("auth.continue_google")}
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-xs text-muted-foreground">{t("auth.or")}</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              <form onSubmit={handleMagicLink} className="space-y-2.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.enter_email")}
                  required
                  className="w-full rounded-xl border border-border/60 bg-card/50 px-4 py-3 text-sm text-card-foreground placeholder:text-muted-foreground/60 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30 dark:border-border/40"
                />
                <button
                  type="submit"
                  disabled={status === "sending" || !email.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {status === "sending" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {t("auth.sending_link")}
                    </>
                  ) : (
                    t("auth.send_magic_link")
                  )}
                </button>
              </form>

              {status === "error" && (
                <p className="text-center text-xs text-destructive">
                  {t("auth.something_went_wrong")}
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleClose}
            className="mt-4 w-full text-center text-sm text-muted-foreground transition-colors hover:text-card-foreground"
          >
            {t("auth.not_now")}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
