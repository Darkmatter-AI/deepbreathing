// Dev-only OG image gallery. Renders every /og/[slug] variant plus a few
// custom-color examples in a grid so you can eyeball the brand consistency
// without clicking through 12 tabs. Not linked from anywhere — visit
// /og-preview directly.

const slugs = [
  'box',
  '4-7-8',
  'coherent',
  'physiological-sigh',
  'pursed-lip',
  'ujjayi',
  'belly',
  'nadi-shodhana',
  'buteyko',
  'tummo',
  'wim-hof',
  'breath-of-fire',
];

const customExamples = [
  { title: 'Deep Breathing Exercises', subtitle: 'deepbreathingexercises.com' },
  { title: 'Free Online Box Breathing Timer', subtitle: 'deepbreathingexercises.com' },
  { title: 'Breathing Technique for Panic Attack', subtitle: 'Stop panic in 30 seconds' },
  { title: '2 Minute Breathing Exercise', subtitle: 'Quick reset' },
];

function buildOgUrl(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  return `/og?${q}`;
}

export const metadata = {
  title: 'OG Preview',
  robots: { index: false, follow: false },
};

export default function OgPreviewPage() {
  return (
    <main style={{ padding: '32px', background: '#fafafa', minHeight: '100vh' }}>
      <h1 style={{ fontFamily: 'system-ui', fontSize: 24, marginBottom: 8 }}>OG image gallery</h1>
      <p style={{ fontFamily: 'system-ui', fontSize: 14, color: '#666', marginBottom: 32 }}>
        Each card shows what social platforms render when a URL is shared.
      </p>

      <h2 style={{ fontFamily: 'system-ui', fontSize: 18, marginBottom: 16 }}>By pattern slug</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 48 }}>
        {slugs.map((slug) => (
          <div key={slug} style={{ background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontFamily: 'system-ui', fontSize: 13, color: '#444', marginBottom: 8 }}>/og/{slug}</div>
            <img
              src={`/og/${slug}?cb=${Date.now()}`}
              alt={`OG for ${slug}`}
              style={{ width: '100%', display: 'block', borderRadius: 4 }}
            />
          </div>
        ))}
      </div>

      <h2 style={{ fontFamily: 'system-ui', fontSize: 18, marginBottom: 16 }}>Custom title/subtitle (homepage variants)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {customExamples.map((ex, i) => {
          const url = buildOgUrl({ title: ex.title, subtitle: ex.subtitle });
          return (
            <div key={i} style={{ background: 'white', padding: 12, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <div style={{ fontFamily: 'system-ui', fontSize: 13, color: '#444', marginBottom: 8 }}>
                {ex.title}
              </div>
              <img
                src={`${url}&cb=${Date.now()}`}
                alt={ex.title}
                style={{ width: '100%', display: 'block', borderRadius: 4 }}
              />
            </div>
          );
        })}
      </div>
    </main>
  );
}
