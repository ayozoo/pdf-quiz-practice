import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { TemplateService } from './template.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  AnalyzeSampleDto,
  AiGenerateDto,
  AiTestConnectionDto,
} from './template.dto';
import type { SuggestedPatterns } from './template.dto';
import { PdfTemplate } from './template.entity';

@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  findAll(): Promise<PdfTemplate[]> {
    return this.templateService.findAll();
  }

  /** 样本文本启发式分析 */
  @Post('analyze-sample')
  analyzeSample(@Body() dto: AnalyzeSampleDto): SuggestedPatterns {
    return this.templateService.analyzeSample(dto.sampleText);
  }

  /** AI 辅助生成正则 */
  @Post('ai-generate')
  aiGenerate(@Body() dto: AiGenerateDto): Promise<SuggestedPatterns> {
    return this.templateService.aiGenerate(dto);
  }

  /** AI 连通性测试 */
  @Post('ai-test-connection')
  aiTestConnection(
    @Body() dto: AiTestConnectionDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.templateService.aiTestConnection(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PdfTemplate> {
    return this.templateService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTemplateDto): Promise<PdfTemplate> {
    return this.templateService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTemplateDto,
  ): Promise<PdfTemplate> {
    return this.templateService.update(id, dto);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id', ParseIntPipe) id: number): Promise<PdfTemplate> {
    return this.templateService.duplicate(id);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.templateService.remove(id);
  }
}
