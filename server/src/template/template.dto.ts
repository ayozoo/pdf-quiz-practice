export class CreateTemplateDto {
  name: string;
  description?: string;
  questionSplitPattern: string;
  questionNumberPattern: string;
  optionPattern: string;
  correctAnswerLinePattern: string;
  correctAnswerExtractPattern: string;
  explanationPattern?: string; // 可选
  hasDiscussion?: boolean;
  discussionDatePattern?: string;
  noiseLinePatterns?: string;
}

export class UpdateTemplateDto {
  name?: string;
  description?: string;
  questionSplitPattern?: string;
  questionNumberPattern?: string;
  optionPattern?: string;
  correctAnswerLinePattern?: string;
  correctAnswerExtractPattern?: string;
  explanationPattern?: string;
  hasDiscussion?: boolean;
  discussionDatePattern?: string;
  noiseLinePatterns?: string;
}

/** 样本文本分析请求 */
export class AnalyzeSampleDto {
  sampleText: string;
}

/** AI 生成请求 */
export class AiGenerateDto {
  sampleText: string;
  apiEndpoint: string;
  apiKey: string;
  model: string;
}

/** AI 连通性测试请求 */
export class AiTestConnectionDto {
  apiEndpoint: string;
  apiKey: string;
  model: string;
}

/** 分析/AI 返回的建议正则 */
export interface SuggestedPatterns {
  questionSplitPattern?: string;
  questionNumberPattern?: string;
  optionPattern?: string;
  correctAnswerLinePattern?: string;
  correctAnswerExtractPattern?: string;
  explanationPattern?: string;
  hasDiscussion?: boolean;
  discussionDatePattern?: string;
  noiseLinePatterns?: string;
  /** 各字段的置信度或说明 */
  hints?: Record<string, string>;
}
