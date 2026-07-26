import React, { useEffect, useState } from "react";
import styles from "./candidatosEmpresa.module.css";
import { SidebarEmpresa } from "../../../components/sideBar/sideBarEmpresa";
import { supabase } from "../../../supabaseClient";
import { useDocumentTitle } from "Hooks/useDocumentTitle";
import { useNavigate } from "react-router-dom";

interface Candidatura {
  id_candidatura: string;
  data_candidatura: string;
  id_candidato: string;
  vaga: {
    titulo: string;
    id_em: string;
  };
  curriculo?: {
    nome: string;
    telefone: string;
    endereco: string;
    email: string;
    descricao: string;
    competencias: string;
    experiencias: string;
    curso: string;
  };
}

const CandidatosEmpresa: React.FC = () => {
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidaturaSelecionada, setCandidaturaSelecionada] =
    useState<Candidatura | null>(null);

  const navigate = useNavigate();

  useDocumentTitle("CIJA - Candidatos às suas Vagas");

  useEffect(() => {
    buscarCandidatos();
  }, []);

  async function buscarCandidatos() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Busca as candidaturas das vagas desta empresa
      const { data: dadosCandidaturas, error } = await supabase
        .from("candidaturas")
        .select(
          `
          id_candidatura,
          data_candidatura,
          id_candidato,
          vaga!inner(titulo, id_em)
        `,
        )
        .eq("vaga.id_em", user.id)
        .order("data_candidatura", { ascending: false });

      if (error) throw error;

      // 2. Mescla os dados de 'jovem_aprendiz' e 'curriculo'
      const candidaturasComCurriculo = await Promise.all(
        (dadosCandidaturas || []).map(async (cand: any) => {
          const { data: dadosUsuario } = await supabase
            .from("jovem_aprendiz")
            .select("nome, telefone, endereco, email")
            .eq("id_ja", cand.id_candidato)
            .maybeSingle();

          const { data: dadosCv } = await supabase
            .from("curriculo")
            .select("descricao, competencias, experiencias, curso")
            .eq("id_ja", cand.id_candidato)
            .maybeSingle();

          return {
            ...cand,
            curriculo:
              dadosUsuario || dadosCv
                ? {
                    nome: dadosUsuario?.nome || "",
                    telefone: dadosUsuario?.telefone || "",
                    endereco: dadosUsuario?.endereco || "",
                    email: dadosUsuario?.email || "",
                    descricao: dadosCv?.descricao || "",
                    competencias: dadosCv?.competencias || "",
                    experiencias: dadosCv?.experiencias || "",
                    curso: dadosCv?.curso || "",
                  }
                : undefined,
          };
        }),
      );

      setCandidaturas(candidaturasComCurriculo);
    } catch (err) {
      console.error("Erro ao carregar candidatos:", err);
    } finally {
      setLoading(false);
    }
  }

  function abrirCurriculo(candidatura: Candidatura) {
    if (!candidatura.curriculo) {
      alert("Este candidato não possui informações de currículo preenchidas.");
      return;
    }
    setCandidaturaSelecionada(candidatura);
  }

  async function iniciarConversa(idCandidato: string) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Usuário não autenticado.");
        return;
      }

      const { data: conversaExistente, error: erroBusca } = await supabase
        .from("mensagens")
        .select("id_msg")
        .eq("id_em", user.id)
        .eq("id_ja", idCandidato)
        .limit(1);

      if (erroBusca) throw erroBusca;

      if (!conversaExistente || conversaExistente.length === 0) {
        const { error: erroCriacao } = await supabase.from("mensagens").insert({
          id_ja: idCandidato,
          id_em: user.id,
          enviado_por_jovem: false,
          conteudo: "Conversa iniciada",
          lida: false,
          data_envio: new Date().toISOString(),
        });

        if (erroCriacao) throw erroCriacao;
      }

      navigate("/mensagensEmpresa");
    } catch (error) {
      console.error("Erro ao iniciar conversa:", error);
      alert("Não foi possível iniciar a conversa.");
    }
  }

  return (
    <div
      className={styles.container}
      style={{
        display: "flex",
        width: "100vw",
        minHeight: "100vh",
        backgroundColor: "#09090b",
      }}
    >
      <SidebarEmpresa />

      <main
        className={styles.main}
        style={{
          marginLeft: "260px",
          padding: "2rem",
          flex: 1,
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ color: "#fff", fontSize: "28px", margin: 0 }}>
            Candidatos às suas Vagas
          </h1>
          <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>
            Acompanhe os jovens que demonstraram interesse nas suas
            oportunidades.
          </p>
        </div>

        {loading ? (
          <p style={{ color: "#a855f7" }}>Carregando dados...</p>
        ) : candidaturas.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>
            Ainda não recebeu candidaturas para as suas vagas.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {candidaturas.map((candidatura) => (
              <div
                key={candidatura.id_candidatura}
                style={{
                  background: "#131129",
                  padding: "1.5rem",
                  borderRadius: "8px",
                  border: "1px solid #262147",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3 style={{ color: "#a855f7", margin: "0 0 1rem 0" }}>
                    Vaga: {candidatura.vaga.titulo}
                  </h3>

                  {candidatura.curriculo ? (
                    <div
                      style={{
                        color: "#f1f5f9",
                        fontSize: "14px",
                        lineHeight: "1.6",
                      }}
                    >
                      <p>
                        <strong>Nome:</strong> {candidatura.curriculo.nome}
                      </p>
                      <p>
                        <strong>Telefone:</strong>{" "}
                        {candidatura.curriculo.telefone || "Não informado"}
                      </p>
                      <p
                        style={{
                          color: "#94a3b8",
                          fontSize: "13px",
                          fontStyle: "italic",
                          marginTop: "0.5rem",
                        }}
                      >
                        {candidatura.curriculo.descricao ||
                          "Sem resumo profissional"}
                      </p>
                    </div>
                  ) : (
                    <div style={{ color: "#f1f5f9", fontSize: "14px" }}>
                      <p>
                        Perfil detalhado pendente de preenchimento pelo
                        candidato.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "12px",
                      marginTop: "1rem",
                    }}
                  >
                    Aplicado em:{" "}
                    {new Date(candidatura.data_candidatura).toLocaleDateString(
                      "pt-BR",
                    )}
                  </p>
                  <div className={styles.botoesAcao}>
                    <button
                      onClick={() => abrirCurriculo(candidatura)}
                      className={styles.btnCurriculo}
                    >
                      Ver Currículo
                    </button>

                    <button
                      onClick={() => iniciarConversa(candidatura.id_candidato)}
                      className={styles.btnConversa}
                    >
                      Conversar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL SEGURO DE VISUALIZAÇÃO E IMPRESSÃO DO CURRÍCULO (XSS-Safe com JSX) */}
      {candidaturaSelecionada && candidaturaSelecionada.curriculo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          {/* Controles Flutuantes (Não saem na impressão) */}
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              display: "flex",
              gap: "10px",
              zIndex: 1001,
            }}
            className="no-print"
          >
            <button
              onClick={() => window.print()}
              style={{
                backgroundColor: "#9333ea",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Imprimir / Salvar PDF
            </button>
            <button
              onClick={() => setCandidaturaSelecionada(null)}
              style={{
                backgroundColor: "#ef4444",
                color: "#fff",
                border: "none",
                padding: "10px 20px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Fechar
            </button>
          </div>

          {/* Folha A4 do Currículo */}
          <div
            className="cv-print-area"
            style={{
              background: "#ffffff",
              color: "#2D3748",
              width: "210mm",
              minHeight: "297mm",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              display: "flex",
              position: "relative",
              boxSizing: "border-box",
              fontFamily: "'Segoe UI', Arial, sans-serif",
            }}
          >
            {/* Coluna da Esquerda */}
            <div
              style={{
                width: "33%",
                backgroundColor: "#1A1D24",
                color: "#FFFFFF",
                padding: "25mm 12mm",
                boxSizing: "border-box",
              }}
            >
              <h3
                style={{
                  fontSize: "13px",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  color: "#A855F7",
                  marginTop: "25px",
                  marginBottom: "10px",
                  borderBottom: "1px solid #3A3F4D",
                  paddingBottom: "5px",
                }}
              >
                Contato
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  lineHeight: "1.6",
                  color: "#E2E8F0",
                  margin: "0 0 12px 0",
                }}
              >
                <strong
                  style={{
                    color: "#FFFFFF",
                    display: "block",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    marginBottom: "2px",
                  }}
                >
                  Telefone
                </strong>
                {candidaturaSelecionada.curriculo.telefone || "Não informado"}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  lineHeight: "1.6",
                  color: "#E2E8F0",
                  margin: "0 0 12px 0",
                }}
              >
                <strong
                  style={{
                    color: "#FFFFFF",
                    display: "block",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    marginBottom: "2px",
                  }}
                >
                  E-mail
                </strong>
                {candidaturaSelecionada.curriculo.email || "Não informado"}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  lineHeight: "1.6",
                  color: "#E2E8F0",
                  margin: "0 0 12px 0",
                }}
              >
                <strong
                  style={{
                    color: "#FFFFFF",
                    display: "block",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    marginBottom: "2px",
                  }}
                >
                  Localização
                </strong>
                {candidaturaSelecionada.curriculo.endereco || "Não informado"}
              </p>

              <h3
                style={{
                  fontSize: "13px",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  color: "#A855F7",
                  marginTop: "25px",
                  marginBottom: "10px",
                  borderBottom: "1px solid #3A3F4D",
                  paddingBottom: "5px",
                }}
              >
                Formação
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  lineHeight: "1.6",
                  color: "#E2E8F0",
                  margin: "0 0 12px 0",
                }}
              >
                <strong
                  style={{
                    color: "#FFFFFF",
                    display: "block",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    marginBottom: "2px",
                  }}
                >
                  Curso Atual
                </strong>
                {candidaturaSelecionada.curriculo.curso || "Não informado"}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  lineHeight: "1.6",
                  color: "#E2E8F0",
                  margin: "0 0 12px 0",
                }}
              >
                <strong
                  style={{
                    color: "#FFFFFF",
                    display: "block",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    marginBottom: "2px",
                  }}
                >
                  Instituição
                </strong>
                Centro de Integração Jovem Aprendiz (CIJA)
              </p>

              <h3
                style={{
                  fontSize: "13px",
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  color: "#A855F7",
                  marginTop: "25px",
                  marginBottom: "10px",
                  borderBottom: "1px solid #3A3F4D",
                  paddingBottom: "5px",
                }}
              >
                Competências
              </h3>
              <ul style={{ paddingLeft: "14px", margin: 0, color: "#E2E8F0" }}>
                {candidaturaSelecionada.curriculo.competencias ? (
                  candidaturaSelecionada.curriculo.competencias
                    .split(",")
                    .map((s, idx) => (
                      <li
                        key={idx}
                        style={{ fontSize: "12px", marginBottom: "5px" }}
                      >
                        {s.trim()}
                      </li>
                    ))
                ) : (
                  <li style={{ fontSize: "12px", marginBottom: "5px" }}>
                    Qualificação Profissional
                  </li>
                )}
              </ul>
            </div>

            {/* Coluna da Direita */}
            <div
              style={{
                width: "67%",
                padding: "25mm 18mm",
                boxSizing: "border-box",
              }}
            >
              <div style={{ marginBottom: "30px" }}>
                <h1
                  style={{
                    fontSize: "32px",
                    fontWeight: 700,
                    color: "#1A1D24",
                    margin: "0 0 5px 0",
                  }}
                >
                  {candidaturaSelecionada.curriculo.nome || "Nome do Candidato"}
                </h1>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#64748B",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    fontWeight: 600,
                  }}
                >
                  Jovem Aprendiz / Perfil Técnico
                </div>
              </div>

              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#1A1D24",
                  letterSpacing: "1px",
                  margin: "25px 0 10px 0",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Resumo Profissional
              </div>
              <div
                style={{
                  fontSize: "13px",
                  lineHeight: "1.6",
                  color: "#475569",
                  textAlign: "justify",
                  margin: "0 0 15px 0",
                  whiteSpace: "pre-wrap",
                }}
              >
                {candidaturaSelecionada.curriculo.descricao ||
                  "Sem resumo profissional preenchido."}
              </div>

              <div
                style={{
                  fontSize: "15px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#1A1D24",
                  letterSpacing: "1px",
                  margin: "25px 0 10px 0",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Experiência e Projetos
              </div>
              <div
                style={{
                  fontWeight: 600,
                  color: "#1A1D24",
                  marginBottom: "2px",
                  fontSize: "13.5px",
                }}
              >
                Desenvolvimento Prático —{" "}
                {candidaturaSelecionada.curriculo.experiencias ||
                  "Projetos Acadêmicos"}
              </div>
              <div
                style={{
                  fontSize: "11.5px",
                  color: "#64748B",
                  marginBottom: "8px",
                }}
              >
                CIJA — Centro de Integração Jovem Aprendiz
              </div>
              <div
                style={{
                  fontSize: "13px",
                  lineHeight: "1.6",
                  color: "#475569",
                  textAlign: "justify",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                }}
              >
                Atuação ativa e prática em atividades de capacitação corporativa
                voltadas ao mercado de trabalho, com foco no desenvolvimento de
                competências técnicas, autonomia operacional e resolução de
                problemas práticos.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regras CSS para Otimização da Impressão */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .cv-print-area, .cv-print-area * {
            visibility: visible;
          }
          .cv-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CandidatosEmpresa;
