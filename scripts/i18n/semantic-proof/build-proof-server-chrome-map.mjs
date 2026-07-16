#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { stableJson } from "../audit-structured-i18n-mapping.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const outputPath = join(repoRoot, "src/i18n/content/proof/server-chrome-map.json");

const shared = [
  ["chrome.shared.brand-eyebrow", "DEEP BREATHING EXERCISES"],
  ["chrome.shared.breadcrumb-home", "Home"],
  ["chrome.shared.date-last-updated", "Last updated"],
  ["chrome.shared.date-reviewed-by", "Reviewed by"],
  ["chrome.shared.quick-sessions", "Quick sessions"],
  ["chrome.shared.quick-sessions-description", "Short on time? Try a timed session:"],
  ["chrome.shared.one-minute", "1 minute"],
  ["chrome.shared.two-minutes", "2 minutes"],
  ["chrome.shared.five-minutes", "5 minutes"],
  ["chrome.shared.share-exercise", "Share this exercise"],
  ["chrome.shared.safety-warning", "Stop if dizzy, tingly, or chest-tight. Resume later with shorter, easier breaths."],
  ["chrome.shared.footer-techniques", "Techniques"],
  ["chrome.shared.footer-guides", "Guides"],
  ["chrome.shared.footer-app", "App"],
  ["chrome.shared.footer-about", "About"],
  ["chrome.shared.footer-about-abi", "About Abi"],
  ["chrome.shared.footer-embed", "Embed"],
  ["chrome.shared.footer-privacy", "Privacy"],
];

const pattern = [
  ["chrome.pattern.og-alt", "Buteyko Breathing: Light, Nasal Breathing Method – Interactive breathing visualizer"],
  ["chrome.pattern.breadcrumb-techniques", "Breathing Techniques"],
  ["chrome.pattern.hero-share-text", "Try this guided buteyko breathing: light, nasal breathing method exercise — it really helps."],
  ["chrome.pattern.technique-overview", "Technique overview"],
  ["chrome.pattern.benefit", "Benefit"],
  ["chrome.pattern.step-by-step", "Step-by-step"],
  ["chrome.pattern.how-to-practice", "How to practice"],
  ["chrome.pattern.how-to-description", "Structured walkthrough pulled from the editorial brief."],
  ["chrome.pattern.total-time", "Total time"],
  ["chrome.pattern.difficulty", "Difficulty"],
  ["chrome.pattern.tools", "Tools"],
  ["chrome.pattern.supplies", "Supplies"],
  ["chrome.pattern.use-cases", "Use cases"],
  ["chrome.pattern.where-it-fits", "Where it fits"],
  ["chrome.pattern.use-cases-description", "Situations where this breathing cadence excels."],
  ["chrome.pattern.suggested-frequency", "Suggested frequency"],
  ["chrome.pattern.practice-notes", "Practice notes"],
  ["chrome.pattern.keep-it-gentle", "Keep it gentle"],
  ["chrome.pattern.practice-notes-description", "Helpful reminders so the pattern stays sustainable day after day."],
  ["chrome.pattern.faq", "FAQ"],
  ["chrome.pattern.common-questions", "Common questions"],
  ["chrome.pattern.faq-description", "Evidence-backed answers we hear from practitioners most often."],
  ["chrome.pattern.research-safety", "Research & safety"],
  ["chrome.pattern.what-evidence-says", "What evidence says"],
  ["chrome.pattern.research-description", "Peer-reviewed highlights and guardrails pulled from the content brief."],
  ["chrome.pattern.study-highlights", "Study highlights"],
  ["chrome.pattern.safety-notes", "Safety notes"],
  ["chrome.pattern.related-techniques", "Related techniques"],
  ["chrome.pattern.related-use-cases", "Use case guides"],
  ["chrome.pattern.related-patterns", "Related patterns"],
  ["chrome.pattern.practice-action", "Practice →"],
  ["chrome.pattern.learn-more-action", "Learn more →"],
  ["chrome.pattern.related-pursed-lip-title", "Pursed Lip Breathing Technique"],
  ["chrome.pattern.related-coherent-title", "Coherent Breathing Trainer"],
  ["chrome.pattern.related-belly-title", "Belly Breathing: Diaphragmatic Breathing Exercises"],
  ["chrome.pattern.related-physiological-sigh-title", "Physiological Sigh: Instant Stress Relief"],
  ["chrome.pattern.share-technique", "Share this technique"],
  ["chrome.pattern.share-section-text", "Know someone who could benefit from buteyko breathing: light, nasal breathing method? Send them a direct link."],
];

