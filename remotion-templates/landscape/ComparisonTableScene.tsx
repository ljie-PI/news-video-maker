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

interface ComparisonTableSceneProps {
  title: string;
  columns: string[];
  rows: {
    cells: string[];
    isHighlighted?: boolean;
  }[];
  audioFile: string;
  narration?: string;
}

export const ComparisonTableScene: React.FC<ComparisonTableSceneProps> = ({
  title,
  columns,
  rows,
  audioFile,
  narration,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const colCount = columns.length;
  const rowCount = rows.length;

  // Background gradient angle
  const bgAngle = rotatingGradient(frame, durationInFrames, 135, 60);

  // Progress

  // Scan line - more visible

  // Header float
  const headerFloat = 0;

  // Header entrance: scale from 0.95 + fade, starts at frame 5
  const headerStart = 5;
  const headerOpacity = fadeIn(frame, headerStart, 15);
  const headerScale = interpolate(frame, [headerStart, headerStart + 15], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Title entrance
  const titleOpacity = fadeIn(frame, 0, 12);
  const titleScale = interpolate(frame, [0, 12], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Row entrance timing — fast stagger, all visible within ~1.5s
  const rowBaseDelay = 5;
  const rowGap = Math.max(3, Math.floor(45 / Math.max(rowCount, 1)));

  // Column widths: first column slightly wider
  const colWidth = (i: number) => (i === 0 ? "22%" : `${78 / (colCount - 1)}%`);
  const portraitSmallFont = false;
  const fontScale = 1;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${bgAngle}deg, ${theme.dark_bg_from} 0%, ${theme.dark_bg_mid} 45%, ${theme.dark_bg_to} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-evenly",
          paddingTop: 40,
          paddingBottom: 40,
          overflow: "hidden",
        }}
      >

        {/* Full-height card panel */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 40,
            right: 40,
            bottom: 30,
            background: theme.card_bg,
            border: `1px solid ${theme.card_border}`,
            borderRadius: 24,
          }}
        />

        {/* Title */}
        <div
          style={{
            fontFamily,
            fontSize: 48,
            fontWeight: 700,
            color: theme.text_on_bg,
            marginBottom: 36,
            transform: `scale(${titleScale})`,
            textAlign: "center",
          }}
        >
          {title}
        </div>

        {/* Table container */}
        <div
          style={{
            width: "92%",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: `0 8px 40px rgba(0,0,0,0.4)`,
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: "flex",
              background: theme.brand_primary,
              opacity: headerOpacity,
              transform: `scale(${headerScale}) translateY(${headerFloat}px)`,
              transformOrigin: "top center",
            }}
          >
            {columns.map((col, ci) => (
              <div
                key={ci}
                style={{
                  width: colWidth(ci),
                  fontFamily,
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#ffffff",
                  padding: "24px 28px",
                  boxSizing: "border-box",
                }}
              >
                {col}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {rows.map((row, ri) => {
            const delay = staggerDelay(rowBaseDelay, ri, rowGap);
            const rowSlideX = slideIn(frame, fps, delay, 200, {
              damping: 14,
              mass: 0.8,
            });
            const rowOpacity = fadeIn(frame, delay, 15);

            const isHighlighted = row.isHighlighted;

            // Alternating row background
            const rowBg = ri % 2 === 0
              ? theme.card_bg
              : theme.overlay_subtle;

            // Highlighted row gets a distinct bg
            const highlightBg = isHighlighted
              ? `rgba(${parseInt(theme.brand_primary.slice(1, 3), 16)},${parseInt(theme.brand_primary.slice(3, 5), 16)},${parseInt(theme.brand_primary.slice(5, 7), 16)},0.12)`
              : rowBg;

            const rowActiveOpacity = 1;

            return (
              <div
                key={ri}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  background: highlightBg,
                  opacity: rowOpacity * rowActiveOpacity,
                  transform: `translateX(${rowSlideX}px)`,
                  transformOrigin: "left center",
                  position: "relative",
                  borderLeft: "3px solid transparent",
                  boxShadow: "none",
                }}
              >
                {/* Strip removed */}

                {row.cells.map((cell, ci) => (
                  <div
                    key={ci}
                    style={{
                      width: colWidth(ci),
                      fontFamily,
                      fontSize: 32,
                      fontWeight: isHighlighted ? 600 : 400,
                      color: isHighlighted
                        ? theme.text_on_bg
                        : theme.text_on_bg_muted,
                      padding: "24px 24px",
                      boxSizing: "border-box",
                      lineHeight: 1.4,
                    }}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            );
          })}
        </div>



      </AbsoluteFill>
    </AbsoluteFill>
  );
};
