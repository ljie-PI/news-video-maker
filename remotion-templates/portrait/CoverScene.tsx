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

// Hex (#rrggbb) → {r,g,b}; falls back to white on parse failure.
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return { r: 255, g: 255, b: 255 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
};

export const CoverScene: React.FC<CoverSceneProps> = ({
  title,
  subtitle,
  audioFile,
  narration,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const gradientAngle = 135 + (frame / durationInFrames) * 120;
  const breathe = 1 + Math.sin(frame / 25) * 0.015;

  const circles = [0, 1, 2, 3, 4].map((i) => {
    const cx = [150, 900, 540, 100, 800][i];
    const cy = [300, 1400, 800, 1100, 500][i];
    return {
      x: Math.sin(frame / (30 + i * 7) + i * 1.5) * 120 + cx,
      y: Math.cos(frame / (25 + i * 5) + i * 2) * 200 + cy,
      size: 100 + i * 50 + Math.sin(frame / 20 + i) * 25,
      opacity: 0.06 + Math.sin(frame / 30 + i * 1.2) * 0.03,
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

  // Per-character wave is interpolated between brand_primary and brand_highlight
  // so each theme keeps its own identity rather than a hard-coded yellow tint.
  const baseColor = hexToRgb(theme.brand_primary);
  const accentColor = hexToRgb(theme.brand_highlight);

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
            const waveY = Math.sin(frame * 0.08 + i * 0.4) * 10;
            const waveT = interpolate(
              Math.sin(frame * 0.05 + i * 0.3),
              [-1, 1],
              [0, 1]
            );
            const r = Math.round(
              baseColor.r + (accentColor.r - baseColor.r) * waveT
            );
            const g = Math.round(
              baseColor.g + (accentColor.g - baseColor.g) * waveT
            );
            const b = Math.round(
              baseColor.b + (accentColor.b - baseColor.b) * waveT
            );
            const color = `rgb(${r}, ${g}, ${b})`;

            return (
              <span
                key={i}
                style={{
                  fontFamily,
                  fontSize: 110,
                  fontWeight: 700,
                  color,
                  opacity: charOpacity,
                  transform: `translateY(${waveY}px)`,
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
            transform: `scale(${subtitleScale + Math.sin(frame / 30) * 0.02})`,
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
