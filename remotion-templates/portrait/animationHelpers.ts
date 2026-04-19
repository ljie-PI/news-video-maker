/**
 * Shared animation helpers for Remotion scene components.
 * Keeps animation logic DRY across 15 scene types.
 */
import { interpolate, spring, InterpolateOptions } from "remotion";

const CLAMP: InterpolateOptions = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

/** Fade in an element starting at a given frame offset. */
export function fadeIn(frame: number, start: number, duration = 15): number {
  return interpolate(frame, [start, start + duration], [0, 1], CLAMP);
}

/** Slide from a direction (returns translateX or translateY offset in px). */
export function slideIn(
  frame: number,
  fps: number,
  start: number,
  distance = 100,
  config = { damping: 14, mass: 0.8 }
): number {
  if (frame < start) return distance;
  const s = spring({ frame: frame - start, fps, config });
  return interpolate(s, [0, 1], [distance, 0]);
}

/** Stagger delay: returns the start frame for item at index i. */
export function staggerDelay(
  baseDelay: number,
  index: number,
  gap = 8
): number {
  return baseDelay + index * gap;
}

/** Calculate which item should be "active" based on frame progress. */
export function activeIndex(
  frame: number,
  entranceDone: number,
  duration: number,
  count: number
): number {
  if (frame < entranceDone || count <= 0) return 0;
  if (entranceDone >= duration - 10) return count - 1;
  const progress = interpolate(
    frame,
    [entranceDone, duration - 10],
    [0, count - 0.01],
    CLAMP
  );
  return Math.floor(Math.max(0, Math.min(progress, count - 1)));
}

/** Breathing/pulse animation — DISABLED. Always returns 1 (no scale variation).
 *  Kept as a no-op so existing call sites compile; visual breathing was removed
 *  so smart_render's freeze-frame matches a full render exactly. */
export function breathe(_frame: number, _period = 20, _amplitude = 0.12): number {
  return 1;
}

/** Float animation — DISABLED. Always returns 0 (no pixel offset).
 *  Kept as a no-op so existing call sites compile; visual floating was removed
 *  so smart_render's freeze-frame matches a full render exactly. */
export function float(
  _frame: number,
  _period = 25,
  _amplitude = 25,
  _phase = 0
): number {
  return 0;
}

/** Typewriter reveal: returns how many characters should be visible. */
export function typewriterCount(
  frame: number,
  start: number,
  totalChars: number,
  framesPerChar = 2
): number {
  if (frame < start) return 0;
  const elapsed = frame - start;
  return Math.min(Math.floor(elapsed / framesPerChar), totalChars);
}

/** Counter animation: interpolates from 0 to target number. */
export function counterValue(
  frame: number,
  start: number,
  end: number,
  target: number
): number {
  const val = interpolate(frame, [start, end], [0, target], CLAMP);
  return Math.round(val);
}

/** Underline sweep: returns width percentage (0-100). */
export function underlineSweep(
  frame: number,
  start: number,
  duration = 30
): number {
  return interpolate(frame, [start, start + duration], [0, 100], CLAMP);
}

/** Progress bar value based on frame position in segment. */
export function progressBar(frame: number, totalFrames: number): number {
  return (frame / totalFrames) * 100;
}

/** Gradient angle rotation over time — continuous oscillation. */
export function rotatingGradient(
  _frame: number,
  _totalFrames: number,
  startAngle = 135,
  _rotationDeg = 180
): number {
  return startAngle;
}
