---
name: news-video-maker
description: >
  Generate narrated news recap videos from deep research files. Supports GitHub, Hacker News, Reddit, and Product Hunt.
  Uses Remotion + React templates with platform-specific themes. Outputs landscape (1920×1080) and portrait (1080×1920) MP4 videos.
  Use when the user wants to create news summary videos from deep_dive research data.
---


# 新闻视频制作工具

基于 GitHub、Hacker News、Reddit、Product Hunt 等平台的热门话题，自动生成带旁白的新闻速递视频。

支持平台：GitHub（蓝 #0969da）、Hacker News（橙 #ff6600）、Reddit（橙红 #ff4500）、Product Hunt（珊瑚红 #ff6154）。

---

## 一、使用方法

### 1.1 环境变量
执行任何步骤前，先 source 一次环境变量：
```bash
source ~/.openclaw/workspace/.env
```
`workDir = ~/.openclaw/workspace/news-monitor/videos`。

### 1.2 前置依赖
- 系统：Node.js 18+、ffmpeg、Python 3.10+
- TTS 引擎：CosyVoice（位于 `~/.openclaw/workspace/CosyVoice`）
- **本 skill 仅负责视频制作**。深度调研由其他 skill 完成，本 skill 直接读取 `~/.openclaw/workspace/news-monitor/deep_dive/yyyy-mm-dd_HH/{github,hackernews,producthunt,reddit}/` 目录下已生成的报告作为输入。

### 1.3 来源选择
用户可在请求中指定只生成某些来源的视频（如"只做 github 的"、"github 和 hn"、"除了 reddit 都做"）。
- 支持的来源 ID：`github` / `hackernews` / `producthunt` / `reddit`
- 别名容忍：`hn` ≡ `hackernews`、`ph` ≡ `producthunt`
- **未指定时默认生成全部 4 个来源**（向后兼容）
- 仅对被选中的来源读入 deep_dive、生成 script.json、调用 TTS、渲染视频；其它来源完全跳过（不读文件、不输出）

请求示例：
- "做今天的视频" → 4 个来源全做
- "只做 GitHub 和 Hacker News" → `github` + `hackernews`
- "做 ph 的视频" → 仅 `producthunt`
- "除了 reddit 都做" → `github` + `hackernews` + `producthunt`

### 1.4 工作目录与日志
所有视频产物落地到 `~/.openclaw/workspace/news-monitor/videos/yyyy-mm-dd_HH/`，包含：
```
videos/yyyy-mm-dd_HH/
├── 1920x1080/                # 横屏成片 {source}.mp4
├── 1080x1920/                # 竖屏成片 {source}.mp4
├── {source}/                 # 每来源工作区
│   ├── script.json           # 步骤 1 输出
│   ├── audio/                # 步骤 2 输出
│   ├── remotion-{source}-landscape/   # 步骤 3 输出
│   └── remotion-{source}-portrait/
└── logs/                     # 步骤日志（必须）
    ├── {source}_01_script.log
    ├── {source}_02_tts.log
    ├── {source}_03_remotion.log
    └── {source}_04_render.log
```
**每一步都必须把执行命令、关键参数、错误堆栈追加写入对应日志文件**，便于回溯失败原因。

---

## 二、视频制作要求（指导性原则，必须遵守）

1. **配色一致性**：视频背景符合各个网站的配色，主题色定义在 `remotion-templates/themes/*.ts`。**同一来源的视频配色必须全片一致**，不能在深色和浅色主题之间随机跳跃。绝不能混淆来源（HN 视频里不能出现 GitHub 配色或内容）。

2. **item 完整性**：视频中的 item 必须与 deep_dive 目录下的文件**一一对应**，不能遗漏任何一个 deep_dive 文件，也不能引入 deep_dive 中不存在的 item。

3. **分镜数量与模板多样性**：每个 item 生成 **5-10 个分镜**。每个 item 至少使用 **5 种不同模板**，全视频至少使用 **10 种不同模板**，确保视觉多样性。

