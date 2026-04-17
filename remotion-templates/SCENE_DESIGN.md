# Remotion 场景模板设计规范

> 基于 deep_dive 实际内容分析，设计 15 种场景类型，覆盖所有内容模式。
> 每种模板定义：Props 接口、视觉布局、动画规范、适用内容。

---

## 模板总览

| # | 模板名 | 用途 | 适用内容 | 优先级 |
|---|--------|------|---------|--------|
| 1 | CoverScene | 视频封面/片尾 | 标题+副标题+来源 | 必须 |
| 2 | ProjectHeroScene | 项目/帖子身份卡 | 名称+rank+star+tagline | 必须 |
| 3 | KeyInsightScene | 核心洞察/痛点 | 一句话大字+解释 | 必须 |
| 4 | RichBulletScene | 详细要点列表 | 技术细节/功能列表 | 必须 |
| 5 | ComparisonTableScene | 对比表格 | 竞品对比/方案比较 | 必须 |
| 6 | QuoteCardScene | 社区引用卡 | 用户评论+用户名 | 必须 |
| 7 | DataHighlightScene | 数据仪表盘 | ⭐数/性能指标/百分比 | 必须 |
| 8 | DebateSplitScene | 正反方辩论 | Pros vs Cons | 必须 |
| 9 | ArchitectureScene | 架构分层图 | 技术架构/流程 | 高 |
| 10 | TechStackScene | 技术栈展示 | 使用的技术/工具 | 高 |
| 11 | TimelineScene | 时间线 | 事件/版本历史 | 高 |
| 12 | FeatureCardScene | 单点特色卡 | 单个功能亮点 | 高 |
| 13 | CodeBlockScene | 代码片段 | 安装命令/示例代码 | 中 |
| 14 | ChatBubblesScene | 多人讨论气泡 | 多条社区评论 | 中 |
| 15 | TransitionScene | 章节过渡 | 来源切换/章节标题 | 低 |

---

## 1. CoverScene（封面场景）

**用途**：视频开场和结尾。深色渐变背景，标题逐字淡入。

```typescript
interface CoverSceneProps {
  title: string;         // "GitHub 今日热榜"
  subtitle: string;      // "2026-04-13 Top 10 开源项目深度解读"
  source: string;        // "GitHub" | "Hacker News" | "Product Hunt" | "Reddit"
  audioFile: string;
}
```

**布局（1920×1080）**：
- 全屏深色渐变背景（从 dark_bg_from → dark_bg_to），渐变角度持续旋转
- 5 个浮动光圈（brand_primary/brand_highlight 交替），漂浮 + 模糊
- 标题：居中，80px bold，逐字淡入 + 波浪位移
- 副标题：标题下方 40px，36px，0.9 opacity 淡入
- 底部来源 badge：pill 形状，brand_primary 背景
- 底部 4px 进度条

**动画**：
- 渐变角度：`135 + (frame/dur) * 120` 度
- 光圈：`sin(frame/(30+i*7)) * 200 + baseX`
- 标题逐字：`delay = i * 1.5`, 12 帧淡入
- 波浪：`sin(frame*0.08 + i*0.4) * 8px`

---

## 2. ProjectHeroScene（项目英雄卡）

**用途**：每个 item 的开场介绍。大号 rank + 项目名 + 简介 + 数据 badge。

```typescript
interface ProjectHeroSceneProps {
  rank: number;          // 1-10
  name: string;          // "claude-mem"
  tagline: string;       // "Claude Code 持久化记忆插件"
  stats: string;         // "+814 ⭐" | "+501 points" | "+285 votes"
  source: string;        // 来源标识
  audioFile: string;
}
```

**布局（1920×1080）**：
- 左侧 30%：超大 rank 数字（200px），持续浮动+脉冲+微旋转
- 右侧 70%：
  - 项目名：72px bold，brand_primary 色，底部下划线扫入
  - 简介：36px，text_secondary 色，下方浮动
  - stats badge：pill 形状，绿色背景，数字从 0 计数到目标值
  - 来源小标签：右上角
- 奇偶交替布局（奇数 rank 左→右，偶数 rank 右→左）
- 底部进度条 + 顶部装饰线

