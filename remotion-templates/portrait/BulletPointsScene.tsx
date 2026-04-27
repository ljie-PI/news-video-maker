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
  bulletDurations?: number[];
}

export const BulletPointsScene: React.FC<BulletPointsSceneProps> = ({
  project,
  sectionTitle,
  bullets,
  audioFile,
  variant = 0,
  bulletDurations,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, height } = useVideoConfig();

  const accentColor = variant % 2 === 0 ? theme.brand_primary : theme.brand_highlight;

  const bulletCount = bullets.length;
  if (bulletCount <= 0) return null;
  const entranceDone = 12 + bulletCount * 10;
  const isDense = bulletCount >= 6;
  const bulletGapPx = isDense
    ? Math.max(8, Math.floor((height - 400) / (bulletCount + 1) / 3))
    : Math.max(20, Math.floor((height - 400) / (bulletCount + 1) / 2));
  const audioDriven = !!bulletDurations && bulletDurations.length === bulletCount;

  // Per-bullet narration window starts. Audio-driven uses prefix sum of
  // bulletDurations; otherwise equal slots starting at entranceDone. The
  // underline progress and (audio-driven) active-bullet selection both read
  // from this array so they stay in sync and never reset.
  const bulletStarts: number[] = new Array(bulletCount);
  let timeSlot = 0;
  if (audioDriven) {
    let acc = 0;
    for (let i = 0; i < bulletCount; i++) {
      bulletStarts[i] = acc;
      acc += bulletDurations![i];
    }
  } else {
    timeSlot = Math.max(
      1,
      (durationInFrames - 10 - entranceDone) / bulletCount,
    );
    for (let i = 0; i < bulletCount; i++) {
      bulletStarts[i] = entranceDone + i * timeSlot;
    }
  }
  const bulletDurAt = (i: number): number =>
    audioDriven ? bulletDurations![i] : timeSlot;

  let activeBullet = bulletCount - 1;
  if (audioDriven) {
    let computed = 0;
    for (let i = 0; i < bulletCount; i++) {
      if (frame >= bulletStarts[i]) computed = i;
    }
    const totalEnd = bulletStarts[bulletCount - 1] + bulletDurations![bulletCount - 1];
    activeBullet = frame >= totalEnd ? bulletCount : computed;
  } else {
    const activeBulletRaw = entranceDone >= durationInFrames - 10
      ? bulletCount - 0.01
      : interpolate(
          frame,
          [entranceDone, durationInFrames - 10],
          [0, bulletCount - 0.01],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
    activeBullet = Math.floor(activeBulletRaw);
  }

  const bgAngle = 135 + (frame / durationInFrames) * 60;
  const progress = frame / durationInFrames;

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
        {/* Left accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 6,
            height: "100%",
            background: `linear-gradient(180deg, ${accentColor}00, ${accentColor}, ${accentColor}00)`,
            transform: `translateY(0)`,
          }}
        />

        {/* Project title */}
        <div
          style={{
            opacity: titleOpacity,
            borderBottom: `3px solid ${theme.border}`,
            paddingBottom: 18,
            transform: `translateX(0)`,
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: 60,
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
                fontSize: 48,
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
            gap: bulletGapPx,
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
            const activeScale = isActive ? 1.02 : (isNarrated ? 1.0 : 0.95);
            const activeOpacity = isActive ? 1 : (isNarrated ? 0.7 : 0.5);

            const underlineWidth = isActive
              ? interpolate(
                  frame - bulletStarts[i],
                  [0, bulletDurAt(i)],
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
                    fontSize: 28,
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
                <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily,
                      fontSize: 48,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? theme.text_primary : theme.text_secondary,
                      lineHeight: 1.5,
                      wordBreak: "break-word",
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
            fontSize: 24,
            fontWeight: 600,
            color: "rgba(0,0,0,0.15)",
          }}
        >
          {frame > entranceDone ? `${Math.min(activeBullet + 1, bulletCount)}/${bulletCount}` : ""}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
