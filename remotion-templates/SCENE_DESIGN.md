# Remotion 场景模板字段规范

> 17 种场景模板的 **`data` 字段契约**。LLM 生成 `script.json` 时，每段
> `data` 必须严格匹配本文档对应模板的 Props 接口；字段名拼错会被
> `generate_main_tsx.py` 忽略并走默认值（如 `mainNumber` 默认 `"0"`，
> 主数字会变成 0）。
>
> 本文档**只规定字段契约**，不描述视觉布局、动画曲线、像素尺寸——
> 那些已在 `landscape/*.tsx` / `portrait/*.tsx` 实现，且不在 LLM 的关心
> 范围内。所有模板都会自动接收顶层 `narration` 字段（可不在 data 里
> 重复填）。

---

## 模板总览

| `template` 取值 | 用途 |
|---|---|
| `cover`（兼容别名 `cover_title`） | 视频封面 / 片尾 |
| `project_hero` | 项目身份卡（rank + 名称 + 数据 badge） |
| `project_intro` | 项目简介卡（横屏长版本） |
| `key_insight` | 核心痛点 / 一句话洞察 |
| `rich_bullet` | 多 bullet 列表，每条带 title + detail |
| `bullet_points` | 多 bullet 列表，每条只有一行文字 |
| `comparison_table` | 对比表格 |
| `quote_card` | 单条社区引用 |
| `data_highlight` | 数据仪表盘（超大主数字 + 副数据卡） |
| `debate_split` | Pros vs Cons 正反方 |
| `architecture` | 架构分层 / 流程 |
| `tech_stack` | 技术栈 badge 列表 |
| `timeline` | 时间线 / 版本历史 |
| `feature_card` | 单点特色卡 |
| `code_block` | 代码片段 / 命令行（**竖屏会自动降级为 `key_insight`**） |
| `chat_bubbles` | 多人讨论气泡 |
| `transition` | 章节过渡大字 |

写错 `template` 名（含拼写、大小写）会被生成器跳过并打印
`WARNING: Unknown template`。

---

## 1. `cover` — CoverScene（视频封面 / 片尾）

CoverScene 现在渲染 `public/cover.png`（全屏铺满 + 淡入 + 底部进度条），
标题/副标题文字内嵌在图片中。生成视频前需把对应来源与分辨率的封面拷贝到
`public/cover.png`：

```bash
# 横屏：1920x1080；竖屏：1080x1440
cp remotion-templates/covers/{source}_{W}x{H}.png public/cover.png
```

```typescript
{
  // 数据字段均为可选，仅为兼容老 script.json 保留；CoverScene 本体忽略它们。
  title?: string;
  subtitle?: string;
}
```
**必填**：无（音频由 `segments[].id` 对应的 `{id}.wav` 提供）。

---

## 2. `project_hero` — ProjectHeroScene（跨来源项目英雄卡）

```typescript
{
  rank: number;        // 1-10
  name: string;        // "claude-mem"
  tagline: string;     // "Claude Code 持久化记忆插件"
  stats: string;       // "+814 ⭐" / "+501 points" / "+285 votes"
  source: string;      // "GitHub" / "Hacker News" / "Product Hunt" / "Reddit"
}
```
**必填**：`rank`、`name`、`tagline`、`stats`、`source`。
**注意**：`stats` 必须是带前缀符号或单位的可读字符串，不要传纯数字。
若没传 `stats`，生成器会回退取 `stars` / `votes` / `upvotes` / `points`
中第一个非空字段，但**不要依赖这条回退**。

---

## 3. `project_intro` — ProjectIntroScene（GitHub 项目身份卡）

```typescript
{
  rank: number;
  name: string;
  tagline: string;
  stars: string;       // "14.2k" / "501 points" / "285" — 任意可读字符串
}
```
**必填**：`rank`、`name`、`tagline`、`stars`。
**注意**：字段名是 `stars`（**不是** `stats`）。组件内部会自动剔除非
数字字符做计数动画，所以传 `"14.2k stars"` 也可以。同样的回退链
`stars → votes → upvotes → points → stats` 存在但不要依赖。

