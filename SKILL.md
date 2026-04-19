---
name: news-video-maker
description: >
  Generate narrated news recap videos from deep research files. Supports GitHub, Hacker News, Reddit, and Product Hunt.
  Uses Remotion + React templates with platform-specific themes. Outputs landscape (1920×1080) and portrait (1080×1920) MP4 videos.
  Use when the user wants to create news summary videos from deep_dive research data.
---


# 新闻视频制作工具

基于 GitHub、Hacker News、Reddit、Product Hunt 等平台的热门话题，自动生成带旁白的新闻速递视频。

## 快速参考

**支持平台：** GitHub（蓝 #0969da）、Hacker News（橙 #ff6600）、Reddit（橙红 #ff4500）、Product Hunt（珊瑚红 #ff6154）

**前置依赖：** Node.js 18+、ffmpeg、Python 3.10+、TTS 引擎（推荐 CosyVoice）

**核心命令：**

生成 Main.tsx：
```bash
python3 generate_main_tsx.py script.json {prefix} project/src --width 1920 --height 1080 --audio-dir project/public/audio
```

标准渲染：
```bash
cd project && npx remotion render src/index.ts Main --output video.mp4 --concurrency=4
```

智能渲染（跳过静态帧，2-4倍加速）：
```bash
python3 smart_render.py project --output video.mp4 --concurrency 4
```

**质量评估：** 使用 video_quality_eval_prompt.md（9个维度，目标分数 >= 9.0）

**可用模板（16 种 + 1 别名，详细规范见 `remotion-templates/SCENE_DESIGN.md`）：**

| 模板 ID | 一句话用途 | 适用关键词 / 同义概念 |
|---|---|---|
| `cover` | 视频封面 / 片尾，标题 + 副标题 + 来源标识 | 封面、cover_title、credit_roll（片尾用此） |
| `project_intro` | **GitHub 专用**项目身份卡：rank + 名称 + tagline + ⭐ 数（图标硬编码 ★） | GitHub 项目介绍、ProjectIntro |
| `project_hero` | **跨来源通用**身份卡：rank + 名称 + tagline + 任意前缀 stats（▲points / votes / ⭐ 等，自动解析前缀） | HN / PH / Reddit 身份卡、leaderboard 单条 |
| `key_insight` | 核心洞察 / 痛点：一句大字 + 一段解释 | 核心观点、insight、痛点、hook |
| `rich_bullet` | 详细要点列表（活跃 bullet 高亮切换，每条带 title + detail 子结构） | 要点列表、leaderboard 总览预告、step_breakdown |
| `bullet_points` | 简洁要点列表（纯字符串 bullets，顶部带项目名称栏） | 项目子要点、章节分要点 |
| `comparison_table` | 竞品 / 方案对比表格 | 对比、split_compare、versus |
| `debate_split` | 正反方辩论：左右两侧支持 / 反对论点（必须用于 pros/cons 内容） | 辩论、pros vs cons、debate_arena、debate_clash |
| `quote_card` | 单条社区评论引用：大字引文 + 作者 + 平台 | 引用、评论、immersive_quote、单条精选评论 |
| `data_highlight` | 数据仪表盘：超大动画数字 + HUD 圆环 / 进度 | star 数、性能数据、百分比、KPI 仪表盘 |
| `feature_card` | 单点功能特色卡：图标 + 标题 + 描述 | 单点亮点、产品功能、three_column 用三个并列 |
| `code_block` | 代码片段 / 命令行展示 | 代码、安装命令、CLI、shell |
| `architecture` | 架构分层图：纵向多层（前端 / 后端 / 数据） | 系统架构、技术栈分层、流程图 |
| `tech_stack` | 技术栈徽章列表 | 使用的技术、stack badges、依赖列表 |
| `chat_bubbles` | 多人讨论气泡（左右交替弹入） | 多条评论、社区讨论、comment_feed、danmaku_wall（弹幕样式无，用此替代） |
| `timeline` | 时间线（事件 / 版本历史，按日期点亮） | 时间线、版本历史、roadmap、timeline_horizontal/vertical |
| `transition` | 章节过渡 / 来源切换大标题 | 转场、章节标题 |

