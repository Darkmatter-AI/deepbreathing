import type { Metadata } from "next";

import { EmbedGenerator } from "./embed-generator";
import { createOgImagePath } from "@/lib/seo/og-image";

const siteUrl = "https://deepbreathingexercises.com";
const title = "Embed a Breathing Exercise on Your Website — Free Widget";
const description =
  "Add a free interactive breathing exercise widget to your website. Choose from 12 patterns including box breathing, 4-7-8, and coherent breathing. Copy the embed code and paste it into your HTML.";
const ogImage = createOgImagePath("Free Breathing Widget", {
  subtitle: "Add an interactive breathing exercise to any website",
});

export const metadata: Metadata = {
  title,
  description,
  robots: { index: true, follow: true },
  alternates: { canonical: `${siteUrl}/embed` },
  openGraph: {
    type: "website",
    url: `${siteUrl}/embed`,
    title,
    description,
    images: [{ url: ogImage, width: 1200, height: 630, alt: "Free breathing exercise embed widget" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export default function EmbedLandingPage() {
  return <EmbedGenerator />;
}
