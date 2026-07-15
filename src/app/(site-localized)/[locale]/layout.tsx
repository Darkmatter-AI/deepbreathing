import { notFound } from "next/navigation";

import { SiteDocument } from "@/components/layout/site-document";
import { getLocaleByPrefix } from "@/i18n";

import "../../globals.css";

export default function LocalizedRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = getLocaleByPrefix(params.locale);
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
