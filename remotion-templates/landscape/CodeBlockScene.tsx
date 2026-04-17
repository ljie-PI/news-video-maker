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
  float,
  rotatingGradient,
} from "./animationHelpers";

interface CodeBlockSceneProps {
  title: string;
  language: string;
  code: string;
  annotation?: string;
  audioFile: string;
  narration?: string;
}

const CODE_FONT =
  "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace";

const DOT_COLORS = ["#ff5f57", "#febc2e", "#28c840"];

interface Token {
  text: string;
  color: string;
}

function tokenizeBash(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Comments
    if (line[i] === "#") {
      tokens.push({ text: line.slice(i), color: "#6a9955" });
      break;
    }
    // Strings (single or double quoted)
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let end = i + 1;
      while (end < line.length && line[end] !== quote) end++;
      tokens.push({
        text: line.slice(i, end + 1),
        color: "#ce9178",
      });
      i = end + 1;
      continue;
    }
    // Words
    if (/\S/.test(line[i])) {
      let end = i;
      while (end < line.length && /\S/.test(line[end])) end++;
      const word = line.slice(i, end);
      const isFirst =
        tokens.length === 0 ||
        tokens.every((t) => /^\s*$/.test(t.text));
      if (isFirst) {
        tokens.push({ text: word, color: "#569cd6" });
      } else {
        tokens.push({ text: word, color: "#d4d4d4" });
      }
      i = end;
      continue;
    }
    // Whitespace
    tokens.push({ text: line[i], color: "#d4d4d4" });
    i++;
  }
  return tokens;
}

const KEYWORDS = new Set([
  "import",
  "export",
  "from",
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "for",
  "while",
  "class",
  "interface",
  "type",
  "new",
  "async",
  "await",
  "true",
  "false",
  "null",
  "undefined",
  "try",
  "catch",
  "throw",
  "default",
  "switch",
  "case",
  "break",
  "continue",
  "extends",
  "implements",
]);

function tokenizeGeneric(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Single-line comments
    if (line[i] === "/" && line[i + 1] === "/") {
      tokens.push({ text: line.slice(i), color: "#6a9955" });
      break;
    }
    // Strings
    if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
      const quote = line[i];
      let end = i + 1;
      while (end < line.length && line[end] !== quote) end++;
      tokens.push({
        text: line.slice(i, end + 1),
        color: "#ce9178",
      });
      i = end + 1;
      continue;
    }
    // Words
    if (/[a-zA-Z_$]/.test(line[i])) {
      let end = i;
      while (end < line.length && /[a-zA-Z0-9_$]/.test(line[end])) end++;
      const word = line.slice(i, end);
      if (KEYWORDS.has(word)) {
        tokens.push({ text: word, color: "#569cd6" });
      } else {
        tokens.push({ text: word, color: "#d4d4d4" });
      }
      i = end;
      continue;
    }
    // Numbers
    if (/[0-9]/.test(line[i])) {
      let end = i;
      while (end < line.length && /[0-9.]/.test(line[end])) end++;
      tokens.push({ text: line.slice(i, end), color: "#b5cea8" });
      i = end;
      continue;
    }
    // Other characters
    tokens.push({ text: line[i], color: "#d4d4d4" });
    i++;
  }
  return tokens;
}

function tokenizeLine(line: string, language: string): Token[] {
  if (language === "bash" || language === "shell" || language === "sh") {
    return tokenizeBash(line);
  }
  return tokenizeGeneric(line);
}

function flattenTokensToChars(
  tokens: Token[]
): { char: string; color: string }[] {
  const chars: { char: string; color: string }[] = [];
  for (const token of tokens) {
    for (const ch of token.text) {
      chars.push({ char: ch, color: token.color });
    }
  }
  return chars;
}

