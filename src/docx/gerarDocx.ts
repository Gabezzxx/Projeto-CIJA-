import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  TabStopType,
} from "docx";
import { normalizarDados, CurriculoDataExport } from "../utils/normalizarDados";

export async function baixarCurriculoDOCX(
  resultadoIA: {
    curriculoEstruturado?: CurriculoDataExport;
    curriculoOtimizadoText?: string;
  },
  jovemData?: any,
  vaga?: any,
) {
  if (
    !resultadoIA?.curriculoEstruturado &&
    !resultadoIA?.curriculoOtimizadoText
  ) {
    throw new Error("Dados insuficientes para gerar o currículo");
  }

  const d = normalizarDados(resultadoIA, jovemData, vaga);

  const COR_PRIMARIA = "1E3A8A";
  const COR_SECUNDARIA = "2563EB";
  const COR_TEXTO = "1F2937";
  const COR_SUAVES = "6B7280";
  const children: any[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: d.nome.toUpperCase(),
          bold: true,
          size: 32,
          color: COR_PRIMARIA,
          font: "Calibri",
        }),
      ],
    }),
  );

  children.push(
    new Paragraph({
      spacing: { after: 120 },
      border: {
        bottom: {
          color: COR_PRIMARIA,
          space: 4,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
      children: [new TextRun({ text: "" })],
    }),
  );

  const contatoRuns: TextRun[] = [];
  const camposContato = [
    d.cidade,
    d.telefone,
    d.email,
    d.linkedin,
    d.github,
  ].filter(Boolean);

  camposContato.forEach((c, i) => {
    if (i > 0) {
      contatoRuns.push(
        new TextRun({
          text: "   |   ",
          size: 18,
          color: COR_SUAVES,
          font: "Calibri",
        }),
      );
    }
    contatoRuns.push(
      new TextRun({
        text: c,
        size: 18,
        color: COR_TEXTO,
        font: "Calibri",
      }),
    );
  });

  if (contatoRuns.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: contatoRuns,
      }),
    );
  }

  if (d.resumo) {
    children.push(criarSecaoDocx("RESUMO PROFISSIONAL", COR_PRIMARIA));
    children.push(
      new Paragraph({
        spacing: { after: 180, line: 276 },
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({
            text: d.resumo,
            size: 20,
            color: COR_TEXTO,
            font: "Calibri",
          }),
        ],
      }),
    );
  }

  if (d.experiencias.length > 0) {
    children.push(criarSecaoDocx("EXPERIÊNCIA PROFISSIONAL", COR_PRIMARIA));

    d.experiencias.forEach((exp) => {
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 20 },
          tabStops: [
            { type: TabStopType.RIGHT, position: convertInchesToTwip(6.5) },
          ],
          children: [
            new TextRun({
              text: exp.cargo,
              bold: true,
              size: 22,
              color: "111827",
              font: "Calibri",
            }),
            new TextRun({ text: "\t", size: 20, font: "Calibri" }),
            new TextRun({
              text: exp.periodo,
              italics: true,
              size: 19,
              color: COR_SUAVES,
              font: "Calibri",
            }),
          ],
        }),
      );

      if (exp.empresa) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: exp.empresa,
                bold: true,
                size: 20,
                color: COR_SECUNDARIA,
                font: "Calibri",
              }),
            ],
          }),
        );
      }

      exp.bullets.forEach((b) => {
        children.push(
          new Paragraph({
            spacing: { after: 30, line: 260 },
            bullet: { level: 0 },
            children: [
              new TextRun({
                text: b,
                size: 20,
                color: COR_TEXTO,
                font: "Calibri",
              }),
            ],
          }),
        );
      });
    });
  }

  if (d.formacao.length > 0) {
    children.push(criarSecaoDocx("FORMAÇÃO ACADÊMICA", COR_PRIMARIA));

    d.formacao.forEach((form) => {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 20 },
          tabStops: [
            { type: TabStopType.RIGHT, position: convertInchesToTwip(6.5) },
          ],
          children: [
            new TextRun({
              text: form.curso,
              bold: true,
              size: 21,
              color: "111827",
              font: "Calibri",
            }),
            form.status
              ? new TextRun({
                  text: ` — ${form.status}`,
                  size: 19,
                  color: COR_SUAVES,
                  font: "Calibri",
                })
              : new TextRun({ text: "", size: 19, font: "Calibri" }),
            new TextRun({ text: "\t", size: 19, font: "Calibri" }),
            new TextRun({
              text: form.periodo,
              italics: true,
              size: 19,
              color: COR_SUAVES,
              font: "Calibri",
            }),
          ],
        }),
      );

      if (form.instituicao) {
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: form.instituicao,
                size: 19,
                color: "4B5563",
                font: "Calibri",
              }),
            ],
          }),
        );
      }
    });
  }

  if (d.habilidades.length > 0) {
    children.push(criarSecaoDocx("HABILIDADES E COMPETÊNCIAS", COR_PRIMARIA));

    const porLinha = 4;
    for (let i = 0; i < d.habilidades.length; i += porLinha) {
      const bloco = d.habilidades.slice(i, i + porLinha);
      const runs: TextRun[] = [];
      bloco.forEach((hab, idx) => {
        if (idx > 0) {
          runs.push(
            new TextRun({
              text: "    •    ",
              size: 20,
              color: COR_SUAVES,
              font: "Calibri",
            }),
          );
        }
        runs.push(
          new TextRun({
            text: hab,
            size: 20,
            bold: true,
            color: COR_TEXTO,
            font: "Calibri",
          }),
        );
      });

      children.push(
        new Paragraph({
          spacing: { after: 50, line: 260 },
          children: runs,
        }),
      );
    }
  }

  if (d.idiomas.length > 0) {
    children.push(criarSecaoDocx("IDIOMAS", COR_PRIMARIA));

    d.idiomas.forEach((idioma) => {
      children.push(
        new Paragraph({
          spacing: { after: 40, line: 260 },
          bullet: { level: 0 },
          children: [
            new TextRun({
              text: idioma.nome,
              bold: true,
              size: 20,
              color: COR_TEXTO,
              font: "Calibri",
            }),
            idioma.nivel
              ? new TextRun({
                  text: ` — ${idioma.nivel}`,
                  size: 20,
                  color: COR_SUAVES,
                  font: "Calibri",
                })
              : new TextRun({ text: "", size: 20, font: "Calibri" }),
          ],
        }),
      );
    });
  }

  const doc = new Document({
    creator: "CIJA",
    title: `Currículo — ${d.nome}`,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.7),
              bottom: convertInchesToTwip(0.7),
              left: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
            },
          },
        },
        children,
      },
    ],
  });

  try {
    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curriculo-${d.nome.toLowerCase().replace(/\s+/g, "-") || "profissional"}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  } catch (error: unknown) {
    console.error("Erro ao gerar DOCX:", error);
    throw new Error("Falha ao gerar DOCX");
  }
}

export function criarSecaoDocx(titulo: string, cor: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    border: {
      bottom: { color: "E5E7EB", space: 4, style: BorderStyle.SINGLE, size: 6 },
    },
    children: [
      new TextRun({
        text: titulo,
        bold: true,
        size: 22,
        color: cor,
        font: "Calibri",
      }),
    ],
  });
}
