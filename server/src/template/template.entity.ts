import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'pdf_templates' })
export class PdfTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /** 是否为内置模版（不可删除） */
  @Column({ default: false })
  isBuiltin: boolean;

  // ---- 解析配置字段 ----

  /** 题目块分割正则（用于从全文中切割出每道题的文本块） */
  @Column({ type: 'text' })
  questionSplitPattern: string;

  /** 题号提取正则（从题目块第一行提取题号，捕获组1=题号数字） */
  @Column({ type: 'text' })
  questionNumberPattern: string;

  /** 选项识别正则（识别选项行，如 "A. xxx"，捕获组1=选项标签） */
  @Column({ type: 'text' })
  optionPattern: string;

  /** 正确答案行检测正则（用于定位正确答案所在行） */
  @Column({ type: 'text' })
  correctAnswerLinePattern: string;

  /** 正确答案提取正则（从答案行提取选项字母，捕获组1=答案字母串） */
  @Column({ type: 'text' })
  correctAnswerExtractPattern: string;

  /** 解析/解释提取正则（捕获组1=解释文本，可选） */
  @Column({ type: 'text', nullable: true })
  explanationPattern?: string;

  /** 是否解析讨论区 */
  @Column({ default: false })
  hasDiscussion: boolean;

  /** 讨论区日期锚点正则（可选，用于分割评论） */
  @Column({ type: 'text', nullable: true })
  discussionDatePattern?: string;

  /** 噪音行过滤正则（JSON 数组，预处理时匹配到的行会被移除，如页眉页脚广告等） */
  @Column({ type: 'text', nullable: true })
  noiseLinePatterns?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
