import React from "react";
import { Composition } from "remotion";
import { Orb, defaultBreathProps, BreathProps } from "./Orb";

type CompProps = BreathProps & { durationSec: number; width: number; height: number };

const FPS = 60;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Breathing"
      component={Orb as React.FC<CompProps>}
      fps={FPS}
      // placeholders; real values come from calculateMetadata so a single
      // composition can render the whole matrix via --props
      durationInFrames={FPS * 60}
      width={1920}
      height={1080}
      defaultProps={{
        ...defaultBreathProps,
        durationSec: 60,
        width: 1920,
        height: 1080,
      }}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.round(props.durationSec * FPS),
        width: props.width,
        height: props.height,
        fps: FPS,
      })}
    />
  );
};