**模板选择速查（含历史 / 同义概念名映射，便于按描述检索）：**
- "封面 / cover_title / 片尾 / credit_roll" → `cover`
- "对比 / split_compare / versus" → `comparison_table`（数据型）或 `debate_split`（观点型）
- "辩论 / debate_arena / debate_clash / pros vs cons" → `debate_split`
- "引用 / immersive_quote / 大字金句" → `quote_card`
- "leaderboard / 排行榜" → 总览预告用 `rich_bullet`，单条详情用 `project_hero`（跨来源）或 `project_intro`（仅 GitHub）
- "弹幕墙 / danmaku_wall / 评论流 / comment_feed / notification_center" → `chat_bubbles`
- "step_breakdown / 步骤引导" → `rich_bullet`（活跃 bullet 表示当前步）
- "three_column / 三栏并列" → 三个 `feature_card` 串联（每个一栏）
- "cinematic_lower_third / 字幕条 overlay / card_stack_swipe / social_feed" → 无独立实现，按场景拆分到现有模板，**不要凭名称生造**

**注意**：上表 16 个模板 ID（含 `project_hero` / `bullet_points` 两个独立组件）是 `generate_main_tsx.py` 当前正式支持的 `template` 取值。另有 1 个**向后兼容别名**：`cover_title` ≡ `cover`。其余 backup 时代的概念名（`debate_arena` / `leaderboard` / `immersive_quote` / `split_compare` / `danmaku_wall` 等）**不在 registry 中**，必须按上方映射换成对应 ID，否则 `generate_main_tsx.py` 会跳过该 segment 并打印 `WARNING: Unknown template`。


**环境变量**: 先执行 `source ~/.openclaw/workspace/.env`
**workDir** = `~/.openclaw/workspace`

**前置依赖**：本 skill 仅负责视频制作。深度调研由其他 skill 完成，本 skill 直接读取 `~/.openclaw/workspace/news-monitor/deep_dive/yyyy-mm-dd_HH/{github,hackernews,producthunt,reddit}/` 目录下已生成的 deep_dive 报告作为输入。

**来源选择：** 用户可在请求中指定只生成某些来源的视频（如"只做 github 的"、"github 和 hn"、"除了 reddit 都做"）。
- 支持的来源 ID：`github` / `hackernews` / `producthunt` / `reddit`
- 别名容忍：`hn` ≡ `hackernews`、`ph` ≡ `producthunt`
- **未指定时默认生成全部 4 个来源**（向后兼容）
- 仅对**被选中的来源**读入 deep_dive、生成 script.json、调用 TTS、渲染视频；其它来源完全跳过（不读文件、不输出）
- 用户请求示例与对应行为：
  - "做今天的视频" → 4 个来源全做
  - "只做 GitHub 和 Hacker News" → 仅 `github` 和 `hackernews`
  - "做 ph 的视频" → 仅 `producthunt`
  - "除了 reddit 都做" → `github` + `hackernews` + `producthunt`

---

