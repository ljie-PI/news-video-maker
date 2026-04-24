import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "./theme";

interface CoverSceneProps {
  audioFile: string;
  // Kept for backward-compatibility with existing script.json; unused now
  // that the cover is a pre-rendered image supplied via public/cover.png.
  title?: string;
  subtitle?: string;
  narration?: string;
}

export const CoverScene: React.FC<CoverSceneProps> = ({ audioFile }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const progress = frame / Math.max(durationInFrames, 1);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.dark_bg_mid }}>
      <Audio src={staticFile(audioFile)} />
      <Img
        src={staticFile("cover.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: fadeIn,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: 4,
          backgroundColor: theme.overlay_subtle,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: `linear-gradient(90deg, ${theme.brand_primary}, ${theme.brand_highlight})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
