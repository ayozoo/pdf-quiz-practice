import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PdfTemplate } from './template.entity';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PdfTemplate])],
  providers: [TemplateService],
  controllers: [TemplateController],
  exports: [TemplateService],
})
export class TemplateModule {}
