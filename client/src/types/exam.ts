export type AnswerOptionLabel = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface AnswerOption {
  label: AnswerOptionLabel;
  text: string;
}

export interface DiscussionComment {
  user: string;
  date: string;
  content: string;
  voteCount?: number;
  selectedAnswer?: string;
  isHighlyVoted?: boolean;
  isMostRecent?: boolean;
}

export interface ParsedQuestion {
  number: number | null;
  text: string;
  options: AnswerOption[];
  correctAnswers: AnswerOptionLabel[];
  explanation?: string;
  discussion?: string;
  comments?: DiscussionComment[];
}

export interface ParsedExam {
  id: number;
  title: string;
  questions: ParsedQuestion[];
}

export interface ExamSummary {
  id: number;
  title: string;
  questionCount: number;
  createdAt: string;
}

// ---- PDF 模版相关类型 ----
export interface PdfTemplateConfig {
  id: number;
  name: string;
  description?: string;
  isBuiltin: boolean;
  questionSplitPattern: string;
  questionNumberPattern: string;
  optionPattern: string;
  correctAnswerLinePattern: string;
  correctAnswerExtractPattern: string;
  explanationPattern?: string;
  hasDiscussion: boolean;
  discussionDatePattern?: string;
  noiseLinePatterns?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateTemplatePayload = Omit<PdfTemplateConfig, 'id' | 'isBuiltin' | 'createdAt' | 'updatedAt'>;
export type UpdateTemplatePayload = Partial<CreateTemplatePayload>;

/** 样本分析/AI 生成返回的建议正则 */
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
  hints?: Record<string, string>;
}
