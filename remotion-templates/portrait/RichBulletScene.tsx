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

// Discrete tier spec for P3 scale-aligned layout (1080×1440 portrait).
// All font sizes land on the 12-level scale (24/28/32/36/40/48/52/60/…).
// `titleFs`=bullet title, `detailFs`=detail body, `pad`=vertical card padding,
// `mt`=margin between title and detail, `badgeFs`/`badgeSize`=number badge.
// Higher count → smaller tier. Max count = 6 (auto-split handles >6).
interface BulletTier {
  titleFs: number;
  detailFs: number;
  pad: number;
  mt: number;
  badgeFs: number;
  badgeSize: number;
  badgeRadius: number;
}

const BULLET_TIERS: BulletTier[] = [
  // Tier 1 — n ≤ 2
  { titleFs: 60, detailFs: 48, pad: 24, mt: 9, badgeFs: 32, badgeSize: 48, badgeRadius: 12 },
  // Tier 2 — n = 3..4
  { titleFs: 52, detailFs: 40, pad: 20, mt: 8, badgeFs: 28, badgeSize: 40, badgeRadius: 10 },
  // Tier 3 — n = 5..6 (and fallback for >6)
  { titleFs: 48, detailFs: 36, pad: 18, mt: 7, badgeFs: 24, badgeSize: 36, badgeRadius: 10 },
];

const tierFor = (count: number): BulletTier =>
  count <= 2 ? BULLET_TIERS[0] : count <= 4 ? BULLET_TIERS[1] : BULLET_TIERS[2];

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

  // Tier-based layout (P3). Each count picks a scale-aligned font tier;
  // gap is back-computed so the bullet stack fits the card's bullets area.
  // Title region padding/margins are independent of bullet density (they
  // describe the scene, not the bullets).
  const tier = tierFor(count);
  const detailClamp = 1;
  const hScale = height / 960; // responsive canvas scaling only

  // Title region height (project + sectionTitle + bottom border gap).
  //   project(60)*1.2 line + sectionTitle(48) + marginTop(6)
  //   + paddingBottom(16*hS) + border(3) + marginBottom(24*hS)
  // At height=1440: 72 + 48 + 6 + 24 + 3 + 36 = 189
  const titleChromePad = Math.round(16 * hScale);
  const titleChromeMargin = Math.round(24 * hScale);

  // Card height for layout reserve (detailClamp=1 line of detail).
  const estCardH =
    2 * tier.pad +
    tier.titleFs * 1.35 +
    tier.mt +
    tier.detailFs * 1.5 * detailClamp;
  // Bullets area = canvas - outer 60 - card padding 80 - title region ~190 - 20 safety
  const availableArea = height - 360;
  const bulletGapPx = Math.max(
    12,
    Math.min(160, Math.floor((availableArea - count * estCardH) / count))
  );
  const baseDelay = 5;
  const staggerGap = Math.max(4, Math.floor(45 / Math.max(count, 1)));
  const entranceDone = staggerDelay(baseDelay, count - 1, staggerGap) + 12;

  const audioDriven = !!bulletDurations && bulletDurations.length === count;

  // Active bullet tracks the real audio timeline (starts at frame 0).
  // After all audio ends, active = count (sentinel) so all bullets show as narrated.
  let active = count - 1;
  if (audioDriven) {
    let acc = 0;
    let computed = 0;
    for (let i = 0; i < count; i++) {
      if (frame >= acc) computed = i;
      acc += bulletDurations![i];
    }
    active = frame >= acc ? count : computed;
  }

  // Pre-compute per-bullet sweep timing.
  // Audio plays from frame 0 but sweep is only visible after entranceDone.
  // Intersect each bullet's audio window [audioStart, audioEnd) with
  // [entranceDone, ∞) so bullets consumed during entrance show as narrated.
  const sweepStarts: number[] = [];
  const sweepDurs: number[] = [];
  if (audioDriven) {
    let audioAcc = 0;
    for (let i = 0; i < count; i++) {
      const audioStart = audioAcc;
      const audioEnd = audioAcc + bulletDurations![i];
      const visStart = Math.max(audioStart, entranceDone);
      // min 1 prevents zero-duration in underlineSweep/interpolate;
      // fully-consumed bullets show as narrated (100% bar) via isNarrated logic.
      const visDur = Math.max(1, audioEnd - visStart);
      sweepStarts.push(visStart);
      sweepDurs.push(visDur);
      audioAcc = audioEnd;
    }
  } else {
    const seg = (durationInFrames - entranceDone - 10) / count;
    for (let i = 0; i < count; i++) {
      sweepStarts.push(entranceDone + seg * i);
      sweepDurs.push(seg);
    }
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

    const stateOpacity = isActive ? 1 : isNarrated ? 0.85 : 0.4;

    const activeFloat = 0;
    const activeFloatX = 0;

    // Narrated bullets get subtle continuous motion
    const narratedFloat = isNarrated && !isActive
      ? 0
      : 0;
    const narratedFloatX = isNarrated && !isActive
      ? 0
      : 0;

    const sweepWidth = !audioDriven
      ? (frame >= entranceDone ? 100 : 0)
      : isActive
        ? (sweepDurs[globalIndex] > 0 ? underlineSweep(frame, sweepStarts[globalIndex], sweepDurs[globalIndex]) : 100)
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
          transform: `translateY(${translateY + activeFloat + narratedFloat}px) translateX(${translateX + activeFloatX + narratedFloatX}px)`,
          transformOrigin: "left top",
          padding: useColumns
            ? `${Math.round(tier.pad * 0.83)}px 14px`
            : `${tier.pad}px 16px`,
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
            fontSize: tier.badgeFs,
            fontWeight: 700,
            color: isActive ? "#ffffff" : isFuture ? `${accentColor}80` : accentColor,
            minWidth: tier.badgeSize,
            height: tier.badgeSize,
            borderRadius: tier.badgeRadius,
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
              fontSize: tier.titleFs,
              fontWeight: 700,
              color: isFuture ? theme.text_muted : theme.brand_primary,
              lineHeight: 1.35,
              whiteSpace: "nowrap" as const,
              overflow: "hidden" as const,
              textOverflow: "ellipsis" as const,
            }}
          >
            {bullet.title}
          </div>
          <div
            style={{
              fontFamily,
              fontSize: tier.detailFs,
              fontWeight: 400,
              color: isFuture ? theme.text_muted : theme.text_secondary,
              lineHeight: 1.5,
              marginTop: tier.mt,
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
            padding: "50px 24px 30px",
          }}
        >

        {/* ── Top area: project + sectionTitle ── */}
        <div
          style={{
            flex: "0 0 auto",
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
            paddingBottom: titleChromePad,
            borderBottom: `3px solid ${theme.card_border}`,
            marginBottom: titleChromeMargin,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily,
                fontSize: 60,
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
                fontSize: 48,
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
              fontSize: 24,
              fontWeight: 600,
              color: theme.text_muted,
              whiteSpace: "nowrap",
            }}
          >
            {audioDriven && frame >= entranceDone ? `${Math.min(active + 1, count)} / ${count}` : ""}
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
              gap: useColumns ? 70 : 0,
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
