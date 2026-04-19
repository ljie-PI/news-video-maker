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

interface BulletPointsSceneProps {
  project: string;
  sectionTitle?: string;
  bullets: string[];
  audioFile: string;
  narration?: string;
  variant?: number;
}

export const BulletPointsScene: React.FC<BulletPointsSceneProps> = ({
  project,
  sectionTitle,
  bullets,
  audioFile,
  variant = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const accentColor = variant % 2 === 0 ? theme.brand_primary : theme.brand_highlight;

  const bulletCount = bullets.length;
  const entranceDone = 12 + bulletCount * 10;
  const activeBulletRaw = interpolate(
    frame,
    [entranceDone, durationInFrames - 10],
    [0, bulletCount - 0.01],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const activeBullet = Math.floor(activeBulletRaw);

  const bgAngle = 135 + (frame / durationInFrames) * 60;
  const progress = frame / durationInFrames;
  const scanY = (frame * 4) % 2000;

  const titleOpacity = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />
      <AbsoluteFill
        style={{
          background: `linear-gradient(${bgAngle}deg, #ffffff 0%, ${theme.background_secondary} 100%)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 60px",
          gap: 36,
          overflow: "hidden",
        }}
      >
        {/* Scan line */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: scanY,
            width: "100%",
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}25, transparent)`,
          }}
        />

        {/* Left accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 6,
            height: "100%",
            background: `linear-gradient(180deg, ${accentColor}00, ${accentColor}, ${accentColor}00)`,
            transform: `translateY(${Math.sin(frame / 30) * 150}px)`,
          }}
        />

        {/* Project title */}
        <div
          style={{
            opacity: titleOpacity,
            borderBottom: `3px solid ${theme.border}`,
            paddingBottom: 18,
            transform: `translateX(${Math.sin(frame / 60) * 5}px)`,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: 48,
              fontWeight: 700,
              color: accentColor,
              lineHeight: 1.2,
            }}
          >
            {project}
          </div>
          {sectionTitle && (
            <div
              style={{
                fontFamily,
                fontSize: 30,
                fontWeight: 500,
                color: theme.text_secondary,
                marginTop: 8,
              }}
            >
              {sectionTitle}
            </div>
          )}
        </div>

        {/* Bullet points */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
            flex: 1,
            justifyContent: "center",
          }}
        >
          {bullets.map((bullet, i) => {
            const bulletDelay = 12 + i * 10;
            const bulletYSpring = spring({
              frame: Math.max(0, frame - bulletDelay),
              fps,
              config: { damping: 14, stiffness: 60 },
            });
            const bulletY = interpolate(bulletYSpring, [0, 1], [80, 0]);
            const bulletOpacity = interpolate(
              frame,
              [bulletDelay, bulletDelay + 15],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            const isActive = i === activeBullet && frame > entranceDone;
            const isNarrated = i <= activeBullet && frame > entranceDone;
            const activeScale = isActive ? 1.02 + Math.sin(frame / 12) * 0.01 : (isNarrated ? 1.0 : 0.95);
            const activeOpacity = isActive ? 1 : (isNarrated ? 0.7 : 0.5);

            const underlineWidth = isActive
              ? interpolate(
                  (frame - entranceDone) % (durationInFrames / bulletCount),
                  [0, (durationInFrames - entranceDone) / bulletCount],
                  [0, 100],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                )
              : (isNarrated ? 100 : 0);

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 20,
                  opacity: bulletOpacity * activeOpacity,
                  transform: `translateY(${bulletY}px) scale(${activeScale})`,
                  transformOrigin: "left center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontFamily,
                    fontSize: 30,
                    fontWeight: 700,
                    color: isActive ? "#ffffff" : accentColor,
                    minWidth: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: isActive ? accentColor : `${accentColor}18`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 4,
                    boxShadow: isActive ? `0 0 15px ${accentColor}50` : "none",
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1, position: "relative" }}>
                  <div
                    style={{
                      fontFamily,
                      fontSize: 32,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? theme.text_primary : theme.text_secondary,
                      lineHeight: 1.5,
                    }}
                  >
                    {bullet}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: -4,
                      left: 0,
                      height: 3,
                      width: `${underlineWidth}%`,
                      backgroundColor: accentColor,
                      borderRadius: 1,
                      opacity: 0.6,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: 4,
            backgroundColor: "rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${accentColor}, ${theme.status_success})`,
            }}
          />
        </div>

        {/* Counter */}
        <div
          style={{
            position: "absolute",
            top: 30,
            right: 40,
            fontFamily,
            fontSize: 22,
            fontWeight: 600,
            color: "rgba(0,0,0,0.15)",
          }}
        >
          {frame > entranceDone ? `${activeBullet + 1}/${bulletCount}` : ""}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
