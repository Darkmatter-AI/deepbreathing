import sourceContent from "@/i18n/content/bespoke/timer-4-7-8/source.json";
import type { TimerPageContent } from "@/i18n/content/bespoke/timer-4-7-8/types";

import {
  TimerPage,
  createTimerMetadataFromContent,
} from "./timer-page";

const content = sourceContent as TimerPageContent;

export const metadata = createTimerMetadataFromContent(content);

export default function FourSevenEightBreathingTimerMoneyPage() {
  return <TimerPage content={content} />;
}
