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
  staggerDelay,
  rotatingGradient,
} from "./animationHelpers";

interface DataHighlightSceneProps {
  mainNumber: string;
  unit: string;
  secondaryStats?: {
    label: string;
    value: string;
  }[];
  context: string;
  audioFile: string;
  narration?: string;
}

/**
 * Parse a human-readable number string into structured parts.
 *
 * Supports: plain integers ("814"), decimals ("3.5"), k/m/b suffixes ("14.2k"),
 * percent ("3.9%"), prefix/suffix text ("$1.2k", "+47k stars", "Top 10").
 *
 * Returns `value: null` when no numeric portion is present, in which case the
 * caller should render the raw string and skip counter animation.
 */
function parseMainNumber(str: string): {
  value: number | null;
  prefix: string;
  suffix: string;
  decimals: number;
} {
  const cleaned = (str ?? "").trim().replace(/,/g, "");
  const match = cleaned.match(/^([^\d+\-]*)([+-]?\d+(?:\.\d+)?)([kmbKMB%]?)(.*)$/);
  if (!match) {
    return { value: null, prefix: "", suffix: "", decimals: 0 };
  }
  const [, leading, num, unit, trailing] = match;
  const decimals = num.includes(".") ? num.split(".")[1].length : 0;
  const value = parseFloat(num);
  const displaySuffix = unit + trailing;
  return { value, prefix: leading, suffix: displaySuffix, decimals };
}

/** Format counter value preserving prefix/suffix and decimal precision. */
function formatCounter(
  current: number,
  parsed: { prefix: string; suffix: string; decimals: number },
): string {
  const fmt = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
  });
  return `${parsed.prefix}${fmt.format(current)}${parsed.suffix}`;
}

const CLAMP = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/* ── Ring / Arc SVG decoration ─────────────────────────────────── */

const RingArc: React.FC<{
  frame: number;
  size: number;
  strokeWidth: number;
  color: string;
  startFrame: number;
  arcDeg?: number;
  rotationOffset?: number;
}> = ({ frame, size, strokeWidth, color, startFrame, arcDeg = 270, rotationOffset = 0 }) => {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const arcLength = (arcDeg / 360) * circumference;

  const drawProgress = interpolate(
    frame,
    [startFrame, startFrame + 50],
    [0, arcLength],
    CLAMP,
  );
  const opacity = fadeIn(frame, startFrame, 20);
  // Continuous rotation after draw-in
  const continuousRotation = rotationOffset + (frame / 60) * 80;

  return (
    <svg
      width={size}
      height={size}
      style={{ position: "absolute", opacity }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${drawProgress} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(${continuousRotation} ${size / 2} ${size / 2})`}
      />
    </svg>
  );
};

/* ── Stat card ─────────────────────────────────────────────────── */

const StatCard: React.FC<{
  label: string;
  value: string;
  index: number;
  frame: number;
  fps: number;
  baseDelay?: number;
}> = ({ label, value, index, frame, fps, baseDelay = 45 }) => {
  const delay = staggerDelay(baseDelay, index, 12);
  const yOffset = slideIn(frame, fps, delay, 60, { damping: 12, mass: 0.7 });
  const opacity = fadeIn(frame, delay, 15);
  const scale = 1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 48px",
        background: theme.overlay_subtle,
        border: `1px solid ${theme.card_border}`,
        borderRadius: 16,
        backdropFilter: "blur(8px)",
        opacity,
        transform: `translateY(${yOffset}px) scale(${scale})`,
        minWidth: 200,
      }}
    >
      <span
        style={{
          fontFamily,
          fontSize: 42,
          fontWeight: 800,
          color: theme.brand_highlight,
          lineHeight: 1.2,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily,
          fontSize: 22,
          fontWeight: 400,
          color: theme.text_muted,
          marginTop: 6,
        }}
      >
        {label}
      </span>
    </div>
  );
};

/* ── Grid background ───────────────────────────────────────────── */

const GridBackground: React.FC<{ frame: number; durationInFrames: number }> = ({
  frame,
  durationInFrames,
}) => {
  const gridOpacity = interpolate(
    frame,
    [0, 30, durationInFrames - 20, durationInFrames],
    [0, 0.15, 0.15, 0],
    CLAMP,
  );
  const gridShift = 0;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: gridOpacity,
        backgroundImage:
          `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),` +
          `linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
        backgroundPosition: `0px ${gridShift}px`,
      }}
    />
  );
};

/* ── Main component ────────────────────────────────────────────── */

