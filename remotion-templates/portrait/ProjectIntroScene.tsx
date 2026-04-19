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
  const { fps, durationInFrames } = useVideoConfig();

  const isDark = rank % 3 === 0;
  const accentColor = rank % 2 === 0 ? theme.brand_highlight : theme.brand_primary;

  const rankSpring = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const rankY = interpolate(rankSpring, [0, 1], [-120, 0]);
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

  const rankFloat = Math.sin(frame / 18) * 25;
  const rankPulse = 1 + Math.sin(frame / 12) * 0.08;
  const rankRotate = Math.sin(frame / 40) * 3;
  const nameGlow = Math.sin(frame / 25) * 0.3 + 0.7;
  const bgGradientAngle = (frame / durationInFrames) * 80;

  const starsNum = parseInt(stars.replace(/[^0-9]/g, "")) || 0;
  const counterProgress = interpolate(frame, [45, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const displayedStars = Math.floor(starsNum * counterProgress);

  const scanY = (frame * 4) % 2000;
  const progress = frame / durationInFrames;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />
      <AbsoluteFill
        style={{
          background: isDark
            ? `linear-gradient(${135 + bgGradientAngle}deg, ${theme.dark_bg_from} 0%, #1a1e2e 50%, ${theme.dark_bg_to} 100%)`
            : `linear-gradient(${135 + bgGradientAngle}deg, hsl(210, 15%, 97%) 0%, ${theme.background_secondary} 50%, hsl(220, 15%, 95%) 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 60px",
          gap: 40,
          overflow: "hidden",
        }}
      >
        {/* Scanning line */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: scanY,
            width: "100%",
            height: 2,
            background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
          }}
        />

        {/* Rank number — centered top */}
        <div
          style={{
            fontFamily,
            fontSize: 220,
            fontWeight: 800,
            color: accentColor,
            opacity: rankOpacity * nameGlow,
            transform: `translateY(${rankY + rankFloat}px) scale(${rankPulse}) rotate(${rankRotate}deg)`,
            lineHeight: 1,
            textAlign: "center",
            textShadow: isDark ? `0 0 40px ${accentColor}40` : "none",
          }}
        >
          {rank}
        </div>

        {/* Project info — stacked vertically */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            width: "100%",
            padding: "0 20px",
          }}
        >
          {/* Name */}
          <div style={{ position: "relative", textAlign: "center" }}>
            <div
              style={{
                fontFamily,
                fontSize: 64,
                fontWeight: 700,
                color: isDark ? "#ffffff" : theme.brand_primary,
                opacity: nameOpacity,
                transform: `scale(${nameScale})`,
                lineHeight: 1.2,
                textAlign: "center",
              }}
            >
              {name}
            </div>
            <div
              style={{
                position: "absolute",
                bottom: -6,
                left: "10%",
                height: 4,
                width: `${interpolate(frame, [25, 60], [0, 80], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}%`,
                backgroundColor: accentColor,
                borderRadius: 2,
              }}
            />
          </div>

          {/* Tagline */}
          <div
            style={{
              fontFamily,
              fontSize: 36,
              fontWeight: 400,
              color: isDark ? "#8b949e" : theme.text_secondary,
              opacity: taglineOpacity,
              transform: `translateY(${taglineY + Math.sin(frame / 35) * 5}px)`,
              lineHeight: 1.4,
              textAlign: "center",
              maxWidth: "90%",
            }}
          >
            {tagline}
          </div>

          {/* Stars badge */}
          {starsNum > 0 && (
            <div
              style={{
                opacity: badgeOpacity,
                transform: `scale(${1 + Math.sin(frame / 18) * 0.04})`,
              }}
            >
              <div
                style={{
                  fontFamily,
                  fontSize: 28,
                  fontWeight: 600,
                  color: "#ffffff",
                  backgroundColor: theme.status_success,
                  padding: "8px 28px",
                  borderRadius: 24,
                  boxShadow: `0 0 ${10 + Math.sin(frame / 12) * 8}px ${theme.status_success}60`,
                }}
              >
                ★ +{displayedStars}
              </div>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 4,
            backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${theme.status_success})`,
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
