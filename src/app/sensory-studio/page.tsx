import type { Metadata } from "next";

import SensoryStudio from "./sensory-studio";

export const metadata: Metadata = {
  title: "Sensory Studio | Deep Breathing",
  description: "An internal workspace for composing Deep Breathing sensory profiles.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function SensoryStudioPage() {
  return <SensoryStudio />;
}
