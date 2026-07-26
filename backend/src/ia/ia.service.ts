/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as mammoth from 'mammoth';
import { gerarCurriculoPrompt } from './prompts/curriculo.prompt';

// pdf-parse é exportado via CommonJS
// eslint-disable-next-line @typescript-eslint/no-require-imports
import pdfParse = require('pdf-parse');

interface OllamaResponse {
  model?: string;
  response: string;
  done: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
}

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 420_000); // 7 min
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

@Injectable()
export class IaService {
  /*Executa o fluxo em duas etapas:1. Gera o currículo estruturado e revisado 2. Gera a análise, compatibilidade e sugestões (Resiliente: se falhar, não quebra a requisição).
   */
  async revisar(file: Express.Multer.File, vaga: string) {
    if (!file) {
      throw new BadRequestException('Nenhum currículo foi enviado.');
    }
    if (!vaga || !vaga.trim()) {
      throw new BadRequestException('A vaga é obrigatória.');
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException('Arquivo excede o limite de 10 MB.');
    }

    const textoCurriculo = await this.extrairTexto(file);
    if (!textoCurriculo || textoCurriculo.trim().length < 20) {
      throw new BadRequestException(
        'Não foi possível extrair texto legível do arquivo. Verifique se o PDF não é uma imagem digitalizada.',
      );
    }

    // ==========================================================
    // ETAPA 1: Gerar o Currículo Otimizado e Estruturado (Obrigatório)
    // ==========================================================
    const promptCurriculo = gerarCurriculoPrompt(textoCurriculo, vaga);
    const dadosCurriculoRaw = await this.chamarOllama(promptCurriculo);

    const textoLimpoCurriculo = dadosCurriculoRaw.response
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const respostaCurriculo = this.tentarParsearJson(textoLimpoCurriculo);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const curriculoEstruturado =
      respostaCurriculo.curriculoEstruturado ||
      respostaCurriculo.curriculo_estruturado ||
      respostaCurriculo.curriculo ||
      null;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const curriculoRevisadoText =
      respostaCurriculo.curriculo_revisado ||
      respostaCurriculo.curriculoRevisado ||
      respostaCurriculo.curriculoOtimizadoText ||
      '';

    // ==========================================================
    // ETAPA 2: Gerar Análise e Compatibilidade (Opcional/Resiliente)
    // Se essa etapa falhar, o usuário ainda recebe o currículo pronto!
    // ==========================================================
    let dadosAnalise: any = {
      compatibilidade_antes: null,
      compatibilidade_depois: null,
      nota_final: null,
      vaga_detectada: '',
      melhorias_realizadas: [],
    };

    try {
      const promptAnalise = `Analise o currículo a seguir frente à vaga informada e retorne APENAS um JSON válido contendo: compatibilidade_antes (número de 0 a 100), compatibilidade_depois (número de 0 a 100), nota_final (número de 0 a 10), vaga_detectada (string) e melhorias_realizadas (array de strings).
      
      VAGA: ${vaga}
      CURRICULO: ${JSON.stringify(curriculoEstruturado)}`;

      const dadosAnaliseRaw = await this.chamarOllama(promptAnalise);
      const textoLimpoAnalise = dadosAnaliseRaw.response
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      dadosAnalise = this.tentarParsearJson(textoLimpoAnalise);
    } catch (erroAnalise) {
      console.warn(
        'Aviso: A segunda IA de análise falhou, mas o currículo foi gerado com sucesso.',
        erroAnalise,
      );
    }

    return {
      modelo: dadosCurriculoRaw.model ?? OLLAMA_MODEL,
      tempo_ms: dadosCurriculoRaw.__tempo_ms ?? 0,
      tokens:
        (dadosCurriculoRaw.prompt_eval_count ?? 0) +
        (dadosCurriculoRaw.eval_count ?? 0),
      vaga: vaga,
      // Atalhos diretos no topo
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      curriculoEstruturado,
      // Mantém compatibilidade: também expõe curriculoOtimizadoText
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      curriculoOtimizadoText: curriculoRevisadoText,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      curriculo_revisado: curriculoRevisadoText,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      compatibilidade_antes:
        dadosAnalise.compatibilidade_antes ??
        dadosAnalise.compatibilidadeAntes ??
        null,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      compatibilidade_depois:
        dadosAnalise.compatibilidade_depois ??
        dadosAnalise.compatibilidadeDepois ??
        null,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      nota_final: dadosAnalise.nota_final ?? dadosAnalise.nota ?? null,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      vaga_detectada: dadosAnalise.vaga_detectada ?? '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      melhorias_realizadas: dadosAnalise.melhorias_realizadas ?? [],
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      resposta: {
        ...respostaCurriculo,
        ...dadosAnalise,
      },
    };
  }

