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
  activeIndex,
  breathe,
  rotatingGradient,
} from "./animationHelpers";

interface TimelineSceneProps {
  title: string;
  events: {
    date: string;
    label: string;
  }[];
  audioFile: string;
}

export const TimelineScene: React.FC<TimelineSceneProps> = ({
  title,
  events,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const count = events.length;

  // Layout constants
  const timelineY = Math.round(height * 0.5);
  const timelineLeft = Math.round(width * 0.094);
  const timelineRight = Math.round(width * 0.906);
  const timelineWidth = timelineRight - timelineLeft;
  const _nodeRadius = 8;

  // Timing
  const lineDrawDuration = 30;
  const nodeBaseDelay = 25;
  const nodeGap = 10;
  const entranceDone = nodeBaseDelay + count * nodeGap + 15;
  const active = activeIndex(frame, entranceDone, durationInFrames, count);

  // Background
  const bgAngle = rotatingGradient(frame, durationInFrames, 135, 60);

  // Timeline draw progress (0→1)
  const lineProgress = interpolate(
    frame,
    [5, 5 + lineDrawDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${bgAngle}deg, ${theme.dark_bg_from} 0%, ${theme.dark_bg_to} 100%)`,
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
        {/* Title */}
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 0,
            width: "100%",
            textAlign: "center",
            opacity: fadeIn(frame, 0, 20),
            transform: `translateY(${slideIn(frame, fps, 0, 40)}px)`,
          }}
        >
          <span
            style={{
              fontFamily,
              fontSize: 52,
              fontWeight: 700,
              color: theme.text_on_bg,
            }}
          >
            {title}
          </span>
        </div>

        {/* Horizontal timeline line with glow */}
        <div
          style={{
            position: "absolute",
            top: timelineY - 2,
            left: timelineLeft,
            width: timelineWidth * lineProgress,
            height: 4,
            borderRadius: 2,
            background: `linear-gradient(90deg, ${theme.brand_primary}, ${theme.brand_highlight})`,
            boxShadow: `0 0 12px ${theme.brand_primary}80, 0 0 30px ${theme.brand_primary}40`,
          }}
        />
        {/* Dimmed track behind */}
        <div
          style={{
            position: "absolute",
            top: timelineY - 1,
            left: timelineLeft,
            width: timelineWidth,
            height: 2,
            borderRadius: 1,
            background: theme.card_border,
          }}
        />

        {/* Nodes and cards */}
        {events.map((event, i) => {
          const x =
            count === 1
              ? timelineLeft + timelineWidth / 2
              : timelineLeft + (i / (count - 1)) * timelineWidth;
          const isAbove = i % 2 === 0;
          const nodeDelay = staggerDelay(nodeBaseDelay, i, nodeGap);
          const isActive = i === active && frame >= entranceDone;
          const isReached = i <= active && frame >= entranceDone;

          // Node entrance scale (spring)
          const nodeSpring = spring({
            frame: Math.max(0, frame - nodeDelay),
            fps,
            config: { damping: 12, mass: 0.6, stiffness: 120 },
          });
          const nodeScale = interpolate(nodeSpring, [0, 1], [0, 1]);

          // Active node breathing
          const activeScale = isActive ? breathe(frame, 18, 0.15) : 1;
          const finalNodeScale = nodeScale * activeScale;

          // Node glow
          const nodeColor = isReached ? theme.brand_primary : theme.text_muted;
          const nodeSize = isActive ? 22 : 16;
          const glowIntensity = isActive ? 1 : isReached ? 0.4 : 0;

          // Card animation
          const cardDelay = nodeDelay + 6;
          const cardOpacity = fadeIn(frame, cardDelay, 15);
          const cardBounce = slideIn(
            frame,
            fps,
            cardDelay,
            isAbove ? -60 : 60,
            { damping: 12, mass: 0.7 }
          );

          // Card highlight for active
          const cardBg = isActive
            ? theme.card_bg
            : isReached
              ? theme.overlay_subtle
              : theme.overlay_subtle;
          const _cardBorder = isActive
            ? `1px solid ${theme.brand_primary}80`
            : `1px solid ${theme.card_border}`;
          const cardShadow = isActive
            ? `0 0 20px ${theme.brand_primary}40, 0 4px 16px rgba(0,0,0,0.3)`
            : "0 2px 8px rgba(0,0,0,0.2)";
          const textOpacity = isActive ? 1 : isReached ? 0.7 : 0.5;

          // Card position offsets
          const cardTop = isAbove ? timelineY - 180 : timelineY + 40;

          return (
            <React.Fragment key={i}>
              {/* Connector line from node to card */}
              <div
                style={{
                  position: "absolute",
                  left: x - 1,
                  top: isAbove ? timelineY - 140 + 10 : timelineY + 10,
                  width: 2,
                  height: isAbove ? 130 : 30,
                  background: `linear-gradient(${isAbove ? "180deg" : "0deg"}, ${nodeColor}60, transparent)`,
                  opacity: cardOpacity,
                  transformOrigin: isAbove ? "bottom center" : "top center",
                  transform: `scaleY(${nodeScale})`,
                }}
              />

              {/* Node */}
              <div
                style={{
                  position: "absolute",
                  left: x - nodeSize / 2,
                  top: timelineY - nodeSize / 2,
                  width: nodeSize,
                  height: nodeSize,
                  borderRadius: "50%",
                  background: nodeColor,
                  transform: `scale(${finalNodeScale})`,
                  boxShadow:
                    glowIntensity > 0
                      ? `0 0 ${12 * glowIntensity}px ${nodeColor}, 0 0 ${24 * glowIntensity}px ${nodeColor}60`
                      : "none",
                  border: isActive ? `2px solid ${theme.text_on_bg}` : "none",
                }}
              />

              {/* Card: date + label */}
              <div
                style={{
                  position: "absolute",
                  left: x - 125,
                  top: cardTop,
                  width: 250,
                  opacity: cardOpacity,
                  transform: `translateY(${cardBounce}px)`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {/* Date label */}
                <div
                  style={{
                    fontFamily,
                    fontSize: 20,
                    fontWeight: 600,
                    color: isActive ? theme.brand_primary : theme.text_on_bg_muted,
                    opacity: textOpacity,
                    order: isAbove ? 0 : 1,
                  }}
                >
                  {event.date}
                </div>

                {/* Event description card */}
                <div
                  style={{
                    fontFamily,
                    fontSize: 28,
                    fontWeight: 500,
                    color: theme.text_on_bg,
                    opacity: textOpacity,
                    background: cardBg,
                    borderRadius: 14,
                    padding: "14px 18px",
                    maxWidth: 250,
                    textAlign: "center",
                    lineHeight: 1.35,
                    boxShadow: cardShadow,
                    backdropFilter: "blur(8px)",
                    order: isAbove ? 1 : 0,
                    transform: isActive
                      ? `scale(${breathe(frame, 22, 0.02)})`
                      : "none",
                  }}
                >
                  {event.label}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Left fade mask */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 160,
            height: "100%",
            background: `linear-gradient(90deg, ${theme.dark_bg_from}, transparent)`,
            pointerEvents: "none",
          }}
        />
        {/* Right fade mask */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 160,
            height: "100%",
            background: `linear-gradient(270deg, ${theme.dark_bg_to}, transparent)`,
            pointerEvents: "none",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
