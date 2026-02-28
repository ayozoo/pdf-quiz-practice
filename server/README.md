# Exam Web — Server

后端 NestJS 应用，负责 PDF 解析、试卷存储和模板管理。

## 技术栈

- **NestJS 11**（应用框架）
- **TypeORM**（ORM）
- **SQLite**（文件型数据库，零配置）
- **pdf-parse**（PDF 文本提取）
- **Multer**（文件上传）

## 开发命令

```bash
npm install        # 安装依赖
npm run start      # 启动服务（http://localhost:3000）
npm run start:dev  # 开发模式（文件变更自动重启）
npm run build      # 编译 TypeScript
npm run lint       # ESLint 检查
npm run test       # 单元测试
```

## 模块结构

```
src/
├── main.ts              # 入口（监听 0.0.0.0:3000，启用 CORS）
├── app.module.ts        # 根模块
├── exam/                # 试卷模块
│   ├── exam.entity.ts   # Exam 实体
│   ├── question.entity.ts # Question 实体
│   ├── exam.service.ts  # 试卷 CRUD 逻辑
│   ├── exam.controller.ts # REST 接口
│   └── exam.module.ts
├── pdf/                 # PDF 解析模块
│   ├── pdf.service.ts   # 核心解析服务（读取模板正则 → 解析 PDF 文本）
│   ├── pdf.controller.ts # 上传接口
│   ├── pdf.types.ts     # 类型定义
│   └── pdf.module.ts
└── template/            # 解析模板模块
    ├── template.entity.ts # PdfTemplate 实体（含所有正则配置字段）
    ├── template.dto.ts    # DTO
    ├── template.service.ts # 模板 CRUD + 内置模板初始化
    ├── template.controller.ts # REST 接口
    └── template.module.ts
```

## 核心 API

### 试卷

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/exams` | 获取所有试卷列表 |
| GET | `/exams/:id` | 获取试卷详情（含所有题目） |
| DELETE | `/exams/:id` | 删除单个试卷 |
| DELETE | `/exams` | 清空所有试卷 |

### PDF 解析

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/pdf/upload` | 上传 PDF 文件（可选 `templateId` 参数指定解析模板） |

### 解析模板

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/templates` | 获取所有模板 |
| GET | `/templates/:id` | 获取单个模板 |
| POST | `/templates` | 新建模板 |
| PATCH | `/templates/:id` | 更新模板 |
| DELETE | `/templates/:id` | 删除模板（内置模板不可删） |

## 解析流程

1. 接收上传的 PDF 文件及可选的 `templateId`
2. 通过 `pdf-parse` 提取 PDF 纯文本
3. 从数据库加载指定模板（或默认内置模板）的正则配置
4. 按模板中的 `questionSplitPattern` 分割题目块
5. 对每个题目块依次提取：题号、题干、选项、正确答案、解析、讨论区评论
6. 将解析结果持久化到 SQLite 数据库
