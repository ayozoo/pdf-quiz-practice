import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PdfTemplate } from './template.entity';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  SuggestedPatterns,
  AiGenerateDto,
  AiTestConnectionDto,
} from './template.dto';

/** 内置的默认模版 — 对应 AWS ExamTopics 格式 */
const BUILTIN_TEMPLATE: Partial<PdfTemplate> = {
  name: 'AWS ExamTopics 默认模版',
  description:
    '适用于 AWS ExamTopics 格式的 PDF 题库（如 SAA-C03、SOA-C02 等），支持 Topic/Question #N、A-F 选项、Correct Answer、Explanation 和讨论区解析。',
  isBuiltin: true,
  questionSplitPattern: '(?:^|\\n)(?:Topic\\s+\\d+\\s*)?Question\\s*#?\\d+',
  questionNumberPattern: '(?:Topic\\s+\\d+\\s*)?Question\\s*#?(\\d+)\\s*[:.)-]?\\s*(.*)$',
  optionPattern: '^([A-F])[).:]\\s+',
  correctAnswerLinePattern: 'Correct\\s*Answer[s]?\\s*[:：]',
  correctAnswerExtractPattern: 'Correct\\s*Answer[s]?\\s*[:-]\\s*([A-F,\\s]+)',
  explanationPattern: 'Explanation\\s*[:-](.*)$',
  hasDiscussion: true,
  discussionDatePattern:
    '(\\d+\\s+(?:year|month|week|day|hour)s?,\\s*)*\\d+\\s+(?:year|month|week|day|hour)s?\\s+ago',
};

@Injectable()
export class TemplateService implements OnModuleInit {
  constructor(
    @InjectRepository(PdfTemplate)
    private readonly templateRepo: Repository<PdfTemplate>,
  ) {}

  /** 应用启动时确保内置模版存在，并同步最新配置 */
  async onModuleInit(): Promise<void> {
    const existing = await this.templateRepo.findOne({
      where: { isBuiltin: true },
    });
    if (!existing) {
      const entity = this.templateRepo.create(BUILTIN_TEMPLATE);
      await this.templateRepo.save(entity);
    } else {
      // 同步内置模版的配置（修复历史 bug，如 optionPattern 转义问题）
      let needUpdate = false;
      const fields: (keyof PdfTemplate)[] = [
        'questionSplitPattern',
        'questionNumberPattern',
        'optionPattern',
        'correctAnswerLinePattern',
        'correctAnswerExtractPattern',
        'explanationPattern',
        'hasDiscussion',
        'discussionDatePattern',
      ];
      for (const f of fields) {
        if (BUILTIN_TEMPLATE[f] !== undefined && existing[f] !== BUILTIN_TEMPLATE[f]) {
          Object.assign(existing, { [f]: BUILTIN_TEMPLATE[f] });
          needUpdate = true;
        }
      }
      if (needUpdate) {
        await this.templateRepo.save(existing);
      }
    }
  }

  async findAll(): Promise<PdfTemplate[]> {
    return this.templateRepo.find({
      order: { isBuiltin: 'DESC', createdAt: 'ASC' },
    });
  }

  async findOne(id: number): Promise<PdfTemplate> {
    const t = await this.templateRepo.findOne({ where: { id } });
    if (!t) {
      throw new NotFoundException(`模版 #${id} 不存在`);
    }
    return t;
  }

  async findDefault(): Promise<PdfTemplate> {
    const t = await this.templateRepo.findOne({ where: { isBuiltin: true } });
    if (!t) {
      throw new NotFoundException('未找到默认模版');
    }
    return t;
  }

  async create(dto: CreateTemplateDto): Promise<PdfTemplate> {
    this.validatePatterns(dto);
    const entity = this.templateRepo.create({ ...dto, isBuiltin: false });
    return this.templateRepo.save(entity);
  }