**关键动画参数**（经验证有效）：
- rank 浮动：`sin(frame/18) * 30px`
- rank 脉冲：`1 + sin(frame/12) * 0.08`
- rank 旋转：`sin(frame/40) * 3deg`
- 背景渐变旋转：`(frame/dur) * 80deg`
- 星标计数器：`interpolate(frame, [45,90], [0, actualValue])`

---

## 3. KeyInsightScene（核心洞察场景）

**用途**：展示一个关键痛点、核心观点、或重要结论。大字号 + 解释文字，视觉冲击力强。

```typescript
interface KeyInsightSceneProps {
  headline: string;      // "每次会话结束，上下文全部清空" 
  explanation: string;   // "开发者需要永远充当 Claude 的记忆..."
  icon?: string;         // emoji 或图标 "🧠" | "⚠️" | "💡"
  accentColor?: string;  // 强调色覆盖
  audioFile: string;
}
```

**布局（1920×1080）**：
- 左侧 15%：超大 icon/emoji（180px），呼吸缩放
- 中间主区域 85%：
  - headline：56px bold，白色或 brand_primary，打字机逐字显示
  - 分割线：3px accent 色，从左向右扫入（0→100%）
  - explanation：32px，text_secondary，逐句淡入
- 背景：深色渐变 + 左侧竖向光带跟随 icon 脉动
- 右下角：半透明大号 icon 水印（200px，0.05 opacity）

**动画**：
- icon 呼吸：`1 + sin(frame/20) * 0.1` scale
- headline 打字机：每字 3 帧，光标闪烁
- 分割线：`interpolate(frame, [charCount*3, charCount*3+30], [0, 100])%`
- explanation 逐句：每句 stagger 20 帧

---

## 4. RichBulletScene（详细要点列表）

**用途**：展示 4-6 个技术细节、功能列表、关键发现等。比当前 BulletPointsScene 内容更丰富。

```typescript
interface RichBulletSceneProps {
  project: string;       // "claude-mem"
  sectionTitle: string;  // "核心架构与技术细节"
  bullets: {
    title: string;       // "Hook 层：实时捕获" — 粗体标题
    detail: string;      // "通过 PreToolUse/PostToolUse 钩子拦截工具调用" — 详细说明
  }[];
  variant?: number;
  audioFile: string;
}
```

**布局（1920×1080）**：
- 顶部区域（15%）：project 名 + sectionTitle，底部 3px 分割线
- 主内容区域（85%）：2 列或 1 列（根据 bullet 数量自适应）
  - 每个 bullet：
    - 左侧：圆角方形序号 badge（40px）
    - 右侧上方：title（28px bold，brand_primary）
    - 右侧下方：detail（24px，text_secondary，最多 2 行）
  - 当前讲述的 bullet 高亮（放大 1.03x + 下划线扫动 + 序号 badge 填充色）
  - 已讲述的 bullet 半透明（0.7）
  - 未讲述的 bullet 更淡（0.4）

**动画**：
- 入场：spring 弹入，stagger = 12+i*8 帧
- 活跃高亮：`activeBullet = Math.floor(interpolate(frame, [entranceDone, dur-10], [0, count-0.01]))`
- 下划线扫：活跃 bullet 底部 2px 线从 0% → 100%
- 序号 badge：活跃时背景色变为 accentColor，文字变白
- 进度条 + 右上角 bullet 计数器

**vs 当前 BulletPointsScene 的区别**：
- 每个 bullet 有 title + detail 两层（不是单行文字）
- 2 列布局选项（可容纳 6 个 bullet 不拥挤）
- 内容量：每帧可见 ~120-200 字（当前 ~40 字）

---

## 5. ComparisonTableScene（对比表格场景）

**用途**：竞品对比、方案比较。deep_dive 中 21/39 个文件有 markdown 表格。

```typescript
interface ComparisonTableSceneProps {
  title: string;           // "竞品对比"
  columns: string[];       // ["方案", "方式", "自动化程度", "痛点"]
  rows: {
    cells: string[];       // ["claude-mem", "Plugin hook + AI压缩", "全自动", "依赖 Claude Code"]
    isHighlighted?: boolean; // 当前项目行高亮
  }[];
  audioFile: string;
}
```

