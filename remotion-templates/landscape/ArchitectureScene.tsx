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
  float,
  rotatingGradient,
} from "./animationHelpers";

interface ArchitectureSceneProps {
  title: string;
  layers: {
    name: string;
    description: string;
    icon?: string;
  }[];
  direction?: "vertical" | "horizontal";
  audioFile: string;
  narration?: string;
}

export const ArchitectureScene: React.FC<ArchitectureSceneProps> = ({
  title,
  layers,
  direction = "vertical",
  audioFile,
  narration,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const isVertical = direction === "vertical";
  const effectiveVertical = isVertical;
  const count = layers.length;

  // --- Timing: spread layer entrances across more of the segment ---
  const TITLE_START = 0;
  const LAYER_BASE_DELAY = 5;
  const LAYER_GAP = Math.max(4, Math.floor(45 / Math.max(count, 1)));
  const entranceDone = LAYER_BASE_DELAY + count * LAYER_GAP + 10;

  // --- Derived animations ---
  const titleOpacity = fadeIn(frame, TITLE_START, 18);
  const titleSlide = slideIn(frame, fps, TITLE_START, 40, { damping: 16, mass: 0.7 });
  // Architecture intentionally renders all layers in the "neutral" state
  // (post-entrance). The narration sync is unreliable for diagrams, so we
  // skip per-frame active highlighting and let the entrance stagger carry
  // the visual rhythm.
  const bgAngle = rotatingGradient(frame, durationInFrames, 135, 120);
  const accentColor = theme.brand_primary;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${bgAngle}deg, ${theme.dark_bg_from} 0%, ${theme.dark_bg_mid} 45%, ${theme.dark_bg_to} 100%)`,
          overflow: "hidden",
        }}
      >
        {/* Pulsing ambient glow behind layers */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "55%",
            width: 700 + Math.sin(frame / 12) * 30,
            height: 700 + Math.sin(frame / 12) * 30,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${accentColor}25, transparent 70%)`,
            filter: "blur(40px)",
            opacity: 0.25 + Math.sin(frame / 10) * 0.03,
          }}
        />

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
            position: "absolute",
            top: 50,
            left: 0,
            width: "100%",
            textAlign: "center",
            fontFamily,
            fontSize: 52,
            fontWeight: 700,
            color: theme.text_on_bg,
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
          }}
        >
          {title}
        </div>

        {/* Layer cards container */}
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 60,
            right: 60,
            bottom: 50,
            display: "flex",
            flexDirection: effectiveVertical ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: effectiveVertical ? 8 : 16,
            padding: effectiveVertical ? "10px 0" : "0 20px",
          }}
        >
          {layers.map((layer, i) => {
            const layerStart = staggerDelay(LAYER_BASE_DELAY, i, LAYER_GAP);
            const slideDistance = effectiveVertical ? 150 : 200;
            const offset = slideIn(frame, fps, layerStart, slideDistance, {
              damping: 13,
              mass: 0.8,
            });
            const opacity = fadeIn(frame, layerStart, 15);

            // No per-frame active highlight in ArchitectureScene; all layers
            // settle into a uniform "all visible" state after entrance.
            const isActive = false;
            const isNarrated = frame >= entranceDone;
            const layerOpacity = isNarrated ? 1 : 1;
            const scale = 1;
            const iconScale = 1;

            // Continuous float per layer (kept subtle, no active boost)
            const layerFloat = float(frame, 18 + i * 3, 14, i);
            const layerFloatX = float(frame, 30, 6, i + 5);

            const glowIntensity = 0;
            const borderColor = theme.card_border;

            // Arrow connector (between layers, not after last)
            const arrowStart = staggerDelay(LAYER_BASE_DELAY, i, LAYER_GAP) + 8;
            const arrowProgress = interpolate(
              frame,
              [arrowStart, arrowStart + 12],
              [0, 1],
              {
                extrapolateLeft: "clamp" as const,
                extrapolateRight: "clamp" as const,
              },
            );

            return (
              <React.Fragment key={i}>
                {/* Layer card */}
                <div
                  style={{
                    width: effectiveVertical ? "90%" : `${80 / count}%`,
                    minHeight: effectiveVertical ? 0 : 280,
                    backgroundColor: theme.card_bg,
                    borderRadius: 16,
                    border: `2px solid ${borderColor}`,
                    padding: effectiveVertical ? "18px 28px" : "24px 20px",
                    display: "flex",
                    flexDirection: effectiveVertical ? "row" : "column",
                    alignItems: "center",
                    gap: effectiveVertical ? 24 : 14,
                    opacity: opacity * layerOpacity,
                    transform: effectiveVertical
                      ? `translateY(${offset + layerFloat}px) translateX(${layerFloatX}px) scale(${scale})`
                      : `translateX(${offset + layerFloatX}px) translateY(${layerFloat}px) scale(${scale})`,
                    boxShadow: isActive
                      ? `0 0 ${glowIntensity}px ${accentColor}60, inset 0 0 ${glowIntensity / 2}px ${accentColor}20`
                      : "0 2px 8px rgba(0,0,0,0.3)",
                    transition: "border-color 0.2s",
                    flexShrink: 0,
                  }}
                >
                  {/* Icon */}
                  {layer.icon && (
                    <div
                      style={{
                        fontSize: 64,
                        lineHeight: 1,
                        flexShrink: 0,
                        transform: `scale(${iconScale})`,
                        filter: isActive
                          ? `drop-shadow(0 0 10px ${accentColor}60)`
                          : "none",
                      }}
                    >
                      {layer.icon}
                    </div>
                  )}

                  {/* Text */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      textAlign: effectiveVertical ? "left" : "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily,
                        fontSize: 38,
                        fontWeight: 700,
                        color: isActive ? theme.text_on_bg : theme.text_secondary,
                        lineHeight: 1.3,
                      }}
                    >
                      {layer.name}
                    </div>
                    <div
                      style={{
                        fontFamily,
                        fontSize: 28,
                        fontWeight: 400,
                        color: isActive ? theme.text_on_bg_muted : theme.text_muted,
                        lineHeight: 1.45,
                      }}
                    >
                      {layer.description}
                    </div>
                  </div>
                </div>

                {/* Arrow connector between layers */}
                {i < count - 1 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: effectiveVertical ? "column" : "row",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                      ...(effectiveVertical
                        ? { height: 36, width: 40 }
                        : { width: 36, height: 40 }),
                    }}
                  >
                    {/* Stem line */}
                    <div
                      style={
                        effectiveVertical
                          ? {
                              width: 2,
                              height: `${arrowProgress * 20}px`,
                              backgroundColor: accentColor,
                              opacity: 0.6,
                            }
                          : {
                              height: 2,
                              width: `${arrowProgress * 20}px`,
                              backgroundColor: accentColor,
                              opacity: 0.6,
                            }
                      }
                    />
                    {/* Arrowhead */}
                    <div
                      style={{
                        fontFamily,
                        fontSize: 18,
                        color: accentColor,
                        lineHeight: 1,
                        opacity: arrowProgress,
                        transform: effectiveVertical ? "none" : "rotate(-90deg)",
                      }}
                    >
                      ▼
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
