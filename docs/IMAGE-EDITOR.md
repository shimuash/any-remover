# Image Editor 技术规格文档

## 概述

本文档描述了图片编辑器功能的技术规格，该编辑器允许用户上传图片后在全屏浮窗中进行涂抹标记，并调用 AI 接口移除标记区域的内容。

---

## 功能需求

### 核心功能

| 功能 | 描述 |
|------|------|
| 全屏编辑器 | 用户上传图片后，以全屏浮窗形式进入编辑状态，不跳转页面 |
| 画布 | 使用 react-konva 实现，展示用户图片，支持缩放 |
| 画笔工具 | 默认选中，颜色 #FF007A，透明度 50%（固定），画笔大小可调 |
| 橡皮擦工具 | 擦除涂抹区域 |
| 移除功能 | 将融合图（原图 + 涂抹区域合成）发送后端，生成结果覆盖当前图片 |
| Chat 工具 | 输入 prompt 进行 AI 图片编辑 |
| Undo/Redo | 针对图片生成历史的版本切换 |
| 下载 | 下载当前图片 |
| 对比功能 | 分屏滑动对比原始图片与当前图片 |
| 缩放控件 | 右下角垂直缩放按钮，显示当前缩放比例，点击比例可重置为适应窗口 |
| Debug 模式 | 实时预览提交给后端的融合图 |
| 移动端适配 | 响应式布局，触摸手势支持 |

### 用户流程

```
用户上传图片
    ↓
打开 ImageEditorDialog（全屏浮窗）
    ↓
用户使用 Brush 涂抹要移除的区域
    ↓
点击"移除"按钮
    ↓
合成融合图（原图 + 涂抹区域叠加）
    ↓
调用后端 API（融合图）
    ↓
返回结果图片，覆盖画布上的图片
    ↓
用户可继续编辑或下载
```

---

## 设计决策

| 项目 | 决策 | 说明 |
|------|------|------|
| 全屏样式 | 真正全屏 (100vw × 100vh) | 无边距，沉浸式编辑体验 |
| 头部布局 | 左侧退出，右侧功能按钮 | 退出按钮左上角，其他功能按钮右上角 |
| 头部按钮顺序 | 从右到左：下载、对比、Redo、Undo、Debug | 常用操作集中在头部 |
| 工具栏位置 | 底部固定 | 仅保留绘制工具：Brush、Eraser、Chat |
| 移动端工具栏 | 底部水平排列 | 符合移动端操作习惯 |
| 橡皮擦实现 | compositeOperation 直接擦除 | 体验更流畅 |
| Undo/Redo 范围 | 仅针对图片版本 | 不包含涂抹操作历史，切换时清空当前 lines |
| 对比功能 | 分屏滑动对比 | 左侧原图，右侧当前图，拖动滑块调整 |
| 缩放控件位置 | 右下角垂直排列 | +/比例/-，点击比例重置为适应窗口 |
| Debug 预览位置 | 缩放控件上方 | 仅在 Debug 模式开启时显示 |
| Chat 输入框位置 | 工具栏上方 | 点击 Chat 工具时显示 |
| 后端服务 | Mock 接口 | 预留真实接口接入点 |

---

## 界面布局