# 视频制作要求（严格遵守！！）
1. 视频背景符合各个网站的配色，具体参考 `remotion-templates/themes/*.ts` 中的主题色定义。**同一来源的视频配色必须全片一致，不能在深色和浅色主题之间随机跳跃。**
2. 每个 item(repo, 帖子，产品) 生成 **5-7 个分镜**（不是 3 个！），每个分镜先根据深度调研的内容确定旁白内容和该分镜应用的模板。**视频中的 item 必须与 deep_dive 目录下的文件一一对应，不能遗漏任何一个 deep_dive 文件，也不能引入 deep_dive 中不存在的 item。**
    - **视频开头结构（必须）**：每个视频开头必须包含两个分镜：
      - **CoverScene**（≈2秒）：标题+日期+来源标识，快速过渡
      - **RichBulletScene 总览预告**（≈5-8秒）：列出 Top 3-5 项目/帖子的名称+一句话亮点+关键数据（如 "+814⭐"），配合旁白的总览介绍。**不能只放一个空荡荡的封面**，开头就要有内容抓住观众。
    - **场景模板选择**：必须使用 `remotion-templates/SCENE_DESIGN.md` 中定义的 15 种场景模板。每个 item 至少使用 3 种不同的模板类型。全视频至少使用 8 种不同的模板类型。具体编排：
      - **GitHub 项目**（5-7 分镜/item）：ProjectHeroScene → KeyInsightScene → ArchitectureScene/RichBulletScene → ComparisonTableScene（如有对比表） → QuoteCardScene（如有引用） → RichBulletScene
      - **HN/Reddit 帖子**（5-7 分镜/item）：ProjectHeroScene → KeyInsightScene → TimelineScene（如有时间线） → DebateSplitScene（如有正反方） → QuoteCardScene × 1-2 → RichBulletScene
      - **Product Hunt 产品**（4-6 分镜/item）：ProjectHeroScene → KeyInsightScene → FeatureCardScene × 1-2 → TechStackScene（如有） → RichBulletScene
    - 旁白应覆盖读入的深度调研内容中的核心要点，**必须具体且有深度**， 不能只读标题和热度。**每个 item 的旁白必须包含：至少 1 个具体数据点、至少 1 个技术细节、至少 1 条社区评论转述（如有）、以及竞品对比要点（如有）。关键事实遗漏率不得超过 30%。**
    - 旁白**一律用中文**，对于 Hacker News, Reddit 这类英文内容较多的来源，**不能直接读英文标题或者评论**，需要先把英文内容翻译成中文再进行旁白撰写。旁白更侧重于解说和分析，画面显示更侧重于原文要点和数据，两者**不需要完全一致**。
    - **画面显示语言规则（严格遵守）**：`script.json` 中所有用于画面展示的文本字段**默认使用中文**，仅以下情况保留原文英文：
      1. **item 身份标识**（各项目的"标题"，保持与原平台一致便于搜索识别）：
         - `ProjectHero.name`（GitHub 仓库名如 `owner/repo`、Hacker News / Reddit 帖子标题、Product Hunt 产品名）
         - `RichBullet.project`、`TechStack.project`（跟随所属 item 名称，保持一致）
         - 总览预告型 `RichBullet.bullets[].title` —— 当列表就是各 item 名称时，title 用英文原名，`detail` 用中文亮点
      2. **品牌 / 平台标识**：`source`、`QuoteCard.platform`（如 `GitHub` / `Hacker News` / `Reddit` / `Product Hunt`）
      3. **作者 handle**：`QuoteCard.author`、`ChatBubbles.messages[].author`
      4. **URL、版本号、技术栈专有名词**（React / PyTorch / CUDA / Next.js / 等）
      5. **代码本身**：`code_block.code`（含语言标识 `language`）

      除上述情况外，以下字段必须翻译为中文：
      - Cover: `title`, `subtitle`（视频整体标题，非 item 标题）
      - ProjectHero: `tagline`
      - KeyInsight: `headline`, `explanation`
      - RichBullet: `sectionTitle`；非 item 列表时的 `bullets[].title` 与 `bullets[].detail`
      - QuoteCard: `quote`（英文评论**必须翻译成中文**），`context`
      - ComparisonTable: `title`, `columns`, `rows`（单元格若为专有名词/数字/版本号可保留原文）
      - DataHighlight: `unit`, `context`
      - DebateSplit: `topic`, `proSide.label / points`, `conSide.label / points`
      - Architecture: `title`, `layers[].name`, `layers[].description`
      - Timeline: `title`, `events[].label`（注：`events[].date` 是日期字符串如 `2026-04-04`，无需翻译）
      - FeatureCard: `title`, `description`, `highlight`
      - ChatBubbles: `topic`, `messages[].text`（英文原文**必须翻译成中文**）
      - Transition: `text`, `subtitle`

      示例（GitHub 项目的 ProjectHero）：
      ```json
      { "name": "microsoft/vscode", "tagline": "微软开源的跨平台代码编辑器", "source": "GitHub" }
      ```
      示例（Hacker News 帖子的 QuoteCard）：
      ```json
      { "quote": "这个方案比 Redis 快 3 倍，但内存占用翻倍", "author": "pcwalton", "platform": "Hacker News" }
      ```
    - 深度调研的结果中如果有 pros/cons 正反方评论（如 Hacker News, Reddit）， 必须加到旁白中，且使用 DebateSplitScene 模板。
    - 旁白内容用于生成 TTS 语音，**避免出现特殊字符，避免多个词连在一起读音发不出来**，**对于英文避免使用连词符号"-", "_", "." 等把单词连在一起**。
    - 旁白中如果有列表或者多个模块，每个列表 item 和每个模块单独一个子分镜，方便后期语音和画面做时间同步。
    - **画面内容密度要求**：每个内容分镜画面上可见文字必须 ≥80 个中文字（或 ≥150 英文字）。旁白提到的关键信息（数据点、技术名词、评论观点）≥70% 必须在画面上以某种形式展示。
