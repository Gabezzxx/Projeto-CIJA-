import { DadosNormalizados, escapeHtml } from "../utils/normalizarDados";

export function renderHtmlCurriculo(d: DadosNormalizados): string {
  const contatoItems: string[] = [];
  if (d.cidade) contatoItems.push(`<span>${escapeHtml(d.cidade)}</span>`);
  if (d.telefone) contatoItems.push(`<span>${escapeHtml(d.telefone)}</span>`);
  if (d.email) contatoItems.push(`<span>${escapeHtml(d.email)}</span>`);
  if (d.linkedin) contatoItems.push(`<span>${escapeHtml(d.linkedin)}</span>`);
  if (d.github) contatoItems.push(`<span>${escapeHtml(d.github)}</span>`);

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Currículo - ${escapeHtml(d.nome)}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm 20mm;
        }
        body {
          font-family: 'Inter', 'Segoe UI', Helvetica, Arial, sans-serif;
          color: #111827;
          background-color: #ffffff;
          margin: 0;
          padding: 0;
          font-size: 12px;
          line-height: 1.5;
        }
        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        h1, h2, h3, p, ul {
          orphans: 3;
          widows: 3;
        }
      </style>
    </head>
    <body>
      <div style="width:100%;box-sizing:border-box;">
        <div style="border-bottom:3px solid #1e3a8a;padding-bottom:18px;margin-bottom:22px;text-align:center;">
          <h1 style="font-size:26px;font-weight:800;color:#1e3a8a;text-transform:uppercase;margin:0 0 6px 0;letter-spacing:0.5px;">
            ${escapeHtml(d.nome)}
          </h1>
          <div style="font-size:11px;color:#4b5563;display:flex;justify-content:center;flex-wrap:wrap;gap:16px;font-weight:500;">
            ${contatoItems.join(" &bull; ")}
          </div>
        </div>

        ${
          d.resumo
            ? `
          <div class="section">
            <h2 style="font-size:12px;font-weight:700;color:#1e3a8a;text-transform:uppercase;border-bottom:1.5px solid #e5e7eb;padding-bottom:4px;margin:0 0 8px 0;">
              Resumo Profissional
            </h2>
            <p style="font-size:11.5px;line-height:1.6;color:#374151;margin:0;text-align:justify;">
              ${escapeHtml(d.resumo)}
            </p>
          </div>`
            : ""
        }

        ${
          d.experiencias.length > 0
            ? `
          <div class="section">
            <h2 style="font-size:12px;font-weight:700;color:#1e3a8a;text-transform:uppercase;border-bottom:1.5px solid #e5e7eb;padding-bottom:4px;margin:0 0 10px 0;">
              Experiência Profissional
            </h2>
            ${d.experiencias
              .map(
                (exp) => `
              <div style="margin-bottom:12px;page-break-inside:avoid;">
                <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:2px;">
                  <h3 style="font-size:12px;font-weight:700;color:#111827;margin:0;">${escapeHtml(exp.cargo)}</h3>
                  <span style="font-size:10.5px;font-weight:600;color:#6b7280;">${escapeHtml(exp.periodo)}</span>
                </div>
                <div style="font-size:11.5px;font-weight:600;color:#2563eb;margin-bottom:4px;">${escapeHtml(exp.empresa)}</div>
                ${
                  exp.bullets.length > 0
                    ? `<ul style="margin:0 0 0 16px;padding:0;">${exp.bullets
                        .map(
                          (b) =>
                            `<li style="font-size:11px;line-height:1.5;color:#374151;margin-bottom:2px;text-align:justify;">${escapeHtml(b)}</li>`,
                        )
                        .join("")}</ul>`
                    : ""
                }
              </div>`,
              )
              .join("")}
          </div>`
            : ""
        }

        ${
          d.formacao.length > 0
            ? `
          <div class="section">
            <h2 style="font-size:12px;font-weight:700;color:#1e3a8a;text-transform:uppercase;border-bottom:1.5px solid #e5e7eb;padding-bottom:4px;margin:0 0 10px 0;">
              Formação Acadêmica
            </h2>
            ${d.formacao
              .map(
                (form) => `
              <div style="margin-bottom:8px;page-break-inside:avoid;">
                <div style="display:flex;justify-content:space-between;align-items:baseline;">
                  <h3 style="font-size:11.5px;font-weight:700;color:#111827;margin:0;">${escapeHtml(form.curso)}${form.status ? ` <span style="font-weight:500;color:#6b7280;font-size:10.5px;">&mdash; ${escapeHtml(form.status)}</span>` : ""}</h3>
                  <span style="font-size:10.5px;color:#6b7280;">${escapeHtml(form.periodo)}</span>
                </div>
                ${form.instituicao ? `<div style="font-size:11px;color:#4b5563;margin-top:2px;">${escapeHtml(form.instituicao)}</div>` : ""}
              </div>`,
              )
              .join("")}
          </div>`
            : ""
        }

        ${
          d.habilidades.length > 0
            ? `
          <div class="section">
            <h2 style="font-size:12px;font-weight:700;color:#1e3a8a;text-transform:uppercase;border-bottom:1.5px solid #e5e7eb;padding-bottom:4px;margin:0 0 10px 0;">
              Habilidades e Competências
            </h2>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${d.habilidades
                .map(
                  (hab) =>
                    `<span style="background-color:#f3f4f6;color:#1f2937;padding:3px 6px;border-radius:4px;font-size:10.5px;font-weight:600;border:1px solid #e5e7eb;">${escapeHtml(hab)}</span>`,
                )
                .join("")}
            </div>
          </div>`
            : ""
        }

        ${
          d.idiomas.length > 0
            ? `
          <div class="section">
            <h2 style="font-size:12px;font-weight:700;color:#1e3a8a;text-transform:uppercase;border-bottom:1.5px solid #e5e7eb;padding-bottom:4px;margin:0 0 8px 0;">
              Idiomas
            </h2>
            <ul style="margin:0 0 0 16px;padding:0;">
              ${d.idiomas
                .map(
                  (i) =>
                    `<li style="font-size:11px;color:#374151;margin-bottom:2px;"><strong>${escapeHtml(i.nome)}</strong>${i.nivel ? ` <span style="color:#6b7280;">&mdash; ${escapeHtml(i.nivel)}</span>` : ""}</li>`,
                )
                .join("")}
            </ul>
          </div>`
            : ""
        }
      </div>
    </body>
    </html>
  `;
}
