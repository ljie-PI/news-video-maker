import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme, fontFamily } from "./theme";
import { fadeIn, rotatingGradient } from "./animationHelpers";

interface TransitionSceneProps {
  text: string;
  subtitle?: string;
  audioFile: string;
}

export const TransitionScene: React.FC<TransitionSceneProps> = ({
  text,
  subtitle,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const angle = rotatingGradient(frame, durationInFrames, 135, 180);

  // Main text: zoom reveal — scale 1.5→1.0 with spring + fade in
  const textSpring = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });
  const textScale = interpolate(textSpring, [0, 1], [1.5, 1]);
  const textOpacity = fadeIn(frame, 0, 12);

  // Subtitle: delayed fade in
  const subtitleOpacity = subtitle ? fadeIn(frame, 15, 15) : 0;
  const subtitleSlide = subtitle
    ? interpolate(frame, [15, 30], [12, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />

      <AbsoluteFill
        style={{
          background: `linear-gradient(${angle}deg, ${theme.dark_bg_from} 0%, ${theme.dark_bg_mid} 35%, ${theme.dark_bg_to} 65%, ${theme.dark_bg_mid} 100%)`,
          overflow: "hidden",
        }}
      >
        {/* Center content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Main text */}
          <div
            style={{
              fontFamily,
              fontSize: 96,
              fontWeight: 800,
              color: theme.text_on_bg,
              opacity: textOpacity,
              transform: `scale(${textScale})`,
              textAlign: "center",
              lineHeight: 1.2,
              padding: "0 80px",
            }}
          >
            {text}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div
              style={{
                fontFamily,
                fontSize: 36,
                fontWeight: 400,
                color: theme.text_secondary,
                marginTop: 24,
                opacity: subtitleOpacity,
                transform: `translateY(${subtitleSlide}px)`,
                textAlign: "center",
                padding: "0 120px",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
