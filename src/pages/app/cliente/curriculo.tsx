import React, { useEffect, useState } from "react";
import { Sidebar } from "../../../components/sideBar/sideBar";
import { supabase } from "supabaseClient"; 
import styles from "./curriculo.module.css";

export const Curriculo: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Estados unificados batendo 100% com o seu formulário atual
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [email, setEmail] = useState("");
  const [resumo, setResumo] = useState("");
  const [competencias, setCompetencias] = useState("");
  const [experiencias, setExperiencias] = useState("");
  const [curso, setCurso] = useState("");

  useEffect(() => {
    carregarDadosCompletos();
  }, []);

  async function carregarDadosCompletos() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      
      const uid = userData.user.id;
      setUserId(uid);
      setEmail(userData.user.email || "");

      // 1. Busca os dados cadastrais na tabela 'jovem_aprendiz'
      const { data: usuarioData } = await supabase
        .from("jovem_aprendiz")
        .select("nome, telefone, endereco")
        .eq("id_ja", uid)
        .maybeSingle();

      if (usuarioData) {
        setNomeCompleto(usuarioData.nome || "");
        setTelefone(usuarioData.telefone || "");
        setEndereco(usuarioData.endereco || "");
      }

      // 2. Busca os dados profissionais na tabela 'curriculo'
      const { data: cvData } = await supabase
        .from("curriculo")
        .select("descricao, competencias, experiencias, curso")
        .eq("id_ja", uid)
        .maybeSingle();

      if (cvData) {
        // Aqui mapeamos a coluna 'descricao' do banco para o seu estado 'resumo' da tela
        setResumo(cvData.descricao || "");
        setCompetencias(cvData.competencias || "");
        setExperiencias(cvData.experiencias || "");
        setCurso(cvData.curso || "");
      }
    } catch (err) {
      console.error("Erro ao mesclar dados para o PDF:", err);
    } finally {
      setFetching(false);
    }
  }

  async function salvarCurriculo(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    try {
      setLoading(true);

      if (!nomeCompleto.trim()) {
        alert("O nome completo é obrigatório.");
        return;
      }

      // 1. Atualiza os dados básicos cadastrais
      await supabase
        .from("jovem_aprendiz")
        .update({
          nome: nomeCompleto.trim(),
          telefone: telefone.trim(),
          endereco: endereco.trim(),
        })
        .eq("id_ja", userId);

      // 2. Salva as atualizações profissionais (Upsert na tabela 'curriculo')
      const { error } = await supabase
        .from("curriculo")
        .upsert({
          id_ja: userId,
          descricao: resumo.trim(), // Salvando o estado 'resumo' na coluna 'descricao' do banco
          competencias: competencias.trim(),
          experiencias: experiencias.trim(),
          curso: curso.trim(),
        }, { onConflict: "id_ja" });

      if (error) throw error;

      alert("Currículo atualizado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar dados profissionais:", err);
      alert(`Falha ao salvar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // Função para abrir a janela separada e gerar o PDF corporativo elegante
  function gerarPdf() {
    const janelaImpressao = window.open("", "_blank");
    if (!janelaImpressao) {
      alert("Por favor, permita pop-ups para gerar o PDF.");
      return;
    }

    // Formata a string de competências separadas por vírgula em itens de lista <li>
    const listaSkills = competencias 
      ? competencias.split(",").map(skill => `<li>${skill.trim()}</li>`).join("")
      : "<li>Qualificação Profissional</li>";

    janelaImpressao.document.write(`
      <html>
        <head>
          <title>Currículo Profissional - ${nomeCompleto || "Candidato"}</title>
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
                <h1>${nomeCompleto || "Nome do Candidato"}</h1>
                <div class="subtitle">Jovem Aprendiz / Perfil Técnico</div>
              </div>

              <div class="section-title">Resumo Profissional</div>
              <div class="content-text">${resumo || "Sem resumo profissional preenchido."}</div>

              <div class="section-title">Experiência e Projetos</div>
              <div class="exp-title">Desenvolvimento Prático — ${experiencias || "Projetos Acadêmicos"}</div>
              <div class="exp-sub">CIJA — Centro de Integração Jovem Aprendiz</div>
              <div class="content-text">
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

  if (fetching) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.content}>
          <p className={styles.loadingText}>Sincronizando dados com o Supabase...</p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.content}>
        <div className={styles.header}>
          <h1>Revisar Currículo</h1>
          <p>Confirme os dados sincronizados do seu painel e gere o arquivo PDF corporativo para envio.</p>
        </div>

        <form onSubmit={salvarCurriculo} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Nome Completo</label>
            <input type="text" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} required />
          </div>

          <div className={styles.gridTwo}>
            <div className={styles.formGroup}>
              <label>Telefone</label>
              <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label>Curso Atual</label>
              <input type="text" value={curso} onChange={(e) => setCurso(e.target.value)} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Endereço / Bairro</label>
            <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </div>

          <div className={styles.formGroup}>
            <label>Competências técnicas (Separe por vírgulas)</label>
            <input 
              type="text" 
              value={competencias} 
              placeholder="Ex: Front-end, React, SQL, Organização" 
              onChange={(e) => setCompetencias(e.target.value)} 
            />
          </div>

          <div className={styles.formGroup}>
            <label>Resumo Profissional</label>
            <textarea rows={4} value={resumo} onChange={(e) => setResumo(e.target.value)} />
          </div>

          <div className={styles.formGroup}>
            <label>Projetos / Experiência Principal</label>
            <input type="text" value={experiencias} onChange={(e) => setExperiencias(e.target.value)} />
          </div>

          <div className={styles.buttonRow}>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? "Gravando..." : "Atualizar Dados"}
            </button>
            <button type="button" onClick={gerarPdf} className={styles.pdfBtn} disabled={!nomeCompleto}>
              Visualizar & Baixar PDF Elegante
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Curriculo;