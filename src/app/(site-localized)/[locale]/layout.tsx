import { notFound } from "next/navigation";

import { SiteDocument } from "@/components/layout/site-document";
import { getLocaleByPrefix } from "@/i18n";

import "../../globals.css";

export default async function LocalizedRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = getLocaleByPrefix((await params).locale);
  if (!locale || !locale.routePrefix) notFound();

  return (
    <SiteDocument
      direction={locale.direction}
      disableSeasonalBanner
      htmlLang={locale.htmlLang}
    >
      {children}
    </SiteDocument>
  );
}