**布局（1920×1080）**：
- 标题：顶部居中，42px bold
- 表格：
  - 表头行：brand_primary 背景，白色文字，28px bold
  - 数据行：交替浅色背景（background_primary / background_secondary）
  - 高亮行（当前项目）：brand_primary 边框 + 左侧 4px 色条 + 微微放大
  - 单元格：24px，padding 16px 24px
  - 表格宽度：占画面 85%，居中
- 行逐条从右侧滑入（spring + stagger）

**动画**：
- 表头：先入场（scale from 0.95 + fade）
- 每行：stagger 入场（slide from right + fade），delay = 15 + i*12
- 高亮行：入场后 pulse 边框 glow
- 当前讲述的行：scale 1.02 + 左侧色条宽度从 0→4px
- 扫描线：从上到下循环

---

## 6. QuoteCardScene（社区引用卡）

**用途**：展示单条高亮社区评论。deep_dive 中 11/39 个文件有 blockquote。

```typescript
interface QuoteCardSceneProps {
  quote: string;           // "终于不用每次重新解释项目架构了"
  author: string;          // "scrollop"
  platform: string;        // "Hacker News" | "Reddit r/AI_Agents"
  upvotes?: string;        // "+127"
  context?: string;        // 引用背景简述
  audioFile: string;
}
```

**布局（1920×1080）**：
- 居中大卡片（宽 75%，圆角 24px，阴影）
- 左上角：超大引号标志 `"`（120px，brand_primary，0.15 opacity）
- 引用文字：48px，text_primary，1.5 行高，居中
- 底部分割线
- 底部：头像占位圆 + 用户名（24px bold）+ 平台标识 + upvote badge
- 背景：浅色渐变 + 左右两侧半透明色块装饰

**动画**：
- 卡片入场：从底部 spring 弹入（translateY 100→0）
- 引号标志：scale from 2.0 → 1.0 + fade in
- 引用文字：打字机效果或逐词淡入
- 作者信息：delay 30 帧后 fade in
- 卡片持续微浮动：`sin(frame/30) * 5px`

---

## 7. DataHighlightScene（数据仪表盘场景）

**用途**：突出展示关键数据点（star 数、性能指标、百分比等）。

```typescript
interface DataHighlightSceneProps {
  mainNumber: string;      // "814"
  unit: string;            // "⭐ 今日新增"
  secondaryStats?: {
    label: string;         // "累计 Star"
    value: string;         // "14.2k"
  }[];
  context: string;         // "一天内获得 814 颗 Star，成为当日最热项目"
  audioFile: string;
}
```

**布局（1920×1080）**：
- 居中主数字：120px ultra-bold，brand_primary
- 主数字下方：unit 文字，36px
- 主数字两侧：半透明 SVG 圆环进度条（装饰）
- 次要数据：底部横排 2-3 个小卡片，每个含 label + value
- 右上角：科技感 HUD 角标装饰
- context：底部 28px 文字条

**动画**：
- 主数字：从 0 滚动增长到目标值（数字 counter），60 帧
- 圆环进度条：draw animation 从 0% → 显示百分比
- 次要数据卡片：stagger 弹入
- HUD 角标：持续旋转
- 背景：深色 + 网格线淡入淡出

---

## 8. DebateSplitScene（正反方辩论场景）

**用途**：展示 Pros vs Cons、正反方观点。HN/Reddit deep_dive 中常见。

```typescript
interface DebateSplitSceneProps {
  topic: string;           // "Claude Code 配额争议"
  proSide: {
    label: string;         // "支持方"
    points: string[];      // ["配额确实被不合理消耗", "需要公开计费明细"]
  };
  conSide: {
    label: string;         // "反对方"
    points: string[];      // ["可能是系统误判", "用户需要更理性看待"]
  };
  audioFile: string;
}
```

**布局（1920×1080）**：
- 顶部：topic 标题，居中，42px
- 左半屏（48%）：正方区域
  - 顶部 label pill（绿色/蓝色）
  - 论点卡片列表，从左侧滑入
- 中间（4%）：VS 标志（圆形，发光脉冲）+ 竖向分割线
- 右半屏（48%）：反方区域
  - 顶部 label pill（红色/橙色）
  - 论点卡片列表，从右侧滑入