4. **视频开头结构（必须）**：
   - **CoverScene**（≈2 秒）：标题 + 日期 + 来源标识，快速过渡
   - **RichBulletScene 总览预告**（≈5-8 秒）：列出**所有**项目/帖子的名称 + 一句话亮点 + 关键数据（如 "+814⭐"），配合旁白的总览介绍
   - **不能只放一个空荡荡的封面**，开头就要有内容抓住观众

5. **旁白深度**：必须具体且有深度，不能只读标题和热度。**每个 item 的旁白必须包含**：
   - ≥1 个具体数据点
   - ≥1 个技术细节
   - ≥1 条社区评论转述（如有）
   - 竞品对比要点（如有）
   - 关键事实遗漏率 ≤ 30%
   - 如有 pros/cons 正反方评论（如 HN、Reddit），**必须用 DebateSplitScene 模板呈现**，观点要覆盖全面

6. **旁白语言**：**一律用中文**。HN/Reddit 这类英文内容较多的来源**不能直接读英文标题或评论**，必须先翻译成中文再撰写旁白。旁白侧重解说和分析，画面侧重原文要点和数据，**两者不需要完全一致**。

7. **TTS 友好**：旁白文本避免特殊字符；英文避免使用 `-` `_` `.` 把单词连在一起（CosyVoice 会读不出来）；旁白中的每个 bullet 和每个模块单独一个子分镜，方便后期音画对齐。

8. **画面密度**：每个内容分镜画面上可见文字 ≥ **80 中文字 / 150 英文字**。旁白提到的关键信息（数据点、技术名词、评论观点）≥ **70%** 必须在画面上展示。旁白提到的数据点（Star 数、性能数字、百分比）应以**大号动画数字 / 动态计数器**形式同步显示；竞品对比必须用表格 / 分栏（不要纯文字列表）；社区评论必须用引用卡片（不要 bullet）。

9. **动效与时长**：
    - **严禁静态画面超过 3 秒**：必须使用逐条入场（stagger ≥ 0.5s），动画结束后用持续动效（活跃 bullet 切换高亮 / 数字 counter / 进度条 / 元素浮动）填充剩余时长
    - **单分镜旁白时长 ≤ 15 秒**。超时必须拆分（按论点拆，每子分镜 8-15 秒，使用不同模板或视觉焦点）。例：35 秒讲 3 个要点 → 拆为 3 个分镜（KeyInsight → RichBullet → DataHighlight），每段约 12 秒
    - **动效幅度** ≥ 20px 或 ≥ 5% 缩放（更小的幅度在视频中不可感知）。每分镜至少叠加 ≥ 2 种动效

10. **空间利用率** ≥ 65%（可用 ImageMagick `-fuzz 15% -trim` 测量），不允许大面积空白。

11. **不得修改组件源码**：模板代码已在 `remotion-templates/` 中评估迭代到位，**只允许修改 `theme.ts` 和 `Main.tsx`**，不得重写 Scene 组件逻辑。

---

## 三、执行步骤

> 以下流程对**每个被选中的来源**单独执行。生成两个版本：横屏 1920×1080 和竖屏 1080×1920。
> Reddit 来源整体做一个视频，根据 subreddit 分类，从 AI 相关分类取 Top 10 帖子。

### 步骤 1：生成分镜（旁白 + 模板选择）

**输入**：`~/.openclaw/workspace/news-monitor/deep_dive/yyyy-mm-dd_HH/{source}/` 下的深度调研报告

**输出**：`videos/yyyy-mm-dd_HH/{source}/script.json`

#### 1.1 可用模板（17 个，详细规范见 `remotion-templates/SCENE_DESIGN.md`）