### Desktop 布局 (≥768px)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌───┐                               ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐      │
│ │ ✕ │                               │🔧 │ │ ↩️ │ │ ↪️ │ │ ⊞ │ │ ⬇️ │      │
│ └───┘                               └───┘ └───┘ └───┘ └───┘ └───┘      │
│ 退出                                Debug  Undo  Redo  对比   下载      │
│                                                                         │
│                                                                         │
│                     ┌───────────────────────────────┐                   │
│                     │                               │                   │
│                     │                               │                   │
│                     │                               │                   │
│                     │                               │                   │
│                     │       用户上传的图片           │                   │
│                     │       (可缩放/拖动)            │                   │
│                     │                               │                   │
│                     │                               │                   │
│                     │                               │       ┌─────────┐ │
│                     │                               │       │ Preview │ │
│                     │                               │       │ (Debug) │ │
│                     └───────────────────────────────┘       ├─────────┤ │
│                                                             │    +    │ │
│                                                             ├─────────┤ │
│                                                             │  100%   │ │
│                                                             ├─────────┤ │
│                                                             │    -    │ │
│                                                             └─────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │   ○──────────────────●─────────────────○   Brush Size             │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  🖌️  │  🧹  │  💬  │                                    │   移除   │  │
│  │Brush │Eraser│ Chat │                                    │  Button  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Desktop - Chat 激活状态

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌───┐                               ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐      │
│ │ ✕ │                               │🔧 │ │ ↩️ │ │ ↪️ │ │ ⊞ │ │ ⬇️ │      │
│ └───┘                               └───┘ └───┘ └───┘ └───┘ └───┘      │
│                                                                         │
│                     ┌───────────────────────────────┐                   │
│                     │                               │                   │
│                     │                               │                   │
│                     │       用户上传的图片           │                   │
│                     │       (可缩放/拖动)            │       ┌─────────┐ │
│                     │                               │       │ Preview │ │
│                     │                               │       │ (Debug) │ │
│                     └───────────────────────────────┘       ├─────────┤ │
│                                                             │    +    │ │
│                                                             ├─────────┤ │
│                                                             │  100%   │ │
│                                                             ├─────────┤ │
│                                                             │    -    │ │
│                                                             └─────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ 💬 描述你想要的修改...                                     [发送] │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                        ↑ Chat 输入框 (工具栏上方)                        │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  🖌️  │  🧹  │  💬  │                                    │   移除   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                  ↑ 💬 高亮状态                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Desktop - 对比模式

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌───┐                               ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐      │
│ │ ✕ │                               │🔧 │ │ ↩️ │ │ ↪️ │ │ ⊞ │ │ ⬇️ │      │
│ └───┘                               └───┘ └───┘ └───┘ └───┘ └───┘      │
│                                                       ↑高亮             │
│                                                                         │
│           ┌─────────────────────────────────────────────────┐           │
│           │                       │                         │           │
│           │                       │                         │           │
│           │      原始图片          │←──滑块──→  当前图片      │           │
│           │                       │                         │           │
│           │                       │                         │           │
│           └─────────────────────────────────────────────────┘           │
│                                                                         │
│                    ← 拖动滑块左右调整分屏位置 →                           │
│                                                                         │
│  对比模式下隐藏：                                                        │
│  - 底部工具栏                                                           │
│  - 缩放控件                                                             │
│  - Debug 预览                                                           │
│                                                                         │
│  再次点击对比按钮退出对比模式                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Mobile 布局 (<768px)

