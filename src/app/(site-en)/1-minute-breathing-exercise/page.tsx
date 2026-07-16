import sourceContent from "@/i18n/content/bespoke/duration-exercises/source/1-minute-breathing-exercise.json";
import type { DurationExercisePageContent } from "@/i18n/content/bespoke/duration-exercises/types";

import {
  DurationExercisePage,
  createDurationMetadataFromContent,
} from "../duration-exercise-page";

const content = sourceContent as DurationExercisePageContent;

export const metadata = createDurationMetadataFromContent(
  content,
  "/1-minute-breathing-exercise",
);

export default function OneMinuteBreathingExercisePage() {
  return (
    <DurationExercisePage
      content={content}
      route="1-minute-breathing-exercise"
    />
  );
}
