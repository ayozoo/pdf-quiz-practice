import { Injectable, BadRequestException } from '@nestjs/common';
import pdfParseModule from 'pdf-parse';
import {
  AnswerOption,
  AnswerOptionLabel,
  DiscussionComment,
  ParsedExam,
  ParsedQuestion,
} from './pdf.types';
import { TemplateService } from '../template/template.service';
import { PdfTemplate } from '../template/template.entity';

type UploadedFile = {
  buffer: Buffer;
  originalname: string;
};

function isUploadedFile(value: unknown): value is UploadedFile {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as {
    buffer?: unknown;
    originalname?: unknown;
  };
  return (
    candidate.buffer instanceof Buffer &&
    typeof candidate.originalname === 'string'
  );
}

@Injectable()
export class PdfService {
  constructor(private readonly templateService: TemplateService) {}

  /**
   * 解析 PDF 文件。
   * @param file       上传的文件对象
   * @param templateId 可选，指定模版 ID；不传则使用内置默认模版
   */
  async parsePdf(file: unknown, templateId?: number): Promise<ParsedExam> {
    if (!isUploadedFile(file)) {
      throw new BadRequestException('文件为空');
    }

    const template = templateId
      ? await this.templateService.findOne(templateId)
      : await this.templateService.findDefault();

    type PdfParseResult = { text?: string };
    type PdfParseFn = (data: Buffer) => Promise<PdfParseResult>;

    const pdfParse = pdfParseModule as unknown as PdfParseFn;
    const data = await pdfParse(file.buffer);
    const text = data.text || '';

    if (!text.trim()) {
      throw new BadRequestException('未能从 PDF 中提取到文字内容');
    }

    return this.parseExamText(text, file.originalname, template);
  }

  /**
   * 预览解析结果（不入库），用于模版调试。
   */
  async previewParse(file: unknown, templateId?: number): Promise<ParsedExam> {
    return this.parsePdf(file, templateId);
  }