```
┌────────────────────────────────┐
│ ┌───┐      ┌───┐┌───┐┌───┐┌───┐┌───┐│
│ │ ✕ │      │🔧 ││ ↩️ ││ ↪️ ││ ⊞ ││ ⬇️ ││
│ └───┘      └───┘└───┘└───┘└───┘└───┘│
│ 退出      Debug Undo Redo 对比 下载 │
│                                │
│ ┌────────────────────────────┐ │
│ │                            │ │
│ │                            │ │
│ │      用户上传的图片         │ │
│ │      (可缩放/拖动)          │ │
│ │                            │ │
│ │                   ┌──────┐ │ │
│ │                   │Preview│ │ │
│ │                   ├──────┤ │ │
│ │                   │  +   │ │ │
│ │                   ├──────┤ │ │
│ │                   │ 100% │ │ │
│ │                   ├──────┤ │ │
│ │                   │  -   │ │ │
│ └───────────────────┴──────┘ │ │
│                                │
│ ┌────────────────────────────┐ │
│ │  ○───────────●──────○      │ │
│ │       Brush Size           │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │  🖌️   │   🧹   │   💬      │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │          移除              │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

### Mobile - Chat 激活状态

```
┌────────────────────────────────┐
│ ┌───┐      ┌───┐┌───┐┌───┐┌───┐┌───┐│
│ │ ✕ │      │🔧 ││ ↩️ ││ ↪️ ││ ⊞ ││ ⬇️ ││
│ └───┘      └───┘└───┘└───┘└───┘└───┘│
│                                │
│ ┌────────────────────────────┐ │
│ │                            │ │
│ │      用户上传的图片         │ │
│ │      (可缩放/拖动)          │ │
│ │                   ┌──────┐ │ │
│ │                   │  +   │ │ │
│ │                   ├──────┤ │ │
│ │                   │ 100% │ │ │
│ │                   ├──────┤ │ │
│ │                   │  -   │ │ │
│ └───────────────────┴──────┘ │ │
│                                │
│ ┌────────────────────────────┐ │
│ │ 💬 描述你想要的修改...      │ │
│ │                    [发送]  │ │
│ └────────────────────────────┘ │
│       ↑ Chat 输入框            │
│                                │
│ ┌────────────────────────────┐ │
│ │  🖌️   │   🧹   │   💬      │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │          移除              │ │
└────────────────────────────────┘
```

---

## 底部区域层级结构

从下往上的堆叠顺序：

```
┌─────────────────────────────────────────┐
│              移除按钮                    │  ← 最底层，始终可见
├─────────────────────────────────────────┤
│  🖌️ │ 🧹 │ 💬                            │  ← 工具栏，始终可见
├─────────────────────────────────────────┤
│  Chat 输入框 (点击💬时显示/隐藏)         │  ← 条件显示
├─────────────────────────────────────────┤
│  Brush Size 滑块                        │  ← 选中 Brush/Eraser 时显示
└─────────────────────────────────────────┘
```

**交互逻辑**：
- 选中 Brush/Eraser → 显示 Brush Size 滑块
- 点击 Chat → 显示 Chat 输入框，隐藏 Brush Size 滑块
- 再次点击 Chat 或点击其他工具 → 隐藏 Chat 输入框
- 进入对比模式 → 隐藏底部所有工具栏和控件

---

## 工具栏设计

### 头部工具栏布局

```
┌───────┐                                    ┌───────────────────────────────┐
│  ✕    │                                    │ 🔧 │ ↩️ │ ↪️ │ ⊞ │ ⬇️          │
│ 退出   │                                    │Debug│Undo│Redo│对比│下载        │
└───────┘                                    └───────────────────────────────┘
    ↑                                                      ↑
  左侧固定                                              右侧工具组
                                                    (从右到左排列)
```

### 底部工具栏布局

```
┌──────┬──────┬──────┬──────────────┬─────────────┐
│  🖌️  │  🧹  │  💬  │              │    移除     │
│Brush │Eraser│ Chat │   (空白)     │   Button    │
└──────┴──────┴──────┴──────────────┴─────────────┘
   ↑                        ↑              ↑
 左侧绘制工具组          flex-grow       右侧固定
 (均分或固定宽度)        撑开间距         突出显示
```

**移动端**：移除按钮独立一行，工具图标均分宽度

### 工具状态

**头部工具栏**（从左到右）：

| 图标 | 工具 | 默认状态 | 激活状态 | 禁用状态 |
|------|------|----------|----------|----------|
| ✕ | 退出 | 灰色 | hover 高亮 | - |

**头部工具栏**（右侧，从左到右）：

| 图标 | 工具 | 默认状态 | 激活状态 | 禁用状态 |
|------|------|----------|----------|----------|
| 🔧 | Debug | 灰色 | 开启时高亮 | - |
| ↩️ | Undo | 灰色 | 可点击 | historyIndex <= 0 或 isProcessing |
| ↪️ | Redo | 灰色 | 可点击 | historyIndex >= history.length-1 或 isProcessing |
| ⊞ | 对比 | 灰色 | 对比模式时高亮 | history.length <= 1 或 isProcessing |
| ⬇️ | Download | 灰色 | hover 高亮 | - |

**底部工具栏**：

| 图标 | 工具 | 默认状态 | 激活状态 | 禁用状态 |
|------|------|----------|----------|----------|
| 🖌️ | Brush | 灰色 | 主色高亮+背景 | isProcessing 时禁用 |
| 🧹 | Eraser | 灰色 | 主色高亮+背景 | !hasMask 或 isProcessing 时禁用 |
| 💬 | Chat | 灰色 | 主色高亮+背景 | isProcessing 时禁用 |
| 🗑️ | 清除涂抹 | 灰色 | hover 高亮 | !hasMask 或 isProcessing 时禁用 |

### 移除按钮状态

```
无涂抹时 (!hasMask):
┌─────────────────────────────┐
│         移除               │  ← 灰色背景，disabled
└─────────────────────────────┘

