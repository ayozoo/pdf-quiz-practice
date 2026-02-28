# UI 布局重构计划 v2

> **原则：仅调整布局和视觉呈现，不侵入任何业务逻辑和功能代码。**
>
> 技术栈：React 19 + React Router v7 + **Ant Design 5.x** + Vite + Lucide Icons

---

## 决策记录

| #   | 决策项     | 结论                                                                          |
| --- | ---------- | ----------------------------------------------------------------------------- |
| 1   | CSS 方案   | 引入 **Ant Design 5.x** 组件库，用 AntD 组件替代手写 CSS，主题通过 Token 覆盖 |
| 2   | 刷题页布局 | **保持二栏布局**，题号导航改为右侧浮层 (Drawer)，浮层内含进度统计             |
| 3   | 暗色模式   | 通过 AntD `ConfigProvider` + `theme.darkAlgorithm` 实现，用户可手动切换       |
| 4   | 自定义 CSS | 尽量不写，仅在 AntD 无法覆盖的局部用少量 inline style 或 CSS Module 补充      |

---

## 一、现状问题摘要

| 区域   | 核心问题                                                        |
| ------ | --------------------------------------------------------------- |
| 整体   | 1758 行 App.css 单文件；无全局提示系统；无骨架屏；无暗色模式    |
| 刷题页 | 试卷列表/题号导航共用侧栏导致上下文断裂；空状态简陋；进度感知弱 |
| 管理页 | 上传区无拖拽反馈；危险操作无防护；列表信息密度不足              |
| 模板页 | 超长表单；向导与手动新建体验割裂；预览区被淹没                  |

---

## 二、引入 Ant Design 5.x

### 2.1 安装依赖

```bash
cd client
npm install antd @ant-design/icons
```

### 2.2 主题配置

在 `App.tsx` 顶层包裹 `ConfigProvider`：

```tsx
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';

const lightTheme = {
  token: {
    colorPrimary: '#4f46e5', // 沿用现有 Indigo
    borderRadius: 8,
    fontFamily: 'Inter, -apple-system, ...',
  },
};

<ConfigProvider
  theme={darkMode ? { ...lightTheme, algorithm: theme.darkAlgorithm } : lightTheme}
  locale={zhCN}
>
  <AntdApp>{/* 路由等 */}</AntdApp>
</ConfigProvider>;
```

### 2.3 AntD 组件替代映射

| 现有手写                                    | AntD 替代                                                  | 好处                                  |
| ------------------------------------------- | ---------------------------------------------------------- | ------------------------------------- |
| `.btn-primary` / `.btn-nav` / `.btn-danger` | `<Button type="primary">` / `<Button>` / `<Button danger>` | 统一风格；自带 loading、disabled 状态 |
| `.error-alert`                              | `<Alert type="error">` 或 `message.error()`                | 自带图标、关闭按钮                    |
| "加载中…" 文字                              | `<Skeleton>` / `<Spin>`                                    | 骨架屏动画                            |
| `.card`                                     | `<Card>`                                                   | 自带阴影、标题栏、操作区              |
| `.file-label` (上传)                        | `<Upload.Dragger>`                                         | 内建拖拽悬停高亮、文件列表、进度条    |
| `.sidebar-item` (列表)                      | `<Menu>` / `<List>`                                        | 自带选中态、hover、键盘导航           |
| `.management-list`                          | `<Table>` 或 `<List>`                                      | 排序、筛选、分页开箱即用              |
| `.tpl-field-input`                          | `<Input>` / `<Input.TextArea>`                             | 统一表单风格                          |
| `.tpl-select`                               | `<Select>`                                                 | 搜索、多选、分组                      |
| confirm()                                   | `<Modal.confirm()>`                                        | 统一弹窗风格                          |
| 无                                          | `<Drawer>`                                                 | 题号导航浮层                          |
| 无                                          | `<Switch>`                                                 | 暗色模式切换                          |
| 无                                          | `<Progress>` / `<Statistic>`                               | 答题进度/正确率展示                   |
| 无                                          | `<Tabs>`                                                   | 模板页分区                            |
| 无                                          | `<Tooltip>`                                                | 导航栏收起时的提示                    |
| 无                                          | `message` / `notification`                                 | 全局 Toast 通知                       |

---

## 三、任务分解（按优先级排序）

### 🔴 P0 — 基础设施（必须先做）

#### Task 0.1：安装 AntD + 主题配置

