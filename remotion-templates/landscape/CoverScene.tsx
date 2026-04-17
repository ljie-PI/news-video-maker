import React from "react";
import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme, fontFamily } from "./theme";

interface CoverSceneProps {
  title: string;
  subtitle: string;
  audioFile: string;
  narration?: string;
}

export const CoverScene: React.FC<CoverSceneProps> = ({
  title,
  subtitle,
  audioFile,
  narration,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const gradientAngle = 135 + (frame / durationInFrames) * 120;
  const breathe = 1;

  const circles = [0, 1, 2, 3, 4].map((i) => {
    const cx = [300, 1600, 900, 200, 1400][i];
    const cy = [200, 700, 400, 600, 300][i];
    return {
      x: cx,
      y: cy,
      size: 80 + i * 40,
      opacity: 0.06,
    };
  });

  const chars = title.split("");
  const subtitleOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subtitleScale = interpolate(frame, [20, 45], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });


  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${gradientAngle}deg, ${theme.background_primary} 0%, ${theme.background_secondary} 40%, ${theme.background_tertiary} 70%, ${theme.background_primary} 100%)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${breathe})`,
          overflow: "hidden",
        }}
      >

        {/* Subtle overlay for brightness */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: theme.overlay_subtle,
          pointerEvents: "none",
        }} />
        {circles.map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: c.size,
              height: c.size,
              borderRadius: "50%",
              background: theme.brand_primary,
              opacity: c.opacity * 0.5,
              filter: "blur(40px)",
            }}
          />
        ))}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "1400px",
            padding: "0 80px",
          }}
        >
          {chars.map((char, i) => {
            const enterDelay = i * 1.5;
            const charOpacity = interpolate(frame, [enterDelay, enterDelay + 12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const color = theme.text_primary;

            return (
              <span
                key={i}
                style={{
                  fontFamily,
                  fontSize: 80,
                  fontWeight: 700,
                  color,
                  opacity: charOpacity,
                  lineHeight: 1.2,
                  whiteSpace: "pre",
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        <div
          style={{
            fontFamily,
            fontSize: 36,
            color: theme.text_secondary,
            marginTop: 40,
            opacity: subtitleOpacity,
            transform: `scale(${subtitleScale})`,
            fontWeight: 400,
          }}
        >
          {subtitle}
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
