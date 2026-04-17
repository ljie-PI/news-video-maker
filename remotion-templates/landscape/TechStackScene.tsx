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
  float,
  rotatingGradient,
} from "./animationHelpers";

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

const CATEGORY_COLORS: Record<string, { bg: string; glow: string }> = {
  语言: { bg: "#2563eb", glow: "#3b82f6" },
  框架: { bg: "#7c3aed", glow: "#8b5cf6" },
  工具: { bg: "#059669", glow: "#10b981" },
  数据库: { bg: "#d97706", glow: "#f59e0b" },
  平台: { bg: "#dc2626", glow: "#ef4444" },
  测试: { bg: "#0891b2", glow: "#06b6d4" },
};

const DEFAULT_COLOR = { bg: "#475569", glow: "#64748b" };

function colorForCategory(cat?: string): { bg: string; glow: string } {
  if (!cat) return DEFAULT_COLOR;
  return CATEGORY_COLORS[cat] ?? DEFAULT_COLOR;
}

export const TechStackScene: React.FC<TechStackSceneProps> = ({
  project,
  title = "技术栈",
  techs,
  audioFile,
  narration,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // --- Background ---
  const gradAngle = rotatingGradient(frame, durationInFrames, 135, 80);

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

  // Flatten for global indexing (stagger + active)
  let globalIdx = 0;
  const indexed: { tech: typeof techs[number]; gIdx: number }[] = [];
  for (const g of groups) {
    for (const t of g.items) {
      indexed.push({ tech: t, gIdx: globalIdx++ });
    }
  }
  const totalCount = indexed.length;

  // Entrance timing — fast stagger, all visible within ~1.5s
  const BADGE_BASE_DELAY = 5;
  const STAGGER_GAP = Math.max(2, Math.floor(45 / Math.max(totalCount, 1)));
  const entranceDone = BADGE_BASE_DELAY + totalCount * STAGGER_GAP + 10;
  const active = activeIndex(frame, entranceDone, durationInFrames, totalCount);

  // --- Progress bar ---

  // --- Floating ambient circles ---
  const circles = [0, 1, 2].map((i) => ({
    x: Math.sin(frame / (30 + i * 9) + i * 2) * 50 + [300, 1600, 960][i],
    y: Math.cos(frame / (25 + i * 7) + i * 1.5) * 36 + [200, 700, 450][i],
    size: 140 + i * 60 + Math.sin(frame / 20 + i) * 6,
    opacity: 0.10 + Math.sin(frame / 22 + i) * 0.012,
  }));

  // Render a single badge
  function renderBadge(
    tech: typeof techs[number],
    gIdx: number,
    isActive: boolean,
  ) {
    const start = staggerDelay(BADGE_BASE_DELAY, gIdx, STAGGER_GAP);
    const badgeSpring = spring({
      frame: Math.max(0, frame - start),
      fps,
      config: { damping: 12, mass: 0.6, stiffness: 120 },
    });
    const entranceScale = interpolate(badgeSpring, [0, 1], [0, 1]);
    const entranceOpacity = fadeIn(frame, start, 12);

    const floatY = float(frame, 16 + (gIdx % 7) * 2, 22, gIdx * 1.3);
    const floatX = float(frame, 20 + (gIdx % 5) * 3, 12, gIdx * 0.7 + 5);
    const activeScale = isActive ? breathe(frame, 12, 0.15) : 1;

    const { bg, glow } = colorForCategory(tech.category);
    const glowIntensity = isActive
      ? 14
      : 0;

    return (
      <div
        key={`${tech.name}-${gIdx}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "12px 24px",
          borderRadius: 999,
          backgroundColor: isActive ? bg : `${bg}cc`,
          border: `2px solid ${isActive ? glow : `${glow}60`}`,
          fontFamily,
          fontSize: 28,
          fontWeight: 600,
          color: "#ffffff",
          opacity: entranceOpacity,
          transform: [
            `scale(${entranceScale * activeScale})`,
            `translateY(${floatY}px)`,
            `translateX(${floatX}px)`,
          ].join(" "),
          boxShadow: isActive
            ? `0 0 ${glowIntensity}px ${glow}90, 0 4px 20px ${bg}50`
            : `0 2px 8px ${bg}30`,
          letterSpacing: 0.3,
          whiteSpace: "nowrap",
          transition: "box-shadow 0.1s",
        }}
      >
        {tech.name}
      </div>
    );
  }

  // Track which global index we've rendered to
  let runningIdx = 0;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />

      <AbsoluteFill
        style={{
          background: `linear-gradient(${gradAngle}deg, ${theme.dark_bg_from} 0%, ${theme.dark_bg_mid} 50%, ${theme.dark_bg_to} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "40px 60px",
          paddingTop: 50,
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

        {/* Badge grid area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            width: "100%",
            maxWidth: 1800,
          }}
        >
          {groups.map((group) => {
            const startIdx = runningIdx;
            const nodes = group.items.map((tech, i) => {
              const gIdx = startIdx + i;
              const isActive = gIdx === active;
              return renderBadge(tech, gIdx, isActive);
            });
            runningIdx = startIdx + group.items.length;

            // Category header + its badges
            const headerStart = staggerDelay(
              BADGE_BASE_DELAY,
              startIdx,
              STAGGER_GAP,
            );
            const headerOpacity = fadeIn(frame, Math.max(0, headerStart - 4), 12);

            return (
              <div
                key={group.category ?? "__all"}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  width: "100%",
                }}
              >
                {group.category && (
                  <div
                    style={{
                      fontFamily,
                      fontSize: 26,
                      fontWeight: 600,
                      color: colorForCategory(group.category).glow,
                      opacity: headerOpacity,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    {group.category}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    gap: 16,
                  }}
                >
                  {nodes}
                </div>
              </div>
            );
          })}
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
