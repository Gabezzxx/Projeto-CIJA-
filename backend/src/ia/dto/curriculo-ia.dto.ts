import { IsObject, IsOptional } from 'class-validator';

export class CurriculoIaDto {
  @IsOptional()
  @IsObject()
  dadosCurriculo?: Record<string, any>;
}