- 底部：支持度进度条（可选）

**动画**：
- 论点交替入场：左1 → 右1 → 左2 → 右2（模拟辩论节奏）
- 每个论点：spring slide + fade，stagger = 20 帧
- VS 标志：持续脉冲发光（`1 + sin(frame/15) * 0.15` scale）
- 当前讲述侧高亮，另一侧变暗
- 分割线：发光渐变，上下移动

---

## 9. ArchitectureScene（架构分层图场景）

**用途**：展示技术架构、系统分层、流程步骤。GitHub deep_dive 中常见。

```typescript
interface ArchitectureSceneProps {
  title: string;           // "claude-mem 三层架构"
  layers: {
    name: string;          // "Hook 层"
    description: string;   // "PreToolUse/PostToolUse 钩子实时捕获"
    icon?: string;         // "🪝"
  }[];
  direction?: "vertical" | "horizontal";  // 排列方向
  audioFile: string;
}
```

**布局（1920×1080）**：
- 标题：顶部居中，42px
- 层级卡片：
  - vertical（默认）：从上到下排列，每层一个圆角卡片
    - 左侧：icon（64px）
    - 中间：name（32px bold）+ description（24px）
    - 层间：箭头连接线（↓）
  - horizontal：从左到右排列（适合流程）
- 每个卡片宽 80%，居中，间距 20px
- 当前讲述层高亮（border glow + scale 1.03）

**动画**：
- 层级逐个入场：从底部/右侧 spring 弹入
- 箭头连接线：draw animation（SVG path）
- 当前层高亮：border 发光 + icon 放大
- 非当前层：0.5 opacity

---

## 10. TechStackScene（技术栈展示场景）

**用途**：展示项目使用的技术、工具、框架。

```typescript
interface TechStackSceneProps {
  project: string;         // "claude-mem"
  title?: string;          // "技术栈"
  techs: {
    name: string;          // "TypeScript"
    category?: string;     // "语言" | "框架" | "工具"
  }[];
  audioFile: string;
}
```

**布局（1920×1080）**：
- 标题：顶部，project + title
- 技术 badge 网格：
  - 每个 badge：圆角 pill（padding 12px 24px），28px
  - 按 category 分行（如果有）
  - 背景色：category 不同色（语言=蓝、框架=紫、工具=绿）
- 居中布局，gap 16px

**动画**：
- badge 逐个弹入：spring + stagger = 6 帧
- 弹入后微浮动：各自不同频率的 sin 位移
- 当前讲述的 badge 放大 + 发光

---

## 11. TimelineScene（时间线场景）

**用途**：事件时间线、版本历史、发展脉络。

```typescript
interface TimelineSceneProps {
  title: string;           // "事件时间线"
  events: {
    date: string;          // "2026-04-04"
    label: string;         // "Anthropic 宣布订阅排他政策"
  }[];
  audioFile: string;
}
```

**布局（1920×1080）**：
- 标题：顶部
- 横向时间轴：居中水平线（4px，发光）
- 节点：圆形（16px），等距分布在轴上
- 每个节点上方/下方交替：
  - 日期标签（20px）
  - 事件描述卡片（28px，最大宽度 250px）
- 左右有渐隐遮罩

**动画**：
- 时间轴：draw animation 从左到右
- 节点：逐个点亮（发光 + scale from 0 → 1）
- 卡片：对应节点点亮时从上/下弹入
- 当前事件：节点放大 + 卡片高亮

---

## 12. FeatureCardScene（单点特色卡场景）

**用途**：突出展示一个功能亮点或关键特性。

```typescript
interface FeatureCardSceneProps {
  icon: string;            // "🔄" | "⚡"
  title: string;           // "Endless Mode"
  description: string;     // "工作记忆与归档记忆分离，Working Memory 约 500 tokens/条..."
  highlight?: string;      // "500 tokens" — 关键数字高亮
  audioFile: string;
}
```

**布局（1920×1080）**：
- 全屏单卡片，padding 80px
- icon：左上角或顶部居中，120px
- title：48px bold，brand_primary
- description：32px，text_secondary，最多 4 行
- highlight 文字用 accent 色 + 背景色块标注
- 背景：浅色/深色交替 + 装饰光圈

