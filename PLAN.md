# PDF 解析模组化改造计划

当前系统的 PDF 解析逻辑是硬编码在 `PdfService` 中的，专门针对 AWS 题库格式。为了支持更多类型的题库（如考公、考研或其他认证），我们需要将解析逻辑模块化，并允许用户通过“模板”来定义解析规则。

## 📅 阶段一：后端重构 (Strategy Pattern)

目标：将现有的硬编码逻辑剥离，建立插件化的解析架构。

1.  **定义解析器接口 (`IPdfParser`)**
    -   所有解析器必须实现统一的 `parse(text: string): ParsedExam` 方法。

2.  **提取现有逻辑**
    -   创建 `AwsSaaParser` 类，将目前 `PdfService` 中的核心正则逻辑移动到这里。
    -   `PdfService` 转变为“协调者”，负责接收文件 -> 提取文本 -> 调用指定的 Parser。

3.  **建立解析器注册表 (`ParserRegistry`)**
    -   使用 Map 管理所有可用的解析器。
    -   Key: 模板 ID (e.g., `aws-saa`, `generic-numbered`)
    -   Value: 解析器实例

## 📅 阶段二：通用模板引擎 (Configurable Parser)

目标：实现一个“万能解析器”，它不包含硬编码正则，而是读取用户提供的 JSON 配置来工作。

1.  **设计模板配置结构 (`ParserConfig`)**
    ```typescript
    interface ParserConfig {
      name: string;
      // 题块分割规则
      blockSplitter: RegExp | string; 
      // 题目元数据提取
      questionNumberRegex: RegExp;
      questionTextRegex: RegExp;
      // 选项提取
      optionRegex: RegExp; // e.g., /^([A-F])[).:]\s+/
      // 答案与解析
      correctAnswerRegex: RegExp;
      explanationRegex: RegExp;
    }
    ```

2.  **实现 `ConfigurableParser`**
    -   该类在实例化时接收一个 `ParserConfig` 对象。
    -   使用配置中的正则动态进行匹配和提取。

3.  **预置常用模板**
    -   **AWS 模式**: 现有的逻辑。
    -   **通用数字模式**: 匹配 `1. 题目内容... A. 选项...` 这种最常见的格式。
    -   **中文考试模式**: 匹配 `一、选择题... 1. ...`。

## 📅 阶段三：前端交互升级

目标：让用户在上传文件时可以选择或上传解析模板。

1.  **改造上传界面**
    -   在文件选择框旁边增加“解析模板”下拉菜单。
    -   选项：`AWS SAA (默认)`, `通用格式`, `自定义...`。

2.  **支持自定义模板**
    -   允许高级用户直接粘贴 JSON 配置，或者上传 `.json` 格式的规则文件。
    -   后端接收 PDF + JSON，即时生成一个临时的 `ConfigurableParser` 来处理该文件。

## 🚀 预期效果

完成改造后，系统将不再局限于 AWS 题库。用户可以：
-   上传 **驾照考试** 题库（配合“通用数字模式”）。
-   上传 **公司内部培训** 题库（配合自定义 JSON）。
-   后端代码变得干净，易于维护和扩展。