---

## 4. `key_insight` — KeyInsightScene（核心洞察 / 痛点）

```typescript
{
  headline: string;    // "每次会话结束，上下文全部清空"
  explanation: string; // "开发者需要充当 Claude 的长期记忆…"
  icon?: string;       // "🧠" / "⚠️" / "💡"
  accentColor?: string;
}
```
**必填**：`headline`、`explanation`。

---

## 5. `rich_bullet` — RichBulletScene（详细要点列表，每条 title + detail）

```typescript
{
  project: string;
  sectionTitle: string;            // 也可写作 title
  bullets: {
    title: string;                 // "Hook 层：实时捕获"
    detail: string;                // "通过 PreToolUse/PostToolUse 钩子拦截工具调用"
  }[];
}
```
**必填**：`project`、`sectionTitle`、`bullets`（`bullets` 中每条
都需要 `title` + `detail`）。
**特殊**：narration 中**用 `\n\n` 分隔每条 bullet 的旁白**，TTS 会
按段切分并自动为每条 bullet 生成时长，组件用这些时长做高亮切换。
忘记加 `\n\n` 不会报错，但所有 bullet 会平均分时长。

---

## 6. `bullet_points` — BulletPointsScene（简洁要点列表，纯字符串）

```typescript
{
  project: string;
  sectionTitle?: string;
  bullets: string[];               // 每条一行纯文本
}
```
**必填**：`project`、`bullets`。
**vs `rich_bullet`**：本模板每条只有一行文字（不带 detail），适合
4 条以内简短列表。需要"标题 + 详情"两层结构时用 `rich_bullet`。

---

## 7. `comparison_table` — ComparisonTableScene（竞品 / 方案对比表格）

```typescript
{
  title: string;
  columns: string[];               // ["方案", "方式", "自动化程度", "痛点"]
  rows: {
    cells: string[];               // 每个 cells 长度等于 columns 长度
    isHighlighted?: boolean;       // 当前项目行高亮
  }[];
}
```
**必填**：`title`、`columns`、`rows`。
**注意**：`rows[].cells` 长度必须等于 `columns` 长度。也可直接传
`rows: [["a","b","c"]]`（数组的数组），生成器会归一化。

---

## 8. `quote_card` — QuoteCardScene（社区评论引用卡）

```typescript
{
  quote: string;                   // 中文翻译后的引文
  author: string;                  // "scrollop"
  platform: string;                // "Hacker News" / "Reddit r/AI_Agents"
  upvotes?: string;                // "+127"
  context?: string;                // 引用背景一行
}
```
**必填**：`quote`、`author`、`platform`。
**注意**：英文原评论必须翻译成中文写入 `quote`。

---

## 9. `data_highlight` — DataHighlightScene（数据仪表盘 / 大字数字）

```typescript
{
  mainNumber: string;              // "814" / "42,000" / "3.9%" / "10x" / "-9%"
  unit: string;                    // "⭐ 今日新增"
  context: string;                 // 一行解读：底部 28px 文字条
  secondaryStats?: {
    label: string;                 // "累计 Star"
    value: string;                 // "14.2k"
  }[];
}
```
**必填**：`mainNumber`、`unit`、`context`。
**常见错误**：
- 把主数字字段名写成 `value`（这是 `secondaryStats[].value` 用的）。
  写错字段名会让 `mainNumber` 默认为 `"0"`，主计数器从 0 滚到 0。
- `mainNumber` 必须是字符串（而不是 number），用引号包好。组件会
  自动解析数字部分 + 前缀（如 `$`）+ 后缀（如 `%`、`k`）做计数动画。

---

## 10. `debate_split` — DebateSplitScene（正反方辩论）

