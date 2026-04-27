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

// Target rows for n chips on landscape (max 3 rows). Designed so v-util grows
// monotonically as n increases.
function targetRowsLandscape(n: number): number {
  if (n <= 1) return 1;
  if (n <= 6) return 2;
  return 3;
}

// Chip height tiers: rows 1, 2, 3. Smoothly decreasing across tiers.
const CHIP_H_TIERS = [260, 220, 200];

export const TechStackScene: React.FC<TechStackSceneProps> = ({
  project,
  title = "技术栈",
  techs,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  const titleOpacity = fadeIn(frame, 0, 15);
  const titleSlide = slideIn(frame, fps, 0, 80);

  const totalCount = Math.max(techs.length, 1);
  const MAX_COLS = 5;
  const targetRows = targetRowsLandscape(totalCount);
  const cols = Math.min(MAX_COLS, Math.ceil(totalCount / targetRows));
  const actualRows = Math.ceil(totalCount / cols);
  const gap = 24;

  // Live-compute available grid height (canvas - paddings - title block).
  const titleH = Math.round(52 * 1.3);
  const gridAvail = height - 50 - titleH - 48 - 40;

  const baseChipH =
    CHIP_H_TIERS[Math.min(actualRows, CHIP_H_TIERS.length) - 1];
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
    x: [300, 1600, 960][i],
    y: [200, 700, 450][i],
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

    const cat = tech.category ?? "";
    const isOrphan = lastRowOrphan && idx === totalCount - 1;
    const orphanCellWidth = `calc((100% - ${(cols - 1) * gap}px) / ${cols})`;

    return (
      <div
        key={`${tech.name}-${idx}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          width: isOrphan ? orphanCellWidth : "100%",
          height: chipH,
          padding: "0 28px",
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
          <CategoryIcon category={cat} size={26} />
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
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: 0.3,
            }}
          >
            {tech.name}
          </div>
          {cat && (
            <div
              style={{
                fontFamily,
                fontSize: 18,
                fontWeight: 500,
                lineHeight: 1.2,
                letterSpacing: 0.5,
                opacity: 0.65,
              }}
            >
              {cat}
            </div>
          )}
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
          padding: "40px 60px",
          paddingTop: 50,
          overflow: "hidden",
        }}
      >
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

        <div
          style={{
            fontFamily,
            fontSize: 52,
            fontWeight: 700,
            color: theme.brand_primary,
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
            marginBottom: 48,
            textAlign: "center",
            lineHeight: 1.3,
            flexShrink: 0,
          }}
        >
          <span style={{ color: theme.text_on_bg }}>{project}</span>
          <span style={{ color: "#8b949e", margin: "0 16px" }}>·</span>
          <span>{title}</span>
        </div>

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
