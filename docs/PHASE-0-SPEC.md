# Phase 0 Spec — Foundation for Agent-Generated Pages

> Four prerequisite tasks that unblock the agent pages MVP (Phase 1).
> Each task is independently shippable and testable.

---

## Task 0.1: Migrate Web Resonance.tsx to `@resonance/engine`

### Problem
The web `Resonance.tsx` imports from local files:
```
src/components/resonance/types.ts      ← duplicate of packages/engine/src/types.ts
src/components/resonance/constants.ts  ← duplicate of packages/engine/src/patterns.ts
```
The mobile app correctly imports from `@resonance/engine`. The web fork will drift when we add custom pattern support in Task 0.2.

### Changes

**1. Update imports in `Resonance.tsx`:**
```diff
- import { BreathingPhase, ModeName, AIRecommendation, ProtocolPhase, ProtocolState } from './types';
- import { BREATHING_PATTERNS, DEFAULT_SPEED_MULTIPLIER, WIM_HOF_PROTOCOL } from './constants';
+ import {
+   BreathingPhase, ModeName, ProtocolPhase, ProtocolState,
+   BREATHING_PATTERNS, DEFAULT_SPEED_MULTIPLIER, WIM_HOF_PROTOCOL,
+   getPhaseVisualState, updatePhase, getPhaseDurationMs, getNextPhase,
+ } from '@resonance/engine';
```

**2. Move web-only types to Resonance.tsx or a thin local file:**
- `AIRecommendation` — not in the engine package, only used by web. Keep in a local `types.ts` that only has web-specific types.
- `SessionStats` — duplicates `UserStats` from `@resonance/domain`. Replace with the domain import.

**3. Replace inline phase logic with engine functions:**
The web component reimplements `getNextPhase` and phase duration calculations inline in its `requestAnimationFrame` loop. Replace with calls to the engine's `updatePhase()` and `getPhaseVisualState()` — matching how the mobile app already works.

**4. Delete the local duplicates:**
- Delete `src/components/resonance/types.ts` (after moving `AIRecommendation` somewhere)
- Delete duplicate pattern/constant definitions from `src/components/resonance/constants.ts`
- Keep `constants.ts` only if it has web-specific constants (e.g., `MODE_LIST`, `VALID_DURATIONS`)

**5. Update `tsconfig.json` paths (if needed):**
The web app already resolves workspace packages via pnpm. Verify `@resonance/engine` resolves correctly in Next.js — it should since the mobile app's Metro already does this. If needed, add to `next.config.js`:
```js
transpilePackages: ['@resonance/engine'],
```

### Tests
- [ ] `pnpm build` succeeds (Next.js compiles without errors)
- [ ] All 12 breathing patterns work identically (manual QA in browser)
- [ ] Wim Hof protocol works (3 rounds, hold/release, completion)
- [ ] Speed multiplier works at 0.5x, 1.0x, 2.0x
- [ ] No visual regressions (circle animation, phase labels, timers)

### Risks
- The web component's inline phase logic may have subtle differences from the engine functions (e.g., edge cases in phase transitions). Test all 12 patterns thoroughly.
- Next.js may need `transpilePackages` config since the engine exports raw TypeScript.

---

## Task 0.2: Add Custom Pattern Support to Engine

### Problem
`BreathingPattern.name` is typed as `ModeName` (an enum of 12 hardcoded strings). Agent-generated sessions need arbitrary phase durations that don't map to any preset.

The engine functions (`updatePhase`, `getPhaseVisualState`) already accept a plain `BreathingPattern` object and don't check the `name` field — they only use the numeric durations. The constraint is in the types, not the logic.

### Changes

**1. In `packages/engine/src/types.ts`:**

```typescript
// Existing: named preset patterns
export interface NamedBreathingPattern {
  name: ModeName;
  description: string;
  inhale: number;
  inhale2?: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  color: string;
}

// New: custom patterns from agents/users
export interface CustomBreathingPattern {
  name: "Custom";
  label: string;          // Agent-provided display name, e.g. "Pre-Interview Calm"
  description: string;
  inhale: number;
  inhale2?: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  color: string;
}

// Union type — engine functions accept either
export type BreathingPattern = NamedBreathingPattern | CustomBreathingPattern;

// Helper type guard
export function isCustomPattern(p: BreathingPattern): p is CustomBreathingPattern {
  return p.name === "Custom";
}
```