  private parseExamText(
    rawText: string,
    filename: string,
    template: PdfTemplate,
  ): ParsedExam {
    const normalized = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map((line) => this.cleanLine(line))
      .filter((line) => line.length > 0)
      .join('\n');

    // 使用模版的 questionSplitPattern
    const questionHeaderRegex = new RegExp(template.questionSplitPattern, 'gi');
    const matches = Array.from(normalized.matchAll(questionHeaderRegex));

    const blocks: string[] = [];

    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i += 1) {
        const start = matches[i].index ?? 0;
        const end =
          i + 1 < matches.length
            ? (matches[i + 1].index ?? normalized.length)
            : normalized.length;
        const block = normalized.slice(start, end).trim();
        if (block.length > 0) {
          blocks.push(block);
        }
      }
    } else {
      const fallbackBlocks = normalized
        .split(/\n{2,}/)
        .map((b) => b.trim())
        .filter((b) => b.length > 0);
      blocks.push(...fallbackBlocks);
    }

    const questions: ParsedQuestion[] = [];

    for (const block of blocks) {
      const parsed = this.tryParseQuestionBlock(block, template);
      if (parsed) {
        questions.push(parsed);
      }
    }

    const title = filename.replace(/\.[^.]+$/, '');

    return {
      title,
      questions,
    };
  }

  private tryParseQuestionBlock(
    block: string,
    template: PdfTemplate,
  ): ParsedQuestion | null {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      return null;
    }

    // 使用模版的 correctAnswerLinePattern 定位正确答案行
    const correctLineRegex = new RegExp(template.correctAnswerLinePattern, 'i');
    const correctLineIndex = lines.findIndex((line) =>
      correctLineRegex.test(line),
    );

    const qaLines =
      correctLineIndex === -1 ? lines : lines.slice(0, correctLineIndex);

    if (qaLines.length === 0) {
      return null;
    }

    const discussionLines =
      correctLineIndex === -1 ? [] : lines.slice(correctLineIndex + 1);

    const firstLine = qaLines[0];

    // 使用模版的 questionNumberPattern 提取题号
    const questionNumberRegex = new RegExp(template.questionNumberPattern, 'i');
    const questionHeaderMatch = firstLine.match(questionNumberRegex);
    const numberedLineMatch = firstLine.match(/^(\d+)[).:\s]+(.*)$/);

    const number = questionHeaderMatch
      ? parseInt(questionHeaderMatch[1], 10)
      : numberedLineMatch
        ? parseInt(numberedLineMatch[1], 10)
        : null;

    // 使用模版的 optionPattern 识别选项行
    const optionRegex = new RegExp(template.optionPattern);
    const optionLines: { index: number; label: AnswerOptionLabel }[] = [];

    for (let i = 0; i < qaLines.length; i += 1) {
      const line = qaLines[i];
      const optionMatch = line.match(optionRegex);
      if (optionMatch) {
        const label = optionMatch[1] as AnswerOptionLabel;
        optionLines.push({ index: i, label });
      }
    }

    if (optionLines.length === 0) {
      return null;
    }

    const firstOptionIndex = optionLines[0].index;

    let questionTextLines: string[] = [];

    if (questionHeaderMatch) {
      const rest = questionHeaderMatch[2] ? questionHeaderMatch[2].trim() : '';
      if (rest.length > 0) {
        questionTextLines.push(rest);
      }
      if (firstOptionIndex > 1) {
        questionTextLines = questionTextLines.concat(
          qaLines.slice(1, firstOptionIndex),
        );
      }
    } else if (numberedLineMatch) {
      const rest = numberedLineMatch[2] ? numberedLineMatch[2].trim() : '';
      if (rest.length > 0) {
        questionTextLines.push(rest);
      }
      if (firstOptionIndex > 1) {
        questionTextLines = questionTextLines.concat(
          qaLines.slice(1, firstOptionIndex),
        );
      }
    } else {
      questionTextLines = qaLines.slice(0, firstOptionIndex);
    }
    const questionText = questionTextLines.join(' ');

    const options: AnswerOption[] = [];
    for (let i = 0; i < optionLines.length; i += 1) {
      const current = optionLines[i];
      const next = optionLines[i + 1];
      const start = current.index;
      const end = next ? next.index : qaLines.length;

      const optionTextLines = qaLines.slice(start, end);
      const firstOptionLine = optionTextLines[0];
      const labelPrefixMatch = firstOptionLine.match(optionRegex);
      const firstTextPart = labelPrefixMatch
        ? firstOptionLine.slice(labelPrefixMatch[0].length).trim()
        : firstOptionLine;

      const rest = optionTextLines.slice(1).join(' ');
      const text = [firstTextPart, rest].filter((t) => t.length > 0).join(' ');

      options.push({
        label: current.label,
        text,
      });
    }

    const correctAnswers = this.extractCorrectAnswers(lines, template);
    const explanation = this.extractExplanation(lines, template);

    let discussion: string | undefined;
    let comments: DiscussionComment[] | undefined;

    if (template.hasDiscussion && discussionLines.length > 0) {
      discussion =
        this.cleanDiscussion(discussionLines.join('\n').trim()) || undefined;
      if (discussion && template.discussionDatePattern) {
        comments = this.parseDiscussionComments(
          discussion,
          template.discussionDatePattern,
        );
      }
    }

    return {
      number,
      text: questionText,
      options,
      correctAnswers,
      explanation,
      discussion,
      comments,
    };
  }

  private extractCorrectAnswers(
    lines: string[],
    template: PdfTemplate,
  ): AnswerOptionLabel[] {
    const joined = lines.join(' ');

    // 使用模版的 correctAnswerExtractPattern
    const primaryRegex = new RegExp(template.correctAnswerExtractPattern, 'i');
    const fallbackRegex = /Answer[s]?\s*[:-]\s*([A-F,\s]+)/i;

    const match = joined.match(primaryRegex) || joined.match(fallbackRegex);

    if (!match) {
      return [];
    }

    const raw = match[1];
    // 移除所有非 A-F 的字符（逗号、空格），然后拆分成数组
    // "A, C" -> "AC" -> ['A', 'C']
    // "AC" -> "AC" -> ['A', 'C']
    const cleaned = raw.replace(/[^A-F]/gi, '').toUpperCase();

    return cleaned.split('') as AnswerOptionLabel[];
  }

  private extractExplanation(
    lines: string[],
    template: PdfTemplate,
  ): string | undefined {
    const joined = lines.join('\n');

    // 使用模版的 explanationPattern
    const primaryRegex = new RegExp(template.explanationPattern, 'is');
    const fallbackRegex = /解析\s*[:-](.*)$/is;

    const explanationMatch =
      joined.match(primaryRegex) || joined.match(fallbackRegex);

    if (!explanationMatch) {
      return undefined;
    }

    const raw = explanationMatch[1]
      .split('\n')
      .map((line) => this.cleanLine(line))
      .filter((line) => line.length > 0);

    if (raw.length === 0) {
      return undefined;
    }

    return raw.join(' ');
  }

  private cleanLine(line: string): string {
    const trimmed = line.trim();

    if (!trimmed) {
      return '';
    }

    // 移除 URL
    const withoutUrls = trimmed.replace(/https?:\/\/\S+/g, '');

    return withoutUrls.trim();
  }

  private cleanDiscussion(text: string): string {
    // 替换 PDF 解析出来的 FontAwesome 私有区图标
    // \uf147 () -> 空
    // \uf007 () -> 👤 (用户图标)
    return text
      .replace(/\uf147/g, '')
      .replace(/\uf007/g, '👤 ')
      .replace(/\uf086/g, '💬 ') // 也是常见的气泡图标
      .replace(/\uf0a3/g, '• ') // 可能是列表点
      .replace(/\uf164/g, '') //  (thumbs-up)，直接移除，因为我们会用 upvoted 文本
      .trim();
  }

  private parseDiscussionComments(
    discussionText: string,
    datePatternStr: string,
  ): DiscussionComment[] {
    const comments: DiscussionComment[] = [];
    const lines = discussionText.split('\n').map((l) => l.trim());

    // 使用模版的 discussionDatePattern
    const looseDateRegex = new RegExp(datePatternStr, 'i');

    let contentBuffer: string[] = [];
    let currentComment: Partial<DiscussionComment> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const dateMatch = line.match(looseDateRegex);

      if (dateMatch) {
        // 命中日期！
        const dateStr = dateMatch[0]; // 捕获到的时间字符串

        // 找到时间字符串在行内的位置
        const index = line.indexOf(dateStr);

        // 这一行剩下的部分（前缀）
        // 注意：如果时间后面还有文字（比如 "ago and then..."），我们暂时忽略，假设时间就是分隔符
        const prefix = line.substring(0, index).trim();

        let user = 'Anonymous';
        let isHighlyVoted = false;
        let isMostRecent = false;

        // 如果 prefix 不为空，说明 User/Badge 可能就在这一行
        if (prefix.length > 0) {
          // 检查 prefix 是否包含 Badge
          if (prefix.includes('Highly Voted')) {
            isHighlyVoted = true;
            user = prefix.replace('Highly Voted', '').trim();
          } else if (prefix.includes('Most Recent')) {
            isMostRecent = true;
            user = prefix.replace('Most Recent', '').trim();
          } else {
            // 没有 Badge，整个 prefix 就是 User
            user = prefix;
          }
        } else {
          // prefix 为空，说明 User/Badge 在之前的行里 (buffer)
          // 回溯 buffer
          if (contentBuffer.length > 0) {
            const lastLine = contentBuffer[contentBuffer.length - 1];

            if (
              lastLine.includes('Highly Voted') ||
              lastLine.includes('Most Recent')
            ) {
              if (lastLine.includes('Highly Voted')) isHighlyVoted = true;
              if (lastLine.includes('Most Recent')) isMostRecent = true;
              contentBuffer.pop(); // 消耗 Badge 行

              if (contentBuffer.length > 0) {
                user = contentBuffer.pop()!;
              }
            } else {
              user = contentBuffer.pop()!;
            }
          }
        }

        // 【新增】清理 User 之前的纯图标行（防止残留的 👤 污染上一条评论）
        while (contentBuffer.length > 0) {
          const last = contentBuffer[contentBuffer.length - 1].trim();
          // 如果只包含图标或者为空，就 pop 掉
          if (last === '👤' || last === '' || /^[\s👤]+$/u.test(last)) {
            contentBuffer.pop();
          } else {
            break;
          }
        }

        // 清理 User 字符串
        user =
          user
            .replace(/^[👤\s]+/u, '')
            .replace(/[|\u2261]/g, '')
            .trim() || 'Anonymous';

        // 此时 contentBuffer 里剩下的就是 *上一条* 评论的内容
        if (currentComment) {
          let content = contentBuffer.join('\n').trim();

          // 提取 Selected Answer
          const selectedMatch = content.match(
            /Selected Answer:\s*([A-F,\s]+)/i,
          );
          if (selectedMatch) {
            currentComment.selectedAnswer = selectedMatch[1].trim();
            content = content
              .replace(/Selected Answer:\s*[A-F,\s]+/i, '')
              .trim();
          }

          // 提取 Vote Count
          const voteMatch = content.match(/upvoted\s+(\d+)\s+times?$/i);
          if (voteMatch) {
            currentComment.voteCount = parseInt(voteMatch[1], 10);
            content = content.replace(/upvoted\s+(\d+)\s+times?$/i, '').trim();
          }

          currentComment.content = content;
          comments.push(currentComment as DiscussionComment);
        }

        // 开始新评论
        currentComment = {
          user,
          date: dateStr,
          isHighlyVoted,
          isMostRecent,
          content: '',
        };
        contentBuffer = [];
      } else {
        contentBuffer.push(line);
      }
    }

    // 处理最后一条
    if (currentComment) {
      let content = contentBuffer.join('\n').trim();
      const selectedMatch = content.match(/Selected Answer:\s*([A-F,\s]+)/i);
      if (selectedMatch) {
        currentComment.selectedAnswer = selectedMatch[1].trim();
        content = content.replace(/Selected Answer:\s*[A-F,\s]+/i, '').trim();
      }
      const voteMatch = content.match(/upvoted\s+(\d+)\s+times?$/i);
      if (voteMatch) {
        currentComment.voteCount = parseInt(voteMatch[1], 10);
        content = content.replace(/upvoted\s+(\d+)\s+times?$/i, '').trim();
      }
      currentComment.content = content;
      comments.push(currentComment as DiscussionComment);
    }

    return comments;
  }
}
