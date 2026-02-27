import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PdfService } from './pdf.service';
import { ExamService } from '../exam/exam.service';

@Controller('pdf')
export class PdfController {
  constructor(
    private readonly pdfService: PdfService,
    private readonly examService: ExamService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @UploadedFile() file: any,
    @Body('templateId') templateId?: string,
  ) {
    const tplId = templateId ? parseInt(templateId, 10) : undefined;
    const parsed = await this.pdfService.parsePdf(file, tplId);
    return this.examService.createFromParsedExam(parsed);
  }

  /** 预览解析结果（不入库），用于模版调试 */
  @Post('preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewPdf(
    @UploadedFile() file: any,
    @Body('templateId') templateId?: string,
  ) {
    const tplId = templateId ? parseInt(templateId, 10) : undefined;
    return this.pdfService.previewParse(file, tplId);
  }
}