**2. Validation function in engine:**

```typescript
export interface PatternValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCustomPattern(input: {
  inhale?: number;
  inhale2?: number;
  holdIn?: number;
  exhale?: number;
  holdOut?: number;
}): PatternValidationResult {
  const errors: string[] = [];
  const { inhale = 0, inhale2 = 0, holdIn = 0, exhale = 0, holdOut = 0 } = input;

  // Must have at least inhale + exhale
  if (inhale <= 0) errors.push("inhale must be > 0");
  if (exhale <= 0) errors.push("exhale must be > 0");

  // Phase duration bounds (seconds)
  const MAX_PHASE = 30; // 30s max per phase — prevents abuse
  const MIN_PHASE = 0.5; // 0.5s minimum for non-zero phases
  for (const [name, val] of Object.entries({ inhale, inhale2, holdIn, exhale, holdOut })) {
    if (val < 0) errors.push(`${name} cannot be negative`);
    if (val > MAX_PHASE) errors.push(`${name} cannot exceed ${MAX_PHASE}s`);
    if (val > 0 && val < MIN_PHASE) errors.push(`${name} must be >= ${MIN_PHASE}s if non-zero`);
  }

  // Total cycle duration bounds
  const totalCycle = inhale + inhale2 + holdIn + exhale + holdOut;
  if (totalCycle < 2) errors.push("total cycle must be >= 2s");
  if (totalCycle > 120) errors.push("total cycle must be <= 120s");

  return { valid: errors.length === 0, errors };
}
```

**3. No changes to engine functions:**
`updatePhase()`, `getPhaseVisualState()`, `getPhaseDurationMs()`, `getNextPhase()` all work with the union type unchanged — they destructure `{ inhale, holdIn, exhale, holdOut }` and never check `name`.

**4. Update `@resonance/domain` session types:**

```diff
// packages/domain/src/sessions.ts

- export type BreathingMode =
-   | "Box Breathing"
-   | "4-7-8 Relax"
-   | ... ;
+ export type BreathingMode =
+   | "Box Breathing"
+   | "4-7-8 Relax"
+   | "Coherent Breathing"
+   | "Physiological Sigh"
+   | "Wim Hof Breathing"
+   | "Pursed Lip Breathing"
+   | "Nadi Shodhana"
+   | "Ujjayi Breathing"
+   | "Belly Breathing"
+   | "Buteyko Breathing"
+   | "Tummo Breathing"
+   | "Breath of Fire"
+   | "Custom";

  export interface SessionEvent {
    id: string;
    userId?: string;
    guestId?: string;
    startedAt: string;
    endedAt: string;
    seconds: number;
    mode: BreathingMode;
    completed: boolean;
    platform: Platform;
+   // For custom patterns — stores the phase config
+   customPattern?: {
+     label: string;
+     inhale: number;
+     inhale2?: number;
+     holdIn: number;
+     exhale: number;
+     holdOut: number;
+   };
+   // Which agent/session page generated this (nullable for direct app usage)
+   sessionPageSlug?: string;
  }
```

### Tests
- [ ] `validateCustomPattern({ inhale: 4, exhale: 6, holdIn: 2, holdOut: 0 })` → valid
- [ ] `validateCustomPattern({ inhale: 0, exhale: 4 })` → invalid (inhale must be > 0)
- [ ] `validateCustomPattern({ inhale: 50, exhale: 4 })` → invalid (exceeds 30s)
- [ ] `validateCustomPattern({ inhale: 0.3, exhale: 1 })` → invalid (below 0.5s min)
- [ ] `updatePhase()` works with a `CustomBreathingPattern` (same behavior as named patterns)
- [ ] `getPhaseVisualState()` works with a `CustomBreathingPattern`
- [ ] `isCustomPattern()` returns true for custom, false for named
- [ ] `pnpm exec tsc --noEmit` passes across all packages

