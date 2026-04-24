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
import {
  fadeIn,
  slideIn,
  staggerDelay,
  rotatingGradient,
} from "./animationHelpers";

interface DebateSplitSceneProps {
  topic: string;
  proSide: {
    label: string;
    points: string[];
  };
  conSide: {
    label: string;
    points: string[];
  };
  audioFile: string;
  narration?: string;
}

export const DebateSplitScene: React.FC<DebateSplitSceneProps> = ({
  topic,
  proSide,
  conSide,
  audioFile,
  narration,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Use theme brand colors — matches each platform's identity
  const SIDE_A_COLOR = theme.brand_primary;
  const SIDE_B_COLOR = theme.brand_highlight;

  const TITLE_START = 5;
  const POINTS_BASE = 20;
  const STAGGER_GAP = 12;

  const bgAngle = rotatingGradient(frame, durationInFrames, 135, 60);

  const renderSide = (
    side: { label: string; points: string[] },
    color: string,
    direction: "left" | "right",
    startDelay: number,
  ) => {
    const isLeft = direction === "left";
    const labelOpacity = fadeIn(frame, startDelay, 12);
    const labelSlide = slideIn(frame, fps, startDelay, isLeft ? -60 : 60, { damping: 14, mass: 0.8 });

    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          minHeight: 0,
        }}
      >
        {/* Side label bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: labelOpacity,
            transform: `translateX(${labelSlide}px)`,
            marginTop: 32,
            paddingBottom: 8,
            borderBottom: `2px solid ${color}`,
            marginBottom: 4,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: color,
            }}
          />
          <span
            style={{
              fontFamily,
              fontSize: 40,
              fontWeight: 700,
              color: color,
              letterSpacing: 0.5,
            }}
          >
            {side.label}
          </span>
        </div>

        {/* Point cards — natural height with comfortable breathing room */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 32,
            justifyContent: "center",
            minHeight: 0,
          }}
        >
          {side.points.map((text, i) => {
            const delay = staggerDelay(startDelay + 8, i, STAGGER_GAP);
            const opacity = fadeIn(frame, delay, 15);
            const slideOffset = slideIn(frame, fps, delay, isLeft ? -100 : 100, {
              damping: 14,
              mass: 0.8,
            });

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  borderRadius: 14,
                  backgroundColor: theme.background_primary,
                  border: `1px solid ${theme.border}`,
                  overflow: "hidden",
                  opacity,
                  transform: `translateX(${slideOffset}px)`,
                  minHeight: 140,
                }}
              >
                {/* Left color accent stripe */}
                <div
                  style={{
                    width: 5,
                    backgroundColor: color,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    padding: "32px 40px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily,
                      fontSize: 40,
                      fontWeight: 400,
                      color: theme.text_primary,
                      lineHeight: 1.55,
                      wordBreak: "break-word" as const,
                    }}
                  >
                    {text}
                  </span>
                </div>
              </div>
            );
          })}
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
          overflow: "hidden",
          padding: "36px 48px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Topic title */}
        <div
          style={{
            fontFamily,
            fontSize: 50,
            fontWeight: 700,
            color: theme.text_primary,
            textAlign: "center",
            lineHeight: 1.3,
            marginBottom: 20,
            opacity: fadeIn(frame, TITLE_START, 15),
            transform: `translateY(${interpolate(
              frame,
              [TITLE_START, TITLE_START + 15],
              [-20, 0],
              { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const },
            )}px)`,
            flexShrink: 0,
          }}
        >
          {topic}
        </div>

        {/* Main split area — takes all remaining space */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            gap: 36,
            minHeight: 0,
          }}
        >
          {renderSide(proSide, SIDE_A_COLOR, "left", POINTS_BASE)}

          {/* Minimal divider */}
          <div
            style={{
              ...{ width: 1, alignSelf: "stretch" as const },
              backgroundColor: theme.border,
              flexShrink: 0,
            }}
          />

          {renderSide(conSide, SIDE_B_COLOR, "right", POINTS_BASE + 5)}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
