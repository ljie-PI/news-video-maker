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

interface ProjectIntroSceneProps {
  rank: number;
  name: string;
  tagline: string;
  stars: string;
  audioFile: string;
  narration?: string;
}

export const ProjectIntroScene: React.FC<ProjectIntroSceneProps> = ({
  rank,
  name,
  tagline,
  stars,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height: _height } = useVideoConfig();

  // Alternate layout: odd ranks left-to-right, even ranks right-to-left
  const isReversed = rank % 2 === 0;

  // Alternate color scheme
  const isDark = false;
  const accentColor = rank % 2 === 0 ? theme.brand_highlight : theme.brand_primary;

  // Entrance animations
  const rankSpring = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const rankX = interpolate(rankSpring, [0, 1], [isReversed ? 200 : -200, 0]);
  const rankOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const nameSpring = spring({ frame: Math.max(0, frame - 8), fps, config: { damping: 14, stiffness: 70 } });
  const nameScale = interpolate(nameSpring, [0, 1], [0.85, 1]);
  const nameOpacity = interpolate(frame, [8, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tagSpring = spring({ frame: Math.max(0, frame - 18), fps, config: { damping: 14, stiffness: 70 } });
  const taglineY = interpolate(tagSpring, [0, 1], [40, 0]);
  const taglineOpacity = interpolate(frame, [18, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badgeOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // CONTINUOUS animations - large amplitude
  const rankFloat = 0;
  const rankPulse = 1;
  const rankRotate = 0;
  const nameGlow = 1;
  const bgGradientAngle = (frame / durationInFrames) * 80;

  // Animated star counter (counts up from 0 to displayed value)
  const starsNum = parseInt(stars.replace(/[^0-9]/g, "")) || 0;
  const counterProgress = interpolate(frame, [45, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const displayedStars = Math.floor(starsNum * counterProgress);

  // Scanning line effect

  // Progress bar

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />
      <AbsoluteFill
        style={{
          background: isDark
            ? `linear-gradient(${135 + bgGradientAngle}deg, ${theme.dark_bg_from} 0%, ${theme.dark_bg_mid} 50%, ${theme.dark_bg_to} 100%)`
            : `linear-gradient(${135 + bgGradientAngle}deg, hsl(210, 15%, 97%) 0%, ${theme.background_secondary} 50%, hsl(220, 15%, 95%) 100%)`,
          display: "flex",
          flexDirection: isReversed ? "row-reverse" : "row",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 80px",
          gap: 60,
          overflow: "hidden",
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

        {/* Rank number */}
        <div
          style={{
            fontFamily,
            fontSize: 180,
            fontWeight: 800,
            color: accentColor,
            opacity: rankOpacity * nameGlow,
            transform: `translateX(${rankX}px) translateY(${rankFloat}px) scale(${rankPulse}) rotate(${rankRotate}deg)`,
            lineHeight: 1,
            minWidth: 200,
            textAlign: "center",
            textShadow: isDark ? `0 0 30px ${accentColor}40` : "none",
          }}
        >
          {rank}
        </div>

        {/* Project info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: 1,
          }}
        >
          {/* Name with underline sweep */}
          <div style={{ position: "relative", display: "inline-block" }}>
            <div
              style={{
                fontFamily,
                fontSize: 72,
                fontWeight: 700,
                color: isDark ? "#ffffff" : theme.brand_primary,
                opacity: nameOpacity,
                transform: `scale(${nameScale})`,
                transformOrigin: isReversed ? "right center" : "left center",
                lineHeight: 1.2,
              }}
            >
              {name}
            </div>
            {/* Underline sweep */}
            <div
              style={{
                position: "absolute",
                bottom: -4,
                left: 0,
                height: 4,
                width: `${interpolate(frame, [25, 60], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%`,
                backgroundColor: accentColor,
                borderRadius: 2,
              }}
            />
          </div>

          <div
            style={{
              fontFamily,
              fontSize: 36,
              fontWeight: 400,
              color: isDark ? "#8b949e" : theme.text_secondary,
              opacity: taglineOpacity,
              transform: `translateY(${taglineY}px)`,
              lineHeight: 1.4,
              wordBreak: "break-word",
              whiteSpace: "normal",
            }}
          >
            {tagline}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 8,
              opacity: badgeOpacity,
              transform: "none",
              transformOrigin: isReversed ? "right center" : "left center",
            }}
          >
            {starsNum > 0 && (
              <div
                style={{
                  fontFamily,
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#ffffff",
                  backgroundColor: theme.brand_primary,
                  padding: "6px 20px",
                  borderRadius: 20,
                  boxShadow: `0 0 10px ${theme.brand_primary}60`,
                }}
              >
                ★ +{displayedStars}
              </div>
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