| 模板 ID | 一句话用途 | 适用关键词 / 同义概念 |
|---|---|---|
| `cover` | 视频封面 / 片尾，标题 + 副标题 + 来源标识 | 封面、cover_title、credit_roll（片尾用此） |
| `project_intro` | **GitHub 专用**项目身份卡：rank + 名称 + tagline + ⭐ 数（图标硬编码 ★） | GitHub 项目介绍、ProjectIntro |
| `project_hero` | **跨来源通用**身份卡：rank + 名称 + tagline + 任意前缀 stats（▲ points / votes / ⭐ 等，自动解析前缀） | HN / PH / Reddit 身份卡、leaderboard 单条 |
| `key_insight` | 核心洞察 / 痛点：一句大字 + 一段解释 | 核心观点、insight、痛点、hook |
| `rich_bullet` | 详细要点列表（活跃 bullet 高亮切换，每条带 title + detail 子结构） | 要点列表、leaderboard 总览预告、step_breakdown |
| `bullet_points` | 简洁要点列表（纯字符串 bullets，顶部带项目名称栏） | 项目子要点、章节分要点 |
| `comparison_table` | 竞品 / 方案对比表格 | 对比、split_compare、versus |
| `debate_split` | 正反方辩论：左右两侧支持 / 反对论点（pros/cons 必用） | 辩论、pros vs cons、debate_arena、debate_clash |
| `quote_card` | 单条社区评论引用：大字引文 + 作者 + 平台 | 引用、评论、immersive_quote、单条精选评论 |
| `data_highlight` | 数据仪表盘：超大动画数字 + HUD 圆环 / 进度 | star 数、性能数据、百分比、KPI 仪表盘 |
| `feature_card` | 单点功能特色卡：图标 + 标题 + 描述 | 单点亮点、产品功能、three_column 用三个并列 |
| `code_block` | 代码片段 / 命令行展示 | 代码、安装命令、CLI、shell |
| `architecture` | 架构分层图：纵向多层（前端 / 后端 / 数据） | 系统架构、技术栈分层、流程图 |
| `tech_stack` | 技术栈徽章列表 | 使用的技术、stack badges、依赖列表 |
| `chat_bubbles` | 多人讨论气泡（左右交替弹入） | 多条评论、社区讨论、comment_feed、danmaku_wall（用此替代） |
| `timeline` | 时间线（事件 / 版本历史，按日期点亮） | 时间线、版本历史、roadmap |
| `transition` | 章节过渡 / 来源切换大标题 | 转场、章节标题 |

**注意**：上表 17 个模板 ID + 1 个向后兼容别名 `cover_title` ≡ `cover` 是 `generate_main_tsx.py` 当前接受的全部 `template` 取值。其它 backup 时代的概念名（`debate_arena` / `leaderboard` / `immersive_quote` / `cinematic_lower_third` / `card_stack_swipe` / `social_feed` 等）**不在 registry**，写错会被跳过并打印 `WARNING: Unknown template`——遇到这些概念请按第 3 列同义词映射到现有模板，不要凭名称生造。

> `remotion-templates/SCENE_DESIGN.md` 是更早版本的视觉规范，仅包含其中 15 个场景，未含 `project_intro` 与 `bullet_points`；这两个组件请直接参考 `landscape/` 下的 `ProjectIntroScene.tsx` / `BulletPointsScene.tsx` 源码。

#### 1.2 画面显示语言规则（严格遵守）

`script.json` 中所有用于画面展示的文本字段**默认中文**，仅以下情况保留原文：

1. **item 身份标识**（保持与原平台一致便于搜索识别）：
   - `ProjectHero.name` / `ProjectIntro.name`（GitHub 仓库名 `owner/repo`、HN/Reddit 帖子标题、PH 产品名）
   - `RichBullet.project`、`TechStack.project`（跟随所属 item 名称）
   - 总览预告型 `RichBullet.bullets[].title`（列表就是各 item 名称时，title 用英文原名，`detail` 用中文亮点）
2. **品牌 / 平台标识**：`source`、`QuoteCard.platform`
3. **作者 handle**：`QuoteCard.author`、`ChatBubbles.messages[].author`
4. **URL、版本号、技术栈专有名词**（React / PyTorch / CUDA 等）
5. **代码本身**：`code_block.code`（含 `language`）

