import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { IaService } from './ia.service';

@Controller('ia')
export class IaController {
  constructor(private readonly iaService: IaService) {}

  @Post('revisar')
  @UseInterceptors(
    FileInterceptor('curriculo', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
      },
    }),
  )
  async revisar(
    @UploadedFile() file: Express.Multer.File,
    @Body('vaga') vaga: string,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum currículo enviado.');
    }
    if (!vaga || !vaga.trim()) {
      throw new BadRequestException('Informe a vaga.');
    }
    return this.iaService.revisar(file, vaga);
  }
}