- `npm install antd @ant-design/icons`
- 在 `App.tsx` 包裹 `ConfigProvider` + `AntdApp`
- 配置 `zhCN` 国际化 + 主色 Token
- 验证：AntD 按钮在页面上正常渲染
- **涉及文件**：`App.tsx`, `package.json`
- **预计**：15 min

#### Task 0.2：暗色模式开关

- 新增 `useDarkMode` hook（读写 `localStorage` + `prefers-color-scheme`）
- 在 Layout 导航底部放置 `<Switch>` 切换暗/亮
- `ConfigProvider` 根据 state 切换 `theme.darkAlgorithm`
- **涉及文件**：新建 `hooks/useDarkMode.ts`，修改 `App.tsx`、`Layout.tsx`
- **预计**：20 min

#### Task 0.3：全局消息通知迁移

- 将现有的 `setError(msg)` + 红色 div 替换为 `message.error(msg)` 或 `notification`
- 操作成功时增加 `message.success('上传成功')`
- **涉及文件**：`App.tsx`（handleUpload / handleDelete 等回调内）
- **预计**：15 min
- **功能影响**：无 — 仅将错误展示方式从内联 div 改为 AntD toast

---

### 🟡 P1 — 全局布局改版

#### Task 1.1：Layout 侧边导航改版

- 用 AntD `<Layout.Sider>` + `<Menu>` 替换手写 sidebar
- 支持折叠/展开（`collapsible`），折叠时仅图标 + Tooltip
- 底部固定区域放"暗色模式" Switch + 版本号
- 移动端（≤768px）：Sider 隐藏，改为顶部 hamburger 触发 `<Drawer>`
- **涉及文件**：`Layout.tsx`，删除 App.css 中 `.main-sidebar` / `.main-nav` 等相关样式
- **预计**：40 min

#### Task 1.2：PageHeader 统一

- 用 AntD `<Typography.Title>` + `<Typography.Text>` 替换各页面 `.page-header`
- 可复用组件 `<PageHeader icon title subtitle actions />`
- **涉及文件**：新建 `components/PageHeader.tsx`，修改 `ExamManagement.tsx`、`TemplateConfig.tsx`
- **预计**：20 min

---

### 🟢 P2 — 刷题页重构（核心体验）

#### Task 2.1：二栏布局 + 题号浮层

**桌面端布局**：

```
┌────────┬──────────────────────────────────────┐
│ Sider  │                                      │
│ (导航) │   [试卷名] [切换试卷▾] [题号导航📋]    │
│        │                                      │
│        │   Question #42  (单选)    12/50      │
│        │   题目正文 ...                        │
│        │                                      │
│        │   A. ○ 选项一                         │
│        │   B. ○ 选项二                         │
│        │   C. ○ 选项三                         │
│        │   D. ○ 选项四                         │
│        │                                      │
│        │   [← 上一题]  12/50  [下一题 →]       │
│        │   [提交] [答案] [解析] [复制]          │
│        │                                      │
└────────┴──────────────────────────────────────┘
```

**题号导航浮层**（点击 📋 按钮弹出 Drawer）：

```
┌────────────────────┐
│  题号导航    [关闭]  │
│ ──────────────────  │
│ ┌─┬─┬─┬─┬─┬─┬─┬─┐ │
│ │1│2│3│4│5│6│7│8│ │
│ │9│…│…│…│…│…│…│50│ │
│ └─┴─┴─┴─┴─┴─┴─┴─┘ │
│                     │
│ ── 答题统计 ──       │
│ 已做: 12 / 50       │
│ 正确: 10            │
│ 错误: 2             │
│ 正确率: 83.3%       │
│ ━━━━━━━━━━ 24%     │  ← Progress bar
│                     │
│ ● 当前  ● 正确      │
│ ● 错误  ○ 未做      │
└────────────────────┘
```

**试卷选择器**：

- 用 AntD `<Modal>` 弹出试卷列表（替代原来左侧栏的 ExamListSidebar）
- Modal 内复用 `<ExamListSidebar>` 的列表渲染逻辑
- **删除**原来的 sidebar 拖拽 resize 功能 + 固定左侧栏占位

**改动要点**：

- `ExamPractice.tsx`：移除 `sidebarWidth` / `isResizing` / resizer 等侧边栏管理代码（这些是布局代码不是业务逻辑）
- `QuestionNavigator` 放入 `<Drawer placement="right">`
- `ExamListSidebar` 放入 `<Modal>`
- 新增统计卡片组件用 `<Statistic>` + `<Progress>`
- 主内容区占满宽度，`max-width: 800px` 居中

