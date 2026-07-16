import type { Metadata } from "next";
import "../globals.css";
import { SiteDocument } from "@/components/layout/site-document";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const defaultOgImage = createOgImagePath("Free Breathing Visualizer: Calm Anxiety in 60 Seconds");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Free Breathing Visualizer: Calm Anxiety in 60 Seconds",
    template: "%s | Deep Breathing Exercises"
  },
  description:
    "Calm anxiety in 60 seconds with our free breathing visualizer. Box breathing, 4-7-8, physiological sigh—all free, no signup. Used by 10,000+ people. Try now.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    other: [
      {
        rel: "android-chrome-192x192",
        url: "/android-chrome-192x192.png"
      },
      {
        rel: "android-chrome-512x512",
        url: "/android-chrome-512x512.png"
      }
    ]
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Free Breathing Visualizer: Calm Anxiety in 60 Seconds",
    description:
      "Calm anxiety in 60 seconds with our free breathing visualizer. Box breathing, 4-7-8, physiological sigh. No signup required.",
    type: "website",
    url: siteUrl,
    siteName: "Deep Breathing Exercises",
    images: [
      {
        url: defaultOgImage,
        width: 1200,
        height: 630,
        alt: "Interactive breathing orb expanding against a coral gradient"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Breathing Visualizer: Calm Anxiety in 60 Seconds",
    description:
      "Calm anxiety in 60 seconds with our free breathing visualizer. Box breathing, 4-7-8, physiological sigh. Try now—no signup.",
    creator: "@abiassi_",
    images: [defaultOgImage]
  },
  alternates: {
    canonical: siteUrl
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument htmlLang="en">{children}</SiteDocument>;
}
