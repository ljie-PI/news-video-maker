#!/usr/bin/env python3
"""Generate Main.tsx and Root.tsx from a script JSON + audio durations.

Supports all 17 scene templates + 1 alias (cover_title ≡ cover); see TEMPLATE_REGISTRY.
Registry-driven: each template maps to a component name and prop builder.
"""
import json
import subprocess
import sys
import math
import os


def get_duration_frames(wav_path: str) -> int:
    """Get duration of a wav file in frames (30fps)."""
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", wav_path],
        capture_output=True, text=True
    )
    seconds = float(result.stdout.strip())
    return math.ceil(seconds * 30)


MAX_BULLETS = 6


def _split_audio(wav_path: str, split_sec: float, out_a: str, out_b: str):
    """Split a wav file at split_sec into two files."""
    subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path, "-t", str(split_sec),
         "-c", "copy", out_a, "-loglevel", "error"],
        check=True,
    )
    subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path, "-ss", str(split_sec),
         "-c", "copy", out_b, "-loglevel", "error"],
        check=True,
    )


def _split_bullet_segments(segments: list, audio_dir: str, is_portrait: bool = False) -> list:
    """Pre-process: split rich_bullet/bullet_points segments with >MAX_BULLETS items.

    Applies repeatedly until each splittable segment has ≤MAX_BULLETS bullets.
    In landscape mode, rich_bullet is not split (two-column layout handles more items),
    so those segments may still exceed MAX_BULLETS.
    """
    queue = list(segments)
    result = []
    while queue:
        seg = queue.pop(0)
        template = seg.get("template", "")
        bullets = seg.get("data", {}).get("bullets", [])
        skip_split = template == "rich_bullet" and not is_portrait
        if template not in ("rich_bullet", "bullet_points") or len(bullets) <= MAX_BULLETS or skip_split:
            result.append(seg)
            continue

        seg_id = seg["id"]
        data = seg["data"]
        narration = seg.get("narration", "")
        mid = math.ceil(len(bullets) / 2)

        # Split narration by \n\n for rich_bullet
        narration_parts = [p.strip() for p in narration.split("\n\n") if p.strip()] if "\n\n" in narration else []

        # Detect "intro paragraph" pattern: narration paragraphs = bullets + 1.
        # First paragraph is a generic intro, remaining N map 1:1 to bullets.
        has_intro = len(narration_parts) == len(bullets) + 1
        narration_mid = mid + (1 if has_intro else 0)

        # Try to find bulletDurations to split audio precisely. Two valid
        # forms when has_intro:
        #   (a) "unmerged": len == len(bullets) + 1 with d[0] = intro time
        #       (typical: original manifest produced alongside narration).
        #   (b) "merged": len == len(bullets) with intro already folded into
        #       d[0] (typical: a manifest written by a previous split pass —
        #       relevant for recursive splits when seg_a still has > MAX
        #       bullets).
        # Without has_intro, only len == len(bullets) is valid.
        manifest_path = os.path.join(audio_dir, f"{seg_id}.bullets.json")
        durations = None
        intro_offset = 0  # 1 when manifest is in unmerged form
        if os.path.exists(manifest_path):
            try:
                with open(manifest_path) as f:
                    durations = json.load(f).get("durations", [])
                if has_intro and len(durations) == len(bullets) + 1:
                    intro_offset = 1
                elif len(durations) != len(bullets):
                    durations = None
            except (ValueError, OSError):
                durations = None

        # Split audio
        wav_path = os.path.join(audio_dir, f"{seg_id}.wav")
        id_a, id_b = f"{seg_id}-a", f"{seg_id}-b"
        wav_a = os.path.join(audio_dir, f"{id_a}.wav")
        wav_b = os.path.join(audio_dir, f"{id_b}.wav")

        if os.path.exists(wav_path):
            if durations:
                # Either form sums to the same audio split point: covers
                # intro + bullets[:mid] in seg_a.
                split_sec = sum(durations[:mid + intro_offset])
            else:
                # Fallback: split proportionally by bullet count
                total_sec = subprocess.run(
                    ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
                     "-of", "csv=p=0", wav_path],
                    capture_output=True, text=True,
                )
                split_sec = float(total_sec.stdout.strip()) * mid / len(bullets)
            _split_audio(wav_path, split_sec, wav_a, wav_b)

            # Write split bullets.json manifests. Always emit in merged form:
            # length == segment's bullet count. seg_a's first bullet absorbs
            # the intro time so bullet 1 stays highlighted while intro audio
            # plays.
            if durations:
                if intro_offset == 1:
                    # Unmerged input: d[0]=intro, d[1..]=per-bullet.
                    dur_a = [durations[0] + durations[1]] + list(durations[2:1 + mid])
                else:
                    # Already-merged input (or no intro): d[0] already
                    # includes any intro time.
                    dur_a = list(durations[:mid])
                dur_b = list(durations[mid + intro_offset:])
                for fname, dur_list in [(f"{id_a}.bullets.json", dur_a), (f"{id_b}.bullets.json", dur_b)]:
                    with open(os.path.join(audio_dir, fname), "w") as f:
                        json.dump({"durations": dur_list}, f, ensure_ascii=False, indent=2)

        # Build two segments — push back to queue for further splitting if needed
        title = data.get("sectionTitle", data.get("title", ""))
        seg_a = {
            "id": id_a,
            "template": template,
            "narration": "\n\n".join(narration_parts[:narration_mid]) if narration_parts else narration,
            "data": {**data, "bullets": bullets[:mid], "sectionTitle": title},
        }
        seg_b = {
            "id": id_b,
            "template": template,
            "narration": "\n\n".join(narration_parts[narration_mid:]) if narration_parts else "",
            "data": {**data, "bullets": bullets[mid:], "sectionTitle": f"{title}（续）"},
        }

        print(f"SPLIT: {seg_id} ({len(bullets)} bullets) → {id_a} ({mid}) + {id_b} ({len(bullets)-mid})")
        queue.insert(0, seg_b)
        queue.insert(0, seg_a)

    return result