  async update(id: number, dto: UpdateTemplateDto): Promise<PdfTemplate> {
    const t = await this.findOne(id);
    if (t.isBuiltin) {
      throw new BadRequestException('不能修改内置模版，请复制后修改');
    }
    this.validatePatterns(dto);
    Object.assign(t, dto);
    return this.templateRepo.save(t);
  }

  async duplicate(id: number): Promise<PdfTemplate> {
    const source = await this.findOne(id);
    const copy = this.templateRepo.create({
      name: `${source.name} (副本)`,
      description: source.description,
      isBuiltin: false,
      questionSplitPattern: source.questionSplitPattern,
      questionNumberPattern: source.questionNumberPattern,
      optionPattern: source.optionPattern,
      correctAnswerLinePattern: source.correctAnswerLinePattern,
      correctAnswerExtractPattern: source.correctAnswerExtractPattern,
      explanationPattern: source.explanationPattern,
      hasDiscussion: source.hasDiscussion,
      discussionDatePattern: source.discussionDatePattern,
      noiseLinePatterns: source.noiseLinePatterns,
    });
    return this.templateRepo.save(copy);
  }

  async remove(id: number): Promise<void> {
    const t = await this.findOne(id);
    if (t.isBuiltin) {
      throw new BadRequestException('不能删除内置模版');
    }
    await this.templateRepo.remove(t);
  }

  /** 基于样本文本启发式分析，推荐正则 */
  analyzeSample(sampleText: string): SuggestedPatterns {
    const result: SuggestedPatterns = {};
    const hints: Record<string, string> = {};

    // --- 题号检测 ---
    const questionDetectors: {
      regex: RegExp;
      split: string;
      number: string;
      hint: string;
    }[] = [
      {
        regex: /(?:Topic\s+\d+\s*)?Question\s*#?\d+/m,
        split: '(?:^|\\n)(?:Topic\\s+\\d+\\s*)?Question\\s*#?\\d+',
        number: '(?:Topic\\s+\\d+\\s*)?Question\\s*#?(\\d+)\\s*[:.)-]?\\s*(.*)$',
        hint: '检测到 ExamTopics 风格: "Question #N" 或 "Topic X Question #N"',
      },
      {
        regex: /NEW QUESTION \d+/m,
        split: '(?:^|\\n)NEW QUESTION \\d+',
        number: 'NEW QUESTION (\\d+)\\s*[:.)-]?\\s*(.*)$',
        hint: '检测到 "NEW QUESTION N" 风格',
      },
      {
        regex: /^Q\s*[.:]?\s*\d+/m,
        split: '(?:^|\\n)Q\\s*[.:]?\\s*\\d+',
        number: 'Q\\s*[.:]?\\s*(\\d+)[:.)-]?\\s*(.*)$',
        hint: '检测到 "Q. N" / "Q N" 风格',
      },
      {
        regex: /^\d+\)\s+/m,
        split: '(?:^|\\n)\\d+\\)\\s+',
        number: '^(\\d+)\\)\\s+(.*)$',
        hint: '检测到 "N) text" 风格',
      },
      {
        regex: /^\d+\.\s+\S/m,
        split: '(?:^|\\n)\\d+\\.\\s+',
        number: '^(\\d+)\\.\\s+(.*)$',
        hint: '检测到 "N. text" 风格',
      },
      {
        regex: /第\s*\d+\s*题/m,
        split: '(?:^|\\n)第\\s*\\d+\\s*题',
        number: '第\\s*(\\d+)\\s*题[:.：]?\\s*(.*)$',
        hint: '检测到中文 "第N题" 风格',
      },
    ];

    for (const d of questionDetectors) {
      if (d.regex.test(sampleText)) {
        result.questionSplitPattern = d.split;
        result.questionNumberPattern = d.number;
        hints.questionSplitPattern = d.hint;
        break;
      }
    }
    if (!result.questionSplitPattern) {
      hints.questionSplitPattern = '未识别到题号格式，请手动填写';
    }