const useCase = [
  ["chrome.use-case.breadcrumb-use-cases", "Use Cases"],
  ["chrome.use-case.hero-share-text", "Try this guided breathing exercise for how to stop anxiety in 60 seconds with box breathing."],
  ["chrome.use-case.share-with-someone", "Share with someone"],
  ["chrome.use-case.important", "Important"],
  ["chrome.use-case.problem", "The Problem"],
  ["chrome.use-case.common-symptoms", "Common symptoms"],
  ["chrome.use-case.solution", "The Solution"],
  ["chrome.use-case.why-this-technique", "Why this technique"],
  ["chrome.use-case.start-practicing", "Start practicing now →"],
  ["chrome.use-case.learn-box-breathing", "Learn more about Box Breathing →"],
  ["chrome.use-case.box-breathing-name", "Box Breathing"],
  ["chrome.use-case.why-it-works", "Why It Works"],
  ["chrome.use-case.step-by-step", "Step-by-Step"],
  ["chrome.use-case.how-to-practice", "How to Practice"],
  ["chrome.use-case.pro-tips", "Pro tips"],
  ["chrome.use-case.research-references", "Research & References"],
  ["chrome.use-case.scientific-sources", "Scientific Sources"],
  ["chrome.use-case.faq", "FAQ"],
  ["chrome.use-case.common-questions", "Common Questions"],
  ["chrome.use-case.more-guides", "More Breathing Guides"],
  ["chrome.use-case.learn-more-action", "Learn more →"],
  ["chrome.use-case.related-panic-title", "How to Stop a Panic Attack in 30 Seconds"],
  ["chrome.use-case.related-public-speaking-title", "Breathing Exercises for Public Speaking"],
  ["chrome.use-case.related-holiday-title", "How to Handle Holiday Stress in 30 Seconds"],
  ["chrome.use-case.related-travel-title", "Breathing Exercises for Travel Anxiety"],
  ["chrome.use-case.related-kids-title", "Deep Breathing Exercises for Kids"],
  ["chrome.use-case.related-huberman-title", "Huberman Lab Breathing Protocols"],
  ["chrome.use-case.in-depth-guides", "In-Depth Guides"],
  ["chrome.use-case.read-guide-action", "Read guide →"],
  ["chrome.use-case.ready-to-practice", "Ready to practice?"],
  ["chrome.use-case.start-session", "Start Your Session"],
  ["chrome.use-case.visualizer-description", "Use the interactive visualizer above to guide your breathing. Follow the animation and let your body relax."],
  ["chrome.use-case.go-to-visualizer", "Go to visualizer →"],
  ["chrome.use-case.try-box-app", "Try the dedicated Box Breathing App →"],
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function messages(entries) {
  return [...shared, ...entries].map(([messageId, sourceText]) => ({
    messageId,
    reviewedSourceHash: sha256(sourceText),
    sourceText,
  }));
}

const sourceMap = {
  routes: [
    {
      messages: messages(pattern),
      routeId: "breathe.buteyko",
      sourceRoute: "/breathe/buteyko",
    },
    {
      messages: messages(useCase),
      routeId: "for.anxiety",
      sourceRoute: "/for/anxiety",
    },
  ],
  schemaVersion: 1,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, stableJson(sourceMap));
console.log(JSON.stringify({ messages: sourceMap.routes.map((route) => route.messages.length), outputPath }));
