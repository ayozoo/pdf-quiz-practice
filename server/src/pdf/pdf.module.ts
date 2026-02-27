import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { ExamModule } from '../exam/exam.module';
import { TemplateModule } from '../template/template.module';

@Module({
  imports: [MulterModule.register(), ExamModule, TemplateModule],
  controllers: [PdfController],
  providers: [PdfService],
})
export class PdfModule {}