**动画**：
- icon：scale from 0 → 1 + 旋转入场
- title：slide from left + fade
- description：逐行淡入，stagger 15 帧
- highlight 数字：scale pulse 强调

---

## 13. CodeBlockScene（代码片段场景）

**用途**：展示安装命令、配置代码、API 示例。

```typescript
interface CodeBlockSceneProps {
  title: string;           // "安装方式"
  language: string;        // "bash" | "typescript" | "json"
  code: string;            // "/plugin add thedotmack/claude-mem"
  annotation?: string;     // "注意：不要用 npm install"
  audioFile: string;
}
```

**布局（1920×1080）**：
- 标题：顶部 40px
- 代码区域：深色圆角卡片（#1e1e1e），等宽字体
  - 顶部：窗口装饰条（3 个圆点 + 语言标签）
  - 代码内容：28px monospace，语法高亮（关键字蓝/字符串绿/注释灰）
  - 行号：左侧灰色
- 注解：代码区域下方，24px，warning 黄色图标

**动画**：
- 代码区域：scale from 0.95 → 1 + fade
- 代码文字：打字机逐字符显示，带光标
- 行号：逐行淡入
- 注解：delay 入场 + shake 强调

---

## 14. ChatBubblesScene（多人讨论气泡场景）

**用途**：展示多条社区评论，模拟讨论氛围。

```typescript
interface ChatBubblesSceneProps {
  topic: string;           // "社区反应"
  messages: {
    author: string;        // "scrollop"
    text: string;          // "过去一周有大量关于 Claude 退化的讨论..."
    side: "left" | "right"; // 左右交替
    upvotes?: string;      // "+127"
  }[];
  audioFile: string;
}
```

**布局（1920×1080）**：
- 标题：顶部
- 气泡区域：
  - 左侧气泡：圆角卡片，左对齐，brand_primary 浅色背景
  - 右侧气泡：圆角卡片，右对齐，brand_highlight 浅色背景
  - 每个气泡：作者名（bold）+ 文字内容 + upvote 小标签
  - 最多同时显示 3-4 条

**动画**：
- 气泡逐条从底部弹入（bounce up）
- 新气泡入场时旧气泡上推
- 当前讲述的气泡高亮，其他变淡
- 气泡微浮动

---

## 15. TransitionScene（过渡场景）

**用途**：章节切换、来源切换。短暂过渡。

```typescript
interface TransitionSceneProps {
  text: string;            // "接下来..." | "第三名"
  subtitle?: string;       // "Project Name"
  audioFile: string;
}
```

**布局**：全屏深色 + 居中大字（96px）+ 可选 glitch/mask 效果。

---

## 每个 item 的分镜编排建议

### GitHub 项目（~5-7 个分镜/item）：
1. `ProjectHeroScene` — rank + 名称 + star
2. `KeyInsightScene` — 核心痛点/定位
3. `ArchitectureScene` 或 `RichBulletScene` — 技术架构
4. `ComparisonTableScene` — 竞品对比（如有表格）
5. `QuoteCardScene` — 社区评价（如有引用）
6. `RichBulletScene` — 局限性/总结

### HN/Reddit 帖子（~5-7 个分镜/item）：
1. `ProjectHeroScene` — 帖子标题 + points/votes
2. `KeyInsightScene` — 事件核心
3. `TimelineScene` — 事件时间线（如有）
4. `DebateSplitScene` — 正反方辩论
5. `QuoteCardScene` × 1-2 — 精选评论
6. `RichBulletScene` — 行业影响/总结

### Product Hunt 产品（~4-6 个分镜/item）：
1. `ProjectHeroScene` — 产品名 + votes
2. `KeyInsightScene` — 核心卖点
3. `FeatureCardScene` × 1-2 — 关键功能
4. `TechStackScene` — 技术栈（如有）
5. `RichBulletScene` — 总结

### 预期效果：
- 10 个 item × 5-6 分镜 = 50-60 个分镜（当前 32 个）
- 每个 item 使用 3-4 种不同模板（当前只用 2 种）
- 全视频至少 8-10 种不同的视觉布局
- 每帧可见文字 ≥80 字
