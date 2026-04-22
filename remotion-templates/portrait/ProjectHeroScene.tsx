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
  breathe,
  float,
  counterValue,
  underlineSweep,
  rotatingGradient,
} from "./animationHelpers";

interface ProjectHeroSceneProps {
  rank: number;
  name: string;
  tagline: string;
  stats: string;
  source: string;
  audioFile: string;
  narration?: string;
}

export const ProjectHeroScene: React.FC<ProjectHeroSceneProps> = ({
  rank,
  name,
  tagline,
  stats,
  source,
  audioFile,
  narration,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const vScale = 2.0;
  const fScale = 1.25;

  const isReversed = rank % 2 === 0;

  // --- Background ---
  const gradAngle = rotatingGradient(frame, durationInFrames, 135, 80);

  const circles = [0, 1, 2, 3, 4].map((i) => {
    const cx = [260, 1620, 960, 180, 1440][i];
    const cy = [180, 740, 380, 620, 280][i];
    return {
      x: cx,
      y: cy,
      size: 150 + i * 80,
      opacity: 0.18,
    };
  });

  // --- Rank entrance ---
  const rankSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const rankEntranceX = interpolate(
    rankSpring,
    [0, 1],
    [isReversed ? 200 : -200, 0],
  );
  const rankOpacity = fadeIn(frame, 0, 15);

  // --- Rank continuous animations ---
  const rankFloat = 0;
  const rankPulse = 1;
  const rankRotation = 0;
  const rankGlow = 1;

  // --- Name entrance + continuous motion ---
  const nameOpacity = fadeIn(frame, 8, 17);
  const nameSlide = slideIn(frame, fps, 8, isReversed ? -120 : 120);
  const nameFloat = 0;
  const nameParallaxX = 0;

  // --- Underline sweep ---
  const ulWidth = underlineSweep(frame, 25, 35);

  // --- Tagline entrance + continuous float ---
  const tagOpacity = fadeIn(frame, 18, 17);
  const tagSlide = slideIn(frame, fps, 18, 50, { damping: 14, mass: 0.8 });
  const tagFloat = float(frame, 16, 22, 1);
  const tagFloatX = 0;

  // --- Stats badge ---
  const badgeOpacity = fadeIn(frame, 30, 15);
  const badgeFloat = 0;
  const statsNum = parseInt(stats.replace(/[^0-9]/g, ""), 10) || 0;
  // Detect the prefix part (e.g. "+") and suffix part (e.g. " ⭐")
  const matchPrefix = stats.match(/^([^0-9]*)/);
  const matchSuffix = stats.match(/[0-9]([^0-9]*)$/);
  const numPrefix = matchPrefix ? matchPrefix[1] : "";
  const numSuffix = matchSuffix ? matchSuffix[1] : "";
  const displayedStats = counterValue(frame, 45, 90, statsNum);
  const badgePulse = breathe(frame, 18, 0.05);

  // --- Source tag ---
  const sourceOpacity = fadeIn(frame, 10, 20);

  // --- Scanning line ---

  // --- Progress & decorative lines ---

  // --- Top decorative line ---
  const topLineWidth = interpolate(frame, [0, 40], [0, 100], {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  });

  const accentColor =
    rank % 2 === 0 ? theme.brand_highlight : theme.brand_primary;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />

      <AbsoluteFill
        style={{
          background: `linear-gradient(${gradAngle}deg, ${theme.dark_bg_from} 0%, ${theme.dark_bg_mid} 45%, ${theme.dark_bg_to} 75%, ${theme.dark_bg_mid} 100%)`,
          overflow: "hidden",
        }}
      >
        {/* Floating gradient circles */}
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
              filter: "blur(35px)",
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Top decorative line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: 3,
            width: `${topLineWidth}%`,
            background: `linear-gradient(90deg, ${accentColor}, ${theme.brand_highlight})`,
            pointerEvents: "none",
          }}
        />


        {/* ====== Full-height content card ====== */}
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
            overflow: "hidden",
          }}
        >
          {/* --- Rank side (25%) --- */}
          <div
            style={{
              flex: "0 0 12%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `linear-gradient(180deg, ${accentColor}08, ${accentColor}15)`,
              borderRight: "none",
              borderLeft: "none",
              borderBottom: `1px solid ${theme.card_border}`,
            }}
          >
            <div
              style={{
                fontFamily,
                fontSize: 150,
                fontWeight: 900,
                color: accentColor,
                opacity: rankOpacity * rankGlow,
                transform: [
                  `translateX(${rankEntranceX}px)`,
                  `translateY(${rankFloat}px)`,
                  `scale(${rankPulse})`,
                  `rotate(${rankRotation}deg)`,
                ].join(" "),
                lineHeight: 1,
                textAlign: "center",
                textShadow: `0 0 40px ${accentColor}50, 0 0 80px ${accentColor}25`,
                userSelect: "none",
              }}
            >
              {rank}
            </div>
          </div>

          {/* --- Content side (75%) --- */}
          <div
            style={{
              flex: "1 1 88%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-evenly",
              padding: "60px 40px 60px",
              gap: 32 * vScale,
            }}
          >
            {/* Source badge */}
            <div
              style={{
                fontFamily,
                fontSize: 32,
                fontWeight: 600,
                color: accentColor,
                opacity: sourceOpacity,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {source} TRENDING #{rank}
            </div>

            {/* Project name + underline sweep */}
            <div style={{ position: "relative", display: "inline-block" }}>
              <div
                style={{
                  fontFamily,
                  fontSize: Math.round(96 * fScale),
                  fontWeight: 700,
                  color: theme.brand_primary,
                  opacity: nameOpacity,
                  transform: `translateX(${nameSlide + nameParallaxX}px) translateY(${nameFloat}px)`,
                  transformOrigin: isReversed ? "right center" : "left center",
                  lineHeight: 1.2,
                }}
              >
                {name}
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: -6,
                  left: isReversed ? "auto" : 0,
                  right: isReversed ? 0 : "auto",
                  height: 4,
                  width: `${ulWidth}%`,
                  backgroundColor: accentColor,
                  borderRadius: 2,
                }}
              />
            </div>

            {/* Tagline */}
            <div
              style={{
                fontFamily,
                fontSize: Math.round(48 * fScale),
                fontWeight: 400,
                color: theme.text_secondary,
                opacity: tagOpacity,
                transform: `translateY(${tagSlide + tagFloat}px) translateX(${tagFloatX}px)`,
                lineHeight: 1.6,
                maxWidth: 1200,
              }}
            >
              {tagline}
            </div>

            {/* Stats badge */}
            {statsNum > 0 && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  marginTop: Math.round(12 * vScale),
                  opacity: badgeOpacity,
                  transform: `scale(${badgePulse}) translateY(${badgeFloat}px)`,
                  transformOrigin: isReversed ? "right center" : "left center",
                }}
              >
                <div
                  style={{
                    fontFamily,
                    fontSize: Math.round(38 * fScale),
                    fontWeight: 700,
                    color: "#ffffff",
                    backgroundColor: theme.status_success,
                    padding: `${Math.round(14 * vScale)}px ${36}px`,
                    borderRadius: 32,
                    boxShadow: `0 0 12px ${theme.status_success}60`,
                    letterSpacing: 0.5,
                  }}
                >
                  {numPrefix}
                  {displayedStats}
                  {numSuffix}
                </div>
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
