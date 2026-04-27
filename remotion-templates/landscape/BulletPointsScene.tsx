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

  // Use light mode consistently for Reddit theme
  const accentColor = variant % 2 === 0 ? theme.brand_primary : theme.brand_highlight;

  const bulletCount = bullets.length;
  if (bulletCount <= 0) return null;
  const bulletBaseDelay = 5;
  const bulletGap = Math.max(3, Math.floor(45 / bulletCount));
  const entranceDone = bulletBaseDelay + bulletCount * bulletGap + 10;
  const isDense = bulletCount >= 6;
  const bulletGapPx = isDense
    ? Math.max(8, Math.floor((height - 300) / (bulletCount + 1) / 3))
    : Math.max(12, Math.floor((height - 300) / (bulletCount + 1) / 2));
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

  // Background gradient rotation
  const bgAngle = 135 + (frame / durationInFrames) * 60;

  // Progress bar

  // Scanning line (faster)

  // Active bullet indicator Y position (tracks which bullet is highlighted)
  const bulletItemHeight = 68; // approximate height per bullet row
  const indicatorY = activeBullet * bulletItemHeight;

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
          justifyContent: "flex-start",
          padding: "50px 80px",
          paddingTop: 60,
          gap: 24,
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

        {/* Project title + section subtitle */}
        <div
          style={{
            opacity: titleOpacity,
            borderBottom: `3px solid ${theme.border}`,
            paddingBottom: 14,
            transform: "none",
          }}
        >
          <div
            style={{
              fontFamily,
              fontSize: 42,
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
                fontSize: 26,
                fontWeight: 500,
                color: theme.text_secondary,
                marginTop: 6,
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
          }}
        >
          {bullets.map((bullet, i) => {
            const bulletDelay = bulletBaseDelay + i * bulletGap;
            const bulletXSpring = spring({
              frame: Math.max(0, frame - bulletDelay),
              fps,
              config: { damping: 14, stiffness: 60 },
            });
            const bulletX = interpolate(bulletXSpring, [0, 1], [150, 0]);
            const bulletOpacity = interpolate(
              frame,
              [bulletDelay, bulletDelay + 15],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            // Is this bullet currently being narrated?
            const isActive = i === activeBullet && frame > entranceDone;
            const isNarrated = i <= activeBullet && frame > entranceDone;

            // Active bullet highlight: scale up, glow, others dim
            const activeScale = isActive ? 1.03 : (isNarrated ? 1.0 : 0.95);
            const activeOpacity = isActive ? 1 : (isNarrated ? 0.7 : 0.5);

            // Underline sweep for active bullet
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
                  gap: 18,
                  opacity: bulletOpacity * activeOpacity,
                  transform: `translateX(${bulletX}px) scale(${activeScale})`,
                  transformOrigin: "left center",
                  transition: "opacity 0.3s",
                  position: "relative",
                }}
              >
                {/* Number badge */}
                <div
                  style={{
                    fontFamily,
                    fontSize: 26,
                    fontWeight: 700,
                    color: isActive ? "#ffffff" : accentColor,
                    minWidth: 40,
                    height: 40,
                    borderRadius: 10,
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
                      fontSize: 36,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? theme.text_primary : theme.text_secondary,
                      lineHeight: 1.45,
                      wordBreak: "break-word",
                      whiteSpace: "normal",
                    }}
                  >
                    {bullet}
                  </div>
                  {/* Underline sweep indicator */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: -4,
                      left: 0,
                      height: 2,
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

        {/* Bullet counter in corner */}
        <div
          style={{
            position: "absolute",
            top: 30,
            right: 40,
            fontFamily,
            fontSize: 20,
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
