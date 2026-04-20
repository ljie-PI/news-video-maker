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
  underlineSweep,
  float,
  rotatingGradient,
} from "./animationHelpers";

interface RichBulletSceneProps {
  project: string;
  sectionTitle: string;
  bullets: {
    title: string;
    detail: string;
  }[];
  variant?: number;
  audioFile: string;
  narration?: string;
  bulletDurations?: number[];
}

export const RichBulletScene: React.FC<RichBulletSceneProps> = ({
  project,
  sectionTitle,
  bullets,
  audioFile,
  narration,
  variant = 0,
  bulletDurations,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, height } = useVideoConfig();

  const accentColor =
    variant % 3 === 0
      ? theme.brand_primary
      : variant % 3 === 1
        ? theme.brand_highlight
        : theme.brand_highlight;

  const count = bullets.length;
  const useColumns = false;

  // Density-adaptive layout: scale font/padding/gap as bullet count grows so
  // 1-10 bullets all fit and stay visually balanced. See plan / spec.
  const DENSITY_SCALE: Record<number, number> = {
    5: 0.90, 6: 0.84, 7: 0.80, 8: 0.76, 9: 0.70, 10: 0.66,
  };
  const densityScale = count <= 4 ? 1 : (DENSITY_SCALE[count] ?? 0.66);
  const detailClamp = count <= 3 ? 3 : 2;

  const vScale = 2.0 * densityScale;
  const fScale = 1.25 * densityScale;

  const baseGap = Math.floor((height - 400) / (count + 1) / 2);
  const gapFactor = count <= 4 ? 1 : Math.max(0.35, 1 - (count - 4) * 0.12);
  const bulletGapPx = Math.max(
    16,
    Math.min(160, Math.round(baseGap * gapFactor * densityScale))
  );
  const baseDelay = 5;
  const staggerGap = Math.max(4, Math.floor(45 / Math.max(count, 1)));
  const entranceDone = staggerDelay(baseDelay, count - 1, staggerGap) + 12;

  const audioDriven = !!bulletDurations && bulletDurations.length === count;
  let active = count - 1;
  if (audioDriven) {
    let acc = 0;
    let computed = 0;
    for (let i = 0; i < count; i++) {
      if (frame >= acc) computed = i;
      acc += bulletDurations![i];
    }
    active = computed;
  }
  const bgAngle = rotatingGradient(frame, durationInFrames, 135, 120);

  // Scan line - more visible

  const titleOpacity = fadeIn(frame, 0, 18);
  const titleSlide = slideIn(frame, fps, 0, 60, { damping: 16, mass: 0.7 });

  // Split bullets into columns
  const leftCol = useColumns ? bullets.slice(0, Math.ceil(count / 2)) : bullets;
  const rightCol = useColumns ? bullets.slice(Math.ceil(count / 2)) : [];

  const renderBullet = (
    bullet: { title: string; detail: string },
    globalIndex: number,
  ) => {
    const delay = staggerDelay(baseDelay, globalIndex, staggerGap);
    const springVal = spring({
      frame: Math.max(0, frame - delay),
      fps,
      config: { damping: 14, stiffness: 80 },
    });
    const translateY = interpolate(springVal, [0, 1], [150, 0]);
    const translateX = slideIn(frame, fps, delay, 100, { damping: 14, mass: 0.8 });
    const opacity = fadeIn(frame, delay, 15);

    const isActive = audioDriven
      ? globalIndex === active && frame >= entranceDone
      : true;
    const isNarrated = audioDriven && globalIndex < active && frame >= entranceDone;
    const isFuture = !isActive && !isNarrated;

    const stateOpacity = isActive ? 1 : isNarrated ? 0.7 : 0.4;
    const scale = isActive ? 1.06 : 1;

    const activeFloat = 0;
    const activeFloatX = 0;

    // Narrated bullets get subtle continuous motion
    const narratedFloat = isNarrated && !isActive
      ? 0
      : 0;
    const narratedFloatX = isNarrated && !isActive
      ? 0
      : 0;

    const segmentDuration = (durationInFrames - entranceDone - 10) / count;
    const sweepStart = entranceDone + segmentDuration * globalIndex;
    const sweepWidth = !audioDriven
      ? (frame >= entranceDone ? 100 : 0)
      : isActive
        ? (segmentDuration > 0 ? underlineSweep(frame, sweepStart, segmentDuration) : 100)
        : isNarrated
          ? 100
          : 0;

    return (
      <div
        key={globalIndex}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          opacity: opacity * stateOpacity,
          transform: `translateY(${translateY + activeFloat + narratedFloat}px) translateX(${translateX + activeFloatX + narratedFloatX}px) scale(${scale})`,
          transformOrigin: "left top",
          padding: useColumns ? `${Math.round(10 * vScale)}px 14px` : `${Math.round(12 * vScale)}px 16px`,
          borderRadius: 12,
          backgroundColor: isActive
            ? `${accentColor}12`
            : "transparent",
          position: "relative",
          marginBottom: bulletGapPx,
        }}
      >
        {/* Number badge */}
        <div
          style={{
            fontFamily,
            fontSize: Math.round(22 * densityScale),
            fontWeight: 700,
            color: isActive ? "#ffffff" : isFuture ? `${accentColor}80` : accentColor,
            minWidth: Math.round(40 * densityScale),
            height: Math.round(40 * densityScale),
            borderRadius: Math.round(10 * densityScale),
            backgroundColor: isActive ? accentColor : `${accentColor}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
            boxShadow: isActive ? `0 0 24px ${accentColor}60` : "none",
          }}
        >
          {globalIndex + 1}
        </div>

        {/* Title + detail */}
        <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
          <div
            style={{
              fontFamily,
              fontSize: Math.round(36 * fScale),
              fontWeight: 700,
              color: isActive
                ? theme.brand_primary
                : isNarrated
                  ? theme.text_on_bg_muted
                  : theme.text_muted,
              lineHeight: 1.35,
              wordBreak: "break-word",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {bullet.title}
          </div>
          <div
            style={{
              fontFamily,
              fontSize: Math.round(28 * fScale),
              fontWeight: 400,
              color: isActive ? theme.text_secondary : theme.text_muted,
              lineHeight: 1.5,
              marginTop: Math.round(6 * vScale),
              display: "-webkit-box",
              WebkitLineClamp: detailClamp,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-word",
            }}
          >
            {bullet.detail}
          </div>
          {/* Underline sweep */}
          <div
            style={{
              position: "absolute",
              bottom: -2,
              left: 0,
              height: 4,
              width: `${sweepWidth}%`,
              backgroundColor: accentColor,
              borderRadius: 2,
              opacity: isActive ? 0.9 : 0.4,
              boxShadow: isActive ? `0 0 12px ${accentColor}60` : "none",
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${bgAngle}deg, ${theme.dark_bg_from} 0%, ${theme.dark_bg_mid} 50%, ${theme.dark_bg_to} 100%)`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >

        {/* Full-height content card */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 40,
            right: 40,
            bottom: 30,
            background: theme.card_bg,
            border: `1px solid ${theme.card_border}`,
            borderRadius: 20,
            display: "flex",
            flexDirection: "column",
            padding: "30px 24px 30px",
          }}
        >

        {/* ── Top area: project + sectionTitle ── */}
        <div
          style={{
            flex: "0 0 auto",
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
            paddingBottom: Math.round(16 * vScale),
            borderBottom: `3px solid ${theme.card_border}`,
            marginBottom: Math.round(24 * vScale),
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily,
                fontSize: Math.round(48 * fScale),
                fontWeight: 700,
                color: accentColor,
                lineHeight: 1.2,
              }}
            >
              {project}
            </div>
            <div
              style={{
                fontFamily,
                fontSize: Math.round(30 * fScale),
                fontWeight: 500,
                color: "#8b949e",
                marginTop: 6,
              }}
            >
              {sectionTitle}
            </div>
          </div>

          {/* Bullet counter (top-right) */}
          <div
            style={{
              fontFamily,
              fontSize: Math.round(22 * densityScale),
              fontWeight: 600,
              color: theme.text_muted,
              whiteSpace: "nowrap",
            }}
          >
            {audioDriven && frame >= entranceDone ? `${active + 1} / ${count}` : ""}
          </div>
        </div>

        {/* ── Main content area (85%): bullet cards ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: useColumns ? 40 : 0,
              alignItems: "flex-start",
            }}
          >
          {/* Left column (or single column) */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: 0 }}>
            {leftCol.map((b, i) => renderBullet(b, i))}
          </div>

          {/* Right column */}
          {useColumns && rightCol.length > 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {rightCol.map((b, i) =>
                renderBullet(b, Math.ceil(count / 2) + i),
              )}
            </div>
          )}
          </div>
        </div>

        </div>
        {/* End content card */}

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
