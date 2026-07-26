/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Body,
  Res,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import type { Response } from 'express';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PdfService } from './pdf.service';

class GerarPdfDto {
  @IsString({ message: 'O HTML precisa ser um texto.' })
  @IsNotEmpty({ message: 'O conteúdo HTML é obrigatório.' })
  @MaxLength(2097152, { message: 'O HTML excede o limite permitido (2MB).' })
  html!: string;
}

@Controller('pdf')
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('curriculo')
  @HttpCode(200)
  async gerarCurriculoPdf(@Body() body: GerarPdfDto, @Res() res: Response) {
    // O ValidationPipe global (whitelist + transform) já validou o DTO
    // Mas mantemos um fallback manual em caso de body vazio.
    const html = body?.html;

    if (!html || typeof html !== 'string' || !html.trim()) {
      throw new BadRequestException('O conteúdo HTML é obrigatório.');
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const pdfBuffer = await this.pdfService.gerarPdf(html);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="curriculo.pdf"',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('ERRO PDF: ', error);
      throw new BadRequestException('Erro ao processar a geração do PDF.');
    }
  }
}