### Risks
- The `BreathingPattern` type rename (`BreathingPattern` → union of `NamedBreathingPattern | CustomBreathingPattern`) will break imports across web and mobile. Both need updating in the same PR. This is why Task 0.1 (web migration to shared engine) must happen first.

---

## Task 0.3: Create `session_events` Table + API Endpoint

### Problem
`SessionEvent` is fully typed in `@resonance/domain` but there's no database table and no API endpoint. Only aggregate `UserStats` are persisted. Agent-generated pages need per-session engagement data for:
- Completion counts displayed on the page (social proof)
- Quality scoring for the tiered indexing gate
- Analytics on which patterns/use-cases agents create most

### Changes

**1. Database migration (`src/lib/db/migrations/002_session_events.sql`):**

```sql
CREATE TABLE IF NOT EXISTS session_events (
  id                TEXT PRIMARY KEY,
  user_id           TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  guest_id          TEXT,
  started_at        TIMESTAMPTZ NOT NULL,
  ended_at          TIMESTAMPTZ NOT NULL,
  seconds           INTEGER NOT NULL,
  mode              TEXT NOT NULL,
  completed         BOOLEAN NOT NULL DEFAULT false,
  platform          TEXT NOT NULL DEFAULT 'web',
  custom_pattern    JSONB,
  session_page_slug TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for page-level aggregation (completion counts per generated page)
CREATE INDEX IF NOT EXISTS idx_session_events_page_slug
  ON session_events(session_page_slug) WHERE session_page_slug IS NOT NULL;

-- Index for user history
CREATE INDEX IF NOT EXISTS idx_session_events_user_id
  ON session_events(user_id) WHERE user_id IS NOT NULL;

-- Index for quality scoring (recent completions per page)
CREATE INDEX IF NOT EXISTS idx_session_events_page_completed
  ON session_events(session_page_slug, completed, created_at)
  WHERE session_page_slug IS NOT NULL AND completed = true;
```

**2. API endpoint (`src/app/api/v1/sync/session-events/route.ts`):**

```typescript
// POST — record a session event
// Body: SessionEvent (from @resonance/domain)
// Auth: optional (guests send guestId, authed users send userId via session)
// Returns: { ok: true, id: string }
```

Validation:
- `seconds` must be > 0 and <= 3600 (1 hour max — prevents abuse)
- `mode` must be a valid `BreathingMode`
- `started_at` must be within last 24 hours (prevents backfilling)
- If `mode === "Custom"`, `custom_pattern` must be present and valid per `validateCustomPattern()`
- Rate limit: 100 events per IP per hour

**3. Aggregation query (for Phase 1 page rendering):**

```sql
-- Get completion stats for a session page
SELECT
  COUNT(*) AS total_sessions,
  COUNT(*) FILTER (WHERE completed) AS completed_sessions,
  AVG(seconds) FILTER (WHERE completed) AS avg_duration_seconds
FROM session_events
WHERE session_page_slug = $1
  AND created_at > now() - interval '90 days';
```

### Tests
- [ ] Migration runs cleanly on a fresh DB (after 001)
- [ ] POST with valid session event → 200 + stored in DB
- [ ] POST with seconds > 3600 → 400
- [ ] POST with invalid mode → 400
- [ ] POST with custom mode but missing custom_pattern → 400
- [ ] Rate limit triggers at 101st request → 429
- [ ] Aggregation query returns correct counts for a given slug
- [ ] Guest sessions (no auth) work with guestId

---

## Task 0.4: Create `breathing_sessions` Table (Agent Page Persistence)

### Problem
Agent-generated pages need persistent storage: slug, pattern config, metadata, quality tier, engagement stats. This table is the backbone of the entire feature.

### Changes

**1. Database migration (`src/lib/db/migrations/003_breathing_sessions.sql`):**

