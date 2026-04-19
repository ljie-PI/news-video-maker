#!/usr/bin/env python3
"""TTS orchestrator for news-video-maker.

Reads a script.json, builds a single CosyVoice batch input, calls
clone_voice_batch.py once, then writes the per-segment audio files
expected by generate_main_tsx.py.

Usage:
    python tts_batch.py <script.json> <audio_dir> [--cosyvoice-dir DIR] [--speed 1.3]

Outputs in <audio_dir>:
    <seg_id>.wav                final per-segment narration
    <seg_id>.bullets.json       (rich_bullet segments only) {"durations":[s,...]}

Intermediate files in <audio_dir>/_raw/:
    NNN.wav                     one wav per CosyVoice item
    input.json                  flat array of preprocessed strings
    timings.json                manifest written by clone_voice_batch.py

Any narration > 15s is logged with a WARN prefix; the script does not
abort, so callers can review and re-split offending segments.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

DEFAULT_COSYVOICE_DIR = os.path.expanduser("~/.openclaw/workspace/CosyVoice")
MAX_SEGMENT_SECONDS = 15.0

_HYPHEN_BETWEEN_LETTERS = re.compile(r'(?<=[A-Za-z])-(?=[A-Za-z])')
_CJK = r'\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af'
_CJK_THEN_ASCII = re.compile(rf'([{_CJK}])([A-Za-z0-9])')
_ASCII_THEN_CJK = re.compile(rf'([A-Za-z0-9])([{_CJK}])')


def preprocess_narration(text: str) -> str:
    text = _HYPHEN_BETWEEN_LETTERS.sub(' ', text)
    text = _CJK_THEN_ASCII.sub(r'\1 \2', text)
    text = _ASCII_THEN_CJK.sub(r'\1 \2', text)
    return text


def _build_items(script):
    """Walk segments; return (preprocessed_texts, mapping).

    mapping[i] = (seg_id, bullet_index_or_None)
    """
    texts = []
    mapping = []
    for seg in script.get("segments", []):
        seg_id = seg["id"]
        narration = seg.get("narration", "")
        is_rich = seg.get("template") == "rich_bullet"
        if is_rich and "\n\n" in narration:
            parts = [p.strip() for p in narration.split("\n\n") if p.strip()]
            for i, part in enumerate(parts):
                texts.append(preprocess_narration(part))
                mapping.append((seg_id, i))
        else:
            texts.append(preprocess_narration(narration))
            mapping.append((seg_id, None))
    return texts, mapping


def _run_cosyvoice(cosyvoice_dir, input_json, raw_dir, speed):
    cmd = [
        "uv", "run", "python", "clone_voice_batch.py",
        str(input_json), str(raw_dir), "--speed", str(speed),
    ]
    env = os.environ.copy()
    env_prefix = ""
    if sys.platform == "darwin" and "PYTORCH_ENABLE_MPS_FALLBACK" not in env:
        env["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
        env_prefix = "PYTORCH_ENABLE_MPS_FALLBACK=1 "
    print(f"$ (cd {cosyvoice_dir} && {env_prefix}{' '.join(cmd)})")
    subprocess.run(cmd, cwd=cosyvoice_dir, check=True, env=env)


def _ffmpeg_concat(wavs, out_path):
    list_file = out_path.with_suffix(".concat.txt")
    list_file.write_text("".join(f"file '{w}'\n" for w in wavs), encoding="utf-8")
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_file),
         "-c", "copy", str(out_path), "-loglevel", "error"],
        check=True,
    )
    list_file.unlink()


def _emit_outputs(timings, mapping, raw_dir, audio_dir):
    """Group entries by seg_id (preserves order), then emit final wavs."""
    by_index = {item["index"]: item for item in timings["items"]}
    grouped = []
    last_seg = object()
    for i, (seg_id, bullet_i) in enumerate(mapping):
        if seg_id != last_seg:
            grouped.append((seg_id, []))
            last_seg = seg_id
        grouped[-1][1].append((i, bullet_i))

    warnings = []
    for seg_id, entries in grouped:
        seg_total = 0.0
        seg_wav = audio_dir / f"{seg_id}.wav"
        if len(entries) == 1 and entries[0][1] is None:
            i, _ = entries[0]
            item = by_index.get(i)
            if not item:
                print(f"  ❌ {seg_id}: missing wav for index {i}")
                continue
            shutil.copyfile(raw_dir / item["wav"], seg_wav)
            seg_total = item["duration"]
        else:
            durations = []
            wavs = []
            for i, _ in entries:
                item = by_index.get(i)
                if not item:
                    print(f"  ❌ {seg_id}: missing wav for index {i}")
                    durations = []
                    break
                durations.append(item["duration"])
                wavs.append(raw_dir / item["wav"])
            if not durations:
                continue
            _ffmpeg_concat(wavs, seg_wav)
            (audio_dir / f"{seg_id}.bullets.json").write_text(
                json.dumps({"durations": durations}, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
            seg_total = sum(durations)

        flag = "WARN" if seg_total > MAX_SEGMENT_SECONDS else "OK  "
        print(f"  [{flag}] {seg_id}: {seg_total:.2f}s ({len(entries)} item(s))")
        if seg_total > MAX_SEGMENT_SECONDS:
            warnings.append((seg_id, seg_total))

    return warnings


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("script", help="Path to script.json")
    parser.add_argument("audio_dir", help="Final audio output directory")
    parser.add_argument("--cosyvoice-dir", default=DEFAULT_COSYVOICE_DIR,
                        help=f"Path to CosyVoice repo (default: {DEFAULT_COSYVOICE_DIR})")
    parser.add_argument("--speed", type=float, default=1.3,
                        help="CosyVoice speed multiplier (default: 1.3)")
    args = parser.parse_args()

    script_path = Path(args.script)
    audio_dir = Path(args.audio_dir)
    raw_dir = audio_dir / "_raw"
    audio_dir.mkdir(parents=True, exist_ok=True)
    raw_dir.mkdir(parents=True, exist_ok=True)

    script = json.loads(script_path.read_text(encoding="utf-8"))
    texts, mapping = _build_items(script)
    if not texts:
        print("No segments found in script.json")
        return 0

    input_json = raw_dir / "input.json"
    input_json.write_text(json.dumps(texts, ensure_ascii=False, indent=2), encoding="utf-8")

    t0 = time.time()
    _run_cosyvoice(args.cosyvoice_dir, input_json, raw_dir, args.speed)
    print(f"⏱  CosyVoice batch finished in {time.time() - t0:.1f}s")

    timings_path = raw_dir / "timings.json"
    if not timings_path.exists():
        print(f"❌ {timings_path} not found; CosyVoice batch likely failed", file=sys.stderr)
        return 1
    timings = json.loads(timings_path.read_text(encoding="utf-8"))

    print("\n📦 Emitting per-segment audio:")
    warnings = _emit_outputs(timings, mapping, raw_dir, audio_dir)

    print(f"\n✅ done: {len(timings['items'])} item(s) total")
    if warnings:
        print(f"⚠  {len(warnings)} segment(s) exceed {MAX_SEGMENT_SECONDS}s; please re-split:")
        for seg_id, dur in warnings:
            print(f"   - {seg_id}: {dur:.2f}s")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
