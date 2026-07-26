export interface DadosPessoais {
  nome: string;
  cidade: string;
  naturalidade?: string;
  nacionalidade?: string;
  telefone: string;
  email: string;
  linkedin: string;
  github?: string;
}

export interface Experiencia {
  cargo: string;
  empresa: string;
  periodo: string;
  descricao: string;
}

export interface Formacao {
  curso: string;
  instituicao: string;
  periodo: string;
  status?: string;
}

export interface Idioma {
  idioma?: string;
  nome?: string;
  nivel?: string;
  data_emissao?: string;
}

export interface CurriculoDataExport {
  dados_pessoais: DadosPessoais;
  resumo_profissional: string;
  experiencias: Experiencia[];
  formacao: Formacao[];
  habilidades: string[];
  idiomas: Idioma[] | string[];
}

export interface DadosNormalizados {
  nome: string;
  cidade: string;
  telefone: string;
  email: string;
  linkedin: string;
  github: string;
  resumo: string;
  experiencias: Array<{
    cargo: string;
    empresa: string;
    periodo: string;
    bullets: string[];
  }>;
  formacao: Array<{
    curso: string;
    instituicao: string;
    periodo: string;
    status?: string;
  }>;
  habilidades: string[];
  idiomas: Array<{ nome: string; nivel: string }>;
}

export function removerEmojis(texto: string): string {
  if (!texto) return "";
  return texto
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDDFF])/g,
      "",
    )
    .trim();
}

export function escapeHtml(texto: string): string {
  if (!texto) return "";
  const limpo = removerEmojis(texto);
  return limpo
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function gerarBulletsInteligentes(descricao: string, max = 6): string[] {
  if (!descricao) return [];
  const limpoDesc = removerEmojis(descricao);
  const jaTemBullets = /[\n•\-\*▪]/.test(limpoDesc);

  if (jaTemBullets) {
    return limpoDesc
      .split(/\r?\n/)
      .map((l) => l.replace(/^\s*[•\-\*▪◦►▶✓✔]\s*/, "").trim())
      .filter((l) => l.length > 0)
      .slice(0, max);
  }

  const sentencas = limpoDesc
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú])/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (sentencas.length > 1) return sentencas.slice(0, max);
  return [limpoDesc.trim()];
}

export function formatarPeriodo(periodo: string): string {
  if (!periodo) return "";
  return removerEmojis(periodo)
    .replace(/\batual\b/gi, "Atual")
    .replace(/\bpresente\b/gi, "Atual")
    .replace(/\bjaneiro\b/gi, "Jan")
    .replace(/\bfevereiro\b/gi, "Fev")
    .replace(/\bmar[çc]o\b/gi, "Mar")
    .replace(/\babril\b/gi, "Abr")
    .replace(/\bmaio\b/gi, "Mai")
    .replace(/\bjunho\b/gi, "Jun")
    .replace(/\bjulho\b/gi, "Jul")
    .replace(/\bagosto\b/gi, "Ago")
    .replace(/\bsetembro\b/gi, "Set")
    .replace(/\boutubro\b/gi, "Out")
    .replace(/\bnovembro\b/gi, "Nov")
    .replace(/\bdezembro\b/gi, "Dez");
}

