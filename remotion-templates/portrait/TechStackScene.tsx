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
      // </>
      return (
        <svg {...common}>
          <polyline points="8 7 3 12 8 17" />
          <polyline points="16 7 21 12 16 17" />
          <line x1="14" y1="5" x2="10" y2="19" />
        </svg>
      );
    case "框架":
      // 2x2 grid
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "工具":
      // wrench
      return (
        <svg {...common}>
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-2.4 2.6-2.6Z" />
        </svg>
      );
    case "数据库":
      // cylinder
      return (
        <svg {...common}>
          <ellipse cx="12" cy="5" rx="8" ry="2.5" />
          <path d="M4 5v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5" />
          <path d="M4 11v6c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-6" />
        </svg>
      );
    case "平台":
      // cloud
      return (
        <svg {...common}>
          <path d="M7 18a4 4 0 0 1-.9-7.9 5 5 0 0 1 9.7-1.4A4.5 4.5 0 0 1 17.5 18H7Z" />
        </svg>
      );
    case "测试":
      // test tube + check
      return (
        <svg {...common}>
          <path d="M9 3h6" />
          <path d="M10 3v9.5a4 4 0 1 0 4 0V3" />
          <path d="M10 13h4" />
        </svg>
      );
    default:
      // sparkle
      return (
        <svg {...common}>
          <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
        </svg>
      );
  }
};

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

  // --- Title animation ---
  const titleOpacity = fadeIn(frame, 0, 15);
  const titleSlide = slideIn(frame, fps, 0, 80);

  // --- Group techs by category ---
  const hasCategories = techs.some((t) => t.category);
  type Group = { category: string | null; items: typeof techs };
  const groups: Group[] = [];
  if (hasCategories) {
    const catMap = new Map<string, typeof techs>();
    for (const t of techs) {
      const key = t.category ?? "其他";
      const arr = catMap.get(key) ?? [];
      arr.push(t);
      catMap.set(key, arr);
    }
    for (const [cat, items] of catMap) {
      groups.push({ category: cat, items });
    }
  } else {
    groups.push({ category: null, items: techs });
  }

  const totalCount = techs.length;

  // Entrance stagger
  const BADGE_BASE_DELAY = 5;
  const STAGGER_GAP = Math.max(2, Math.floor(45 / Math.max(totalCount, 1)));

  const circles = [0, 1, 2].map((i) => ({
    x: [200, 800, 480][i],
    y: [300, 1100, 700][i],
    size: 140 + i * 60,
    opacity: 0.10,
  }));

  // Per-group column count: count>1 forces ≥2 rows; max 3 cols on portrait.
  const MAX_COLS = 3;
  const colsForCount = (n: number) =>
    n <= 1 ? 1 : Math.min(MAX_COLS, Math.ceil(n / 2));

  const BADGE_MAX_W = 480;

  // Render a single badge (no active highlight cycle).
  function renderBadge(tech: typeof techs[number], gIdx: number) {
    const start = staggerDelay(BADGE_BASE_DELAY, gIdx, STAGGER_GAP);
    const badgeSpring = spring({
      frame: Math.max(0, frame - start),
      fps,
      config: { damping: 12, mass: 0.6, stiffness: 120 },
    });
    const entranceScale = interpolate(badgeSpring, [0, 1], [0, 1]);
    const entranceOpacity = fadeIn(frame, start, 12);

    return (
      <div
        key={`${tech.name}-${gIdx}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: BADGE_MAX_W,
          justifySelf: "center",
          padding: `${Math.round(20 * vScale)}px ${Math.round(32 * fScale)}px`,
          minHeight: Math.round(88 * vScale),
          borderRadius: 10,
          backgroundColor: theme.brand_primary,
          border: `1px solid ${theme.brand_highlight}`,
          fontFamily,
          fontSize: Math.round(29 * fScale),
          fontWeight: 600,
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.4,
          letterSpacing: 0.3,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          opacity: entranceOpacity,
          transform: `scale(${entranceScale})`,
          boxSizing: "border-box",
        }}
      >
        {tech.name}
      </div>
    );
  }

  let runningIdx = 0;

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

        {/* Group stack */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "center",
            gap: Math.round(32 * vScale),
            width: "100%",
          }}
        >
          {groups.map((group) => {
            const startIdx = runningIdx;
            const cols = colsForCount(group.items.length);

            const headerStart = staggerDelay(
              BADGE_BASE_DELAY,
              startIdx,
              STAGGER_GAP,
            );
            const headerOpacity = fadeIn(
              frame,
              Math.max(0, headerStart - 4),
              12,
            );

            const node = (
              <div
                key={group.category ?? "__all"}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: Math.round(18 * vScale),
                  width: "100%",
                }}
              >
                {group.category && (
                  <div
                    style={{
                      fontFamily,
                      fontSize: Math.round(24 * fScale),
                      fontWeight: 600,
                      color: theme.brand_highlight,
                      opacity: headerOpacity,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      marginBottom: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    <CategoryIcon
                      category={group.category}
                      size={Math.round(28 * fScale)}
                    />
                    <span>{group.category}</span>
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gap: 14,
                    width: "100%",
                    justifyItems: "center",
                  }}
                >
                  {group.items.map((tech, i) =>
                    renderBadge(tech, startIdx + i),
                  )}
                </div>
              </div>
            );

            runningIdx = startIdx + group.items.length;
            return node;
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
