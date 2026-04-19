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
  rotatingGradient,
} from "./animationHelpers";

interface QuoteCardSceneProps {
  quote: string;
  author: string;
  platform: string;
  upvotes?: string;
  context?: string;
  audioFile: string;
  narration?: string;
}

export const QuoteCardScene: React.FC<QuoteCardSceneProps> = ({
  quote,
  author,
  platform,
  upvotes,
  context,
  audioFile,
  narration,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // --- Word processing ---
  const words = quote.split(/(\s+)/);
  const wordTokens: { text: string; wordIndex: number }[] = [];
  let wordIdx = 0;
  for (const w of words) {
    if (w.trim().length > 0) {
      wordTokens.push({ text: w, wordIndex: wordIdx });
      wordIdx++;
    } else {
      wordTokens.push({ text: w, wordIndex: -1 });
    }
  }
  const totalWords = wordIdx;

  // --- Animation timing ---
  const CARD_ENTRANCE_START = 0;
  const QUOTE_MARK_START = 5;
  const QUOTE_TEXT_START = 12;
  const WORDS_PER_FRAME = 0.15;
  const allWordsFrame = QUOTE_TEXT_START + totalWords / WORDS_PER_FRAME + 8;
  const AUTHOR_START = Math.max(30, Math.ceil(allWordsFrame) + 10);
  const CONTEXT_START = AUTHOR_START + 10;

  // --- Animated values ---
  const bgAngle = rotatingGradient(frame, durationInFrames, 135, 60);
  const cardFloat = Math.sin(frame / 22) * 4;

  // Card entrance: spring bounce from bottom
  const cardY = slideIn(frame, fps, CARD_ENTRANCE_START, 100, {
    damping: 12,
    mass: 0.9,
  });
  const cardOpacity = fadeIn(frame, CARD_ENTRANCE_START, 10);

  // Quotation mark animation: scale 2→1 + continuous pulse after entrance
  const quoteMarkOpacity = fadeIn(frame, QUOTE_MARK_START, 20);
  const quoteMarkEntrance = interpolate(
    spring({ frame: Math.max(0, frame - QUOTE_MARK_START), fps, config: { damping: 14, mass: 0.6 } }),
    [0, 1],
    [2.0, 1.0],
  );
  const quoteMarkPulse = frame > 30
    ? 1 + Math.sin((frame - 30) / 25) * 0.04
    : 1;
  const quoteMarkScale = quoteMarkEntrance * quoteMarkPulse;

  // Closing quote mark appears after all words
  const closingQuoteOpacity = fadeIn(frame, Math.ceil(allWordsFrame), 20);
  const closingQuoteScale = interpolate(
    spring({ frame: Math.max(0, frame - Math.ceil(allWordsFrame)), fps, config: { damping: 14, mass: 0.6 } }),
    [0, 1],
    [2.0, 1.0],
  ) * quoteMarkPulse;

  // Author info fade in
  const authorOpacity = fadeIn(frame, AUTHOR_START, 18);
  const authorY = interpolate(frame, [AUTHOR_START, AUTHOR_START + 18], [15, 0], {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
  });

  // Context fade in
  const contextOpacity = context ? fadeIn(frame, CONTEXT_START, 15) : 0;

  // Side decorations pulse
  const leftDecorOpacity = 0.10 + Math.sin(frame / 25) * 0.006;
  const rightDecorOpacity = 0.06 + Math.sin(frame / 40 + 2) * 0.006;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${bgAngle}deg, ${theme.dark_bg_from} 0%, ${theme.dark_bg_mid} 45%, ${theme.dark_bg_to} 100%)`,
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: 0,
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
        {/* Left semi-transparent color block decoration */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "15%",
            width: "18%",
            height: "70%",
            background: `linear-gradient(180deg, ${theme.brand_primary}00 0%, ${theme.brand_primary} 50%, ${theme.brand_primary}00 100%)`,
            opacity: leftDecorOpacity,
            filter: "blur(60px)",
            borderRadius: "0 50% 50% 0",
          }}
        />
        {/* Right semi-transparent color block decoration */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "20%",
            width: "16%",
            height: "60%",
            background: `linear-gradient(180deg, ${theme.brand_highlight}00 0%, ${theme.brand_highlight} 50%, ${theme.brand_highlight}00 100%)`,
            opacity: rightDecorOpacity,
            filter: "blur(60px)",
            borderRadius: "50% 0 0 50%",
          }}
        />

        {/* Main card */}
        <div
          style={{
            width: "75%",
            minHeight: "55%",
            backgroundColor: theme.card_bg,
            border: `1px solid ${theme.card_border}`,
            borderRadius: 24,
            boxShadow:
              "0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(0, 0, 0, 0.2)",
            padding: "40px 50px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-evenly",
            alignItems: "center",
            position: "relative",
            overflow: "hidden",
            opacity: cardOpacity,
            transform: `translateY(${cardY + cardFloat}px)`,
          }}
        >
          {/* Card inner glow */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "40%",
              background: `linear-gradient(180deg, ${theme.brand_primary}08 0%, transparent 100%)`,
              pointerEvents: "none",
            }}
          />

          {/* Giant opening quotation mark */}
          <div
            style={{
              position: "absolute",
              top: 30,
              left: 50,
              fontFamily,
              fontSize: 120,
              fontWeight: 700,
              color: theme.brand_primary,
              opacity: quoteMarkOpacity * 0.15,
              lineHeight: 1,
              transform: `scale(${quoteMarkScale})`,
              transformOrigin: "top left",
              userSelect: "none",
            }}
          >
            &ldquo;
          </div>

          {/* Closing quotation mark */}
          <div
            style={{
              position: "absolute",
              bottom: 30,
              right: 50,
              fontFamily,
              fontSize: 120,
              fontWeight: 700,
              color: theme.brand_primary,
              opacity: closingQuoteOpacity * 0.15,
              lineHeight: 1,
              transform: `scale(${closingQuoteScale})`,
              transformOrigin: "bottom right",
              userSelect: "none",
            }}
          >
            &rdquo;
          </div>

          {/* Quote text — word-by-word fade in */}
          <div
            style={{
              fontFamily,
              fontSize: 48,
              fontWeight: 600,
              color: theme.text_on_bg,
              position: "relative",
              zIndex: 1,
            }}
          >
            {wordTokens.map((token, i) => {
              if (token.wordIndex < 0) {
                return <span key={i}>{token.text}</span>;
              }
              const wordFrame = QUOTE_TEXT_START + token.wordIndex / WORDS_PER_FRAME;
              const opacity = fadeIn(frame, wordFrame, 8);
              const y = interpolate(
                frame,
                [wordFrame, wordFrame + 8],
                [10, 0],
                {
                  extrapolateLeft: "clamp" as const,
                  extrapolateRight: "clamp" as const,
                },
              );
              return (
                <span
                  key={i}
                  style={{
                    opacity,
                    transform: `translateY(${y}px)`,
                    display: "inline-block",
                  }}
                >
                  {token.text}
                </span>
              );
            })}
          </div>

          {/* Context line */}
          {context && (
            <div
              style={{
                fontFamily,
                fontSize: 26,
                fontWeight: 400,
                color: "#8b949e",
                lineHeight: 1.5,
                textAlign: "center",
                marginTop: 20,
                maxWidth: "80%",
                opacity: contextOpacity,
                position: "relative",
                zIndex: 1,
              }}
            >
              {context}
            </div>
          )}

          {/* Divider line */}
          <div
            style={{
              width: interpolate(frame, [AUTHOR_START - 10, AUTHOR_START + 5], [0, 200], {
                extrapolateLeft: "clamp" as const,
                extrapolateRight: "clamp" as const,
              }),
              height: 2,
              background: `linear-gradient(90deg, transparent, ${theme.brand_primary}80, transparent)`,
              marginTop: 35,
              marginBottom: 35,
              borderRadius: 1,
              position: "relative",
              zIndex: 1,
            }}
          />

          {/* Author info row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              opacity: authorOpacity,
              transform: `translateY(${authorY}px)`,
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Avatar placeholder circle */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${theme.brand_primary}, ${theme.brand_highlight})`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#ffffff",
                  textTransform: "uppercase",
                }}
              >
                {author.charAt(0)}
              </span>
            </div>

            {/* Author name */}
            <span
              style={{
                fontFamily,
                fontSize: 24,
                fontWeight: 700,
                color: theme.text_on_bg,
              }}
            >
              {author}
            </span>

            {/* Platform badge */}
            <span
              style={{
                fontFamily,
                fontSize: 16,
                fontWeight: 600,
                color: theme.brand_primary,
                backgroundColor: `${theme.brand_primary}18`,
                padding: "5px 14px",
                borderRadius: 20,
                border: `1px solid ${theme.brand_primary}30`,
              }}
            >
              {platform}
            </span>

            {/* Upvote badge */}
            {upvotes && (
              <span
                style={{
                  fontFamily,
                  fontSize: 16,
                  fontWeight: 600,
                  color: theme.brand_primary,
                  backgroundColor: `${theme.brand_primary}18`,
                  padding: "5px 14px",
                  borderRadius: 20,
                  border: `1px solid ${theme.brand_primary}30`,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                ▲ {upvotes}
              </span>
            )}
          </div>
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
