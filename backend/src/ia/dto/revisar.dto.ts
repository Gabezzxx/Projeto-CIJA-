import { IsString } from 'class-validator';

export class revisarDTO {
  @IsString()
  curriculo: string;

  @IsString()
  vaga: string;
}
