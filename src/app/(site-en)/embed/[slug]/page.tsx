import { notFound } from "next/navigation";

import { breathingPageMap } from "@/data/breathing-pages";
import sourceContent from "@/i18n/content/bespoke/embed/source.json";
import type { EmbedContent } from "@/i18n/content/bespoke/embed/types";
import {
  VALID_EMBED_SLUGS,
  type EmbedSlug,
} from "@/i18n/content/bespoke/embed/types";

import {
  createEmbedPlayerMetadata,
  EmbedPlayer,
  type EmbedPlayerSearchParams,
} from "./embed-player";

const embedContent = sourceContent as EmbedContent;
const validSlugs = new Set<string>(VALID_EMBED_SLUGS);

export function generateStaticParams() {
  return VALID_EMBED_SLUGS.map((slug) => ({ slug }));
}

function getPage(slug: string) {
  if (!validSlugs.has(slug)) notFound();
  const page = breathingPageMap[slug as EmbedSlug];
  if (!page) notFound();
  return page;
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const metadata = createEmbedPlayerMetadata(
    getPage(params.slug),
    embedContent.player.embedLabel,
  );
  return {
    ...metadata,
    // Keep the route-level crawler contract explicit for inventory tooling and review.
    robots: { index: false, follow: false },
  };
}

export default function EmbedPageRoute({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: EmbedPlayerSearchParams;
}) {
  return (
    <EmbedPlayer
      content={getPage(params.slug)}
      playerContent={embedContent.player}
      searchParams={searchParams}
    />
  );
}
