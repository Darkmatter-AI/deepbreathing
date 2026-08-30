import type { Metadata } from "next";

import { AgentHandoffLandingTracker } from "@/components/analytics/AgentHandoffLandingTracker";
import { AGENT_RECOMMENDATIONS } from "@/data/agent-recommendations";
import {
  buildAgentReferralHref,
  type AgentReferralSearchParams,
} from "@/lib/agent-referral";

export const metadata: Metadata = {
  title: "Choose a breathing exercise",
  description: "A short guide to choosing a free breathing exercise for the moment you are in.",
  alternates: {
    canonical: "/recommend",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default async function RecommendPage({
  searchParams,
}: {
  searchParams: Promise<AgentReferralSearchParams>;
}) {
  const referralSearchParams = await searchParams;

  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6">
      <AgentHandoffLandingTracker />
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Free guided breathing
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Choose a breathing exercise for this moment
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Every exercise runs in your browser. No account or installation is required.
          Choose a comfortable pace and stop if you feel dizzy, short of breath, or unwell.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {AGENT_RECOMMENDATIONS.map((recommendation) => (
            <article
              key={recommendation.intent}
              className="rounded-3xl border border-border bg-card p-6 text-card-foreground"
            >
              <p className="text-sm font-medium text-muted-foreground">
                {recommendation.situation}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{recommendation.exercise}</h2>
              <p className="mt-3 text-sm">Practice for {recommendation.duration}.</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {recommendation.safetyNote}
              </p>
              <a
                href={buildAgentReferralHref(recommendation.path, referralSearchParams)}
                className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Start {recommendation.exercise}
              </a>
            </article>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          These exercises support general wellbeing and are not medical treatment. If breathing
          feels difficult, symptoms are severe, or you may need urgent care, seek qualified medical help.
        </p>
      </div>
    </main>
  );
}