**涉及文件**：`ExamPractice.tsx`、`QuestionNavigator.tsx`、新建 `components/ExamSelectModal.tsx`、`components/PracticeStats.tsx`
**预计**：60 min

#### Task 2.2：题目卡片视觉升级

- 用 AntD `<Card>` 包裹题目
- 选项列表用 AntD `<Radio.Group>` (单选) / `<Checkbox.Group>` (多选) 替换手写 `.option-item`
- 操作栏按钮用 AntD `<Button>` + `<Space>`，拆上下两行
- 解析区用 `<Card>` + `<Collapse>` 折叠面板
- 讨论区用 `<Collapse>` + `<List>` 式布局
- **涉及文件**：`QuestionCard.tsx`
- **预计**：45 min

#### Task 2.3：空状态与加载态

- 未选试卷时：AntD `<Empty>` 组件 + CTA 按钮 "选择试卷"
- 加载中：AntD `<Skeleton>` 骨架屏（模拟题目卡片形状）
- **涉及文件**：`ExamPractice.tsx`
- **预计**：15 min

#### Task 2.4：键盘快捷键

- `←` / `→`：上一题 / 下一题
- `1-6`：快速选择 A-F
- `Enter`：提交
- `Space`：显示/隐藏答案
- 纯 `useEffect` + `keydown` 监听，**不改变任何回调逻辑**
- **涉及文件**：`ExamPractice.tsx` 或新建 `hooks/useKeyboardShortcuts.ts`
- **预计**：15 min

---

### 🔵 P3 — 管理页优化

#### Task 3.1：上传区改造

- 用 AntD `<Upload.Dragger>` 替换手写上传区
- 自带拖拽悬停高亮 + 文件列表 + 移除按钮
- 模板选择器用 AntD `<Select>` 替换 `<select>`
- **涉及文件**：`ExamManagement.tsx`
- **预计**：25 min

#### Task 3.2：试卷列表升级

- 用 AntD `<Table>` 替换 `.management-list`
- 列：标题 | 题数 | 创建日期 | 操作
- 操作列：删除按钮
- "清空全部"移入表头右侧 `<Dropdown>` 菜单（更安全）
- 删除全部 / 单条删除均用 `Modal.confirm()` 二次确认
- **涉及文件**：`ExamManagement.tsx`
- **预计**：25 min

#### Task 3.3：整体布局

- 页面用 AntD `<Card>` 分区
- 错误提示迁移到 `message.error()`（Task 0.3 已覆盖）
- **预计**：10 min

---

### 🟣 P4 — 模板配置页优化

#### Task 4.1：页面分区 (Tabs)

- 用 AntD `<Tabs>` 将页面拆为三个 tab：
  - **模版列表**：展示所有模版的可折叠列表（现有功能）
  - **新建模版**："从样本创建" 和 "手动新建" 两个子 tab 或 `<Segmented>` 切换
  - **解析预览**：独立 tab，提升可见性
- **涉及文件**：`TemplateConfig.tsx`
- **预计**：30 min

#### Task 4.2：表单体验升级

- 所有输入框用 AntD `<Form>` + `<Form.Item>` + 校验规则
- 正则输入用 `<Input>` + `<Typography.Text type="secondary">` 描述
- 开关字段用 `<Switch>`
- 表单分组用 `<Collapse>` 折叠：
  - 基础信息（名称、描述）— 始终展开
  - 核心解析规则 — 默认展开
  - 高级选项（讨论区、噪音过滤）— 默认折叠
- **涉及文件**：`TemplateConfig.tsx`
- **预计**：30 min

#### Task 4.3：模版列表交互

- 列表项用 AntD `<List>` 或 `<Collapse>` 面板
- 操作按钮用 AntD `<Button>` + `<Popconfirm>` 删除确认
- AI 配置区用 `<Collapse>` 折叠
- **涉及文件**：`TemplateConfig.tsx`
- **预计**：20 min

---

### ⚪ P5 — 清理 & 响应式

#### Task 5.1：清除旧 CSS

- 删除 `App.css` 中已被 AntD 替代的样式（预计删除 80%+）
- 剩余少量布局样式提取到对应组件旁的 `.module.css` 或 inline
- 删除 `index.css` 中与 AntD 冲突的全局 reset
- **涉及文件**：`App.css`、`index.css`
- **预计**：30 min

#### Task 5.2：移动端适配