export const CodeBlockScene: React.FC<CodeBlockSceneProps> = ({
  title,
  language,
  code,
  annotation,
  audioFile,
  narration,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const lines = code.split("\n");

  const codeFontSize = 28;
  const codeLineHeight = 44;

  // Dynamic terminal height: sized to content, not full screen
  const headerBarHeight = 46;
  const codePaddingV = 56;
  const terminalMaxH = 650;
  const terminalHeight = Math.max(200,
    Math.min(lines.length * codeLineHeight + headerBarHeight + codePaddingV, terminalMaxH)
  );

  // --- Animations ---
  const cardScale = interpolate(frame, [5, 25], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardOpacity = fadeIn(frame, 5, 20);



  const titleOpacity = fadeIn(frame, 0, 15);
  const titleFloat = 0;
  const titleSlide = interpolate(frame, [0, 15], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const annotationDelay = Math.min(35, durationInFrames - 40);
  const annotationOpacity = annotation ? fadeIn(frame, annotationDelay, 15) : 0;
  const annotationShake = 0;

  const gradientAngle = rotatingGradient(frame, durationInFrames, 135, 120);

  // ── Continuous animations ──
  const cardFloat = float(frame, 22, 30);
  const glowPulse = 0.08;



  return (
    <AbsoluteFill>
      <Audio src={staticFile(audioFile)} />

      {/* Background gradient */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(${gradientAngle}deg, ${theme.dark_bg_from}, ${theme.dark_bg_to})`,
        }}
      />

      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "10%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: theme.brand_highlight,
          opacity: glowPulse,
          filter: "blur(80px)",
          transform: `translate(${float(frame, 24, 60, 0)}px, ${float(frame, 20, 45, 1)}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          right: "8%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: theme.brand_primary,
          opacity: glowPulse * 0.8,
          filter: "blur(70px)",
          transform: `translate(${float(frame, 28, 50, 2)}px, ${float(frame, 22, 40, 3)}px)`,
        }}
      />

      {/* Content card */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 40,
          right: 40,
          bottom: 30,
          borderRadius: 24,
          background: theme.card_bg,
          border: `1px solid ${theme.card_border}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Title */}
        <div
          style={{
            padding: "24px 40px 16px",
            textAlign: "center",
            fontFamily,
            fontSize: 52,
            fontWeight: 700,
            color: theme.text_on_bg,
            opacity: titleOpacity,
            transform: `translateY(${titleSlide + titleFloat}px)`,
            letterSpacing: "-0.02em",
            flexShrink: 0,
          }}
        >
          {title}
        </div>

        {/* Dark terminal - dynamic height based on code lines */}
        <div
          style={{
            margin: "0 24px",
            height: terminalHeight,
            background: "#1e1e1e",
            borderRadius: 16,
            opacity: cardOpacity,
            transform: `scale(${cardScale}) translateY(${cardFloat}px)`,
            boxShadow:
              "0 8px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {/* Window Decoration Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "16px 24px",
              background: "#2d2d2d",
              borderBottom: "1px solid #3c3c3c",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              {DOT_COLORS.map((color, i) => (
                <div
                  key={i}
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: color,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                marginLeft: 20,
                fontFamily: CODE_FONT,
                fontSize: 16,
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {language}
            </div>
          </div>

          {/* Code Content */}
          <div
            style={{
              flex: 1,
              padding: "28px 0",
              overflow: "hidden",
              display: "flex",
            }}
          >
            {/* Line Numbers */}
            <div
              style={{
                width: 70,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                paddingTop: 0,
                borderRight: "1px solid #333",
                userSelect: "none",
              }}
            >
              {lines.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: CODE_FONT,
                      fontSize: codeFontSize,
                      lineHeight: `${codeLineHeight}px`,
                      textAlign: "right",
                      paddingRight: 18,
                      color: "#555",
                    }}
                  >
                    {i + 1}
                  </div>
              ))}
            </div>

            {/* Code Text */}
            <div
              style={{
                flex: 1,
                paddingLeft: 24,
                paddingRight: 24,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {lines.map((line, lineIndex) => {
                const tokens = tokenizeLine(line, language);
                const chars = flattenTokensToChars(tokens);

                return (
                  <div
                    key={lineIndex}
                    style={{
                      fontFamily: CODE_FONT,
                      fontSize: codeFontSize,
                      lineHeight: `${codeLineHeight}px`,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      minHeight: codeLineHeight,
                      position: "relative",
                      borderLeft: "3px solid transparent",
                      paddingLeft: 4,
                    }}
                  >
                    {chars.map((ch, ci) => (
                      <span key={ci} style={{ color: ch.color }}>
                        {ch.char}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Spacer pushes annotation/narration toward bottom */}
        <div style={{ flex: 1, minHeight: 16 }} />

        {/* Annotation */}
        {annotation && (
          <div
            style={{
              padding: "12px 40px",
              textAlign: "center",
              fontFamily,
              fontSize: 24,
              color: theme.status_warning,
              opacity: annotationOpacity,
              transform: `translateX(${annotationShake}px)`,
              flexShrink: 0,
            }}
          >
            <span style={{ marginRight: 10 }}>{"⚠️"}</span>
            {annotation}
          </div>
        )}


      </div>
    </AbsoluteFill>
  );
};
