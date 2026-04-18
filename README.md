# news-video-maker

> OpenClaw skill — 把深度调研报告自动转成带 TTS 旁白的 MP4 新闻速递视频。

基于 GitHub、Hacker News、Reddit、Product Hunt 的深度调研内容（deep_dive 报告），自动生成横屏（1920×1080）和竖屏（1080×1920）两种格式的 MP4 视频。视频使用 [Remotion](https://www.remotion.dev/) + React 渲染，配合 CosyVoice TTS 旁白和平台专属配色，开箱即得评分 ≥9.0/10 的成片。

---

## ✨ 特性

- **15 种场景模板**：CoverScene、ProjectHeroScene、KeyInsightScene、RichBulletScene、ComparisonTableScene、QuoteCardScene、DataHighlightScene、DebateSplitScene、ArchitectureScene、TechStackScene、TimelineScene、FeatureCardScene、CodeBlockScene、ChatBubblesScene、TransitionScene。
- **平台主题色**：GitHub（蓝紫 `#0969da`）、Hacker News（橙 `#ff6600`）、Reddit（橙红 `#ff4500`）、Product Hunt（珊瑚红 `#ff6154`）。
- **横竖屏双版本**：每个组件都有 `landscape/` 与 `portrait/` 两套实现，针对 1920×1080 与 1080×1920 分别优化布局。
- **音频驱动的自动排版**：`generate_main_tsx.py` 根据每段 TTS 音频时长自动计算帧偏移，生成 Remotion `Main.tsx` / `Root.tsx`。
- **智能渲染加速**：`smart_render.py` 解析 `Main.tsx`，只渲染有动效的帧，静态部分用 ffmpeg freeze frame 填充，**2–4× 加速**。
- **质量评估 prompt**：`video_quality_eval_prompt.md` 提供 9 维度（P0/P1）量化评估，目标分数 ≥9.0。

---

## 📋 前置依赖

| 依赖 | 用途 |
|---|---|
| Node.js 18+ | 运行 Remotion |
| Python 3.10+ | 运行 `generate_main_tsx.py` 和 `smart_render.py` |
| ffmpeg / ffprobe | 音频时长解析、smart render 拼接 |
| ImageMagick（可选） | 视频质量评估时量化空间利用率 |
| TTS 引擎 | 推荐 [CosyVoice](https://github.com/FunAudioLLM/CosyVoice) |

---

## 🚀 使用方法

### 1. 准备 deep_dive 报告

本 skill **不负责**深度调研，输入是已经按平台分目录存放的 deep_dive markdown 报告：

```
~/.openclaw/workspace/news-monitor/deep_dive/yyyy-mm-dd_HH/
├── github/*.md
├── hackernews/*.md
├── producthunt/*.md
└── reddit/{category}/*.md
```

### 2. 创建 Remotion 项目

每个来源 × 每种格式 = 1 个 Remotion 项目。

```bash
SOURCE=github           # github | hackernews | producthunt | reddit
ORIENTATION=landscape   # landscape | portrait
PROJ=remotion-${SOURCE}-${ORIENTATION}

mkdir -p $PROJ/src $PROJ/public
cp remotion-templates/package.json $PROJ/
cp remotion-templates/tsconfig.json $PROJ/
cp remotion-templates/index.ts remotion-templates/index.css $PROJ/src/
cp remotion-templates/${ORIENTATION}/*.tsx $PROJ/src/
cp remotion-templates/${ORIENTATION}/animationHelpers.ts $PROJ/src/
cp remotion-templates/themes/${SOURCE}.ts $PROJ/src/theme.ts

# 链接 TTS 音频
ln -s "$(pwd)/audio" $PROJ/public/audio

cd $PROJ && npm install && cd ..
```

### 3. 准备 `script.json`

定义视频每个分镜的模板与数据：

```json
{
  "segments": [
    {
      "id": "intro",
      "template": "cover",
      "narration": "中文旁白...",
      "data": { "title": "GitHub 今日热榜", "subtitle": "2026-04-18 Top 10" }
    },
    {
      "id": "claude_mem_1",
      "template": "project_hero",
      "narration": "...",
      "data": { "rank": 1, "name": "claude-mem", "tagline": "Claude Code 持久化记忆插件", "stats": "+814 ⭐" }
    },
    {
      "id": "claude_mem_2",
      "template": "key_insight",
      "narration": "...",
      "data": { "headline": "每次会话结束，上下文全部清空", "explanation": "..." }
    }
  ]
}
```

支持的 `template` 取值见 [remotion-templates/SCENE_DESIGN.md](./remotion-templates/SCENE_DESIGN.md)。

### 4. TTS 生成音频

每个 segment 的旁白生成一个 wav，命名为 `{audio_prefix}_{seg_id}.wav`。例如使用 CosyVoice：

```bash
cd ~/.openclaw/workspace/CosyVoice
uv run python clone_voice.py "中文旁白文本" -o audio/github_intro.wav --speed 1.2
```

### 5. 生成 Main.tsx / Root.tsx

```bash
python3 generate_main_tsx.py \
    script.json github $PROJ/src \
    --width 1920 --height 1080 \
    --audio-dir $PROJ/public/audio
```

参数：
- `script.json`：分镜脚本
- `github`：音频文件名前缀（对应 `github_{seg_id}.wav`）
- `$PROJ/src`：输出目录
- `--width` / `--height`：竖屏请用 `1080` × `1920`
- `--audio-dir`：音频实际存放路径

### 6. 渲染视频

**标准渲染：**

```bash
cd $PROJ
npx remotion render src/index.ts Main \
    --output=out.mp4 --fps=30 --codec=h264 --concurrency=4
```

**智能渲染（推荐，2–4× 加速）：**

```bash
python3 smart_render.py $PROJ --output out.mp4 --concurrency 4
# 干跑查看渲染计划：
python3 smart_render.py $PROJ --output out.mp4 --dry-run
```

### 7. 质量评估

把生成的视频、`script.json`、对应的 deep_dive 报告一起喂给 LLM，使用 [`video_quality_eval_prompt.md`](./video_quality_eval_prompt.md) 进行 9 维度评分。目标 **≥9.0/10**，否则按报告中的 `top_issues` 修订重做。

---

## 📂 项目结构

```
news-video-maker/
├── SKILL.md                      # OpenClaw skill 入口（视频制作硬性规范）
├── README.md                     # 本文件
├── _meta.json                    # skill 元信息
├── generate_main_tsx.py          # 脚本+音频 → Main.tsx/Root.tsx
├── smart_render.py               # 智能渲染（跳过静态帧）
├── video_quality_eval_prompt.md  # LLM 视频质量评估 prompt（9 维度）
└── remotion-templates/
    ├── README.md
    ├── SCENE_DESIGN.md           # 15 种场景模板设计规范
    ├── package.json              # Remotion 4.0.448 + React 19
    ├── tsconfig.json
    ├── index.ts / index.css
    ├── landscape/                # 横屏 1920×1080 组件 + animationHelpers.ts
    ├── portrait/                 # 竖屏 1080×1920 组件 + animationHelpers.ts
    └── themes/                   # github / hackernews / reddit / producthunt
```

---

## 🔗 依赖的其他 Skill

本 skill 仅负责视频制作。完整新闻速递管线还会用到：

| Skill | 仓库 | 作用 |
|---|---|---|
| **last30days-skill** | [mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill) | 跨 Reddit/X/YouTube/HN/Polymarket/Web 调研近期话题，生成有据可查的综合摘要 |
| **news-monitor** | [ljie-PI/news-monitor](https://github.com/ljie-PI/news-monitor) | 监控 GitHub / Hacker News / Reddit / Product Hunt 当日热榜，输出 top list |
| **web-chat** | [ljie-PI/web-chat](https://github.com/ljie-PI/web-chat) | 通过 Playwright 浏览器自动化与 Gemini / ChatGPT 对话，获取深度见解 |

典型管线：`news-monitor` 拉榜 → `last30days` + `web-chat` 做深度调研 → 本 skill 把 deep_dive 报告做成视频。