export function normalizarDados(
  resultadoIA: {
    curriculoEstruturado?: CurriculoDataExport;
    curriculoOtimizadoText?: string;
  },
  jovemData?: any,
  vaga?: any,
): DadosNormalizados {
  const dados = resultadoIA.curriculoEstruturado;
  const dp = dados?.dados_pessoais;

  const nome = removerEmojis(
    dp?.nome ||
      jovemData?.nome_completo ||
      jovemData?.nome ||
      resultadoIA.curriculoOtimizadoText?.split("\n")[0] ||
      "Profissional Qualificado",
  );

  const cidade = removerEmojis(
    dp?.cidade || jovemData?.cidade || vaga?.cidade
      ? `${vaga?.cidade || ""}${vaga?.estado ? `/${vaga.estado}` : ""}`.replace(
          /^\/|\/$/g,
          "",
        )
      : "",
  );

  const telefone = removerEmojis(dp?.telefone || jovemData?.telefone || "");
  const email = removerEmojis(dp?.email || jovemData?.email || "");
  const linkedin = removerEmojis(dp?.linkedin || jovemData?.linkedin || "");
  const github = removerEmojis(dp?.github || jovemData?.github || "");

  let resumo = removerEmojis(
    dados?.resumo_profissional || resultadoIA.curriculoOtimizadoText || "",
  );
  if (!resumo.trim()) {
    const tituloVaga = vaga?.titulo || "a oportunidade";
    resumo = `Busco atuar na posição de ${tituloVaga}, aplicando minha capacidade de aprendizado, dedicação e foco em resultados para contribuir com o crescimento da organização.`;
  }

  const experienciasRaw =
    dados?.experiencias && dados.experiencias.length > 0
      ? dados.experiencias
      : [
          {
            cargo: "Atuação Profissional",
            empresa: "Empresa / Projeto",
            periodo: "Recente",
            descricao:
              resultadoIA.curriculoOtimizadoText ||
              "Vivência prática em atividades relacionadas à área de atuação.",
          },
        ];

  const experiencias = experienciasRaw
    .filter(
      (e) =>
        (e.cargo && e.cargo.trim()) ||
        (e.empresa && e.empresa.trim()) ||
        (e.descricao && e.descricao.trim()),
    )
    .map((e) => ({
      cargo: removerEmojis(e.cargo?.trim() || "Cargo"),
      empresa: removerEmojis(e.empresa?.trim() || "Empresa"),
      periodo: formatarPeriodo(e.periodo?.trim() || "Período não informado"),
      bullets: gerarBulletsInteligentes(e.descricao || "", 6),
    }));

  const formacaoRaw =
    dados?.formacao && dados.formacao.length > 0
      ? dados.formacao
      : [
          {
            curso:
              jovemData?.formacao || jovemData?.curso || "Formação Acadêmica",
            instituicao: jovemData?.instituicao || "Instituição de Ensino",
            periodo: jovemData?.periodo_formacao || "Concluído",
            status: jovemData?.status_formacao || "",
          },
        ];

  const formacao = (formacaoRaw as Formacao[])
    .filter(
      (f: Formacao) =>
        (f.curso && f.curso.trim()) || (f.instituicao && f.instituicao.trim()),
    )
    .map((f: Formacao) => ({
      curso: removerEmojis(f.curso?.trim() || "Curso"),
      instituicao: removerEmojis(f.instituicao?.trim() || ""),
      periodo: formatarPeriodo(f.periodo?.trim() || ""),
      status: f.status?.trim() ? removerEmojis(f.status) : undefined,
    }));

  const habilidades =
    dados?.habilidades && dados.habilidades.length > 0
      ? dados.habilidades.map((h) => removerEmojis(h)).filter((h) => h.trim())
      : ["Trabalho em Equipe", "Comunicação", "Proatividade"];

  const idiomasRaw = dados?.idiomas || [];
  const idiomas = (idiomasRaw as any[])
    .map((i) => {
      if (typeof i === "string") {
        const limpoStr = removerEmojis(i);
        const m = limpoStr.match(/^([^()]+)\s*(?:\(([^)]+)\))?$/);
        return {
          nome: m?.[1]?.trim() || limpoStr,
          nivel: m?.[2]?.trim() || "",
        };
      }
      return {
        nome: removerEmojis(i.idioma || i.nome || "").trim(),
        nivel: removerEmojis(i.nivel || "").trim(),
      };
    })
    .filter((i) => i.nome);

  if (idiomas.length === 0) {
    idiomas.push({ nome: "Português", nivel: "Nativo" });
  }

  return {
    nome,
    cidade,
    telefone,
    email,
    linkedin,
    github,
    resumo,
    experiencias,
    formacao,
    habilidades,
    idiomas,
  };
}
