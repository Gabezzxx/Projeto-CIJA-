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
  // Dados unificados idênticos ao modelo do candidato
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

  const navigate = useNavigate();

  useDocumentTitle("CIJA - Candidatos às suas Vagas");

  useEffect(() => {
    buscarCandidatos();
  }, []);

  async function buscarCandidatos() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Busca as candidaturas das vagas desta empresa
      const { data: dadosCandidaturas, error } = await supabase
        .from("candidaturas")
        .select(`
          id_candidatura,
          data_candidatura,
          id_candidato,
          vaga!inner(titulo, id_em)
        `)
        .eq("vaga.id_em", user.id)
        .order("data_candidatura", { ascending: false });

      if (error) throw error;

      // 2. Mescla os dados de 'jovem_aprendiz' e 'curriculo' (idêntico ao do cliente)
      const candidaturasComCurriculo = await Promise.all(
        (dadosCandidaturas || []).map(async (cand: any) => {
          // Busca dados cadastrais básicos
          const { data: dadosUsuario } = await supabase
            .from("jovem_aprendiz")
            .select("nome, telefone, endereco, email")
            .eq("id_ja", cand.id_candidato)
            .maybeSingle();

          // Busca dados profissionais
          const { data: dadosCv } = await supabase
            .from("curriculo")
            .select("descricao, competencias, experiencias, curso")
            .eq("id_ja", cand.id_candidato)
            .maybeSingle();

          return {
            ...cand,
            curriculo: dadosUsuario || dadosCv ? {
              nome: dadosUsuario?.nome || "",
              telefone: dadosUsuario?.telefone || "",
              endereco: dadosUsuario?.endereco || "",
              email: dadosUsuario?.email || "",
              descricao: dadosCv?.descricao || "",
              competencias: dadosCv?.competencias || "",
              experiencias: dadosCv?.experiencias || "",
              curso: dadosCv?.curso || "",
            } : undefined
          };
        })
      );

      setCandidaturas(candidaturasComCurriculo);
    } catch (err) {
      console.error("Erro ao carregar candidatos:", err);
    } finally {
      setLoading(false);
    }
  }

  
  // GERA O CURRÍCULO EM PDF EXATAMENTE IGUAL AO DO CLIENTE
  function abrirCurriculo(candidatura: Candidatura) {
    if (!candidatura.curriculo) {
      alert("Este candidato não possui informações de currículo preenchidas.");
      return;
    }

    const { nome, telefone, endereco, email, descricao, competencias, experiencias, curso } = candidatura.curriculo;

    const janelaImpressao = window.open("", "_blank");
    if (!janelaImpressao) {
      alert("Por favor, permita pop-ups para visualizar o currículo.");
      return;
    }

    // Formata as competências exatamente como no cliente
    const listaSkills = competencias 
      ? competencias.split(",").map(skill => `<li>${skill.trim()}</li>`).join("")
      : "<li>Qualificação Profissional</li>";

    janelaImpressao.document.write(`
      <html>
        <head>
          <title>Currículo Profissional - ${nome || "Candidato"}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              font-family: 'Segoe UI', Arial, sans-serif;
              color: #2D3748;
              background-color: #ffffff;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .cv-container {
              display: flex;
              min-height: 297mm;
            }
            
            /* Coluna da Esquerda (Informações de Contato e Skills) */
            .sidebar {
              width: 33%;
              background-color: #1A1D24;
              color: #FFFFFF;
              padding: 25mm 12mm;
              box-sizing: border-box;
            }
            .sidebar h3 {
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #A855F7;
              margin-top: 25px;
              margin-bottom: 10px;
              border-bottom: 1px solid #3A3F4D;
              padding-bottom: 5px;
            }
            .sidebar p {
              font-size: 12px;
              line-height: 1.6;
              color: #E2E8F0;
              margin: 0 0 12px 0;
            }
            .sidebar p strong {
              color: #FFFFFF;
              display: block;
              font-size: 10px;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .sidebar ul {
              padding-left: 14px;
              margin: 0;
              color: #E2E8F0;
            }
            .sidebar ul li {
              font-size: 12px;
              margin-bottom: 5px;
            }

            /* Coluna da Direita (Experiência e Histórico) */
            .main-content {
              width: 67%;
              padding: 25mm 18mm;
              box-sizing: border-box;
            }
            .header-block {
              margin-bottom: 30px;
            }
            .header-block h1 {
              font-size: 32px;
              font-weight: 700;
              color: #1A1D24;
              margin: 0 0 5px 0;
            }
            .header-block .subtitle {
              font-size: 13px;
              color: #64748B;
              text-transform: uppercase;
              letter-spacing: 2px;
              font-weight: 600;
            }
            
            .section-title {
              font-size: 15px;
              font-weight: 700;
              text-transform: uppercase;
              color: #1A1D24;
              letter-spacing: 1px;
              margin: 25px 0 10px 0;
              display: flex;
              align-items: center;
            }
            .section-title::after {
              content: "";
              flex: 1;
              height: 1.5px;
              background-color: #E2E8F0;
              margin-left: 12px;
            }
            
            .content-text {
              font-size: 13px;
              line-height: 1.6;
              color: #475569;
              text-align: justify;
              margin: 0 0 15px 0;
              white-space: pre-wrap;
            }
            .exp-title {
              font-weight: 600;
              color: #1A1D24;
              margin-bottom: 2px;
              font-size: 13.5px;
            }
            .exp-sub {
              font-size: 11.5px;
              color: #64748B;
              margin-bottom: 8px;
            }
          </style>
        </head>
        <body>
          <div class="cv-container">
            <div class="sidebar">
              <h3>Contato</h3>
              <p><strong>Telefone</strong>${telefone || "Não informado"}</p>
              <p><strong>E-mail</strong>${email || "Não informado"}</p>
              <p><strong>Localização</strong>${endereco || "Não informado"}</p>

              <h3>Formação</h3>
              <p><strong>Curso Atual</strong>${curso || "Não informado"}</p>
              <p><strong>Instituição</strong>Centro de Integração Jovem Aprendiz (CIJA)</p>

              <h3>Competências</h3>
              <ul>${listaSkills}</ul>
            </div>

            <div class="main-content">
              <div class="header-block">
                <h1>${nome || "Nome do Candidato"}</h1>
                <div class="subtitle">Jovem Aprendiz / Perfil Técnico</div>
              </div>

              <div class="section-title">Resumo Profissional</div>
              <div class="content-text">${descricao || "Sem resumo profissional preenchido."}</div>

              <div class="section-title">Experiência e Projetos</div>
              <div class="exp-title">Desenvolvimento Prático — ${experiencias || "Projetos Acadêmicos"}</div>
              <div class="exp-sub">CIJA — Centro de Integração Jovem Aprendiz</div>
              <div class="content-text" style="margin-bottom: 0;">
                Atuação ativa e prática em atividades de capacitação corporativa voltadas ao mercado de trabalho, com foco no desenvolvimento de competências técnicas, autonomia operacional e resolução de problemas práticos.
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    janelaImpressao.document.close();
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

    // Verifica se já existe conversa entre empresa e candidato
    const { data: conversaExistente, error: erroBusca } = await supabase
      .from("mensagens")
      .select("id_msg")
      .eq("id_em", user.id)
      .eq("id_ja", idCandidato)
      .limit(1);

    if (erroBusca) throw erroBusca;

    // Se não existir nenhuma mensagem ainda
    if (!conversaExistente || conversaExistente.length === 0) {
      const { error: erroCriacao } = await supabase
        .from("mensagens")
        .insert({
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
    <div className={styles.container} style={{ display: "flex", width: "100vw", minHeight: "100vh", backgroundColor: "#09090b" }}>
      <SidebarEmpresa />
      
      <main className={styles.main} style={{ marginLeft: "260px", padding: "2rem", flex: 1, boxSizing: "border-box" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ color: "#fff", fontSize: "28px", margin: 0 }}>Candidatos às suas Vagas</h1>
          <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>Acompanhe os jovens que demonstraram interesse nas suas oportunidades.</p>
        </div>

        {loading ? (
          <p style={{ color: "#a855f7" }}>Carregando dados...</p>
        ) : candidaturas.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>Ainda não recebeu candidaturas para as suas vagas.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
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
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <h3 style={{ color: "#a855f7", margin: "0 0 1rem 0" }}>Vaga: {candidatura.vaga.titulo}</h3>
                  
                  {candidatura.curriculo ? (
                    <div style={{ color: "#f1f5f9", fontSize: "14px", lineHeight: "1.6" }}>
                      <p><strong>Nome:</strong> {candidatura.curriculo.nome}</p>
                      <p><strong>Telefone:</strong> {candidatura.curriculo.telefone || "Não informado"}</p>
                      <p style={{ color: "#94a3b8", fontSize: "13px", fontStyle: "italic", marginTop: "0.5rem" }}>
                        "{candidatura.curriculo.descricao || "Sem resumo profissional"}"
                      </p>
                    </div>
                  ) : (
                    <div style={{ color: "#f1f5f9", fontSize: "14px" }}>
                      <p><strong>Candidato ID:</strong> {candidatura.id_candidato.substring(0, 8)}...</p>
                      <p style={{ color: "#94a3b8", fontSize: "12px" }}>Perfil detalhado pendente de preenchimento pelo usuário.</p>
                    </div>
                  )}
                </div>

                <div>
                  <p style={{ color: "#64748b", fontSize: "12px", marginTop: "1rem" }}>
                    Aplicado em: {new Date(candidatura.data_candidatura).toLocaleDateString("pt-BR")}
                  </p>
                  <div className={styles.botoesAcao}>
                  <button 
                    onClick={() => abrirCurriculo(candidatura)}
                    className={styles.btnCurriculo}
                  >
                    Ver Currículo (PDF)
                  </button>

                  <button 
                    onClick={() => iniciarConversa(candidatura.id_candidato)}
                    className={styles.btnConversa}
                    >Conversar</button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CandidatosEmpresa;