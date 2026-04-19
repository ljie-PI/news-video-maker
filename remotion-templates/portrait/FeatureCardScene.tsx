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
import {
  fadeIn,
  slideIn,
  rotatingGradient,
} from "./animationHelpers";

interface FeatureCardSceneProps {
  icon: string;
  title: string;
  description: string;
  highlight?: string;
  audioFile: string;
  narration?: string;
}

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/* ── Decorative background circles ─────────────────────────────── */

const DecorativeCircles: React.FC<{ frame: number; durationInFrames: number }> = ({
  frame,
  durationInFrames,
}) => {
  const circles = [
    { cx: 1600, cy: 200, r: 300, delay: 5, color: theme.brand_primary },
    { cx: 300, cy: 800, r: 220, delay: 10, color: theme.brand_highlight },
    { cx: 1700, cy: 900, r: 180, delay: 15, color: theme.brand_primary },
    { cx: 200, cy: 200, r: 140, delay: 20, color: theme.brand_highlight },
  ];

  return (
    <>
      {circles.map((c, i) => {
        const opacity = interpolate(
          frame,
          [c.delay, c.delay + 30, durationInFrames - 20, durationInFrames],
          [0, 0.22, 0.22, 0],
          CLAMP,
        );
        const drift = 0;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.cx - c.r,
              top: c.cy - c.r + drift,
              width: c.r * 2,
              height: c.r * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${c.color}40, transparent 70%)`,
              opacity,
              filter: "blur(40px)",
            }}
          />
        );
      })}
    </>
  );
};

/* ── Highlight renderer ────────────────────────────────────────── */

function renderDescriptionWithHighlight(
  description: string,
  highlight: string | undefined,
  frame: number,
): React.ReactNode[] {
  if (!highlight || !description.includes(highlight)) {
    return [description];
  }

  const parts = description.split(highlight);
  const result: React.ReactNode[] = [];

  const pulseScale = 1;
  const highlightOpacity = interpolate(
    frame,
    [50, 65],
    [0.6, 1],
    CLAMP,
  );

  parts.forEach((part, i) => {
    if (part) result.push(part);
    if (i < parts.length - 1) {
  const shimmerPos = ((frame % 120) / 120) * 140 - 20;
      result.push(
        <span
          key={`hl-${i}`}
          style={{
            display: "inline-block",
            color: theme.brand_highlight,
            background: `linear-gradient(90deg, ${theme.brand_highlight}18 ${Math.max(0, shimmerPos - 15)}%, ${theme.brand_highlight}40 ${shimmerPos}%, ${theme.brand_highlight}18 ${Math.min(100, shimmerPos + 15)}%)`,
            padding: "2px 12px",
            borderRadius: 8,
            fontWeight: 700,
            transform: `scale(${pulseScale})`,
            opacity: highlightOpacity,
            border: `1px solid ${theme.brand_highlight}40`,
          }}
        >
          {highlight}
        </span>,
      );
    }
  });

  return result;
}

/* ── Main component ────────────────────────────────────────────── */

export const FeatureCardScene: React.FC<FeatureCardSceneProps> = ({
  icon,
  title,
  description,
  highlight,
  audioFile,
  narration,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const vScale = 2.0;
  const fScale = 1.25;

  const bgAngle = rotatingGradient(frame, durationInFrames, 135, 120);

  // Icon entrance: scale 0→1 + rotation
  const iconSpring = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 10, mass: 0.6 },
  });
  const iconScale = interpolate(iconSpring, [0, 1], [0, 1]);
  const iconRotation = interpolate(iconSpring, [0, 1], [-180, 0]);
  const iconOpacity = fadeIn(frame, 5, 20);

  // Title entrance: slide from left + fade
  const titleX = slideIn(frame, fps, 15, 120, { damping: 14, mass: 0.8 });
  const titleOpacity = fadeIn(frame, 15, 20);

  // Description: line-by-line stagger (split into lines of ~60 chars)
  const descLines = splitIntoLines(description, 45);
  const DESC_START = 30;
  const DESC_STAGGER = Math.max(15, Math.floor((durationInFrames * 0.5) / Math.max(descLines.length, 1)));

  const iconFloat = 0;
  const iconBounce = 0;
  const iconWobble = 0;
  const glowPulse = 0.2;
  const glowSize = 900;
  const titleFloat = 0;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />

      {/* Dark gradient background */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${bgAngle}deg, ${theme.dark_bg_from}, ${theme.dark_bg_to})`,
        }}
      >
        {/* Decorative light circles */}
        <DecorativeCircles frame={frame} durationInFrames={durationInFrames} />

        {/* Pulsing glow behind card area */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            width: glowSize,
            height: glowSize * 0.7,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(ellipse, ${theme.brand_primary}30 0%, transparent 70%)`,
            filter: "blur(40px)",
            opacity: glowPulse,
          }}
        />

        {/* ── Full-height content card ────────────────── */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 60,
            right: 60,
            bottom: 40,
            background: theme.card_bg,
            border: `1px solid ${theme.card_border}`,
            borderRadius: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-evenly",
            alignItems: "center",
            padding: "50px 80px 40px",
            gap: Math.round(36 * vScale),
            transform: `translateY(0)`,
          }}
        >
          {/* Icon */}
          <div
            style={{
              fontSize: 160,
              lineHeight: 1,
              opacity: iconOpacity,
              transform: `scale(${iconScale}) rotate(${iconRotation + iconWobble}deg) translateY(${iconFloat + iconBounce}px)`,
              transformOrigin: "center center",
            }}
          >
            {icon}
          </div>

          {/* Title */}
          <div
            style={{
              fontFamily,
              fontSize: Math.round(80 * fScale),
              fontWeight: 800,
              color: theme.brand_primary,
              lineHeight: 1.2,
              opacity: titleOpacity,
              transform: `translateX(${titleX}px) translateY(${titleFloat}px)`,
              textShadow: `0 0 40px ${theme.brand_primary}44`,
              letterSpacing: "-0.5px",
              textAlign: "center",
            }}
          >
            {title}
          </div>

          {/* Accent divider */}
          <div
            style={{
              position: "relative",
              width: interpolate(frame, [20, 45], [0, 600], CLAMP),
              height: 5,
              borderRadius: 2,
              background: `linear-gradient(90deg, ${theme.brand_primary}, ${theme.brand_highlight})`,
              opacity: fadeIn(frame, 20, 20),
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: `${((frame * 3) % 600) - 100}px`,
                width: 100,
                height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
              }}
            />
          </div>

          {/* Description — line-by-line */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: Math.round(16 * vScale),
              maxWidth: 1600,
              alignItems: "center",
            }}
          >
            {descLines.map((line, i) => {
              const lineStart = DESC_START + i * DESC_STAGGER;
              const lineOpacity = fadeIn(frame, lineStart, 18);
              const lineY = slideIn(frame, fps, lineStart, 80, {
                damping: 14,
                mass: 0.7,
              });

              return (
                <div
                  key={i}
                  style={{
                    fontFamily,
                    fontSize: Math.round(42 * fScale),
                    fontWeight: 400,
                    color: theme.text_secondary,
                    lineHeight: 1.7,
                    opacity: lineOpacity,
                    transform: `translateY(${lineY}px)`,
                    textAlign: "center",
                  }}
                >
                  {i === descLines.length - 1 || line.includes(highlight ?? "\0")
                    ? renderDescriptionWithHighlight(line, highlight, frame)
                    : line}
                </div>
              );
            })}
          </div>
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ── Utility: split text into balanced lines ───────────────────── */

function splitIntoLines(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (test.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);

  // Cap at 4 lines max
  if (lines.length > 4) {
    const truncated = lines.slice(0, 4);
    truncated[3] = truncated[3].replace(/\s+\S*$/, "…");
    return truncated;
  }

  return lines;
}
