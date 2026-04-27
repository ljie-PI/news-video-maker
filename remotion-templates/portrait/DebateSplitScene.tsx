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

// Reference card minHeight (px) at the 1440-tall portrait baseline. Scaled by
// `height / 1440` at use sites so other resolutions stay proportional.
const DEFAULT_CARD_MIN_HEIGHT = 150;
// Moderate (count=3) tier caps. minHeight is lower so flexShrink can reclaim
// space when most cards happen to be 1-line; maxHeight bounds 2-line cards
// so 3 × 2-line stacks (~492 px) still fit the ~498 px points area.
const MODERATE_CARD_MIN_HEIGHT = 100;
const MODERATE_CARD_MAX_HEIGHT = 160;
// Hard maxHeight (px) ceiling applied only in dense mode so a 3+ line runaway
// message can't push past its column. Cards set `overflow: 'hidden'`, so
// excess text clips visually rather than overlapping the opposing side.
const DENSE_CARD_MAX_HEIGHT = 130;

interface DensityConfig {
  cardFontSize: number;
  cardLineHeight: number;
  cardPaddingV: number;
  cardPaddingH: number;
  cardGap: number;
  cardMinHeight: number;
  cardMaxHeight: number | undefined;
  headerMarginTop: number;
  pointsJustify: "center" | "flex-start";
  // Card content alignment. Anchors to flex-start in dense mode so a clipped
  // overflow hides the tail of the message rather than chopping both ends off
  // a vertically-centered block.
  cardAlignItems: "center" | "flex-start";
  // flexShrink lets dense cards compress below maxHeight when text is short
  // and stack space is tight. Default mode keeps the rigid layout (0).
  cardFlexShrink: 0 | 1;
}

const getDensityConfig = (maxPoints: number, height: number): DensityConfig => {
  // Three font tiers, all within the Body typography band (32–40):
  // ≤2 → 40 (upper Body), =3 → 36 (mid Body), ≥4 → 32 (lower Body).
  // count=3 sits in its own "moderate" tier so multi-line cards stop
  // overflowing into the opposing side's label, while count≥4 stays the
  // densest option.
  if (maxPoints >= 4) {
    return {
      cardFontSize: 32,
      cardLineHeight: 1.45,
      cardPaddingV: 12,
      cardPaddingH: 22,
      cardGap: 16,
      // Explicit 0 (not "auto") because flex items default to
      // min-height: auto, which would prevent shrinking and neutralize
      // the cardMaxHeight cap + cardFlexShrink: 1 below.
      cardMinHeight: 0,
      cardMaxHeight: Math.round(DENSE_CARD_MAX_HEIGHT * height / 1440),
      headerMarginTop: 12,
      pointsJustify: "flex-start",
      cardAlignItems: "flex-start",
      cardFlexShrink: 1,
    };
  }
  if (maxPoints === 3) {
    return {
      cardFontSize: 36,
      cardLineHeight: 1.5,
      cardPaddingV: 20,
      cardPaddingH: 30,
      cardGap: 24,
      cardMinHeight: Math.round(MODERATE_CARD_MIN_HEIGHT * height / 1440),
      cardMaxHeight: Math.round(MODERATE_CARD_MAX_HEIGHT * height / 1440),
      headerMarginTop: 18,
      pointsJustify: "center",
      cardAlignItems: "center",
      cardFlexShrink: 1,
    };
  }
  return {
    cardFontSize: 40,
    cardLineHeight: 1.55,
    cardPaddingV: 32,
    cardPaddingH: 36,
    cardGap: 36,
    cardMinHeight: Math.round(DEFAULT_CARD_MIN_HEIGHT * height / 1440),
    cardMaxHeight: undefined,
    headerMarginTop: 24,
    pointsJustify: "center",
    cardAlignItems: "center",
    cardFlexShrink: 0,
  };
};

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
  const { fps, durationInFrames, height } = useVideoConfig();

  // Use theme brand colors — matches each platform's identity
  const SIDE_A_COLOR = theme.brand_primary;
  const SIDE_B_COLOR = theme.brand_highlight;

  const TITLE_START = 5;
  const POINTS_BASE = 20;
  const STAGGER_GAP = 12;

  // Density-aware sizing. Each side gets ~600 px tall in 1080×1440 portrait;
  // with the original two-tier layout, count=3 + multi-line messages spilled
  // into the opposing side's label, while count≥4 dropped to 28 px (Caption
  // tier) and felt undersized. Three tiers anchored within Body (32–40):
  //   ≤2  → 40 default, generous breathing room
  //   =3  → 36 moderate, smaller padding/gap and bounded card heights
  //   ≥4  → 32 dense, tight padding and lowest card cap
  const maxPoints = Math.max(proSide.points.length, conSide.points.length);
  const density = getDensityConfig(maxPoints, height);

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
          gap: 14,
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
            marginTop: density.headerMarginTop,
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
              fontSize: 52,
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
            gap: density.cardGap,
            justifyContent: density.pointsJustify,
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
                  minHeight: density.cardMinHeight,
                  maxHeight: density.cardMaxHeight,
                  flexShrink: density.cardFlexShrink,
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
                    padding: `${density.cardPaddingV}px ${density.cardPaddingH}px`,
                    display: "flex",
                    alignItems: density.cardAlignItems,
                  }}
                >
                  <span
                    style={{
                      fontFamily,
                      fontSize: density.cardFontSize,
                      fontWeight: 400,
                      color: theme.text_primary,
                      lineHeight: density.cardLineHeight,
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
          padding: "50px 28px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Topic title */}
        <div
          style={{
            fontFamily,
            fontSize: 60,
            fontWeight: 700,
            color: theme.text_primary,
            textAlign: "center",
            lineHeight: 1.3,
            marginBottom: 24,
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
            flexDirection: "column",
            gap: 16,
            minHeight: 0,
          }}
        >
          {renderSide(proSide, SIDE_A_COLOR, "left", POINTS_BASE)}

          {/* Minimal divider */}
          <div
            style={{
              ...{ height: 1, width: "50%", alignSelf: "center" as const },
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
