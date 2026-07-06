// Server component: the origin only ever renders English, and this is used
// exclusively inside Server Components (pattern-page, use-case-page). Keeping it
// server-only removes its client chunk from those routes' first-load JS. The
// SSR HTML (English "Last updated" + date) is identical to what the old client
// component produced on the origin; translated pages get the text localized by
// the mass-translate proxy, which reads it straight from this SSR output.

export function LocalizedDate({
  date,
  reviewerName,
}: {
  date: string;
  reviewerName?: string | null;
}) {
  const formatted = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      Last updated: {formatted}
      {reviewerName ? <> • Reviewed by {reviewerName}</> : null}
    </>
  );
}
