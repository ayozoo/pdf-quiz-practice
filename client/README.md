# Exam Web — Client

前端 React 应用，提供刷题练习、题库管理和模板配置三大功能页面。

## 技术栈

- **React 19** + **TypeScript**
- **Vite 5**（开发服务器 + 构建）
- **React Router 7**（客户端路由）
- **Lucide React**（图标库）

## 开发命令

```bash
npm install     # 安装依赖
npm run dev     # 启动开发服务器（http://localhost:5173）
npm run build   # 生产构建
npm run lint    # ESLint 检查
npm run preview # 预览生产构建
```

## 页面结构

| 路由 | 页面组件 | 说明 |
|------|---------|------|
| `/` | `ExamPractice` | 刷题练习：选题 → 作答 → 查看解析 |
| `/manage` | `ExamManagement` | 题库管理：上传 PDF / 删除试卷 |
| `/templates` | `TemplateConfig` | 解析模板配置：正则规则可视化编辑 |

## 核心组件

- **Layout** — 全局侧边导航栏（刷题 / 管理 / 模板）
- **ExamListSidebar** — 试卷列表，显示做题进度
- **QuestionCard** — 单题卡片，支持单选/多选、提交、查看答案与解析
- **QuestionNavigator** — 题号导航面板，按颜色显示正确/错误/未做状态

## 状态管理

- 考试列表与当前试卷状态由 `App.tsx` 集中管理，通过 props 传递。
- 做题进度（当前题号、已选选项、提交状态）保存在浏览器 `localStorage`，以 `exam_progress_{examId}` 为 key。

## API 通信

前端通过 `fetch` 直接调用后端 REST API。API 地址自动推断：
- 环境变量 `VITE_API_BASE_URL`（优先）
- 否则使用 `${protocol}//${hostname}:3000`（支持局域网访问）

开发模式下 Vite 提供代理，将 `/exams` 和 `/pdf` 请求转发至后端。
