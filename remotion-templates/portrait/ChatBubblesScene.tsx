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
  activeIndex,
  float,
  rotatingGradient,
} from "./animationHelpers";

interface ChatBubblesSceneProps {
  topic: string;
  messages: {
    author: string;
    text: string;
    side: "left" | "right";
    upvotes?: string;
  }[];
  audioFile: string;
  narration?: string;
}

export const ChatBubblesScene: React.FC<ChatBubblesSceneProps> = ({
  topic,
  messages,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const LEFT_COLOR = theme.brand_primary;
  const RIGHT_COLOR = theme.brand_highlight;

  // --- Timing: spread bubble entrances across first 40% of segment ---
  const TITLE_START = 3;
  const BUBBLES_BASE = 15;
  const STAGGER_GAP = Math.max(18, Math.floor((durationInFrames * 0.35) / Math.max(messages.length, 1)));

  const count = messages.length;
  const entranceDone = BUBBLES_BASE + count * STAGGER_GAP + 15;
  const activeIdx = activeIndex(frame, entranceDone, durationInFrames, count);

  // --- Background ---
  const bgAngle = rotatingGradient(frame, durationInFrames, 135, 120);

  // Scroll offset: push bubbles up as new ones appear so ~3-4 are visible
  const MAX_VISIBLE = 4;
  const BUBBLE_HEIGHT = 160;
  const BUBBLE_GAP = 20;
  const BUBBLE_STEP = BUBBLE_HEIGHT + BUBBLE_GAP;

  const getScrollOffset = (): number => {
    if (count <= MAX_VISIBLE) return 0;
    // During entrance, scroll as bubbles appear
    const lastVisibleIdx = Math.min(count - 1, MAX_VISIBLE - 1);
    const scrollStartFrame = staggerDelay(BUBBLES_BASE, lastVisibleIdx + 1, STAGGER_GAP);

    if (frame < scrollStartFrame) return 0;

    // During narration, follow the active bubble
    if (frame >= entranceDone) {
      const targetScroll = Math.max(0, activeIdx - MAX_VISIBLE + 2) * BUBBLE_STEP;
      const maxScroll = Math.max(0, count - MAX_VISIBLE) * BUBBLE_STEP;
      return Math.min(targetScroll, maxScroll);
    }

    // During entrance after MAX_VISIBLE, scroll to keep new bubbles visible
    const entranceProgress = interpolate(
      frame,
      [scrollStartFrame, entranceDone],
      [0, Math.max(0, count - MAX_VISIBLE) * BUBBLE_STEP],
      { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const },
    );
    return entranceProgress;
  };

  const scrollOffset = getScrollOffset();

  const renderBubble = (
    msg: { author: string; text: string; side: "left" | "right"; upvotes?: string },
    index: number,
  ) => {
    const entrance = staggerDelay(BUBBLES_BASE, index, STAGGER_GAP);
    const isLeft = msg.side === "left";
    const accentColor = isLeft ? LEFT_COLOR : RIGHT_COLOR;

    // Entrance: slide from left/right with large distance
    const slideY = slideIn(frame, fps, entrance, 200, { damping: 12, mass: 0.9 });
    const slideX = isLeft
      ? slideIn(frame, fps, entrance, -150, { damping: 14, mass: 0.8 })
      : slideIn(frame, fps, entrance, 150, { damping: 14, mass: 0.8 });
    const opacity = fadeIn(frame, entrance, 18);

    // Active state
    const isActive = frame >= entranceDone && index === activeIdx;
    const isPast = frame >= entranceDone && index < activeIdx;
    const isFuture = frame >= entranceDone && index > activeIdx;

    const cardOpacity = isActive ? 1 : isPast ? 0.5 : isFuture ? 0.35 : 1;
    const cardScale = isActive
      ? 1.06
      : isPast
        ? 0.95
        : 1;

    const floatY = 0;
    const floatX = 0;

    // Typing indicator: show animated dots before the bubble fully appears
    const entranceEnd = entrance + 20;
    const showTyping = frame >= entrance - 10 && frame < entranceEnd && frame >= BUBBLES_BASE;

    return (
      <React.Fragment key={index}>
        {/* Typing indicator */}
        {showTyping && (
          <div
            style={{
              display: "flex",
              justifyContent: isLeft ? "flex-start" : "flex-end",
              width: "100%",
              paddingLeft: isLeft ? 0 : 120,
              paddingRight: isLeft ? 120 : 0,
              opacity: fadeIn(frame, entrance - 10, 8),
            }}
          >
            <div
              style={{
                padding: "16px 28px",
                borderRadius: 20,
                backgroundColor: `${accentColor}18`,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((dotIdx) => (
                <div
                  key={dotIdx}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: accentColor,
                    opacity: 0.3 + Math.sin((frame * 0.3) + dotIdx * 2) * 0.4,
                    transform: `translateY(${Math.sin((frame * 0.4) + dotIdx * 2.5) * 6}px)`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {/* Bubble */}
        <div
          style={{
            display: "flex",
            justifyContent: isLeft ? "flex-start" : "flex-end",
            width: "100%",
            paddingLeft: isLeft ? 0 : 120,
            paddingRight: isLeft ? 120 : 0,
            opacity: opacity * cardOpacity,
            transform: `translateY(${slideY + floatY}px) translateX(${slideX + floatX}px) scale(${cardScale})`,
            transformOrigin: isLeft ? "left center" : "right center",
          }}
        >
        <div
          style={{
            maxWidth: "85%",
            minWidth: "50%",
            padding: "22px 30px",
            borderRadius: isLeft ? "24px 24px 24px 6px" : "24px 24px 6px 24px",
            backgroundColor: isActive
              ? `${accentColor}30`
              : `${accentColor}14`,
            border: `1.5px solid ${isActive ? `${accentColor}70` : `${accentColor}25`}`,
            boxShadow: isActive
              ? `0 0 40px ${accentColor}40, 0 8px 32px rgba(0,0,0,0.3)`
              : "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          {/* Author row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 10,
            }}
          >
            {/* Avatar circle */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily,
                fontSize: 24,
                fontWeight: 700,
                color: "#ffffff",
                flexShrink: 0,
              }}
            >
              {msg.author.charAt(0).toUpperCase()}
            </div>
            <div
              style={{
                fontFamily,
                fontSize: 24,
                fontWeight: 700,
                color: isActive ? theme.text_on_bg : accentColor,
                letterSpacing: 0.3,
              }}
            >
              {msg.author}
            </div>
            {msg.upvotes && (
              <div
                style={{
                  marginLeft: "auto",
                  fontFamily,
                  fontSize: 24,
                  fontWeight: 600,
                  color: isActive ? theme.text_on_bg : theme.text_on_bg_muted,
                  backgroundColor: isActive
                    ? `${accentColor}50`
                    : theme.overlay_subtle,
                  padding: "4px 14px",
                  borderRadius: 12,
                  border: `1px solid ${isActive ? `${accentColor}60` : theme.card_border}`,
                }}
              >
                {msg.upvotes}
              </div>
            )}
          </div>
          {/* Message text */}
          <div
            style={{
              fontFamily,
              fontSize: 24,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? theme.text_on_bg : theme.text_on_bg_muted,
              lineHeight: 1.55,
            }}
          >
            {msg.text}
          </div>
        </div>
        </div>
      </React.Fragment>
    );
  };

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${bgAngle}deg, ${theme.dark_bg_from} 0%, ${theme.dark_bg_mid} 50%, ${theme.dark_bg_to} 100%)`,
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
        {/* === Topic title === */}
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 0,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            opacity: fadeIn(frame, TITLE_START, 15),
            transform: `translateY(${interpolate(
              frame,
              [TITLE_START, TITLE_START + 15],
              [-20, 0],
              { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const },
            )}px)`,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: 40,
              fontWeight: 700,
              color: theme.text_on_bg,
              textAlign: "center",
              padding: "0 60px",
              lineHeight: 1.3,
            }}
          >
            {topic}
          </div>
        </div>

        {/* === Chat bubble area === */}
        <div
          style={{
            position: "absolute",
            top: 120,
            bottom: 40,
            left: 80,
            right: 80,
            overflow: "hidden",
          }}
        >
          {/* Scrollable inner container */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: BUBBLE_GAP,
              transform: `translateY(${-scrollOffset}px)`,
              justifyContent: "center",
              minHeight: "100%",
              paddingTop: 20,
              paddingBottom: 20,
            }}
          >
            {messages.map((msg, i) => renderBubble(msg, i))}
          </div>

          {/* Top fade mask */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 60,
              background: `linear-gradient(180deg, ${theme.dark_bg_from} 0%, transparent 100%)`,
              pointerEvents: "none",
              opacity: scrollOffset > 10 ? 1 : 0,
            }}
          />
          {/* Bottom fade mask */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
              background: `linear-gradient(0deg, ${theme.dark_bg_to} 0%, transparent 100%)`,
              pointerEvents: "none",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