**必须翻译为中文的字段**：
- `Cover.title/subtitle`、`ProjectHero.tagline`、`ProjectIntro.tagline`
- `KeyInsight.headline/explanation`
- `RichBullet.sectionTitle`；非 item 列表时的 `bullets[].title`/`detail`
- `QuoteCard.quote`（英文评论必须翻译）、`QuoteCard.context`
- `ComparisonTable.title/columns/rows`（专有名词、版本号、数字可保留）
- `DataHighlight.unit/context`
- `DebateSplit.topic/proSide.label|points/conSide.label|points`
- `Architecture.title/layers[].name|description`
- `Timeline.title/events[].label`（`events[].date` 是日期字符串，不译）
- `FeatureCard.title/description/highlight`
- `ChatBubbles.topic/messages[].text`（英文必须翻译）
- `Transition.text/subtitle`

#### 1.3 做法

1. 读入该来源所有 deep_dive 文件
2. 为每个 item 规划 5-10 个分镜：先决定每个分镜要讲什么内容（结合二.5 旁白深度要求），再选合适模板
3. 第 1 分镜固定 `cover`，第 2 分镜固定 `rich_bullet`（总览预告，列出**所有** items）
4. 撰写每个分镜的 `narration`（中文，遵循二.6/7 与 1.2 的语言规则）
5. 写入 `script.json`：顶层是 `{"segments": [...]}`，每个 segment 包含 `id`（唯一标识，用于 audio 文件名）、`template`（取 1.1 表中 17 个模板 ID 之一）、`narration`（旁白文本）、`data`（模板需要的字段，字段集随模板不同而不同；详见 `remotion-templates/SCENE_DESIGN.md` 中各 Scene 的 Props 定义）

#### 1.4 关键字段约束

- 每个 segment 的 `id` 必须全局唯一（用作 audio 文件名前缀）
- `data.name`（项目名）必须是人类可读的真实名称，**不能用 slug 或 id**
- `bullet_points.data.project` 必须**显式传入真实项目名**（如 "Gemini CLI"），不能是 slug，且应与同一 item 的 `project_intro.data.name` 一致；缺省会导致顶部标题为空
- 数值字段：GitHub 用 `stars`，HN 用 `points`，PH 用 `votes`，Reddit 通常没有（留空或省略）

**日志**：把读入的 deep_dive 文件清单、为每个 item 规划的 segment 数 / 模板分布、最终 script.json 路径写入 `logs/{source}_01_script.log`。

### 步骤 2：生成 TTS 语音

**输入**：步骤 1 的 `script.json`

**输出**：`videos/yyyy-mm-dd_HH/{source}/audio/{seg_id}.wav`

**命令**（CosyVoice）：
```bash
cd ~/.openclaw/workspace/CosyVoice && \
  uv run python clone_voice.py "旁白文本" \
    -o /path/to/audio/{seg_id}.wav \
    --speed 1.2
```
参考音色：`reference/my_voice.wav`（默认）。

**做法**：
1. 遍历 script.json 的所有 segments，按 `id` 顺序串行调用 CosyVoice
2. 跳过已存在的 wav 文件（支持断点续跑）
3. 每生成完一条 wav，用 `ffprobe -v quiet -show_entries format=duration -of csv=p=0 {wav}` 读取**音频实际时长（秒）**，作为后续帧偏移和 §二.9「单分镜旁白时长 ≤ 15 秒」校验依据；超过 15 秒的分镜必须在日志中标红，回到步骤 1 拆分该 segment 后重跑
4. 失败的 segment 记录原始旁白和报错堆栈到日志，便于人工修复后重跑

**日志**：`logs/{source}_02_tts.log`，**每条 wav 一行**记录 `id / 字数 / 音频时长(秒) / 生成耗时(秒) / 文件大小`，超时分镜额外用 `WARN` 前缀标出；末尾追加汇总（总分镜数 / 总时长 / 失败数 / 超时数）。

---

### 步骤 3：生成 Remotion 项目和 Main.tsx

**输入**：步骤 1 的 `script.json` + 步骤 2 的 `audio/`