  // ------------------------------------------------------------
  // Extração de texto (PDF / DOCX)[cite: 3]
  // ------------------------------------------------------------
  private async extrairTexto(file: Express.Multer.File): Promise<string> {
    const extensao = file.originalname.split('.').pop()?.toLowerCase();
    const ehPdf = file.mimetype === 'application/pdf' || extensao === 'pdf';
    const ehDocx =
      file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      extensao === 'docx';

    if (ehPdf) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const parseFunction = (pdfParse as any).default || pdfParse;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
        const pdfData = await parseFunction(file.buffer);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return (pdfData.text || '').toString();
      } catch (err: any) {
        throw new BadRequestException(
          `Erro ao ler o arquivo PDF: ${err?.message || 'arquivo inválido'}`,
        );
      }
    }

    if (ehDocx) {
      try {
        const doc = await mammoth.extractRawText({ buffer: file.buffer });
        return (doc.value || '').toString();
      } catch (err: any) {
        throw new BadRequestException(
          `Erro ao ler o arquivo DOCX: ${err?.message || 'arquivo inválido'}`,
        );
      }
    }

    throw new BadRequestException(
      'Formato inválido. Envie um arquivo PDF ou DOCX.',
    );
  }

  // ------------------------------------------------------------
  // Chamada ao Ollama
  // ------------------------------------------------------------
  private async chamarOllama(
    prompt: string,
  ): Promise<OllamaResponse & { __tempo_ms: number }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    const inicio = Date.now();

    let response: Response;
    try {
      response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          format: 'json',
          keep_alive: '30m',
          options: {
            num_predict: 6000,
            temperature: 0.4,
            top_p: 0.9,
            repeat_penalty: 1.1,
            num_ctx: 8192,
          },
        }),
      });
    } catch (err: any) {
      clearTimeout(timeout);
      if (err?.name === 'AbortError') {
        throw new ServiceUnavailableException(
          'A IA demorou demais para responder. Tente novamente ou use um modelo menor.',
        );
      }
      throw new ServiceUnavailableException(
        `Falha de conexão com a IA em ${OLLAMA_URL}: ${err?.message || 'verifique se o Ollama está rodando'}`,
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const erroDetalhado = await response.text();
      throw new ServiceUnavailableException(
        `Erro da IA (${response.status}): ${erroDetalhado.slice(0, 500)}`,
      );
    }

    const data = (await response.json()) as OllamaResponse;
    (data as any).__tempo_ms = Date.now() - inicio;
    return data as OllamaResponse & { __tempo_ms: number };
  }

  // ------------------------------------------------------------
  // Parse seguro do JSON retornado pela IA[cite: 3]
  // ------------------------------------------------------------
  private tentarParsearJson(textoLimpo: string): any {
    const inicio = textoLimpo.indexOf('{');
    if (inicio === -1) {
      throw new ServiceUnavailableException(
        'A IA não retornou um JSON estruturado. Tente novamente.',
      );
    }

    const fim = this.encontrarFimJson(textoLimpo, inicio);
    if (fim === -1) {
      throw new ServiceUnavailableException(
        'A IA retornou um JSON incompleto. Tente novamente.',
      );
    }

    const jsonString = textoLimpo.substring(inicio, fim + 1);

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(jsonString);
    } catch {
      const recuperado = jsonString
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/\n/g, '\\n');
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return JSON.parse(recuperado);
      } catch {
        throw new ServiceUnavailableException(
          'A IA retornou um JSON malformado. Tente novamente.',
        );
      }
    }
  }

  private encontrarFimJson(texto: string, inicio: number): number {
    let profundidade = 0;
    let emString = false;
    let escape = false;
    for (let i = inicio; i < texto.length; i++) {
      const c = texto[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === '"') {
        emString = !emString;
        continue;
      }
      if (emString) continue;
      if (c === '{') profundidade++;
      else if (c === '}') {
        profundidade--;
        if (profundidade === 0) return i;
      }
    }
    return -1;
  }
}