```sql
CREATE TABLE IF NOT EXISTS breathing_sessions (
  -- Identity
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug              TEXT UNIQUE NOT NULL,

  -- Pattern configuration
  mode              TEXT NOT NULL,                    -- ModeName value or "Custom"
  custom_pattern    JSONB,                            -- null for named patterns
  speed_multiplier  REAL NOT NULL DEFAULT 1.0,
  duration_seconds  INTEGER,                          -- target session duration (nullable = infinite)

  -- Page content
  title             TEXT NOT NULL,                    -- "Pre-Interview Calm"
  description       TEXT,                             -- meta description
  guidance          TEXT,                             -- agent's custom guidance text (100+ words for quality gate)
  use_case          TEXT,                             -- "anxiety", "sleep", "focus", etc.
  color             TEXT,                             -- hex color override

  -- Attribution
  creator_type      TEXT NOT NULL DEFAULT 'anonymous', -- 'anonymous' | 'agent' | 'user'
  creator_name      TEXT,                             -- agent/user display name
  creator_id        TEXT,                             -- API key hash or user ID (for future)

  -- Quality & indexing
  quality_tier      TEXT NOT NULL DEFAULT 'probation', -- 'permanent' | 'probation' | 'temporary'
  quality_score     INTEGER,                          -- 0-100, computed periodically
  is_indexed        BOOLEAN NOT NULL DEFAULT false,   -- whether page has <meta name="robots" content="index">
  similarity_hash   TEXT,                             -- hash of (mode + use_case + duration_bucket) for dedup

  -- Engagement (denormalized from session_events for fast page rendering)
  total_sessions    INTEGER NOT NULL DEFAULT 0,
  completed_sessions INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ,                     -- set for temporary sessions (created_at + 30 days)
  promoted_at       TIMESTAMPTZ                      -- when promoted from probation → permanent
);

-- Slug lookup (primary access pattern)
CREATE UNIQUE INDEX IF NOT EXISTS idx_breathing_sessions_slug
  ON breathing_sessions(slug);

-- Similarity dedup check
CREATE INDEX IF NOT EXISTS idx_breathing_sessions_similarity
  ON breathing_sessions(similarity_hash)
  WHERE quality_tier != 'temporary';

-- Quality tier filtering (for sitemap generation)
CREATE INDEX IF NOT EXISTS idx_breathing_sessions_indexed
  ON breathing_sessions(quality_tier, is_indexed)
  WHERE is_indexed = true;

-- Use-case hub pages (list all sessions for a use case)
CREATE INDEX IF NOT EXISTS idx_breathing_sessions_use_case
  ON breathing_sessions(use_case, quality_tier)
  WHERE quality_tier != 'temporary';

-- Cleanup: find expired temporary sessions
CREATE INDEX IF NOT EXISTS idx_breathing_sessions_expires
  ON breathing_sessions(expires_at)
  WHERE expires_at IS NOT NULL AND quality_tier = 'temporary';
```

**2. Slug generation utility (`packages/engine/src/slug.ts`):**

```typescript
/**
 * Generate a URL slug from session metadata.
 * Format: {pattern-shortname}-{use-case}-{duration}
 * Example: "4-7-8-anxiety-relief-5min"
 *
 * Appends a short random suffix to ensure uniqueness.
 */
export function generateSessionSlug(input: {
  mode: string;
  useCase?: string;
  durationSeconds?: number;
  title?: string;
}): string {
  // ... normalize, slugify, append 4-char random suffix
}

/**
 * Generate a similarity hash for near-duplicate detection.
 * Hashes: mode + use_case + duration_bucket (1m, 2m, 3m, 5m, 10m, 15m, 20m)
 */
export function generateSimilarityHash(input: {
  mode: string;
  useCase?: string;
  durationSeconds?: number;
}): string {
  // ... normalize and hash
}
```

**3. Domain types (`packages/domain/src/breathing-session.ts`):**

