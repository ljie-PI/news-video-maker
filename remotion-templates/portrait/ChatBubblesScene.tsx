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
  activeIndex,
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

const WIDE_CHAR_RE = /[^\x00-\x7F]/u;

// Estimate how many wrapped lines the given text will occupy inside a
// bubble of the given char-per-line capacity. Treats every non-ASCII char
// as full-width (CJK ideographs/kana/hangul/full-width punctuation/emoji)
// and ASCII as roughly half-width.
const estimateLines = (text: string, charsPerLine: number): number => {
  let units = 0;
  for (const ch of text) units += WIDE_CHAR_RE.test(ch) ? 1 : 1 / 2.2;
  return Math.max(1, Math.ceil(units / Math.max(1, charsPerLine)));
};

export const ChatBubblesScene: React.FC<ChatBubblesSceneProps> = ({
  topic,
  messages,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const LEFT_COLOR = theme.brand_primary;
  const RIGHT_COLOR = theme.brand_highlight;

  // --- Timing: spread bubble entrances across first ~35% of segment ---
  const TITLE_START = 3;
  const BUBBLES_BASE = 15;
  const count = messages.length;
  const STAGGER_GAP = Math.max(
    18,
    Math.floor((durationInFrames * 0.35) / Math.max(count, 1)),
  );
  const entranceDone = BUBBLES_BASE + count * STAGGER_GAP + 15;
  const activeIdx = activeIndex(frame, entranceDone, durationInFrames, count);

  // --- Background ---
  const bgAngle = rotatingGradient(frame, durationInFrames, 135, 120);

  // === Layout constants ===
  const PANEL_PAD_X = 80;
  const PANEL_PAD_BOTTOM = 40;
  const BUBBLE_GAP = 40;
  const BUBBLE_PADDING_V = 100; // 50 top + 50 bottom
  const BUBBLE_HEADER_H = 46; // avatar 36 + marginBottom 10
  const BUBBLE_LINE_H = 50; // fontSize 32 × lineHeight ~1.55

  // Title geometry (self-adapting to number of wrap lines)
  const TITLE_TOP = 80;
  const TITLE_FS = 60;
  const TITLE_LINE_H = Math.round(TITLE_FS * 1.3);
  const TITLE_PAD_X = 60;
  const titleTextWidth = Math.max(1, width - 2 * TITLE_PAD_X);
  const titleCharsPerLine = Math.max(1, Math.floor(titleTextWidth / TITLE_FS));
  const titleLines = estimateLines(topic, titleCharsPerLine);
  const titleHeight = titleLines * TITLE_LINE_H;

  // Bubble area geometry. Clamp bubbleAreaTop so we never starve the
  // viewport: very long topics could otherwise push the bubble area down to
  // ~0 px tall and break scroll math.
  const MIN_VIEWPORT_H = 200;
  const idealBubbleAreaTop = TITLE_TOP + titleHeight + 40;
  const bubbleAreaLeft = PANEL_PAD_X;
  const bubbleAreaRight = PANEL_PAD_X;
  const bubbleAreaWidth = width - bubbleAreaLeft - bubbleAreaRight;
  const bubbleAreaBottom = PANEL_PAD_BOTTOM;
  const maxBubbleAreaTop = Math.max(
    0,
    height - bubbleAreaBottom - MIN_VIEWPORT_H,
  );
  const bubbleAreaTop = Math.min(idealBubbleAreaTop, maxBubbleAreaTop);
  const viewportH = Math.max(1, height - bubbleAreaTop - bubbleAreaBottom);

  // Per-bubble real width and text capacity. Each bubble row has 120 px of
  // side padding (left or right) for the cross-side gutter, so the row's
  // flex content width is (bubbleAreaWidth - ROW_SIDE_PAD) and the bubble's
  // 85% maxWidth resolves against that, not against the full area.
  const ROW_SIDE_PAD = 120;
  const BUBBLE_MAX_W_RATIO = 0.85;
  const BUBBLE_PADDING_X = 30; // 30 left + 30 right
  const rowContentW = Math.max(1, bubbleAreaWidth - ROW_SIDE_PAD);
  const bubbleMaxW = Math.floor(rowContentW * BUBBLE_MAX_W_RATIO);
  const bubbleTextW = Math.max(1, bubbleMaxW - 2 * BUBBLE_PADDING_X);
  const bubbleCharsPerLine = Math.max(1, Math.floor(bubbleTextW / 32));

  // Estimated bubble heights. The bubbles themselves render in natural CSS
  // flow (flex column + gap), so layout cannot drift if the estimate is
  // imperfect — these heights only feed the scroll math and the typing
  // indicator's vertical anchor (both of which can tolerate small errors).
  const bubbleHeights = messages.map(
    (m) =>
      BUBBLE_PADDING_V +
      BUBBLE_HEADER_H +
      estimateLines(m.text, bubbleCharsPerLine) * BUBBLE_LINE_H,
  );
  const cumTop: number[] = [];
  {
    let acc = 0;
    for (let i = 0; i < count; i++) {
      cumTop.push(acc);
      acc += bubbleHeights[i] + BUBBLE_GAP;
    }
  }
  const totalH =
    count > 0 ? cumTop[count - 1] + bubbleHeights[count - 1] : 0;

  // Scroll: prefer "active bubble's top at 30% from viewport top" (idealTop),
  // but if the bubble fits inside the viewport, also enforce that its bottom
  // stays inside (so a 70% × viewport-tall bubble doesn't get its tail
  // clipped). For bubbles taller than the viewport, fall back to anchoring
  // the bubble's top.
  const computeScroll = (idx: number): number => {
    if (count === 0 || totalH <= viewportH) return 0;
    const bubbleH = bubbleHeights[idx];
    const idealTop = cumTop[idx] - viewportH * 0.3;
    let target: number;
    if (bubbleH <= viewportH) {
      // Window of scrollOffsets that fully contain the bubble:
      // scrollOffset ∈ [cumTop[idx] + bubbleH - viewportH, cumTop[idx]]
      const minScroll = cumTop[idx] + bubbleH - viewportH;
      const maxScroll = cumTop[idx];
      target = Math.max(minScroll, Math.min(maxScroll, idealTop));
    } else {
      target = cumTop[idx];
    }
    return Math.max(0, Math.min(totalH - viewportH, target));
  };
  const keyFrames = messages.map((_, i) => BUBBLES_BASE + i * STAGGER_GAP);
  const scrollTargets = messages.map((_, i) => computeScroll(i));

  let scrollOffset = 0;
  // Smooth-blend window after entranceDone so we don't jolt from
  // scrollTargets[count-1] back to computeScroll(activeIdx=0) in one frame.
  const POST_ENTRANCE_BLEND = 15;
  if (count > 0) {
    if (frame >= entranceDone + POST_ENTRANCE_BLEND) {
      scrollOffset = computeScroll(activeIdx);
    } else if (frame >= entranceDone) {
      const start = scrollTargets[count - 1];
      const end = computeScroll(activeIdx);
      const t = (frame - entranceDone) / POST_ENTRANCE_BLEND;
      scrollOffset = start * (1 - t) + end * t;
    } else if (count === 1 || frame < keyFrames[0]) {
      scrollOffset = 0;
    } else {
      scrollOffset = interpolate(frame, keyFrames, scrollTargets, {
        extrapolateLeft: "clamp" as const,
        extrapolateRight: "clamp" as const,
      });
    }
  }

  const renderBubble = (
    msg: { author: string; text: string; side: "left" | "right"; upvotes?: string },
    index: number,
  ) => {
    const entrance = BUBBLES_BASE + index * STAGGER_GAP;
    const isLeft = msg.side === "left";
    const accentColor = isLeft ? LEFT_COLOR : RIGHT_COLOR;

    const slideY = slideIn(frame, fps, entrance, 200, { damping: 12, mass: 0.9 });
    const slideX = isLeft
      ? slideIn(frame, fps, entrance, -150, { damping: 14, mass: 0.8 })
      : slideIn(frame, fps, entrance, 150, { damping: 14, mass: 0.8 });
    const opacity = fadeIn(frame, entrance, 18);

    const isActive = frame >= entranceDone && index === activeIdx;
    const cardScale = isActive ? 1.06 : 1;

    return (
      <div
        key={`bubble-${index}`}
        style={{
          display: "flex",
          width: "100%",
          justifyContent: isLeft ? "flex-start" : "flex-end",
          paddingLeft: isLeft ? 0 : 120,
          paddingRight: isLeft ? 120 : 0,
          opacity,
          transform: `translateY(${slideY}px) translateX(${slideX}px) scale(${cardScale})`,
          transformOrigin: isLeft ? "left center" : "right center",
        }}
      >
        <div
          style={{
            maxWidth: `${BUBBLE_MAX_W_RATIO * 100}%`,
            minWidth: "50%",
            padding: "50px 30px",
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
                fontSize: 32,
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
                fontSize: 32,
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
                  fontSize: 32,
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
              fontSize: 32,
              fontWeight: isActive ? 500 : 400,
              color: isActive ? theme.text_on_bg : theme.text_on_bg_muted,
              lineHeight: 1.55,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {msg.text}
          </div>
        </div>
      </div>
    );
  };

  const renderTyping = (
    msg: { side: "left" | "right" },
    index: number,
  ) => {
    const entrance = BUBBLES_BASE + index * STAGGER_GAP;
    const entranceEnd = entrance + 20;
    if (!(frame >= entrance - 10 && frame < entranceEnd && frame >= BUBBLES_BASE)) {
      return null;
    }
    const isLeft = msg.side === "left";
    const accentColor = isLeft ? LEFT_COLOR : RIGHT_COLOR;
    const TYPING_H = 60;
    // Anchor typing indicator just above its bubble's final position; clamp
    // to >= 0 so the very first bubble's typing dots stay inside the viewport
    // instead of being clipped above (cumTop[0] === 0).
    const top = Math.max(0, cumTop[index] - TYPING_H - 8);
    return (
      <div
        key={`typing-${index}`}
        style={{
          position: "absolute",
          top,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: isLeft ? "flex-start" : "flex-end",
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
                opacity: 0.3 + Math.sin(frame * 0.3 + dotIdx * 2) * 0.4,
                transform: `translateY(${Math.sin(frame * 0.4 + dotIdx * 2.5) * 6}px)`,
              }}
            />
          ))}
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
        }}
      >
        {/* Card panel */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 40,
            right: 40,
            bottom: 30,
            borderRadius: 24,
            background: theme.card_bg,
            border: `1px solid ${theme.card_border}`,
            pointerEvents: "none",
          }}
        />
        {/* === Topic title === */}
        <div
          style={{
            position: "absolute",
            top: TITLE_TOP,
            left: 0,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            opacity: fadeIn(frame, TITLE_START, 15),
            transform: `translateY(${interpolate(
              frame,
              [TITLE_START, TITLE_START + 15],
              [-20, 0],
              {
                extrapolateLeft: "clamp" as const,
                extrapolateRight: "clamp" as const,
              },
            )}px)`,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: TITLE_FS,
              fontWeight: 700,
              color: theme.text_on_bg,
              textAlign: "center",
              padding: `0 ${TITLE_PAD_X}px`,
              lineHeight: 1.3,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {topic}
          </div>
        </div>

        {/* === Chat bubble area === */}
        <div
          style={{
            position: "absolute",
            top: bubbleAreaTop,
            bottom: bubbleAreaBottom,
            left: bubbleAreaLeft,
            right: bubbleAreaRight,
            overflow: "hidden",
          }}
        >
          {/* Scroll inner: bubbles flow naturally as a flex column (so layout
              cannot drift if our height estimates are off); typing indicators
              are absolute overlays anchored by the same estimates, where a
              small misalignment is purely cosmetic. */}
          <div
            style={{
              position: "relative",
              width: "100%",
              minHeight: viewportH,
              transform: `translateY(${-scrollOffset}px)`,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: BUBBLE_GAP,
              }}
            >
              {messages.map((msg, i) => renderBubble(msg, i))}
            </div>
            {messages.map((msg, i) => renderTyping(msg, i))}
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
