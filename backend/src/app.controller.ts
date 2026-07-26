import { Controller, Get } from '@nestjs/common';

@Controller()
export class appController {
  @Get()
  getStatus(): string {
    return 'SUCESSO ! | BackEnd e FrontEnd funcionandos corretamente!';
  }
}
