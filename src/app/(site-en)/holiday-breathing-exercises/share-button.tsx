"use client";

import { useState } from "react";

import { appendShareUtm } from "@/lib/share-utm";

export interface HolidayShareButtonProps {
  url: string;
  title: string;
  text: string;
  buttonText: string;
  copiedText: string;
}

export function HolidayShareButton({
  url,
  title,
  text,
  buttonText,
  copiedText,
}: HolidayShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const markCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: appendShareUtm(url, "native"),
        });
        return;
      } catch {}
    }

    const copyValue = `${text} ${appendShareUtm(url, "copy")}`;
    try {
      await navigator.clipboard.writeText(copyValue);
      markCopied();
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = copyValue;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      markCopied();
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800/80 px-6 py-3 text-sm font-medium text-slate-200 transition-all hover:bg-slate-700 hover:border-slate-500"
    >
      {copied ? (
        <>
          <CheckIcon className="h-4 w-4" />
          {copiedText}
        </>
      ) : (
        <>
          <ShareIcon className="h-4 w-4" />
          {buttonText}
        </>
      )}
    </button>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  );
}
