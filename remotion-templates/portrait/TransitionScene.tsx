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
import { fadeIn, breathe, rotatingGradient } from "./animationHelpers";

interface TransitionSceneProps {
  text: string;
  subtitle?: string;
  audioFile: string;
}

export const TransitionScene: React.FC<TransitionSceneProps> = ({
  text,
  subtitle,
  audioFile,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Background gradient rotation (fast for impact)
  const angle = rotatingGradient(frame, durationInFrames, 135, 180);

  // Main text: zoom reveal — scale 1.5→1.0 with spring + fade in
  const textSpring = spring({ frame, fps, config: { damping: 14, mass: 0.6 } });
  const textScale = interpolate(textSpring, [0, 1], [1.5, 1]);
  const textOpacity = fadeIn(frame, 0, 12);

  // Subtitle: delayed fade in
  const subtitleOpacity = subtitle ? fadeIn(frame, 15, 15) : 0;
  const subtitleSlide = subtitle
    ? interpolate(frame, [15, 30], [12, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Background breathing
  const bgScale = breathe(frame, 40, 0.01);

  // Particle dots
  const particles = Array.from({ length: 20 }, (_, i) => {
    const speed = 0.3 + (i % 5) * 0.15;
    const startX = ((i * 97 + 31) % 100);
    const startY = ((i * 53 + 17) % 100);
    const x = startX + Math.sin(frame * speed * 0.05 + i * 1.7) * 6;
    const y = startY - (frame * speed * 0.4) % 120;
    const wrappedY = ((y % 120) + 120) % 120 - 10;
    const size = 2 + (i % 3);
    const opacity = 0.15 + Math.sin(frame * 0.08 + i * 0.9) * 0.1;
    return { x, y: wrappedY, size, opacity };
  });

  // Glitch offset (occasional horizontal glitch on text)
  const glitchCycle = Math.sin(frame * 0.7) * Math.sin(frame * 1.3);
  const glitchActive = glitchCycle > 0.85;
  const glitchX = glitchActive ? (Math.sin(frame * 3.7) * 4) : 0;
  const glitchClip = glitchActive
    ? `inset(${30 + Math.sin(frame * 5) * 20}% 0 ${30 + Math.cos(frame * 4) * 15}% 0)`
    : "none";

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />

      {/* Rotating gradient background */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${angle}deg, ${theme.dark_bg_from} 0%, ${theme.dark_bg_mid} 35%, ${theme.dark_bg_to} 65%, ${theme.dark_bg_mid} 100%)`,
          transform: `scale(${bgScale})`,
          overflow: "hidden",
        }}
      >
        {/* Particle dots */}
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: i % 3 === 0 ? theme.brand_primary : theme.brand_highlight,
              opacity: p.opacity,
              filter: "blur(1px)",
            }}
          />
        ))}

        {/* Center content */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Main text */}
          <div
            style={{
              fontFamily,
              fontSize: 96,
              fontWeight: 800,
              color: theme.text_on_bg,
              opacity: textOpacity,
              transform: `scale(${textScale}) translateX(${glitchX}px)`,
              textAlign: "center",
              lineHeight: 1.2,
              padding: "0 80px",
            }}
          >
            {text}
          </div>

          {/* Glitch echo layer */}
          {glitchActive && (
            <div
              style={{
                position: "absolute",
                fontFamily,
                fontSize: 96,
                fontWeight: 800,
                color: theme.brand_primary,
                opacity: 0.3,
                transform: `scale(${textScale}) translateX(${-glitchX * 2}px)`,
                textAlign: "center",
                lineHeight: 1.2,
                padding: "0 80px",
                clipPath: glitchClip,
              }}
            >
              {text}
            </div>
          )}

          {/* Subtitle */}
          {subtitle && (
            <div
              style={{
                fontFamily,
                fontSize: 36,
                fontWeight: 400,
                color: "#8b949e",
                marginTop: 24,
                opacity: subtitleOpacity,
                transform: `translateY(${subtitleSlide}px)`,
                textAlign: "center",
                padding: "0 120px",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

      </AbsoluteFill>
    </AbsoluteFill>
  );
};
