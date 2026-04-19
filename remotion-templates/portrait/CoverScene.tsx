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
  const { durationInFrames } = useVideoConfig();

  const gradientAngle = 135 + (frame / durationInFrames) * 120;
  // Static: no breathing scale to avoid visible content wobble (matches landscape)
  const breathe = 1;

  // Static circle positions/opacities (no per-frame sin/cos drift)
  const circles = [0, 1, 2, 3, 4].map((i) => {
    const cx = [150, 900, 540, 100, 800][i];
    const cy = [300, 1400, 800, 1100, 500][i];
    return {
      x: cx,
      y: cy,
      size: 100 + i * 50,
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

  const progress = frame / durationInFrames;

  // Static title color (no per-frame interpolation between brand colors).
  const titleColor = theme.brand_primary;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${gradientAngle}deg, ${theme.dark_bg_from} 0%, ${theme.dark_bg_mid} 40%, ${theme.dark_bg_to} 70%, ${theme.dark_bg_mid} 100%)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          transform: `scale(${breathe})`,
          overflow: "hidden",
        }}
      >
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
              background:
                i % 2 === 0 ? theme.brand_primary : theme.brand_highlight,
              opacity: c.opacity,
              filter: "blur(40px)",
            }}
          />
        ))}

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            maxWidth: "900px",
            padding: "0 60px",
          }}
        >
          {chars.map((char, i) => {
            const enterDelay = i * 1.5;
            const charOpacity = interpolate(
              frame,
              [enterDelay, enterDelay + 12],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            return (
              <span
                key={i}
                style={{
                  fontFamily,
                  fontSize: 110,
                  fontWeight: 700,
                  color: titleColor,
                  opacity: charOpacity,
                  lineHeight: 1.15,
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
            fontSize: 42,
            color: theme.text_secondary,
            marginTop: 50,
            opacity: subtitleOpacity,
            transform: `scale(${subtitleScale})`,
            fontWeight: 400,
            textAlign: "center",
            padding: "0 40px",
          }}
        >
          {subtitle}
        </div>

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
    </AbsoluteFill>
  );
};
