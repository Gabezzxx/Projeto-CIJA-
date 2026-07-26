import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { IaController } from './ia/ia.controller';
import { IaService } from './ia/ia.service';
import { PdfModule } from './pdf/pdf.module';

@Module({
  imports: [PdfModule],
  controllers: [IaController],
  providers: [AppService, IaService],
})
export class AppModule {}