def escape(s) -> str:
    """Escape special chars for JSX string attributes."""
    if s is None:
        return ""
    return (str(s)
            .replace("&", "&amp;")
            .replace('"', "&quot;")
            .replace("'", "&#39;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("{", "&#123;")
            .replace("}", "&#125;")
            .replace("\n", " ")
            .replace("\\", "&#92;"))


def json_prop(value) -> str:
    """Serialize a value as a JSX expression prop."""
    return json.dumps(value, ensure_ascii=False)


# --- Prop builders: each returns a list of JSX prop lines ---

def _cover_props(data, audio_ref, **_):
    return [
        f'title="{escape(data.get("title", ""))}"',
        f'subtitle="{escape(data.get("subtitle", ""))}"',
        f'audioFile="{audio_ref}"',
    ]

def _project_hero_props(data, audio_ref, **_):
    stats = data.get("stats", data.get("stars", data.get("votes",
            data.get("upvotes", data.get("points", "")))))
    props = [
        f'rank={{{data.get("rank", 0)}}}',
        f'name="{escape(data.get("name", ""))}"',
        f'tagline="{escape(data.get("tagline", ""))}"',
        f'stats="{escape(str(stats))}"',
        f'source="{escape(data.get("source", ""))}"',
        f'audioFile="{audio_ref}"',
    ]
    if data.get("narration"):
        props.append(f'narration="{escape(data["narration"])}"')
    return props

def _project_intro_props(data, audio_ref, **_):
    # ProjectIntroScene takes a single `stars` string regardless of source —
    # it strips non-digits at runtime so any of the source-specific count
    # fields (stars, votes, upvotes, points) can be funneled through.
    stars = data.get("stars", data.get("votes",
            data.get("upvotes", data.get("points",
            data.get("stats", "")))))
    props = [
        f'rank={{{data.get("rank", 0)}}}',
        f'name="{escape(data.get("name", ""))}"',
        f'tagline="{escape(data.get("tagline", ""))}"',
        f'stars="{escape(str(stars))}"',
        f'audioFile="{audio_ref}"',
    ]
    if data.get("narration"):
        props.append(f'narration="{escape(data["narration"])}"')
    return props

def _key_insight_props(data, audio_ref, **_):
    props = [
        f'headline="{escape(data.get("headline", ""))}"',
        f'explanation="{escape(data.get("explanation", ""))}"',
        f'audioFile="{audio_ref}"',
    ]
    if data.get("icon"):
        props.append(f'icon="{escape(data["icon"])}"')
    if data.get("accentColor"):
        props.append(f'accentColor="{escape(data["accentColor"])}"')
    if data.get("narration"):
        props.append(f'narration="{escape(data["narration"])}"')
    return props

def _load_bullet_durations_frames(audio_dir, seg_id, bullet_count):
    """Load per-bullet durations (in frames) from {seg_id}.bullets.json.

    Accepts either length == bullet_count (no intro, or intro already merged
    into bullet 1) or length == bullet_count + 1 (intro paragraph present,
    unmerged). For the unmerged case, the intro duration is merged into
    bullet 1 so the highlight stays on bullet 1 while intro audio plays.
    Returns None if the file is missing/invalid or has any other length.

    Note: a manifest authored with a wrong extra duration entry would be
    silently treated as the intro pattern. Manifests are always generated
    by this script, so this risk is accepted.
    """
    if not (audio_dir and seg_id) or bullet_count < 1:
        return None
    manifest_path = os.path.join(audio_dir, f"{seg_id}.bullets.json")
    if not os.path.exists(manifest_path):
        return None
    try:
        with open(manifest_path) as f:
            durations_sec = json.load(f).get("durations", [])
    except (ValueError, OSError) as e:
        print(f"WARNING: failed to read {manifest_path}: {e}")
        return None
    if not isinstance(durations_sec, list):
        return None
    if len(durations_sec) == bullet_count + 1:
        # Intro present: merge intro time into bullet 1.
        try:
            durations_sec = [durations_sec[0] + durations_sec[1]] + list(durations_sec[2:])
        except TypeError as e:
            print(f"WARNING: bad intro duration in {manifest_path}: {e}")
            return None
    elif len(durations_sec) != bullet_count:
        return None
    try:
        return [max(1, math.ceil(float(s) * 30)) for s in durations_sec]
    except (ValueError, TypeError) as e:
        print(f"WARNING: bad duration value in {manifest_path}: {e}")
        return None


def _rich_bullet_props(data, audio_ref, seq_count=0, audio_dir=None, seg_id=None, **_):
    raw_bullets = data.get("bullets", [])
    # Normalize: plain strings become {title: str, detail: ""}
    bullets = []
    for b in raw_bullets:
        if isinstance(b, str):
            bullets.append({"title": b, "detail": ""})
        else:
            bullets.append(b)
    props = [
        f'project="{escape(data.get("project", ""))}"',
        f'sectionTitle="{escape(data.get("sectionTitle", data.get("title", "")))}"',
        f'bullets={{{json_prop(bullets)}}}',
        f'variant={{{seq_count % 3}}}',
        f'audioFile="{audio_ref}"',
    ]
    if audio_dir and seg_id:
        durations_frames = _load_bullet_durations_frames(audio_dir, seg_id, len(bullets))
        if durations_frames is not None:
            props.append(f'bulletDurations={{{json_prop(durations_frames)}}}')
    return props

def _bullet_points_props(data, audio_ref, seq_count=0, audio_dir=None, seg_id=None, **_):
    # BulletPointsScene takes plain strings only — flatten {title, detail}
    # objects back to "title — detail" strings if needed.
    raw_bullets = data.get("bullets", [])
    bullets = []
    for b in raw_bullets:
        if isinstance(b, str):
            bullets.append(b)
        elif isinstance(b, dict):
            title = b.get("title", "")
            detail = b.get("detail", "")
            bullets.append(f"{title} — {detail}" if detail else title)
        else:
            bullets.append(str(b))
    props = [
        f'project="{escape(data.get("project", ""))}"',
        f'sectionTitle="{escape(data.get("sectionTitle", data.get("title", "")))}"',
        f'bullets={{{json_prop(bullets)}}}',
        f'variant={{{seq_count % 3}}}',
        f'audioFile="{audio_ref}"',
    ]
    if audio_dir and seg_id:
        durations_frames = _load_bullet_durations_frames(audio_dir, seg_id, len(bullets))
        if durations_frames is not None:
            props.append(f'bulletDurations={{{json_prop(durations_frames)}}}')
    return props

def _comparison_table_props(data, audio_ref, **_):
    # Normalize rows: accept both [{cells: [...]}] and [[...]] formats
    raw_rows = data.get("rows", [])
    normalized = []
    for r in raw_rows:
        if isinstance(r, list):
            normalized.append({"cells": r})
        elif isinstance(r, dict) and "cells" in r:
            normalized.append(r)
        else:
            normalized.append({"cells": [str(r)]})
    return [
        f'title="{escape(data.get("title", ""))}"',
        f'columns={{{json_prop(data.get("columns", []))}}}',
        f'rows={{{json_prop(normalized)}}}',
        f'audioFile="{audio_ref}"',
    ]

def _quote_card_props(data, audio_ref, **_):
    props = [
        f'quote="{escape(data.get("quote", ""))}"',
        f'author="{escape(data.get("author", ""))}"',
        f'platform="{escape(data.get("platform", ""))}"',
        f'audioFile="{audio_ref}"',
    ]
    if data.get("upvotes"):
        props.append(f'upvotes="{escape(data["upvotes"])}"')
    if data.get("context"):
        props.append(f'context="{escape(data["context"])}"')
    return props

def _data_highlight_props(data, audio_ref, **_):
    props = [
        f'mainNumber="{escape(data.get("mainNumber", "0"))}"',
        f'unit="{escape(data.get("unit", ""))}"',
        f'context="{escape(data.get("context", ""))}"',
        f'audioFile="{audio_ref}"',
    ]
    if data.get("secondaryStats"):
        props.append(f'secondaryStats={{{json_prop(data["secondaryStats"])}}}')
    return props

def _debate_split_props(data, audio_ref, **_):
    return [
        f'topic="{escape(data.get("topic", ""))}"',
        f'proSide={{{json_prop(data.get("proSide", {"label": "", "points": []}))}}}',
        f'conSide={{{json_prop(data.get("conSide", {"label": "", "points": []}))}}}',
        f'audioFile="{audio_ref}"',
    ]

def _architecture_props(data, audio_ref, **_):
    props = [
        f'title="{escape(data.get("title", ""))}"',
        f'layers={{{json_prop(data.get("layers", []))}}}',
        f'audioFile="{audio_ref}"',
    ]
    if data.get("direction"):
        props.append(f'direction="{escape(data["direction"])}"')
    return props

def _tech_stack_props(data, audio_ref, **_):
    props = [
        f'project="{escape(data.get("project", ""))}"',
        f'techs={{{json_prop(data.get("techs", []))}}}',
        f'audioFile="{audio_ref}"',
    ]
    if data.get("title"):
        props.append(f'title="{escape(data["title"])}"')
    return props

def _timeline_props(data, audio_ref, **_):
    return [
        f'title="{escape(data.get("title", ""))}"',
        f'events={{{json_prop(data.get("events", []))}}}',
        f'audioFile="{audio_ref}"',
    ]

def _feature_card_props(data, audio_ref, **_):
    props = [
        f'icon="{escape(data.get("icon", ""))}"',
        f'title="{escape(data.get("title", ""))}"',
        f'description="{escape(data.get("description", ""))}"',
        f'audioFile="{audio_ref}"',
    ]
    if data.get("highlight"):
        props.append(f'highlight="{escape(data["highlight"])}"')
    if data.get("narration"):
        props.append(f'narration="{escape(data["narration"])}"')
    return props

def _code_block_props(data, audio_ref, **_):
    code_raw = data.get("code", "")
    # Use JSX expression to preserve newlines in code
    code_escaped = json.dumps(code_raw, ensure_ascii=False)
    props = [
        f'title="{escape(data.get("title", ""))}"',
        f'language="{escape(data.get("language", "bash"))}"',
        f'code={{{code_escaped}}}',
        f'audioFile="{audio_ref}"',
    ]
    if data.get("annotation"):
        props.append(f'annotation="{escape(data["annotation"])}"')
    if data.get("narration"):
        props.append(f'narration="{escape(data["narration"])}"')
    return props

def _chat_bubbles_props(data, audio_ref, **_):
    # Normalize: script may use "sender" but component expects "author"
    # Auto-assign "side" if missing (alternating left/right)
    messages = []
    for i, msg in enumerate(data.get("messages", [])):
        m = dict(msg)
        if "sender" in m and "author" not in m:
            m["author"] = m.pop("sender")
        if "side" not in m:
            m["side"] = "left" if i % 2 == 0 else "right"
        messages.append(m)
    return [
        f'topic="{escape(data.get("topic", ""))}"',
        f'messages={{{json_prop(messages)}}}',
        f'audioFile="{audio_ref}"',
    ]

def _transition_props(data, audio_ref, **_):
    props = [
        f'text="{escape(data.get("text", ""))}"',
        f'audioFile="{audio_ref}"',
    ]
    if data.get("subtitle"):
        props.append(f'subtitle="{escape(data["subtitle"])}"')
    return props


# Template registry: template_id -> (ComponentName, prop_builder)
TEMPLATE_REGISTRY = {
    "cover":             ("CoverScene",           _cover_props),
    "cover_title":       ("CoverScene",           _cover_props),
    "project_hero":      ("ProjectHeroScene",     _project_hero_props),
    "project_intro":     ("ProjectIntroScene",    _project_intro_props),
    "key_insight":       ("KeyInsightScene",      _key_insight_props),
    "rich_bullet":       ("RichBulletScene",      _rich_bullet_props),
    "bullet_points":     ("BulletPointsScene",    _bullet_points_props),
    "comparison_table":  ("ComparisonTableScene", _comparison_table_props),
    "quote_card":        ("QuoteCardScene",       _quote_card_props),
    "data_highlight":    ("DataHighlightScene",   _data_highlight_props),
    "debate_split":      ("DebateSplitScene",     _debate_split_props),
    "architecture":      ("ArchitectureScene",    _architecture_props),
    "tech_stack":        ("TechStackScene",       _tech_stack_props),
    "timeline":          ("TimelineScene",        _timeline_props),
    "feature_card":      ("FeatureCardScene",     _feature_card_props),
    "code_block":        ("CodeBlockScene",       _code_block_props),
    "chat_bubbles":      ("ChatBubblesScene",     _chat_bubbles_props),
    "transition":        ("TransitionScene",      _transition_props),
}


def build_sequence(template, data, audio_ref, frame_offset, dur, seq_count, audio_dir=None, seg_id=None):
    """Build a <Sequence> JSX block for a given template."""
    if template not in TEMPLATE_REGISTRY:
        print(f"WARNING: Unknown template '{template}', skipping")
        return ""

    component_name, prop_builder = TEMPLATE_REGISTRY[template]
    props = prop_builder(data, audio_ref, seq_count=seq_count, audio_dir=audio_dir, seg_id=seg_id)

    # Add narration to ALL templates if available and not already included
    narration = data.get("narration", "")
    props_has_narration = any("narration=" in p for p in props)
    if narration and not props_has_narration:
        props.append(f'narration="{escape(narration)}"')

    props_str = "\n".join(f"          {p}" for p in props)

    return (
        f'      <Sequence from={{{frame_offset}}} durationInFrames={{{dur}}}>\n'
        f'        <{component_name}\n'
        f'{props_str}\n'
        f'        />\n'
        f'      </Sequence>'
    )


def main():
    if len(sys.argv) < 3:
        print("Usage: generate_main_tsx.py <script.json> <output_dir> [--width W] [--height H] [--audio-dir DIR]")
        sys.exit(1)

    script_path = sys.argv[1]
    output_dir = sys.argv[2]

    width, height = 1920, 1080
    custom_audio_dir = None
    args = sys.argv[3:]
    for i, arg in enumerate(args):
        if arg == "--width" and i + 1 < len(args):
            width = int(args[i + 1])
        elif arg == "--height" and i + 1 < len(args):
            height = int(args[i + 1])
        elif arg == "--audio-dir" and i + 1 < len(args):
            custom_audio_dir = args[i + 1]

    audio_dir = custom_audio_dir or os.path.join(os.path.dirname(script_path), "audio")

    with open(script_path) as f:
        script = json.load(f)

    is_portrait = height > width
    segments = _split_bullet_segments(script["segments"], audio_dir, is_portrait=is_portrait)

    # Warn early if the script uses CoverScene but the required static
    # image is missing. audio_dir is the conventional location for
    # Remotion's `public/` (the workflow symlinks public/audio -> audio),
    # so `<audio_dir>/../cover.png` resolves to the project's public dir.
    cover_templates = {"cover", "cover_title"}
    if any(s.get("template") in cover_templates for s in segments):
        cover_path = os.path.normpath(os.path.join(audio_dir, "..", "cover.png"))
        if not os.path.exists(cover_path):
            print(
                f"WARNING: CoverScene is used but {cover_path} not found. "
                f"Copy remotion-templates/covers/<source>_{width}x{height}.png "
                f"to this path before rendering."
            )

    sequences = []
    frame_offset = 0
    used_components = set()
    template_counts = {}

    for seg in segments:
        seg_id = seg["id"]
        template = seg["template"]
        data = seg["data"]

        # Portrait mode: replace code_block with key_insight
        if is_portrait and template == "code_block":
            template = "key_insight"
            narration = seg.get("narration", "")
            data = {
                "icon": "💻",
                "headline": data.get("title", ""),
                "explanation": data.get("annotation") or narration,
                "narration": narration,
            }

        wav_file = f"{seg_id}.wav"
        wav_path = os.path.join(audio_dir, wav_file)

        if not os.path.exists(wav_path):
            print(f"WARNING: {wav_path} not found, skipping")
            continue

        dur = get_duration_frames(wav_path)
        audio_ref = f"audio/{wav_file}"

        template_counts[template] = template_counts.get(template, 0) + 1
        seq_count = template_counts[template]

        seq = build_sequence(template, data, audio_ref, frame_offset, dur, seq_count, audio_dir=audio_dir, seg_id=seg_id)
        if seq:
            sequences.append(seq)
            if template in TEMPLATE_REGISTRY:
                used_components.add(TEMPLATE_REGISTRY[template][0])

        frame_offset += dur

    total_frames = frame_offset

    imports = "\n".join(
        f'import {{ {name} }} from "./{name}";'
        for name in sorted(used_components)
    )

    main_tsx = f'''import React from "react";
import {{ Sequence }} from "remotion";
{imports}

const TOTAL_FRAMES = {total_frames};

export const Main: React.FC = () => {{
  return (
    <>
{chr(10).join(sequences)}
    </>
  );
}};
'''

    root_tsx = f'''import "./index.css";
import {{ Composition }} from "remotion";
import {{ Main }} from "./Main";

export const RemotionRoot: React.FC = () => {{
  return (
    <>
      <Composition
        id="Main"
        component={{Main}}
        durationInFrames={{{total_frames}}}
        fps={{30}}
        width={{{width}}}
        height={{{height}}}
      />
    </>
  );
}};
'''

    os.makedirs(output_dir, exist_ok=True)
    with open(os.path.join(output_dir, "Main.tsx"), "w") as f:
        f.write(main_tsx)
    with open(os.path.join(output_dir, "Root.tsx"), "w") as f:
        f.write(root_tsx)

    print(f"Generated Main.tsx and Root.tsx in {output_dir}")
    print(f"Total segments: {len(sequences)}, Total frames: {total_frames}, Duration: {total_frames/30:.1f}s")
    print(f"Components used: {', '.join(sorted(used_components))}")
    print(f"Template distribution: {json.dumps(template_counts, indent=2)}")


if __name__ == "__main__":
    main()
