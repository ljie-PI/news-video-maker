#!/usr/bin/env python3
"""
smart_render.py — Optimized Remotion video renderer.

Parses Main.tsx to identify static segments, renders only animated frames
via Remotion, and fills static portions with ffmpeg freeze frames.

Usage:
    python3 smart_render.py <project_dir> --output <output.mp4> [--concurrency 4]

Example:
    python3 smart_render.py remotion-hn --output hn_v7.mp4
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# Animation duration estimates per template (frames at 30fps).
# "continuous" means the template has ongoing animation (e.g., highlight cycling)
# and must be fully rendered. A number means the template becomes static after
# that many frames.
ANIM_ESTIMATES = {
    "CoverScene":           120,   # title char-by-char entrance
    "ProjectHeroScene":     100,   # rank + name + badge entrance
    "KeyInsightScene":      150,   # typewriter + sentence stagger, then static
    "RichBulletScene":      "continuous",  # activeIndex highlight cycling
    "ComparisonTableScene": 120,   # row entrance then static
    "FeatureCardScene":     100,   # icon + title + desc entrance then static
    "DebateSplitScene":     120,   # card entrance then static
    "QuoteCardScene":       100,   # quote word entrance then static
    "DataHighlightScene":   "continuous",  # gauge ring, HudCorner, gradient all rotate continuously
    "CodeBlockScene":       120,   # code lines appear then static
    "ChatBubblesScene":     "continuous",  # activeIndex bubble cycling
    "TechStackScene":       120,   # badge stagger then static
    "ArchitectureScene":    120,   # layer entrance then static
    "TimelineScene":        "continuous",  # timeline progression
    "TransitionScene":      60,    # quick transition (glitch active throughout)
    "ProjectIntroScene":    120,   # rank/badge entrance + star counter (ends ~90), then static
    "BulletPointsScene":    "continuous",  # activeBullet cycling
}

# Safety buffer: render extra frames after estimated animation end
BUFFER_FRAMES = 30


def parse_main_tsx(main_tsx_path):
    """Parse Main.tsx to extract segment info."""
    with open(main_tsx_path) as f:
        content = f.read()

    # Extract fps from Root.tsx in same directory
    root_path = os.path.join(os.path.dirname(main_tsx_path), "Root.tsx")
    fps = 30
    if os.path.exists(root_path):
        with open(root_path) as f:
            root_content = f.read()
        fps_match = re.search(r"fps=\{(\d+)\}", root_content)
        if fps_match:
            fps = int(fps_match.group(1))

    # Extract total frames
    total_match = re.search(r"TOTAL_FRAMES\s*=\s*(\d+)", content)
    total_frames = int(total_match.group(1)) if total_match else 0

    # Extract sequences
    pattern = r"<Sequence from=\{(\d+)\} durationInFrames=\{(\d+)\}>\s*<(\w+)"
    matches = re.findall(pattern, content)

    segments = []
    for from_frame, duration, component in matches:
        from_frame = int(from_frame)
        duration = int(duration)

        # Determine animation type
        anim_est = ANIM_ESTIMATES.get(component, "continuous")

        if anim_est == "continuous":
            mode = "full"
            anim_frames = duration
        else:
            anim_frames = min(anim_est + BUFFER_FRAMES, duration)
            if anim_frames >= duration * 0.85:
                # If animation is >85% of segment, just render full
                mode = "full"
                anim_frames = duration
            else:
                mode = "partial"

        segments.append({
            "from": from_frame,
            "duration": duration,
            "component": component,
            "mode": mode,
            "anim_frames": anim_frames,
            "static_frames": duration - anim_frames,
        })

    return {
        "fps": fps,
        "total_frames": total_frames,
        "segments": segments,
    }


def print_plan(plan):
    """Print render plan summary."""
    total = plan["total_frames"]
    render_frames = sum(s["anim_frames"] for s in plan["segments"])
    skip_frames = total - render_frames

    print(f"\n{'='*60}")
    print(f"Smart Render Plan")
    print(f"{'='*60}")
    print(f"Total frames:    {total} ({total/plan['fps']:.0f}s)")
    print(f"Render frames:   {render_frames} ({render_frames/total*100:.0f}%)")
    print(f"Skip frames:     {skip_frames} ({skip_frames/total*100:.0f}%)")
    print(f"Estimated speedup: {total/render_frames:.1f}x")
    print(f"{'='*60}")

    for i, seg in enumerate(plan["segments"]):
        mode_icon = "🎬" if seg["mode"] == "full" else "⚡"
        print(f"  {mode_icon} Seg {i:2d} {seg['component']:25s} "
              f"from={seg['from']:6d} dur={seg['duration']:5d} "
              f"render={seg['anim_frames']:5d} skip={seg['static_frames']:5d}")
    print()


def run_cmd(cmd, desc=""):
    """Run a shell command, raise on failure."""
    if desc:
        print(f"  → {desc}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  ❌ FAILED: {cmd}")
        print(f"  stderr: {result.stderr[:500]}")
        raise RuntimeError(f"Command failed: {cmd}")
    return result


def smart_render(project_dir, output_path, concurrency=4, dry_run=False):
    """Execute the smart render."""
    project_dir = os.path.abspath(project_dir)
    main_tsx = os.path.join(project_dir, "src", "Main.tsx")

    if not os.path.exists(main_tsx):
        print(f"❌ Main.tsx not found at {main_tsx}")
        sys.exit(1)

    # Parse and plan
    plan = parse_main_tsx(main_tsx)
    print_plan(plan)

    if dry_run:
        print("DRY RUN — no rendering performed.")
        return

    # Check if any segments are partial (worth optimizing)
    partial_segs = [s for s in plan["segments"] if s["mode"] == "partial"]
    if not partial_segs:
        print("No partial segments — falling back to standard render.")
        cmd = (f"cd {project_dir} && npx remotion render src/index.ts Main "
               f"--output {os.path.abspath(output_path)} --concurrency={concurrency}")
        run_cmd(cmd, "Standard full render")
        return

    # Create temp directory for intermediate files
    tmp_dir = tempfile.mkdtemp(prefix="smart_render_")
    concat_list = os.path.join(tmp_dir, "concat.txt")
    segment_files = []

    try:
        fps = plan["fps"]

        for i, seg in enumerate(plan["segments"]):
            seg_file = os.path.join(tmp_dir, f"seg_{i:03d}.mp4")
            segment_files.append(seg_file)

            abs_from = seg["from"]
            abs_end = abs_from + seg["duration"]
            anim_end = abs_from + seg["anim_frames"]

            if seg["mode"] == "full":
                # Render full segment
                print(f"\n[{i+1}/{len(plan['segments'])}] 🎬 {seg['component']} "
                      f"FULL render ({seg['duration']} frames)")
                cmd = (f"cd {project_dir} && npx remotion render src/index.ts Main "
                       f"--frames={abs_from}-{abs_end - 1} "
                       f"--output {seg_file} --concurrency={concurrency} 2>&1 | tail -1")
                run_cmd(cmd, f"Render frames {abs_from}-{abs_end-1}")

            else:
                # Partial render: animated part + freeze frame fill
                print(f"\n[{i+1}/{len(plan['segments'])}] ⚡ {seg['component']} "
                      f"PARTIAL render ({seg['anim_frames']}/{seg['duration']} frames, "
                      f"skip {seg['static_frames']})")

                anim_file = os.path.join(tmp_dir, f"anim_{i:03d}.mp4")
                still_file = os.path.join(tmp_dir, f"still_{i:03d}.png")
                static_file = os.path.join(tmp_dir, f"static_{i:03d}.mp4")

                # 1. Render animated portion
                cmd = (f"cd {project_dir} && npx remotion render src/index.ts Main "
                       f"--frames={abs_from}-{anim_end - 1} "
                       f"--output {anim_file} --concurrency={concurrency} 2>&1 | tail -1")
                run_cmd(cmd, f"Render animated frames {abs_from}-{anim_end-1}")

                # 2. Extract last frame as still image
                cmd = (f"ffmpeg -y -sseof -0.04 -i {anim_file} -frames:v 1 "
                       f"-q:v 2 {still_file} 2>/dev/null")
                run_cmd(cmd, "Extract freeze frame")

                # 3. Create static segment from still image
                static_duration = seg["static_frames"] / fps
                cmd = (f"ffmpeg -y -loop 1 -i {still_file} -c:v libx264 "
                       f"-t {static_duration:.4f} -pix_fmt yuv420p -r {fps} "
                       f"-preset ultrafast {static_file} 2>/dev/null")
                run_cmd(cmd, f"Generate {seg['static_frames']} static frames ({static_duration:.1f}s)")

                # 4. Concatenate animated + static
                seg_concat = os.path.join(tmp_dir, f"seg_concat_{i:03d}.txt")
                with open(seg_concat, "w") as f:
                    f.write(f"file '{anim_file}'\n")
                    f.write(f"file '{static_file}'\n")
                cmd = (f"ffmpeg -y -f concat -safe 0 -i {seg_concat} "
                       f"-c copy {seg_file} 2>/dev/null")
                run_cmd(cmd, "Concat animated + static")

        # Final: concatenate all segments
        print(f"\n{'='*60}")
        print(f"Concatenating {len(segment_files)} segments...")
        with open(concat_list, "w") as f:
            for sf in segment_files:
                f.write(f"file '{sf}'\n")

        # Concat without audio first
        no_audio = os.path.join(tmp_dir, "no_audio.mp4")
        cmd = (f"ffmpeg -y -f concat -safe 0 -i {concat_list} "
               f"-c copy {no_audio} 2>/dev/null")
        run_cmd(cmd, "Concat all segments")

        # The audio is embedded in each segment via Remotion, so the concat
        # should already have audio. Copy to final output.
        shutil.move(no_audio, output_path)
        print(f"\n✅ Output: {output_path} ({os.path.getsize(output_path) / 1024 / 1024:.1f} MB)")

    finally:
        # Cleanup
        shutil.rmtree(tmp_dir, ignore_errors=True)
        print(f"🧹 Cleaned up temp files")


def main():
    parser = argparse.ArgumentParser(description="Smart Remotion Renderer")
    parser.add_argument("project_dir", help="Remotion project directory")
    parser.add_argument("--output", "-o", required=True, help="Output video path")
    parser.add_argument("--concurrency", "-c", type=int, default=4,
                        help="Remotion render concurrency (default: 4)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print plan without rendering")
    args = parser.parse_args()

    smart_render(args.project_dir, args.output, args.concurrency, args.dry_run)


if __name__ == "__main__":
    main()