```typescript
export type QualityTier = "permanent" | "probation" | "temporary";
export type CreatorType = "anonymous" | "agent" | "user";

export interface BreathingSession {
  id: string;
  slug: string;

  // Pattern config
  mode: BreathingMode;
  customPattern?: {
    label: string;
    inhale: number;
    inhale2?: number;
    holdIn: number;
    exhale: number;
    holdOut: number;
  };
  speedMultiplier: number;
  durationSeconds?: number;

  // Page content
  title: string;
  description?: string;
  guidance?: string;
  useCase?: string;
  color?: string;

  // Attribution
  creatorType: CreatorType;
  creatorName?: string;

  // Quality
  qualityTier: QualityTier;
  qualityScore?: number;
  isIndexed: boolean;

  // Engagement (denormalized)
  totalSessions: number;
  completedSessions: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}
```

**4. Quality gate function (`packages/engine/src/quality-gate.ts`):**

```typescript
export interface QualityGateInput {
  mode: string;
  title: string;
  guidance?: string;
  useCase?: string;
  durationSeconds?: number;
  customPattern?: { inhale: number; exhale: number; holdIn: number; holdOut: number };
}

export interface QualityGateResult {
  tier: "probation" | "temporary";
  reasons: string[];  // why it was downgraded (empty for probation)
}

/**
 * Determines initial quality tier for a new breathing session page.
 *
 * Probation (will be indexed, monitored 30 days):
 *   - Has a title
 *   - Has a use_case tag
 *   - Has guidance text >= 100 words
 *   - Has a valid duration
 *   - If custom pattern: passes validateCustomPattern()
 *
 * Temporary (noindex, expires in 30 days):
 *   - Fails any of the above checks
 *   - Still functional for the user — just not persisted for SEO
 */
export function evaluateQualityGate(input: QualityGateInput): QualityGateResult {
  const reasons: string[] = [];

  if (!input.title || input.title.trim().length < 3) {
    reasons.push("title is required (min 3 characters)");
  }

  if (!input.useCase || input.useCase.trim().length === 0) {
    reasons.push("use_case tag is required");
  }

  const wordCount = (input.guidance || "").trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 100) {
    reasons.push(`guidance must be >= 100 words (got ${wordCount})`);
  }

  if (input.customPattern) {
    const validation = validateCustomPattern(input.customPattern);
    if (!validation.valid) {
      reasons.push(...validation.errors.map(e => `custom pattern: ${e}`));
    }
  }

  return {
    tier: reasons.length === 0 ? "probation" : "temporary",
    reasons,
  };
}
```

### Tests
- [ ] Migration runs cleanly
- [ ] `generateSessionSlug({ mode: "4-7-8 Relax", useCase: "anxiety", durationSeconds: 300 })` → `"4-7-8-anxiety-5min-xxxx"`
- [ ] `generateSimilarityHash()` produces same hash for same inputs
- [ ] `evaluateQualityGate()` returns "probation" for complete input
- [ ] `evaluateQualityGate()` returns "temporary" with reasons for missing guidance
- [ ] `evaluateQualityGate()` returns "temporary" for <100 word guidance
- [ ] `evaluateQualityGate()` returns "temporary" for invalid custom pattern
- [ ] Slug uniqueness constraint prevents duplicates at DB level
- [ ] Similarity hash index works for dedup queries

---

## Task Dependency Graph

```
Task 0.1 (migrate web to shared engine)
    ↓
Task 0.2 (custom pattern support)
    ↓
Task 0.3 (session_events table)    ← can start in parallel with 0.2
    ↓
Task 0.4 (breathing_sessions table) ← depends on types from 0.2
    ↓
Phase 1 (agent pages MVP)
```

## Definition of Done (Phase 0)

- [ ] Web `Resonance.tsx` imports everything from `@resonance/engine` — no local type/pattern duplicates
- [ ] Engine supports `CustomBreathingPattern` with validation
- [ ] `session_events` table exists with API endpoint, rate-limited, recording events
- [ ] `breathing_sessions` table exists with slug generation, similarity hashing, quality gate
- [ ] `pnpm build` passes
- [ ] `pnpm exec tsc --noEmit` passes across all packages
- [ ] All 12 breathing patterns work on web (manual QA)
- [ ] Mobile app still builds (`cd apps/resonance-mobile-app && npx expo export --platform web`)
