import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PdfModule } from './pdf/pdf.module';
import { ExamModule } from './exam/exam.module';
import { TemplateModule } from './template/template.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'exam-db.sqlite',
      autoLoadEntities: true,
      synchronize: true,
    }),
    PdfModule,
    ExamModule,
    TemplateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
