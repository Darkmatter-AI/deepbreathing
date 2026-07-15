import type { LocaleCode } from "@/i18n";

// This stays a Server Component so locale-aware date formatting and labels do
// not add any client JavaScript. The optional values preserve the current
// English output for routes that have not moved to native rendering yet.

export function LocalizedDate({
  date,
  lastUpdatedLabel = "Last updated",
  locale = "en-US",
  reviewedByLabel = "Reviewed by",
  reviewerName,
}: {
  date: string;
  lastUpdatedLabel?: string;
  locale?: LocaleCode;
  reviewedByLabel?: string;
  reviewerName?: string | null;
}) {
  const formatted = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));

  return (
    <>
      {lastUpdatedLabel}: {formatted}
      {reviewerName ? <> • {reviewedByLabel} {reviewerName}</> : null}
    </>
  );
}