```typescript
{
  topic: string;                   // "Claude Code 配额争议"
  proSide: {
    label: string;                 // "支持方"
    points: string[];              // ["配额确实被不合理消耗", "需要公开计费明细"]
  };
  conSide: {
    label: string;                 // "反对方"
    points: string[];
  };
}
```
**必填**：`topic`、`proSide.{label,points}`、`conSide.{label,points}`。
**注意**：`proSide`、`conSide` 是嵌套对象，不是数组；`points` 才是
字符串数组。

---

## 11. `architecture` — ArchitectureScene（架构分层图）

```typescript
{
  title: string;                   // "claude-mem 三层架构"
  layers: {
    name: string;                  // "Hook 层"
    description: string;           // "PreToolUse/PostToolUse 钩子实时捕获"
    icon?: string;                 // "🪝"
  }[];
  direction?: "vertical" | "horizontal";  // 默认 vertical
}
```
**必填**：`title`、`layers`（`layers` 中每条至少 `name` + `description`）。

---

## 12. `tech_stack` — TechStackScene（技术栈徽章列表）

```typescript
{
  project: string;
  techs: {
    name: string;                  // "TypeScript"
    category?: string;             // "语言" / "框架" / "工具"
  }[];
  title?: string;                  // 默认 "技术栈"
}
```
**必填**：`project`、`techs`。

---

## 13. `timeline` — TimelineScene（时间线 / 版本历史）

```typescript
{
  title: string;
  events: {
    date: string;                  // "2026-04-04" — 日期字符串，不译
    label: string;                 // "Anthropic 宣布订阅排他政策"
  }[];
}
```
**必填**：`title`、`events`（`events` 中每条 `date` + `label`）。

---

## 14. `feature_card` — FeatureCardScene（单点功能特色卡）

```typescript
{
  icon: string;                    // "🔄" / "⚡"
  title: string;                   // "Endless Mode"
  description: string;             // 最多 4 行
  highlight?: string;              // "500 tokens" — 关键短语高亮
}
```
**必填**：`icon`、`title`、`description`。

---

## 15. `code_block` — CodeBlockScene（代码片段 / 命令行）

```typescript
{
  title: string;                   // "安装方式"
  language: string;                // "bash" / "typescript" / "json"  — 默认 "bash"
  code: string;                    // "/plugin add thedotmack/claude-mem"
  annotation?: string;             // "注意：不要用 npm install"
}
```
**必填**：`title`、`code`。
**特殊**：**竖屏渲染时，本模板会被自动降级为 `key_insight`**
（headline=`title`、explanation=`annotation` 或顶层 `narration`）。如果
内容必须以代码形式呈现，请只在横屏视频里用本模板。

---

## 16. `chat_bubbles` — ChatBubblesScene（多人讨论气泡）

```typescript
{
  topic: string;                   // "社区反应"
  messages: {
    author: string;                // 也可写作 sender
    text: string;
    side?: "left" | "right";       // 不传时按索引自动左右交替
    upvotes?: string;              // "+127"
  }[];
}
```
**必填**：`topic`、`messages`（`messages` 中每条 `author` + `text`）。
**注意**：英文评论必须翻译成中文写入 `text`。

---

## 17. `transition` — TransitionScene（章节过渡 / 转场）

```typescript
{
  text: string;                    // "接下来…" / "第三名"
  subtitle?: string;
}
```
**必填**：`text`。

---

## 通用约定

- 所有模板都接收顶层 `narration`（不在 data 里），用于 TTS。
- 字符串里的换行会被转义成空格（除了 `code_block.code`，会保留换行）。
- 字段缺失走默认值（多为空串或空数组），不会报错；视觉上会显示空白。
- `script.json` 顶层每段结构：
  ```json
  {
    "id": "gh-claudemem-data",
    "template": "data_highlight",
    "narration": "…",
    "data": { /* 本文档对应模板的 Props */ }
  }
  ```