export const DataHighlightScene: React.FC<DataHighlightSceneProps> = ({
  mainNumber,
  unit,
  secondaryStats = [],
  context,
  audioFile,
  narration,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const parsedNumber = parseMainNumber(mainNumber);
  const targetValue = parsedNumber.value ?? 0;
  const hasNumeric = parsedNumber.value !== null;
  const bgAngle = rotatingGradient(frame, durationInFrames, 135, 120);

  // Counter animation: roll from 0 → target over 30% of segment
  const COUNTER_START = 10;
  const COUNTER_END = Math.floor(durationInFrames * 0.3);
  const currentValueRaw = interpolate(
    frame,
    [COUNTER_START, COUNTER_END],
    [0, targetValue],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Main number entrance
  const numberOpacity = fadeIn(frame, 5, 20);
  const numberScale = interpolate(
    spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 12, mass: 0.6 } }),
    [0, 1],
    [0.6, 1],
  );

  const numberPulse = 1;
  const numberFloat = 0;

  // Unit text
  const unitOpacity = fadeIn(frame, 20, 15);
  const unitY = slideIn(frame, fps, 20, 30);

  // Context bar
  const contextOpacity = fadeIn(frame, 55, 20);
  const contextY = slideIn(frame, fps, 55, 40);

  // Ring sizes
  const RING_SIZE = 456;

  const glowScale = 1;
  const glowOpacity = 0.25;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />

      {/* Dark gradient background */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${bgAngle}deg, ${theme.dark_bg_from}, ${theme.dark_bg_to})`,
        }}
      >

        {/* Card panel */}
        <div style={{
          position: "absolute",
          top: 30,
          left: 40,
          right: 40,
          bottom: 30,
          borderRadius: 24,
          background: theme.card_bg,
          border: `1px solid ${theme.card_border}`,
          pointerEvents: "none",
        }} />
        {/* Animated grid overlay */}
        <GridBackground frame={frame} durationInFrames={durationInFrames} />
        {[0, 1, 2, 3].map((i) => {
          const cx = [200, 1700, 400, 1500][i];
          const cy = [150, 250, 800, 700][i];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: cx,
                top: cy,
                width: 120 + i * 40,
                height: 120 + i * 40,
                borderRadius: "50%",
                background: i % 2 === 0 ? theme.brand_primary : theme.brand_highlight,
                opacity: 0.12,
                filter: "blur(30px)",
                pointerEvents: "none",
              }}
            />
          );
        })}

        {/* Pulsing radial glow behind the number */}
        <div
          style={{
            position: "absolute",
            top: "42%",
            left: "50%",
            width: 700,
            height: 700,
            transform: `translate(-50%, -60%) scale(${glowScale})`,
            background: `radial-gradient(circle, ${theme.brand_primary}30 0%, transparent 70%)`,
            filter: "blur(30px)",
            opacity: glowOpacity,
          }}
        />

        {/* ── Ring decorations flanking the main number ──────── */}
        <div
          style={{
            position: "absolute",
            top: "42%",
            left: "50%",
            transform: "translate(-50%, -55%)",
          }}
        >
          {/* Left ring */}
          <div style={{ position: "absolute", left: -RING_SIZE / 2, top: -RING_SIZE / 2 }}>
            <RingArc
              frame={frame}
              size={RING_SIZE}
              strokeWidth={3}
              color={theme.brand_primary}
              startFrame={8}
              arcDeg={240}
              rotationOffset={-120}
            />
          </div>
          {/* Outer ring */}
          <div style={{ position: "absolute", left: -(RING_SIZE + 40) / 2, top: -(RING_SIZE + 40) / 2 }}>
            <RingArc
              frame={frame}
              size={RING_SIZE + 40}
              strokeWidth={1.5}
              color={theme.brand_highlight}
              startFrame={15}
              arcDeg={180}
              rotationOffset={30}
            />
          </div>
          {/* Inner ring */}
          <div style={{ position: "absolute", left: -(RING_SIZE - 60) / 2, top: -(RING_SIZE - 60) / 2 }}>
            <RingArc
              frame={frame}
              size={RING_SIZE - 60}
              strokeWidth={2}
              color={`${theme.brand_primary}88`}
              startFrame={20}
              arcDeg={200}
              rotationOffset={180}
            />
          </div>
        </div>

        {/* ── Expanding ring pulses after counter completes ──── */}
        {frame > COUNTER_END && (
          <div
            style={{
              position: "absolute",
              top: "42%",
              left: "50%",
              transform: "translate(-50%, -55%)",
              pointerEvents: "none",
            }}
          >
            {[0, 1, 2].map((i) => {
              const ringFrame = frame - COUNTER_END - i * 30;
              if (ringFrame < 0) return null;
              const ringScale = 1 + (ringFrame % 90) / 90 * 0.5;
              const ringOpacity = 1 - (ringFrame % 90) / 90;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: 240,
                    height: 240,
                    left: -120,
                    top: -120,
                    borderRadius: "50%",
                    border: `2px solid ${theme.brand_primary}`,
                    transform: `scale(${ringScale})`,
                    opacity: ringOpacity * 0.35,
                  }}
                />
              );
            })}
          </div>
        )}

        {/* ── Central content area ───────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: "42%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Main number */}
          <div
            style={{
              fontFamily,
              fontSize: 120,
              fontWeight: 900,
              color: theme.brand_primary,
              lineHeight: 1,
              opacity: numberOpacity,
              transform: `scale(${numberScale * numberPulse}) translateY(${numberFloat}px)`,
              textShadow: `0 0 60px ${theme.brand_primary}66, 0 4px 20px rgba(0,0,0,0.5)`,
              letterSpacing: "-2px",
            }}
          >
            {hasNumeric ? formatCounter(currentValueRaw, parsedNumber) : mainNumber}
          </div>

          {/* Unit text */}
          <div
            style={{
              fontFamily,
              fontSize: 48,
              fontWeight: 500,
              color: theme.text_secondary,
              marginTop: 20,
              opacity: unitOpacity,
              transform: `translateY(${unitY}px)`,
              letterSpacing: "2px",
            }}
          >
            {unit}
          </div>
        </div>

        {/* ── Secondary stat cards row ───────────────────────── */}
        {secondaryStats.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 200,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 40,
            }}
          >
            {secondaryStats.slice(0, 3).map((stat, i) => (
              <StatCard
                key={i}
                label={stat.label}
                value={stat.value}
                index={i}
                frame={frame}
                fps={fps}
                baseDelay={COUNTER_END + 5}
              />
            ))}
          </div>
        )}

        {/* ── Context text bar ──────────────────────── */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: contextOpacity,
            transform: `translateY(${contextY}px)`,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: 32,
              fontWeight: 400,
              color: theme.text_muted,
              background: theme.overlay_subtle,
              border: `1px solid ${theme.card_border}`,
              borderRadius: 12,
              padding: "12px 36px",
              maxWidth: 1200,
              textAlign: "center",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {context}
          </div>
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
