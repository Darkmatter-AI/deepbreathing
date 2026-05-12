'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { appendShareUtm } from '@/lib/share-utm';

interface ShareButtonProps {
  url: string;
  title: string;
  text: string;
  buttonText?: string;
  size?: 'default' | 'large';
  variant?: 'default' | 'accent';
  accentColor?: string;
  embedSlug?: string;
}

const EMBED_BASE = 'https://deepbreathingexercises.com/embed';

function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(value);
  }
  // Fallback for older browsers
  const ta = document.createElement('textarea');
  ta.value = value;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  return Promise.resolve();
}

export function ShareButton({
  url,
  title,
  text,
  buttonText = "Share this exercise",
  size = 'default',
  variant = 'default',
  accentColor,
  embedSlug,
}: ShareButtonProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout>>();

  const embedSnippet = embedSlug
    ? `<iframe src="${EMBED_BASE}/${embedSlug}" width="100%" height="500" frameborder="0" allow="autoplay" style="border-radius:16px;"></iframe>`
    : null;

  const close = useCallback(() => {
    setPopoverOpen(false);
    setUrlCopied(false);
    setEmbedCopied(false);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
  }, []);

  // Click outside to close
  useEffect(() => {
    if (!popoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popoverOpen, close]);

  // Auto-dismiss after 8s
  useEffect(() => {
    if (!popoverOpen) return;
    dismissTimer.current = setTimeout(close, 8000);
    return () => { if (dismissTimer.current) clearTimeout(dismissTimer.current); };
  }, [popoverOpen, close]);

  const handleShare = async () => {
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: appendShareUtm(url, 'native') });
        return;
      } catch {
        // User cancelled or share failed, fall through to popover
      }
    }

    // Auto-copy URL to clipboard and open popover
    try {
      await copyToClipboard(appendShareUtm(url, 'copy'));
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch {
      // Clipboard failed, popover still opens so user can manually copy
    }
    setPopoverOpen(true);
  };

  const handleCopyUrl = async () => {
    await copyToClipboard(appendShareUtm(url, 'copy'));
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  const handleCopyEmbed = async () => {
    if (!embedSnippet) return;
    await copyToClipboard(embedSnippet);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const sizeClasses = size === 'large'
    ? 'px-8 py-4 text-base font-semibold'
    : 'px-5 py-2.5 text-sm font-medium';

  const variantClasses = variant === 'accent' && accentColor
    ? ''
    : 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/50';

  const accentStyles = variant === 'accent' && accentColor
    ? {
        borderColor: `${accentColor}40`,
        backgroundColor: `${accentColor}15`,
        color: accentColor,
      }
    : undefined;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={handleShare}
        className={`inline-flex items-center gap-2 rounded-full border transition-all ${sizeClasses} ${variantClasses}`}
        style={accentStyles}
      >
        <ShareIcon className="h-4 w-4" />
        {buttonText}
      </button>

      {popoverOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-border/60 bg-card shadow-lg backdrop-blur-md overflow-hidden">
          {/* URL row */}
          <div className="p-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">Link</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={appendShareUtm(url, 'copy')}
                className="flex-1 min-w-0 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs text-card-foreground select-all outline-none focus:border-primary/50"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyUrl}
                className="shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-card-foreground hover:bg-muted transition-colors"
              >
                {urlCopied ? (
                  <span className="flex items-center gap-1 text-primary">
                    <CheckIcon className="h-3 w-3" /> Copied
                  </span>
                ) : 'Copy'}
              </button>
            </div>
          </div>

          {/* Embed row */}
          {embedSnippet && (
            <div className="border-t border-border/40 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CodeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Embed on your site</p>
                </div>
                <button
                  onClick={handleCopyEmbed}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-card-foreground hover:bg-muted transition-colors"
                >
                  {embedCopied ? (
                    <span className="flex items-center gap-1 text-primary">
                      <CheckIcon className="h-3 w-3" /> Copied
                    </span>
                  ) : 'Copy snippet'}
                </button>
              </div>
              <pre className="mt-1.5 rounded-lg bg-muted/50 px-2.5 py-1.5 text-[10px] text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                {embedSnippet}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
    </svg>
  );
}
