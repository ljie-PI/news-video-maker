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
import { fadeIn, slideIn, staggerDelay } from "./animationHelpers";

interface TechStackSceneProps {
  project: string;
  title?: string;
  techs: {
    name: string;
    category?: string;
  }[];
  audioFile: string;
  narration?: string;
}

// Inline line-style category icons (24x24 viewBox, stroke=currentColor).
const CategoryIcon: React.FC<{ category: string; size: number }> = ({
  category,
  size,
}) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (category) {
    case "语言":
      return (
        <svg {...common}>
          <polyline points="8 7 3 12 8 17" />
          <polyline points="16 7 21 12 16 17" />
          <line x1="14" y1="5" x2="10" y2="19" />
        </svg>
      );
    case "框架":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "工具":
      return (
        <svg {...common}>
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-2.4 2.6-2.6Z" />
        </svg>
      );
    case "数据库":
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5" rx="8" ry="2.5" />
          <path d="M4 5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5" />
          <path d="M4 11v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6" />
        </svg>
      );
    case "平台":
      return (
        <svg {...common}>
          <path d="M7 18a4 4 0 0 1-.9-7.9 5 5 0 0 1 9.7-1.4A4.5 4.5 0 0 1 17.5 18H7Z" />
        </svg>
      );
    case "测试":
      return (
        <svg {...common}>
          <path d="M9 3h6" />
          <path d="M10 3v9.5a4 4 0 1 0 4 0V3" />
          <path d="M10 13h4" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
        </svg>
      );
  }
};

// Target rows for n chips on portrait (max 4 rows). Designed so v-util grows
// monotonically as n increases.
function targetRowsPortrait(n: number): number {
  if (n <= 1) return 1;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  return 4;
}

// Chip height baseline values (at 1440 canvas height). Smoothly decreases
// across rows tiers with modest step-downs so chip footprint isn't jumpy.
const CHIP_H_AT_1440 = [280, 240, 200, 180]; // index = rows - 1

export const TechStackScene: React.FC<TechStackSceneProps> = ({
  project,
  title = "技术栈",
  techs,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const vScale = height / 960;
  const fScale = 1.25;
  const designScale = height / 1440;

  const titleOpacity = fadeIn(frame, 0, 15);
  const titleSlide = slideIn(frame, fps, 0, 80);

  // Flat grid: all techs share one grid; category becomes a per-chip caption.
  const totalCount = Math.max(techs.length, 1);
  const MAX_COLS = 3;
  const targetRows = targetRowsPortrait(totalCount);
  const cols = Math.min(MAX_COLS, Math.ceil(totalCount / targetRows));
  // Actual rows after MAX_COLS clamp; may exceed targetRows when n > 12.
  const actualRows = Math.ceil(totalCount / cols);
  const gap = Math.round(36 * designScale);

  // Live-compute available grid height (canvas - paddings - title block).
  const titleFontPx = Math.round(48 * fScale);
  const titleH = titleFontPx * 1.3;
  const titleMarginPx = Math.round(48 * vScale);
  const padTopPx = Math.round(50 * vScale);
  const padBottomPx = Math.round(40 * vScale);
  const gridAvail = height - padTopPx - titleH - titleMarginPx - padBottomPx;

  const baseChipH = Math.round(
    CHIP_H_AT_1440[
      Math.min(actualRows, CHIP_H_AT_1440.length) - 1
    ] * designScale,
  );
  const maxFitH = Math.max(
    1,
    Math.floor((gridAvail - (actualRows - 1) * gap) / actualRows),
  );
  const chipH = Math.max(1, Math.min(baseChipH, maxFitH));

  const BADGE_BASE_DELAY = 5;
  const STAGGER_GAP = Math.max(2, Math.floor(45 / totalCount));

  // Centering rule: when last row contains exactly 1 chip and cols > 1,
  // span it across all columns and justify-self center with single-cell width.
  const lastRowOrphan = cols > 1 && totalCount % cols === 1;

  const circles = [0, 1, 2].map((i) => ({
    x: [200, 800, 480][i],
    y: [300, 1100, 700][i],
    size: 140 + i * 60,
    opacity: 0.1,
  }));

  function renderChip(tech: typeof techs[number], idx: number) {
    const start = staggerDelay(BADGE_BASE_DELAY, idx, STAGGER_GAP);
    const chipSpring = spring({
      frame: Math.max(0, frame - start),
      fps,
      config: { damping: 12, mass: 0.6, stiffness: 120 },
    });
    const entranceScale = interpolate(chipSpring, [0, 1], [0, 1]);
    const entranceOpacity = fadeIn(frame, start, 12);

    const cat = tech.category?.trim() || "其他";
    const isOrphan = lastRowOrphan && idx === totalCount - 1;
    const orphanCellWidth = `calc((100% - ${(cols - 1) * gap}px) / ${cols})`;

    return (
      <div
        key={`${tech.name}-${idx}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: Math.round(20 * fScale),
          width: isOrphan ? orphanCellWidth : "100%",
          height: chipH,
          padding: `0 ${Math.round(28 * fScale)}px`,
          borderRadius: 14,
          backgroundColor: theme.card_bg,
          border: `2px solid ${theme.brand_primary}`,
          color: theme.brand_primary,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          opacity: entranceOpacity,
          transform: `scale(${entranceScale})`,
          boxSizing: "border-box",
          ...(isOrphan
            ? { gridColumn: "1 / -1", justifySelf: "center" as const }
            : {}),
        }}
      >
        <div style={{ display: "flex", flexShrink: 0 }}>
          <CategoryIcon
            category={cat}
            size={Math.round(28 * fScale)}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "center",
            gap: 4,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: Math.round(29 * fScale),
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: 0.3,
              maxWidth: "100%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {tech.name}
          </div>
          <div
            style={{
              fontFamily,
              fontSize: Math.round(18 * fScale),
              fontWeight: 500,
              lineHeight: 1.2,
              letterSpacing: 0.5,
              opacity: 0.65,
              maxWidth: "100%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {cat}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />

      <AbsoluteFill
        style={{
          background: `linear-gradient(135deg, ${theme.dark_bg_from} 0%, ${theme.dark_bg_mid} 50%, ${theme.dark_bg_to} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: `${Math.round(40 * vScale)}px 60px`,
          paddingTop: Math.round(50 * vScale),
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
        {/* Ambient circles */}
        {circles.map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: c.size,
              height: c.size,
              borderRadius: "50%",
              background:
                i % 2 === 0 ? theme.brand_primary : theme.brand_highlight,
              opacity: c.opacity,
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Title */}
        <div
          style={{
            fontFamily,
            fontSize: Math.round(48 * fScale),
            fontWeight: 700,
            color: theme.brand_primary,
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
            marginBottom: Math.round(48 * vScale),
            textAlign: "center",
            lineHeight: 1.3,
            flexShrink: 0,
          }}
        >
          <span style={{ color: theme.text_on_bg }}>{project}</span>
          <span style={{ color: "#8b949e", margin: "0 16px" }}>·</span>
          <span>{title}</span>
        </div>

        {/* Flat grid: all techs */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridAutoRows: `${chipH}px`,
              gap,
              width: "100%",
            }}
          >
            {techs.map((tech, i) => renderChip(tech, i))}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