    // --- 选项检测 ---
    const optionDetectors: {
      regex: RegExp;
      pattern: string;
      hint: string;
    }[] = [
      {
        regex: /^[A-F][).:][ \t]+/m,
        pattern: '^([A-F])[).:]\\s+',
        hint: '检测到 "A. " / "A) " / "A: " 风格选项',
      },
      {
        regex: /^\([A-F]\)[ \t]+/m,
        pattern: '^\\(([A-F])\\)\\s+',
        hint: '检测到 "(A) text" 风格选项',
      },
      {
        regex: /^[A-F]、/m,
        pattern: '^([A-F])、\\s*',
        hint: '检测到中文 "A、" 风格选项',
      },
    ];

    for (const d of optionDetectors) {
      if (d.regex.test(sampleText)) {
        result.optionPattern = d.pattern;
        hints.optionPattern = d.hint;
        break;
      }
    }
    if (!result.optionPattern) {
      hints.optionPattern = '未识别到选项格式，请手动填写';
    }

    // --- 答案检测 ---
    const answerDetectors: {
      regex: RegExp;
      line: string;
      extract: string;
      hint: string;
    }[] = [
      {
        regex: /Correct\s*Answer[s]?\s*[:：-]/im,
        line: 'Correct\\s*Answer[s]?\\s*[:：]',
        extract: 'Correct\\s*Answer[s]?\\s*[:-]\\s*([A-F,\\s]+)',
        hint: '检测到 "Correct Answer:" 风格',
      },
      {
        regex: /^Answer\s*[:：]/im,
        line: 'Answer\\s*[:：]',
        extract: 'Answer\\s*[:：]\\s*([A-F,\\s]+)',
        hint: '检测到 "Answer:" 风格',
      },
      {
        regex: /正确答案\s*[:：]/m,
        line: '正确答案\\s*[:：]',
        extract: '正确答案\\s*[:：]\\s*([A-F,\\s]+)',
        hint: '检测到中文 "正确答案：" 风格',
      },
      {
        regex: /答案\s*[:：]/m,
        line: '答案\\s*[:：]',
        extract: '答案\\s*[:：]\\s*([A-F,\\s]+)',
        hint: '检测到中文 "答案：" 风格',
      },
    ];

    for (const d of answerDetectors) {
      if (d.regex.test(sampleText)) {
        result.correctAnswerLinePattern = d.line;
        result.correctAnswerExtractPattern = d.extract;
        hints.correctAnswerLinePattern = d.hint;
        break;
      }
    }
    if (!result.correctAnswerLinePattern) {
      hints.correctAnswerLinePattern = '未识别到答案格式，请手动填写';
    }

    // --- 解析检测 ---
    const explanationDetectors: {
      regex: RegExp;
      pattern: string;
      hint: string;
    }[] = [
      {
        regex: /Explanation\s*[:-]/im,
        pattern: 'Explanation\\s*[:-](.*)$',
        hint: '检测到 "Explanation:" 风格',
      },
      {
        regex: /解[析释]\s*[:：]/m,
        pattern: '解[析释]\\s*[:：](.*)$',
        hint: '检测到中文 "解析：" 风格',
      },
      {
        regex: /Analysis\s*[:：-]/im,
        pattern: 'Analysis\\s*[:-](.*)$',
        hint: '检测到 "Analysis:" 风格',
      },
    ];

    for (const d of explanationDetectors) {
      if (d.regex.test(sampleText)) {
        result.explanationPattern = d.pattern;
        hints.explanationPattern = d.hint;
        break;
      }
    }
    if (!result.explanationPattern) {
      hints.explanationPattern = '未识别到解析格式，请手动填写';
    }

    // --- 讨论区检测 ---
    if (/\d+\s+(?:year|month|week|day|hour|minute)s?\s+ago/i.test(sampleText)) {
      result.hasDiscussion = true;
      result.discussionDatePattern =
        '(\\d+\\s+(?:year|month|week|day|hour)s?,\\s*)*\\d+\\s+(?:year|month|week|day|hour)s?\\s+ago';
      hints.hasDiscussion = '检测到讨论区时间戳（如 "2 months ago"）';
    } else {
      result.hasDiscussion = false;
      hints.hasDiscussion = '未检测到讨论区';
    }

    result.hints = hints;
    return result;
  }

  /** 调用 OpenAI 兼容 API 来生成正则 */
  async aiGenerate(dto: AiGenerateDto): Promise<SuggestedPatterns> {
    const systemPrompt = `你是一个正则表达式专家。用户会提供一段考试题库的示例文本。
请分析文本格式并生成用于解析该格式题库的 JavaScript 正则表达式。

需要返回以下字段的 JSON 对象：
- questionSplitPattern: 用于分割每道题的正则（匹配题目起始位置），使用时会加 gm 标志
- questionNumberPattern: 从题目首行提取题号的正则。捕获组1=题号数字，捕获组2=剩余文本
- optionPattern: 识别选项行的正则（如 "A. xxx"），捕获组1=选项字母
- correctAnswerLinePattern: 定位"正确答案"所在行的正则
- correctAnswerExtractPattern: 从答案行提取正确选项字母的正则，捕获组1=答案字母串
- explanationPattern: 提取解析/解释文本的正则，捕获组1=解释内容
- hasDiscussion: 布尔值，文本中是否包含讨论区/评论
- discussionDatePattern: 如果有讨论区，用于分割评论的日期模式正则
- hints: 对象，key 为字段名，value 为对该字段的简要说明

请只返回 JSON 对象，不要使用 markdown 代码块，不要包含其他文字。`;

    const { apiEndpoint, apiKey, model, sampleText } = dto;

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `以下是题库示例文本，请分析并返回解析所需的正则表达式 JSON：\n\n${sampleText}`,
            },
          ],
          temperature: 0,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new BadRequestException(
          `AI API 调用失败 (${response.status}): ${errText.slice(0, 300)}`,
        );
      }

      type AiApiResponse = {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const data = (await response.json()) as AiApiResponse;
      const content: string = data.choices?.[0]?.message?.content ?? '';

      // 尝试提取 JSON
      let jsonStr = content.trim();
      // 去掉可能的 markdown 代码块
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr) as SuggestedPatterns;

      // 验证返回的正则是否合法
      const regexFields: string[] = [
        'questionSplitPattern',
        'questionNumberPattern',
        'optionPattern',
        'correctAnswerLinePattern',
        'correctAnswerExtractPattern',
        'explanationPattern',
        'discussionDatePattern',
      ];
      for (const field of regexFields) {
        const val = (parsed as Record<string, unknown>)[field];
        if (typeof val === 'string' && val.length > 0) {
          try {
            new RegExp(val);
          } catch {
            // AI 返回了非法正则，标记在 hints 中
            if (!parsed.hints) parsed.hints = {};
            parsed.hints[field] = `⚠ AI 生成的正则无效，请手动修正: ${val}`;
          }
        }
      }

      return parsed;
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException(
        `AI 生成失败: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** 测试 AI 连通性 */
  async aiTestConnection(dto: AiTestConnectionDto): Promise<{ success: boolean; message: string }> {
    const { apiEndpoint, apiKey, model } = dto;

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          success: false,
          message: `连接失败 (${response.status}): ${errText.slice(0, 200)}`,
        };
      }

      return {
        success: true,
        message: '连接成功！',
      };
    } catch (err) {
      return {
        success: false,
        message: `连接异常: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /** 校验正则是否合法 */
  private validatePatterns(dto: Partial<CreateTemplateDto>): void {
    const fields: (keyof CreateTemplateDto)[] = [
      'questionSplitPattern',
      'questionNumberPattern',
      'optionPattern',
      'correctAnswerLinePattern',
      'correctAnswerExtractPattern',
      'explanationPattern',
      'discussionDatePattern',
    ];

    for (const field of fields) {
      const value = dto[field];
      if (typeof value === 'string' && value.length > 0) {
        try {
          new RegExp(value);
        } catch {
          throw new BadRequestException(`字段 "${field}" 的正则表达式无效: ${value}`);
        }
      }
    }
  }
}