- AntD 组件自身已有一定响应式能力
- Sider 在移动端自动收起 + Drawer 触发
- Drawer 题号导航在移动端为全屏
- 操作按钮在移动端 `<Space direction="vertical" style={{width:'100%'}}>` 堆叠
- **涉及文件**：`Layout.tsx`、`ExamPractice.tsx`
- **预计**：25 min

#### Task 5.3：微交互与动效

- 路由切换：`<motion.div>`（可选引入 framer-motion）或 AntD 内置 transition
- 按钮 hover 微缩放（AntD 自带）
- 列表项增删动画（AntD `<List>` 自带）
- **预计**：20 min

---

## 四、实施路线图总览

```
Day 1:  P0 全部（Task 0.1 → 0.2 → 0.3）          ≈ 50 min
        P1 全部（Task 1.1 → 1.2）                  ≈ 60 min

Day 2:  P2 核心（Task 2.1 → 2.2 → 2.3）           ≈ 120 min
        P2 增强（Task 2.4）                         ≈ 15 min

Day 3:  P3 全部（Task 3.1 → 3.2 → 3.3）           ≈ 60 min
        P4 部分（Task 4.1）                         ≈ 30 min

Day 4:  P4 剩余（Task 4.2 → 4.3）                  ≈ 50 min
        P5 全部（Task 5.1 → 5.2 → 5.3）           ≈ 75 min
```

**总计预估：约 7-8 小时**

---

## 五、各 Task 功能影响评估

| Task            | 功能侵入风险 | 说明                                   |
| --------------- | ------------ | -------------------------------------- |
| 0.1 安装 + 主题 | ✅ 零        | 只加了外层 Provider                    |
| 0.2 暗色模式    | ✅ 零        | 新增 hook + switch                     |
| 0.3 全局消息    | ✅ 极低      | 仅替换错误展示方式，不改逻辑           |
| 1.1 导航改版    | ✅ 零        | Layout 是纯 UI 壳                      |
| 1.2 PageHeader  | ✅ 零        | 纯展示组件                             |
| 2.1 二栏+浮层   | ⚠️ 低        | 删除 resize 代码（布局代码），回调不变 |
| 2.2 题卡升级    | ⚠️ 低        | 用 AntD 组件渲染，props/回调不变       |
| 2.3 空状态      | ✅ 零        | 替换 JSX 展示                          |
| 2.4 键盘快捷键  | ✅ 零        | 仅增加事件监听                         |
| 3.x 管理页      | ✅ 极低      | 用 AntD 组件渲染，回调不变             |
| 4.x 模板页      | ⚠️ 低        | 结构调整为 Tabs，逻辑不变              |
| 5.1 清除旧 CSS  | ✅ 零        | 删样式文件                             |
| 5.2 移动端      | ✅ 低        | 仅改 CSS/布局                          |
| 5.3 动效        | ✅ 零        | 额外增强                               |

---

## 六、文件变更预览

### 新增文件

```
src/
  hooks/
    useDarkMode.ts              ← 暗色模式 hook
    useKeyboardShortcuts.ts     ← 刷题快捷键
  components/
    PageHeader.tsx              ← 统一页面标题
    ExamSelectModal.tsx         ← 试卷选择弹窗
    PracticeStats.tsx           ← 答题统计卡片
```

### 大幅修改文件

```
App.tsx                         ← 包裹 ConfigProvider + AntdApp
Layout.tsx                      ← AntD Layout.Sider + Menu
ExamPractice.tsx                ← 二栏布局 + Drawer/Modal
QuestionCard.tsx                ← AntD Card/Radio/Checkbox
ExamManagement.tsx              ← AntD Upload.Dragger + Table
TemplateConfig.tsx              ← AntD Tabs + Form + Collapse
```

### 删除/大幅缩减

```
App.css                         ← 从 1758 行缩减至 <100 行（仅保留少量自定义）
```

---

## 七、回归测试清单

每个 Phase 完成后检查：

- [ ] 上传 PDF → 解析成功 → 出现在列表中
- [ ] 选择试卷 → 题目正确加载 → 翻页正常
- [ ] 选择选项 → 提交 → 正确/错误判定正确
- [ ] 显示答案 / 显示解析 / 讨论区正常展开
- [ ] 答题进度 localStorage 持久化 → 刷新后恢复
- [ ] 模板 CRUD（创建/编辑/复制/删除）正常
- [ ] 从样本创建模板 / AI 生成正常
- [ ] 解析预览正常
- [ ] 暗色模式切换不影响功能
- [ ] 移动端布局正常、底部导航可用
- [ ] 404 路由重定向到首页