3. 每个分镜提取出旁白文本，使用 CosyVoice 来做 TTS 语音生成。
4. 画面内容和动效要求：
    - **严禁静态画面超过 3 秒**：每个分镜中的文字、数据、列表项必须使用逐条入场动画（stagger ≥0.5s），动画结束后应有持续动效（活跃 bullet 切换高亮、数字计数器滚动、进度条推进、元素浮动位移）填充剩余时长。
    - **分镜时长限制**：单个分镜的旁白时长不得超过 **15 秒**。如果某段旁白超过 15 秒，必须拆分为多个子分镜，每个子分镜使用不同的模板或不同的视觉焦点。拆分原则：
      - 按内容段落自然拆分（每个论点/功能/数据点一个分镜）
      - 每个子分镜有独立的入场动画，确保画面持续有变化
      - 拆分后每个子分镜时长控制在 **8-15 秒**
      - 例如：一段 35 秒的旁白讲 3 个要点 → 拆为 3 个分镜（KeyInsight → RichBullet → DataHighlight），每段约 12 秒
    - **动效幅度要求**：所有持续动效的振幅必须 ≥20px 或 ≥5% 缩放（低于此在视频中不可感知）。推荐方案：(a) 活跃 bullet 放大突出+下划线扫过、其余缩小变暗，(b) 数据数字 counter 从 0 滚动增长，(c) 卡片入场 spring 弹入（位移 ≥100px），(d) 当前高亮项 glow 边框脉冲。每个分镜至少叠加两种以上动效。
    - **空间利用率**：画面内容区域必须占画面面积 ≥65%（通过 ImageMagick -fuzz 15% -trim 测量）。不允许大面积空白。
    - **场景视觉多样性**：全视频至少 8 种视觉上不同的画面布局。不同 item 的分镜必须有视觉差异，避免所有分镜只是换文字而布局完全相同。
    - **画面信息补充**：旁白提到的关键数据点（如 Star 数、性能数字、百分比）应以大号动画数字或动态计数器形式同步显示在画面上。竞品对比必须用表格/分栏而非纯文字列表。社区评论必须用引用卡片而非 bullet。
5. 使用 `generate_main_tsx.py` + `remotion render` 制作视频。模板代码已在 `remotion-templates/` 中就绪，无需手写 Remotion 组件。制作时注意：每个来源使用对应的 `themes/*.ts` 主题色，**不能混淆**视频来源（如 Hacker News 视频中不能出现 GitHub 的内容或配色）。


## 主题色与模板配置

> 主题色定义详见 `remotion-templates/themes/*.ts`（github.ts / hackernews.ts / reddit.ts / producthunt.ts）
> 模板视觉设计详见 `remotion-templates/SCENE_DESIGN.md`
> 模板组件实现详见 `remotion-templates/landscape/*Scene.tsx`

## Remotion 参考实现（经 3 轮评估迭代，评分 ≥9.0/10）

> **严格要求：必须使用以下模板代码作为基础，只修改 theme.ts 和 Main.tsx，不得重写组件逻辑。**

### 模板文件位置
```
~/.openclaw/workspace/news-monitor/remotion-templates/
├── landscape/              # 横屏 1920×1080 组件
│   ├── CoverScene.tsx      # 封面/结尾场景
│   ├── ProjectIntroScene.tsx  # 项目介绍场景
│   └── BulletPointsScene.tsx  # 要点列表场景
├── portrait/               # 竖屏 1080×1920 组件
│   ├── CoverScene.tsx
│   ├── ProjectIntroScene.tsx
│   └── BulletPointsScene.tsx
├── themes/                 # 各来源主题色
│   ├── github.ts
│   ├── hackernews.ts
│   ├── producthunt.ts
│   └── reddit.ts
├── generate_main_tsx.py    # 从 script.json + audio 自动生成 Main.tsx/Root.tsx
├── package.json            # Remotion 依赖
├── tsconfig.json
├── index.ts                # Remotion 入口
└── index.css               # 全局样式
```

### 项目创建步骤
每个来源（github, hackernews, producthunt, reddit）× 每种格式（横屏, 竖屏）= 1 个 Remotion 项目：
```bash
# 1. 创建项目并安装依赖
mkdir -p remotion-{source}/src remotion-{source}/public
cp remotion-templates/package.json remotion-{source}/
cp remotion-templates/tsconfig.json remotion-{source}/
cd remotion-{source} && npm install && cd ..

# 2. 复制组件（二选一）
cp remotion-templates/landscape/*.tsx remotion-{source}/src/   # 横屏
cp remotion-templates/portrait/*.tsx remotion-{source}/src/    # 竖屏

# 3. 复制入口文件和主题
cp remotion-templates/index.ts remotion-templates/index.css remotion-{source}/src/
cp remotion-templates/themes/{source}.ts remotion-{source}/src/theme.ts

# 4. 链接音频（指向 TTS 输出目录）
ln -s $(pwd)/audio remotion-{source}/public/audio

# 5. 生成 Main.tsx 和 Root.tsx（自动计算帧偏移）
python3 remotion-templates/generate_main_tsx.py script_{source}.json {audio_prefix} remotion-{source}/src

# 6. 渲染
cd remotion-{source}
npx remotion render src/index.ts Main --output=out.mp4 --width=1920 --height=1080 --fps=30 --codec=h264 --concurrency=4
```

