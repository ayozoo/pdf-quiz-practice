# PDF 解析模组化改造计划

> **当前状态：✅ 全部完成**
>
> 以下三个阶段均已实现并上线。

## ✅ 阶段一：后端重构（Strategy Pattern）

目标：将原先硬编码在 `PdfService` 中的 AWS 题库正则剥离，建立基于模板的解析架构。

- [x] **定义 `PdfTemplate` 实体** — 包含题目分割、题号提取、选项识别、答案提取、解析提取、讨论区解析、噪音行过滤等正则配置字段。
- [x] **重构 `PdfService`** — 不再硬编码正则；改为从数据库读取模板配置，动态构建正则进行解析。
- [x] **内置默认模板** — 服务启动时自动初始化 AWS SAA 内置模板（标记为 `isBuiltin`，不可删除）。
- [x] **解析时可指定模板** — `POST /pdf/upload` 支持可选 `templateId` 参数。

## ✅ 阶段二：通用模板引擎（Configurable Parser）

目标：用户通过 REST API 完成模板 CRUD，不同格式的题库用不同模板解析。

- [x] **模板 CRUD 接口** — `GET/POST/PATCH/DELETE /templates`，后端 `TemplateService` + `TemplateController` 完整实现。
- [x] **模板字段设计** — `questionSplitPattern`、`questionNumberPattern`、`optionPattern`、`correctAnswerLinePattern`、`correctAnswerExtractPattern`、`explanationPattern`、`hasDiscussion`、`discussionDatePattern`、`noiseLinePatterns`。
- [x] **DTO 校验** — `CreateTemplateDto` / `UpdateTemplateDto`。

## ✅ 阶段三：前端交互升级

目标：让用户在界面上选择、创建、编辑模板，并在上传时指定模板。

- [x] **上传界面改造** — `ExamManagement` 页面增加模板下拉选择器，上传时附带 `templateId`。
- [x] **模板配置页面** — `TemplateConfig` 页面（`/templates` 路由），支持：
  - 新建 / 编辑 / 复制 / 删除模板
  - 可视化正则字段编辑（每个字段有 label + description + placeholder 引导）
  - 内置模板保护（不可删除，标记 Shield 图标）
- [x] **全局导航** — `Layout` 侧边栏新增「模板」入口。

## 🔮 后续可能的改进方向

- 支持在模板配置页面上传示例 PDF 进行**实时预览**解析结果。
- 引入 AI 辅助，根据 PDF 样本自动**推荐正则模式**。
- 支持导入/导出模板 JSON 文件，方便用户之间共享。
- 用户账号体系 + 做题进度云端同步。