有涂抹时 (hasMask && !isProcessing):
┌─────────────────────────────┐
│         移除               │  ← 主色背景 (#FF007A)，可点击
└─────────────────────────────┘

处理中 (isProcessing):
┌─────────────────────────────┐
│     ○ 处理中...            │  ← 主色背景，loading spinner，禁用点击
└─────────────────────────────┘
```

**禁用条件**：`!hasMask || isProcessing`

---

## 缩放控件

### 布局

```
┌─────────┐
│    +    │  ← 放大按钮
├─────────┤
│  100%   │  ← 当前缩放比例，点击重置为适应窗口
├─────────┤
│    -    │  ← 缩小按钮
└─────────┘
```

### 交互逻辑

| 操作 | 行为 |
|------|------|
| 点击 + | 放大 10% |
| 点击 - | 缩小 10% |
| 点击比例数字 | 在 "1:1 原始比例" 和 "适应窗口" 之间切换 |
| 鼠标滚轮 | 缩放画布 |
| 双指捏合 (移动端) | 缩放画布 |

**比例数字点击逻辑**：
- 当前接近 Fit → 切换到 100% (1:1 原始比例，查看像素细节)
- 当前接近 100% 或其他值 → 切换到 Fit (适应窗口)

### 缩放范围

- 最小：10% (0.1x)
- 最大：500% (5x)
- 适应窗口 (Fit)：根据图片和窗口大小自动计算
- 原始比例 (1:1)：100%，1 像素对应 1 屏幕像素

### 显示规则

- 正常模式：显示在右下角
- 对比模式：隐藏
- Debug 模式：显示在 Debug 预览下方

---

## 对比功能

### 交互方式

分屏滑动对比，用户可拖动中间分隔线查看原图与当前图的差异。

```
┌─────────────────────────────────────────────────┐
│                       │                         │
│                       │                         │
│      原始图片          │←───滑块───→ 当前图片     │
│   (首次上传的图片)      │        (最新编辑结果)    │
│                       │                         │
│                       │                         │
└─────────────────────────────────────────────────┘
```

### 状态管理

| 状态 | 值 |
|------|------|
| isCompareMode | boolean - 是否处于对比模式 |
| comparePosition | number - 分隔线位置 (0-100%) |

### 进入/退出对比模式

- **进入**：点击对比按钮 (⊞)
- **退出**：再次点击对比按钮

### 对比模式下的 UI 变化

| 元素 | 状态 |
|------|------|
| 对比按钮 | 高亮显示 |
| DrawingLayer (涂抹层) | **隐藏** (不显示红色遮罩) |
| 底部工具栏 | 隐藏 |
| Brush Size 滑块 | 隐藏 |
| Chat 输入框 | 隐藏 |
| 移除按钮 | 隐藏 |
| 缩放控件 | 隐藏 |
| Debug 预览 | 隐藏 |
| 头部其他按钮 | 保持可见 |

**DrawingLayer 隐藏说明**：
- 对比的核心目的是查看"修复效果 vs 原图"
- 红色涂抹遮罩会遮挡图片细节，干扰对比观察
- 退出对比模式后，恢复显示 DrawingLayer
- 如需确认标记区域，可使用 Debug 预览

### 禁用条件

- 当 `imageHistory.length <= 1` 时，对比按钮禁用（没有可对比的历史）

### 对比模式下的缩放/拖拽

| 操作 | 是否允许 | 说明 |
|------|----------|------|
| 缩放 | ✅ 允许 | 放大查看修复细节 |
| 拖拽平移 | ✅ 允许 | 移动到关注区域 |
| 滑块拖动 | ✅ 允许 | 调整分屏位置 |

**实现要点**：
- 进入对比模式时，重置为 Fit（适应窗口）
- 两张图（原图/当前图）共享同一个 `{ scale, x, y }` transform 状态
- 缩放/平移操作同步作用于两张图
- 这样用户放大某个区域时，两张图显示相同位置，便于对比

**MVP 备选方案**：如果时间紧张，可先禁用缩放/拖拽（强制 Fit），后续迭代加入。

---

## Debug 预览窗口

```
┌─────────────────┐
│                 │
│   原图 + 涂抹    │  ← 融合图预览
│   区域叠加       │    (将发送给后端的图片)
│                 │
│                 │
└─────────────────┘
  约 120×120px
  位于缩放控件上方
  仅在 Debug 模式开启时显示
```

**说明**：Debug 预览显示的是原图与涂抹区域（#FF007A 50%透明度）叠加后的融合图，即实际发送给后端的图片。

### 性能优化

涂抹过程中频繁生成预览图会导致卡顿，需要做性能优化：

| 平台 | 策略 | 说明 |
|------|------|------|
| Desktop | Throttle 100ms | 每 100ms 最多更新一次，保持实时感 |
| Mobile | Throttle 200ms | 移动端性能较弱，降低更新频率 |
| 备选方案 | 仅笔画结束时更新 | 最省性能，但失去实时预览 |

**推荐实现**：使用 Throttle 而非 Debounce
- Debounce：停止操作后才更新 → 涂抹过程中预览完全不动
- Throttle：固定频率更新 → 既有实时感，又不卡顿

---

## 画布设计 (react-konva)

### 图层结构

```
Stage (可缩放)
  ├── Layer (ImageLayer)
  │     └── Image (用户图片)
  └── Layer (DrawingLayer)
        └── Group
              └── Line[] (涂抹笔画，#FF007A 50% 透明度)
```

**重要**：必须将绘图层与底图层分离。原因：
- 橡皮擦使用 `compositeOperation: 'destination-out'`
- 如果 Image 和 Line 在同一 Layer，橡皮擦会擦除底图，导致图片变透明
- 分层后，橡皮擦只作用于 DrawingLayer，露出下方的 ImageLayer

### 缩放方案

- 使用 Konva 的 `stage.scale()` 配合鼠标滚轮/双指缩放
- 移动端：双指捏合缩放
- 保持图片居中，限制最小/最大缩放比例 (0.1x - 5x)

### 画笔参数

| 参数 | 值 |
|------|------|
| 颜色 | #FF007A |
| 透明度 | 50% (0.5) |
| 默认大小 | 20px |
| 大小范围 | 5px - 100px |
| lineCap | round |
| lineJoin | round |

### 触摸支持

**手势区分策略**：

| 手势 | 行为 | 实现要点 |
|------|------|----------|
| 单指触摸 | 绘制 | `touches.length === 1` 时启用绘制 |
| 双指触摸 | 缩放/平移 | `touches.length === 2` 时切换为缩放模式，中断绘制 |

**实现逻辑**：

```
onTouchStart:
  if (touches.length === 1) → 开始绘制
  if (touches.length === 2) → 进入缩放模式，取消当前笔画

onTouchMove:
  if (缩放模式 && touches.length === 2) → 计算缩放/平移
  if (绘制模式 && touches.length === 1) → 继续绘制

onTouchEnd:
  if (touches.length === 0) → 重置模式
```

**注意事项**：
- 双指触摸时必须立即中断绘制，避免留下意外笔画
- 从双指切换回单指时，不应自动开始绘制（需要重新 touchstart）
- 使用 `evt.evt.touches.length` 获取触摸点数量

---

## 组件架构

### 文件结构

```
src/components/image-editor/
├── ImageEditorDialog.tsx      # 全屏 Dialog 容器
├── EditorCanvas.tsx           # Konva 画布
├── EditorHeader.tsx           # 头部工具栏 (退出、Debug、Undo、Redo、对比、下载)
├── EditorToolbar.tsx          # 底部工具栏 (Brush、Eraser、Chat、清除涂抹)
├── BrushSizeSlider.tsx        # 画笔大小滑块
├── ChatPanel.tsx              # Chat 输入面板
├── DebugPreview.tsx           # Debug mask 预览
├── ZoomControls.tsx           # 缩放控件 (+/-/比例)
├── CompareView.tsx            # 分屏对比视图
├── RemoveButton.tsx           # 移除按钮
├── hooks/
│   ├── use-editor-state.ts    # 编辑器状态
│   ├── use-drawing.ts         # 涂抹逻辑
│   ├── use-image-history.ts   # 图片版本历史
│   └── use-zoom.ts            # 缩放逻辑
├── lib/
│   └── image-compositor.ts    # 将原图与涂抹区域合成融合图
└── types.ts
```

### 组件职责

| 组件 | 职责 |
|------|------|
| `ImageEditorDialog` | 全屏容器，管理打开/关闭状态，布局协调 |
| `EditorCanvas` | Konva Stage/Layer，图片渲染，涂抹绑定，缩放控制 |
| `EditorHeader` | 头部工具栏：退出、Debug、Undo、Redo、对比、下载 |
| `EditorToolbar` | 底部工具栏：Brush、Eraser、Chat |
| `BrushSizeSlider` | 滑块控件，调整画笔大小 |
| `ChatPanel` | 输入框 + 发送按钮 |
| `DebugPreview` | 实时渲染融合图缩略图 |
| `ZoomControls` | 缩放控件，+/-按钮和比例显示 |
| `CompareView` | 分屏对比视图，原图 vs 当前图 |
| `RemoveButton` | 移除按钮，状态管理 |

---

## 状态管理

### EditorState (use-editor-state hook)

```typescript
interface EditorState {
  // 编辑器状态
  isOpen: boolean
  originalImage: string | null      // 原始上传图片
  currentImage: string | null       // 当前显示图片

  // 工具状态
  activeTool: 'brush' | 'eraser' | 'chat'
  brushSize: number                 // 默认 20，范围 5-100

  // 涂抹状态
  lines: Line[]                     // 每条 line 包含 points 数组
  hasMask: boolean                  // 是否有涂抹（计算属性，见下方规则）

  // 历史状态（图片版本）
  imageHistory: string[]            // 图片版本数组
  historyIndex: number              // 当前版本索引

  // 缩放状态
  zoomLevel: number                 // 当前缩放比例 (0.1 - 5)
  fitZoomLevel: number              // 适应窗口的缩放比例
  lastZoomMode: 'fit' | '1:1'       // 上次重置时的模式，用于切换

  // 对比状态
  isCompareMode: boolean            // 是否处于对比模式
  comparePosition: number           // 分隔线位置 (0-100)

  // Debug
  debugMode: boolean

  // 加载状态
  isProcessing: boolean
}

interface Line {
  points: number[]                  // [x1, y1, x2, y2, ...]
  strokeWidth: number
  isEraser: boolean                 // true 时使用 destination-out
}
```

### Actions

```typescript
interface EditorActions {
  // 编辑器控制
  openEditor: (image: string) => void
  closeEditor: () => void

  // 工具切换
  setActiveTool: (tool: 'brush' | 'eraser' | 'chat') => void
  setBrushSize: (size: number) => void

  // 涂抹操作
  addLine: (line: Line) => void
  clearLines: () => void           // 清除所有涂抹，hasMask = false

  // 图片历史
  pushImageHistory: (image: string) => void
  undo: () => void                  // 同时清空 lines
  redo: () => void                  // 同时清空 lines

  // 缩放操作
  zoomIn: () => void                // 放大 10%
  zoomOut: () => void               // 缩小 10%
  toggleZoomReset: () => void       // 在 1:1 和 Fit 之间切换
  setZoomLevel: (level: number) => void

  // 对比操作
  toggleCompareMode: () => void
  setComparePosition: (position: number) => void

  // Debug
  toggleDebugMode: () => void

  // 处理状态
  setProcessing: (isProcessing: boolean) => void
}
```

### hasMask 计算规则

`hasMask` 是一个计算属性，用于控制移除按钮和橡皮擦的状态：

```typescript
// 计算规则：只要有非橡皮擦的线条，就认为有涂抹
hasMask = lines.some(line => !line.isEraser)
```

**边缘情况处理**：
| 场景 | hasMask | 说明 |
|------|---------|------|
| 画了一笔 | true | 正常情况 |
| 画一笔后用橡皮擦擦掉 | true | 技术上仍有画笔线条记录 |
| 用户点击"清除涂抹" | false | `lines = []` |
| Undo/Redo 后 | false | lines 被清空 |
| Inpaint/Chat 成功后 | false | lines 被清空 |

**注意**：如果用户画一笔后完全擦掉，`hasMask` 仍为 `true`。提交移除请求后，后端可能返回"无变化"的图片，这是可接受的行为。如需精确判断，可在提交前检查 DrawingLayer 是否有非透明像素（性能开销较大）。

### 清除涂抹功能

建议在工具栏或 Brush Size 滑块旁添加"清除涂抹"按钮：
- 功能：`lines = []`，`hasMask = false`
- 显示条件：`hasMask === true`
- 禁用条件：`isProcessing === true`

---

## API 设计

### 编辑模型：累积编辑

所有编辑操作（Inpaint、Chat）都基于 `currentImage`（即 `imageHistory[historyIndex]`），而非 `originalImage`。

```
originalImage → [Inpaint] → result1 → [Chat] → result2 → [Inpaint] → result3
                              ↑                   ↑                    ↑
                          currentImage         currentImage        currentImage
```

**为什么不能基于 originalImage**：
- 用户先用 Inpaint 移除了路人甲
- 再用 Chat 说"把天空变成日落色"
- 如果 Chat 基于 originalImage → 路人甲又回来了！

### Inpaint API (Mock)

```typescript
// POST /api/image-edit/inpaint
// 移除涂抹区域

interface InpaintRequest {
  image: string       // base64 融合图（currentImage + 涂抹区域叠加）
}

interface InpaintResponse {
  image: string       // base64 结果图
}

// Mock 实现：直接返回原图
```

### Chat Edit API (Mock)

```typescript
// POST /api/image-edit/chat
// 根据 prompt 编辑图片

interface ChatEditRequest {
  image: string       // base64 当前图片 (currentImage)
  prompt: string      // 用户输入的编辑指令
}

interface ChatEditResponse {
  image: string       // base64 结果图
}

// Mock 实现：直接返回原图
```

**重要**：Chat 必须基于 `currentImage` 而非 `originalImage`，与 Inpaint 保持一致的"累积编辑"模型。

---

## 异步处理与历史管理

### 请求状态处理

| 场景 | 处理 |
|------|------|
| 请求中 | `isProcessing = true`，禁用所有编辑操作 |
| 请求成功 | `pushImageHistory(result)`，清空 lines |
| 请求失败 | 不修改历史，保留 lines，显示错误提示 |
| 用户取消 | abort 请求，保持当前状态 |

### 处理中的禁用状态

当 `isProcessing === true` 时，禁用以下操作：

| 元素 | 状态 |
|------|------|
| Brush 工具 | 禁用 |
| Eraser 工具 | 禁用 |
| Chat 工具 | 禁用 |
| 移除按钮 | 显示 loading 状态 |
| Undo/Redo | 禁用 |
| 下载按钮 | 可用（下载当前图） |

**原因**：处理中如果允许继续涂抹，返回后涂抹状态难以处理（是保留还是清空？）。禁用更安全。

### 清空 lines 的时机

| 时机 | 是否清空 | 说明 |
|------|----------|------|
| Undo/Redo | ✅ 清空 | 底图变了，涂抹会错位 |
| Inpaint 成功 | ✅ 清空 | 涂抹已生效 |
| Chat 成功 | ✅ 清空 | 编辑已生效 |
| 请求失败 | ❌ 保留 | 用户可重试 |
| 用户取消 | ❌ 保留 | 用户可重试 |
| 用户点击"清除涂抹" | ✅ 清空 | 主动清除 |

### Redo 失效条件

采用标准的 Undo/Redo 模型：

```typescript
function pushImageHistory(newImage: string) {
  // 如果当前不在历史末尾，截断后续历史（redo 失效）
  if (historyIndex < imageHistory.length - 1) {
    imageHistory = imageHistory.slice(0, historyIndex + 1)
  }
  imageHistory.push(newImage)
  historyIndex = imageHistory.length - 1
  lines = []  // 清空涂抹
}
```

### 历史上限与内存管理

| 配置项 | 建议值 | 说明 |
|--------|--------|------|
| 最大历史数 | 10-20 | 每张图几 MB，20 张约几十 MB |
| 超限处理 | 丢弃最早版本 | FIFO 策略 |
| 可选优化 | IndexedDB 存储 | 减少内存占用 |

```typescript
const MAX_HISTORY = 15

function pushImageHistory(newImage: string) {
  // ... 截断逻辑 ...
  imageHistory.push(newImage)

  // 超限时丢弃最早版本
  if (imageHistory.length > MAX_HISTORY) {
    imageHistory.shift()
    historyIndex = Math.max(0, historyIndex - 1)
  }
}
```

**注意**：`originalImage` 始终保留，不受历史上限影响，用于对比功能。

---

## 依赖

### 新增依赖

```bash
pnpm add react-konva konva
```

### 现有可复用依赖

- `@radix-ui/react-dialog` - 弹窗基础
- `@radix-ui/react-slider` - 滑块控件
- `lucide-react` - 图标
- `react-dropzone` - 文件上传（已有）
- `zustand` - 状态管理（可选）

---

## 国际化

需要在 `messages/en.json` 和 `messages/zh.json` 中添加以下翻译：

```json
{
  "ImageEditor": {
    "title": "Edit Image",
    "tools": {
      "brush": "Brush",
      "eraser": "Eraser",
      "chat": "Chat",
      "undo": "Undo",
      "redo": "Redo",
      "download": "Download",
      "compare": "Compare",
      "debug": "Debug",
      "clearMask": "Clear"
    },
    "brushSize": "Brush Size",
    "remove": "Remove",
    "removing": "Removing...",
    "close": "Close",
    "chatPlaceholder": "Describe the changes you want...",
    "zoom": {
      "zoomIn": "Zoom In",
      "zoomOut": "Zoom Out",
      "resetZoom": "Fit to Window"
    },
    "compare": {
      "original": "Original",
      "current": "Current"
    }
  }
}
```

---

## 实现注意事项

1. **🛑 图层分离（关键）**：
   - 必须将 ImageLayer 和 DrawingLayer 分离为两个独立的 Layer
   - 橡皮擦使用 `compositeOperation: 'destination-out'`
   - 如果在同一 Layer，橡皮擦会擦除底图导致透明
   - 分层后橡皮擦只擦除 DrawingLayer，露出下方 ImageLayer

2. **Konva 与 Next.js SSR**：react-konva 不支持 SSR，需要动态导入或确保只在客户端渲染

3. **图片跨域**：如果图片来自外部源，需要处理 CORS 以便 canvas 导出

4. **性能优化**：
   - 大图片需要在上传时压缩
   - 涂抹 lines 过多时考虑合并到单个 canvas

5. **触摸手势区分**：
   - 单指 touchstart → 绘制模式
   - 双指 touchstart → 缩放模式，立即中断当前笔画
   - 双指切换回单指时不自动开始绘制
   - 使用 `evt.evt.touches.length` 判断触摸点数量

6. **融合图生成**：将原图与涂抹区域合成时，需要创建临时 canvas，保持涂抹的颜色和透明度

7. **分屏对比实现**：
   - 使用 CSS clip-path 或 canvas 裁剪实现分屏效果
   - 分隔线需要支持拖拽，监听 mouse/touch 事件
   - 对比模式下需要同步两张图片的缩放和位置

8. **缩放控件**：
   - 缩放时以画布中心为缩放原点
   - 点击比例数字在 1:1 和 Fit 之间切换
   - 适应窗口需要计算图片与可视区域的比例
   - 缩放比例显示需要实时更新

9. **Undo/Redo 与涂抹状态**：
   - Undo/Redo 切换图片版本时，必须清空当前 lines
   - 原因：涂抹是基于当前图片的标记，底图变了涂抹区域会错位或无意义
   - 用户心智模型：回退版本 = 重新开始标记

10. **对比模式与涂抹层**：
    - 进入对比模式时隐藏 DrawingLayer（红色涂抹）
    - 原因：对比目的是看修复效果，涂抹遮罩干扰观察
    - 退出对比模式后恢复显示

11. **Debug 预览性能**：
    - 使用 Throttle (非 Debounce) 控制更新频率
    - Desktop: 100ms，Mobile: 200ms
    - 避免每次 mousemove/touchmove 都生成 base64