### 脚本 JSON 格式（generate_main_tsx.py 的输入）
```json
{
  "segments": [
    {
      "id": "intro",
      "template": "cover_title",
      "narration": "中文旁白...",
      "data": { "title": "标题", "subtitle": "副标题" }
    },
    {
      "id": "{slug}_1",
      "template": "project_intro",
      "narration": "...",
      "data": {
        "rank": 1,
        "name": "项目名（显示在画面上的真实名称，不是 slug）",
        "tagline": "一句话简介",
        "stars": "+814"
      }
    },
    {
      "id": "{slug}_2",
      "template": "bullet_points",
      "narration": "...",
      "data": {
        "project": "项目名（与 project_intro 中的 name 一致）",
        "title": "章节标题",
        "bullets": ["要点1", "要点2", "要点3", "要点4"]
      }
    }
  ]
}
```
- 每个 item = `{slug}_1` (project_intro) + `{slug}_2` (bullet_points) + `{slug}_3` (bullet_points)
- stars 字段：GitHub 用 `stars`，HN 用 `points`，PH 用 `votes`，Reddit 可能没有（留空）
- `name` 字段必须是人类可读的项目名称，不能用 slug 或 id

### 注意事项（以下是 3 轮迭代中发现的关键 bug，不能重犯）
1. **BulletPointsScene 的 project 属性**：`generate_main_tsx.py` 不会自动从 `seg_id` 推导，必须在 `bullet_points` 节点的 `data.project` 中显式传入真实项目名称（如 "Gemini CLI"），不能是 slug（如 "gemini_cli"），且应与同一 item 的 `project_intro.data.name` 一致。缺省会导致顶部标题显示为空。
2. **isDark 设置**：除 GitHub 外，其他来源的 BulletPointsScene 中 `isDark` 必须为 `false`（硬编码）。GitHub 来源可使用 `rank % 3 === 0` 交替。
3. **星标/投票数为 0 时**：ProjectIntroScene 已有 `starsNum > 0` 条件判断，不显示空的星标 badge。Reddit 来源通常没有投票数据。
4. **HN 来源**：使用 ▲ 图标代替 ★ 显示 points，可在 theme 中覆盖。
5. **竖屏 scanY**：使用 `% 2000` 而非 `% 1200`（适配 1920 高度）。
6. **Root.tsx 中的 width/height**：横屏 `width={1920} height={1080}`，竖屏 `width={1080} height={1920}`。`generate_main_tsx.py` 默认生成横屏尺寸，竖屏需手动调整。
7. **TTS 音频**：使用 CosyVoice，命令为 `cd ~/.openclaw/workspace/CosyVoice && uv run python clone_voice.py "旁白文本" -o output.wav --speed 1.2`，参考音色 `reference/my_voice.wav`。GPU 同一时间只能运行一个实例。

---

## 视频制作流程
> 以下流程对**用户选中的每个来源**执行。来源选择规则见上方"快速参考 → 来源选择"。未指定时默认全部 4 个来源。

1. 从 `~/.openclaw/workspace/news-monitor/deep_dive/yyyy-mm-dd_HH/{source}` 目录中读入已生成好的深度调研内容（由其他 skill 产出）。**只读取被选中来源对应的子目录**，未选中的来源不读、不处理。
2. 对**每个被选中的**来源（Github、Hacker News、Product Hunt）分别做一个视频，并且这些来源中的 item 不能遗漏任何一个。
3. 如果 Reddit 被选中，整体做一个视频，该来源根据 subreddit 分类，从与 AI 相关分类中取 Top 10 帖子制作视频。
4. 每个视频做两个版本：横屏 1920 × 1080 和竖屏 1080 × 1920。
5. 生成视频的工作目录是 `~/.openclaw/workspace/news-monitor/videos/yyyy-mm-dd_HH`，里面包含 `1920x1080` 和 `1080x1920` 两个子文件夹存放不同格式视频。**只输出被选中来源的视频文件**，未选中来源不会出现在该目录中。