**输出**：两个 Remotion 项目（横屏 + 竖屏）`remotion-{source}-{landscape|portrait}/`

**做法（横屏 / 竖屏各执行一次）**：
```bash
# 1. 创建项目并安装依赖
mkdir -p remotion-{source}-{orientation}/src remotion-{source}-{orientation}/public
cp remotion-templates/package.json remotion-{source}-{orientation}/
cp remotion-templates/tsconfig.json remotion-{source}-{orientation}/
(cd remotion-{source}-{orientation} && npm install)

# 2. 复制对应方向的组件
cp remotion-templates/{landscape|portrait}/*.tsx remotion-{source}-{orientation}/src/

# 3. 复制入口与主题
cp remotion-templates/index.ts remotion-templates/index.css remotion-{source}-{orientation}/src/
cp remotion-templates/themes/{source}.ts remotion-{source}-{orientation}/src/theme.ts

# 4. 链接音频
ln -s $(pwd)/audio remotion-{source}-{orientation}/public/audio

# 5. 生成 Main.tsx + Root.tsx（自动按 wav 时长计算帧偏移）
python3 generate_main_tsx.py script.json {audio_prefix} \
  remotion-{source}-{orientation}/src \
  --width {1920|1080} --height {1080|1920} \
  --audio-dir remotion-{source}-{orientation}/public/audio
```

**注意事项**：
1. **HN 来源**：用 ▲ 替代 ★ 显示 points，可在 theme 中覆盖；或直接选 `project_hero` 模板（前缀自动解析）。
2. **竖屏 scanY**：使用 `% 2000` 而非 `% 1200`（适配 1920 高度）。
3. **Root.tsx 尺寸**：横屏 `width={1920} height={1080}`，竖屏 `width={1080} height={1920}`。`generate_main_tsx.py` 默认横屏，竖屏需通过 `--width 1080 --height 1920` 显式指定。
4. **starsNum=0**：ProjectIntroScene 已有 `starsNum > 0` 守卫，不显示空 badge。Reddit 通常无投票数据，留空即可。

**日志**：`logs/{source}_03_remotion.log`，记录两个项目的安装日志、`generate_main_tsx.py` 的 stdout / stderr、跳过的未知 template warning。

---

### 步骤 4：渲染视频

**输入**：步骤 3 的 Remotion 项目

**输出**：
- `videos/yyyy-mm-dd_HH/1920x1080/{source}.mp4`
- `videos/yyyy-mm-dd_HH/1080x1920/{source}.mp4`

**两种渲染方式**：

**A. 标准渲染**（首次跑或排查问题用）：
```bash
cd remotion-{source}-{orientation} && \
  npx remotion render src/index.ts Main \
    --output /path/to/videos/{date_h}/{wxh}/{source}.mp4 \
    --fps=30 --codec=h264 --concurrency=4
```

**B. 智能渲染**（推荐，跳过静态帧，2-4 倍加速）：
```bash
python3 smart_render.py remotion-{source}-{orientation} \
  --output /path/to/videos/{date_h}/{wxh}/{source}.mp4 \
  --concurrency 4
```
`smart_render.py` 会读 `ANIM_ESTIMATES`，对静态尾段直接复用最后一帧，显著缩短渲染时间。任一新增模板若包含连续动效，必须在 `smart_render.py` 的 `ANIM_ESTIMATES` 中标注 `"continuous"`。

**日志**：`logs/{source}_04_render.log`，记录命令、总耗时、输出文件大小、ffmpeg 报错（如有）。

---

## 四、参考资料

- 主题色定义：`remotion-templates/themes/{github,hackernews,producthunt,reddit}.ts`
- 模板视觉规范：`remotion-templates/SCENE_DESIGN.md`
- 模板组件实现：`remotion-templates/{landscape,portrait}/*Scene.tsx`
- Remotion 入口：`remotion-templates/index.ts`、`index.css`
- 帧偏移生成器：`generate_main_tsx.py`（项目根目录）
- 智能渲染器：`smart_render.py`（项目根目录）
