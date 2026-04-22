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
  typewriterCount,
  underlineSweep,
  rotatingGradient,
} from "./animationHelpers";

interface KeyInsightSceneProps {
  headline: string;
  explanation: string;
  icon?: string;
  accentColor?: string;
  audioFile: string;
  narration?: string;
}

export const KeyInsightScene: React.FC<KeyInsightSceneProps> = ({
  headline,
  explanation,
  icon = "💡",
  accentColor = theme.brand_primary,
  audioFile,
  narration,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const vScale = 2.0;
  const fScale = 1.25;

  // --- Animation timing ---
  const HEADLINE_START = 4;
  const FRAMES_PER_CHAR = 2;
  const headlineChars = headline.length;
  const headlineEnd = HEADLINE_START + headlineChars * FRAMES_PER_CHAR;
  const DIVIDER_START = headlineEnd + 5;
  const EXPLANATION_START = DIVIDER_START + 30;
  const SENTENCE_STAGGER = 20;
  const ENTRANCE_DONE = headlineEnd + 10;

  // Split explanation into sentences
  const sentences = explanation
    .split(/(?<=[。！？.!?])\s*/)
    .filter((s) => s.trim().length > 0);

  // --- Animated values ---
  const iconScale = frame > ENTRANCE_DONE
    ? 1
    : interpolate(frame, [0, 15], [0.85, 1], { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const });
  const iconRotate = 0;
  const visibleHeadlineChars = typewriterCount(
    frame,
    HEADLINE_START,
    headlineChars,
    FRAMES_PER_CHAR,
  );
  const cursorVisible =
    frame >= HEADLINE_START &&
    (visibleHeadlineChars < headlineChars || Math.floor(frame / 15) % 2 === 0);
  const dividerWidth = underlineSweep(frame, DIVIDER_START, 35);
  const bgAngle = rotatingGradient(frame, durationInFrames, 135, 80);

  const headlineFloat = 0;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${bgAngle}deg, ${theme.dark_bg_from} 0%, ${theme.dark_bg_mid} 45%, ${theme.dark_bg_to} 100%)`,
          overflow: "hidden",
        }}
      >
        {/* Bottom-right watermark icon */}
        <div
          style={{
            position: "absolute",
            right: 60,
            bottom: 40,
            fontSize: 150,
            opacity: 0.05,
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {icon}
        </div>

        {/* Main layout with background card */}
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
            width: "auto",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {/* Content column */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-evenly",
              padding: "40px 60px 40px 50px",
              gap: Math.round(36 * vScale),
              alignItems: "center",
            }}
          >
            {/* Portrait icon — small, centered, above headline */}
            <div
              style={{
                fontSize: 80,
                lineHeight: 1,
                transform: `scale(${iconScale}) rotate(${iconRotate}deg)`,
                filter: `drop-shadow(0 0 30px ${accentColor}80)`,
                opacity: fadeIn(frame, 0, 15),
              }}
            >
              {icon}
            </div>
            {/* Headline */}
            <div
              style={{
                fontFamily,
                fontSize: Math.round(77 * fScale),
                fontWeight: 700,
                color: theme.text_on_bg,
                lineHeight: 1.35,
                minHeight: 80,
                transform: `translateY(${headlineFloat}px)`,
              }}
            >
              {headline.slice(0, visibleHeadlineChars)}
              {cursorVisible && (
                <span
                  style={{
                    display: "inline-block",
                    width: 3,
                    height: 62,
                    backgroundColor: accentColor,
                    marginLeft: 4,
                    verticalAlign: "text-bottom",
                  }}
                />
              )}
            </div>

            {/* Divider */}
            <div
              style={{
                width: `${dividerWidth}%`,
                height: 3,
                backgroundColor: accentColor,
                borderRadius: 2,
                boxShadow: `0 0 12px ${accentColor}60`,
              }}
            />

            {/* Explanation sentences */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: Math.round(20 * vScale),
              }}
            >
              {sentences.map((sentence, i) => {
                const sentenceStart = EXPLANATION_START + i * SENTENCE_STAGGER;
                const opacity = fadeIn(frame, sentenceStart, 18);
                const translateY = interpolate(
                  frame,
                  [sentenceStart, sentenceStart + 18],
                  [25, 0],
                  {
                    extrapolateLeft: "clamp" as const,
                    extrapolateRight: "clamp" as const,
                  },
                );
                const microFloat = 0;
                const microFloatX = 0;

                return (
                  <div
                    key={i}
                    style={{
                      fontFamily,
                      fontSize: 52,
                      fontWeight: 400,
                      color: theme.text_secondary,
                      lineHeight: 1.7,
                      opacity,
                      transform: `translateY(${translateY + microFloat}px) translateX(${microFloatX}px)`,
                    }}
                  >
                    {sentence}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
