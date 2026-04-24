# Remotion 视频模板

经过 3 轮评估迭代优化，评分 ≥9.0/10 的 Remotion 组件模板。

## 目录结构

```
remotion-templates/
├── landscape/              # 横屏 1920×1080 组件
│   ├── CoverScene.tsx      # 封面/结尾场景（深色渐变背景、逐字淡入、浮动圆形）
│   ├── ProjectIntroScene.tsx  # 项目介绍（rank浮动脉冲、名称下划线扫、星标计数器）
│   └── BulletPointsScene.tsx  # 要点列表（逐条弹入、活跃高亮、下划线扫动）
├── portrait/               # 竖屏 1080×1440 组件（纵向堆叠布局）
│   ├── CoverScene.tsx
│   ├── ProjectIntroScene.tsx
│   └── BulletPointsScene.tsx
├── themes/                 # 各来源主题色
│   ├── github.ts           # 蓝紫 (#0969da, #8250df)
│   ├── hackernews.ts       # 橙色 (#ff6600) on cream
│   ├── producthunt.ts      # 珊瑚红 (#ff6154, #da552f)
│   └── reddit.ts           # 橙红 (#ff4500) + 蓝 (#0079d3)
├── generate_main_tsx.py    # 从 script.json + audio 自动生成 Main.tsx/Root.tsx
├── package.json            # Remotion 依赖
├── tsconfig.json
├── index.ts                # Remotion 入口
└── index.css               # 全局样式
```

## 使用方法

### 1. 创建项目
```bash
# 为每个来源创建 Remotion 项目
mkdir -p remotion-{source}
cp remotion-templates/package.json remotion-{source}/
cp remotion-templates/tsconfig.json remotion-{source}/
mkdir -p remotion-{source}/src remotion-{source}/public

# 复制组件（横屏或竖屏）
cp remotion-templates/landscape/*.tsx remotion-{source}/src/   # 或 portrait/
cp remotion-templates/index.ts remotion-{source}/src/
cp remotion-templates/index.css remotion-{source}/src/

# 复制主题
cp remotion-templates/themes/{source}.ts remotion-{source}/src/theme.ts

# 链接音频目录
ln -s $(pwd)/audio remotion-{source}/public/audio

# 复制封面图到 public/cover.png（按最终渲染分辨率选择：横屏 1920x1080，竖屏 1080x1440）
cp remotion-templates/covers/{source}_{W}x{H}.png remotion-{source}/public/cover.png

# 安装依赖
cd remotion-{source} && npm install
```

### 2. 生成 Main.tsx
```bash
python3 remotion-templates/generate_main_tsx.py script_{source}.json remotion-{source}/src
```
- `script_{source}.json`: 脚本 JSON（含 segments 数组）
- 自动计算每个 segment 的音频帧数，生成 Main.tsx 和 Root.tsx

### 3. 渲染
```bash
cd remotion-{source}
# 横屏
npx remotion render src/index.ts Main --output=out.mp4 --width=1920 --height=1080 --fps=30 --codec=h264 --concurrency=4
# 竖屏
npx remotion render src/index.ts Main --output=out.mp4 --width=1080 --height=1440 --fps=30 --codec=h264 --concurrency=4
```

## 脚本 JSON 格式

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
      "data": { "rank": 1, "name": "项目名", "tagline": "简介", "stars": "+814" }
    },
    {
      "id": "{slug}_2",
      "template": "bullet_points",
      "narration": "...",
      "data": { "title": "章节标题", "bullets": ["要点1", "要点2", "要点3", "要点4"] }
    }
  ]
}
```

每个 item 对应 3 个 segment：`{slug}_1` (project_intro) + `{slug}_2` (bullet_points) + `{slug}_3` (bullet_points)。

## 关键动效参数（经评估验证）

| 动效 | 参数 | 说明 |
|------|------|------|
| Rank 浮动 | `sin(frame/18)*25~30px` | 持续上下浮动 |
| Rank 脉冲 | `1 + sin(frame/12)*0.08` | 呼吸缩放 |
| Rank 旋转 | `sin(frame/40)*3deg` | 微旋转 |
| 背景渐变旋转 | `(frame/dur)*60~80deg` | 持续旋转 |
| 扫描线 | `(frame*4) % height` | 从上到下循环 |
| 进度条 | `frame/dur * 100%` | 底部进度 |
| Bullet 入场 | `spring(delay=12+i*10)` | 弹性逐条入场 |
| 活跃高亮 | `activeBullet = Math.floor(interpolate(...))` | 当前讲述项放大 |
| 下划线扫 | `interpolate → 0~100%` | 活跃 bullet 下方扫动 |
| 星标计数器 | `interpolate(frame, [45,90], [0,1])` | 从 0 计数到目标值 |
