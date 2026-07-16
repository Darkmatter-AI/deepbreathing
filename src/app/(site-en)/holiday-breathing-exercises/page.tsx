import type { Metadata } from "next";

import holidayContent from "@/i18n/content/bespoke/holiday-breathing/source.json";
import type { HolidayBreathingContent } from "@/i18n/content/bespoke/holiday-breathing/types";

import {
  createHolidayMetadataFromContent,
  HolidayBreathingPage,
} from "./holiday-breathing-page";

const content = holidayContent as HolidayBreathingContent;

export const metadata: Metadata = createHolidayMetadataFromContent(
  content,
  "/holiday-breathing-exercises",
);

export default function HolidayBreathingExercisesPage() {
  return <HolidayBreathingPage content={content} />;
}
