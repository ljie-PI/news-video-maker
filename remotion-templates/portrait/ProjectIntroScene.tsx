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

  // Static: no continuous sin-driven motion — matches landscape behavior.
  const rankFloat = 0;
  const rankPulse = 1;
  const rankRotate = 0;
  const nameGlow = 1;
  const bgGradientAngle = (frame / durationInFrames) * 80;

  const starsNum = parseInt(stars.replace(/[^0-9]/g, "")) || 0;
  const counterProgress = interpolate(frame, [45, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const displayedStars = Math.floor(starsNum * counterProgress);

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${135 + bgGradientAngle}deg, hsl(210, 15%, 97%) 0%, ${theme.background_secondary} 50%, hsl(220, 15%, 95%) 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 60px",
          gap: 40,
          overflow: "hidden",
        }}
      >
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
            textShadow: "none",
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
                color: theme.brand_primary,
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
              color: theme.text_secondary,
              opacity: taglineOpacity,
              transform: `translateY(${taglineY}px)`,
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
                transform: "none",
              }}
            >
              <div
                style={{
                  fontFamily,
                  fontSize: 32,
                  fontWeight: 600,
                  color: "#ffffff",
                  backgroundColor: theme.status_success,
                  padding: "10px 28px",
                  borderRadius: 24,
                  boxShadow: `0 0 16px ${theme.status_success}90`,
                }}
              >
                ★ +{displayedStars}
              </div>
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
