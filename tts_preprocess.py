#!/usr/bin/env python3
"""Narration preprocessing for CosyVoice TTS in news-video-maker.

Rules:
1. Replace `-` between two ASCII letters with a space
   (e.g. `state-of-the-art` -> `state of the art`).
2. Insert a space between a CJK character and an adjacent ASCII letter or digit
   (both directions) so CosyVoice cleanly separates the two languages.

Use as a library:
    from tts_preprocess import preprocess_narration
    cleaned = preprocess_narration(raw_text)

Use as a stdin filter:
    echo "MarkItDown是microsoft出品" | python -m tts_preprocess
"""
import re
import sys

_HYPHEN_BETWEEN_LETTERS = re.compile(r'(?<=[A-Za-z])-(?=[A-Za-z])')
_CJK_THEN_ASCII = re.compile(r'([\u4e00-\u9fff])([A-Za-z0-9])')
_ASCII_THEN_CJK = re.compile(r'([A-Za-z0-9])([\u4e00-\u9fff])')


def preprocess_narration(text: str) -> str:
    text = _HYPHEN_BETWEEN_LETTERS.sub(' ', text)
    text = _CJK_THEN_ASCII.sub(r'\1 \2', text)
    text = _ASCII_THEN_CJK.sub(r'\1 \2', text)
    return text


if __name__ == '__main__':
    sys.stdout.write(preprocess_narration(sys.stdin.read()))
