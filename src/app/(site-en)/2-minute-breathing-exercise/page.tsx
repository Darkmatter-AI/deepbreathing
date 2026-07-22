import sourceContent from "@/i18n/content/bespoke/duration-exercises/source/2-minute-breathing-exercise.json";
import type { DurationExercisePageContent } from "@/i18n/content/bespoke/duration-exercises/types";

import {
  DurationExercisePage,
  createDurationMetadataFromContent,
} from "../duration-exercise-page";

const content = sourceContent as DurationExercisePageContent;

export const metadata = createDurationMetadataFromContent(
  content,
  "/2-minute-breathing-exercise",
);

export default function TwoMinuteBreathingExercisePage() {
  return (
    <DurationExercisePage
      content={content}
      route="2-minute-breathing-exercise"
    />
  );
}
