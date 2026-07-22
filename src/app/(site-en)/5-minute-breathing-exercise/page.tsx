import sourceContent from "@/i18n/content/bespoke/duration-exercises/source/5-minute-breathing-exercise.json";
import type { DurationExercisePageContent } from "@/i18n/content/bespoke/duration-exercises/types";

import {
  DurationExercisePage,
  createDurationMetadataFromContent,
} from "../duration-exercise-page";

const content = sourceContent as DurationExercisePageContent;

export const metadata = createDurationMetadataFromContent(
  content,
  "/5-minute-breathing-exercise",
);

export default function FiveMinuteBreathingExercisePage() {
  return (
    <DurationExercisePage
      content={content}
      route="5-minute-breathing-exercise"
    />
  );
}
