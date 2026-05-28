import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../../../components/sideBar/sideBar";
import styles from "./clientDash.module.css";
import { supabase } from "supabaseClient";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // =========================================================
  // 🟢 INICIALIZAÇÃO SEGURA DO LOCALSTORAGE
  // =========================================================
  const [perfil, setPerfil] = useState(() => {
    const salvo = localStorage.getItem("usuario_logado");
    if (salvo) {
      try {
        const dados = JSON.parse(salvo);
        return {
          nome: dados.nome || "Usuário",
          avatar_url: dados.avatar_url
            ? `${dados.avatar_url}?t=${Date.now()}`
            : "",
          tipo: "Candidato",
        };
      } catch {
        localStorage.removeItem("usuario_logado");
      }
    }
    return { nome: "", avatar_url: "", tipo: "Candidato" };
  });

  const [percent, setPercent] = useState<number>(() => {
    const salvo = localStorage.getItem("usuario_logado_percent");
    return salvo ? parseInt(salvo, 10) : 0;
  });

  const [loading, setLoading] = useState(
    !localStorage.getItem("usuario_logado"),
  );

  useEffect(() => {
    let mounted = true;

    const fetchUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session || !session.user) return;

        const userId = session.user.id;
        const emailUsuario = session.user.email?.trim().toLowerCase();

        // Alinhado com o print do banco ('user_id' ao invés de 'id_ja')
        let { data: jaData } = await supabase
          .from("jovem_aprendiz")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        // Fallback robusto por e-mail caso o user_id na linha esteja NULL (exatamente como no seu print!)
        if (!jaData && emailUsuario) {
          const { data: listaJovens } = await supabase
            .from("jovem_aprendiz")
            .select("*");

          jaData =
            listaJovens?.find(
              (j) => j.email?.trim().toLowerCase() === emailUsuario,
            ) || null;
        }

        if (jaData && mounted) {
          const urlComCacheBuster = jaData.avatar_url
            ? `${jaData.avatar_url}?t=${Date.now()}`
            : "";

          setPerfil({
            nome: jaData.nome || "Usuário",
            avatar_url: urlComCacheBuster,
            tipo: "Candidato",
          });

          // Salva os dados limpos vindos do banco para o ProtectedRoute ler com sucesso
          localStorage.setItem("usuario_logado", JSON.stringify(jaData));

          //  CORREÇÃO 2 Busca o currículo usando a chave primária que existir na tabela do jovem
          const idParaCurriculo = jaData.id_ja || jaData.user_id;

          const { data: currData } = await supabase
            .from("curriculo")
            .select("*")
            .eq("id_ja", idParaCurriculo)
            .maybeSingle();

          if (currData) {
            let pontos = 0;
            if (currData.descricao) pontos += 20;
            if (currData.competencias) pontos += 20;
            if (currData.experiencias) pontos += 20;
            if (currData.curso) pontos += 20;
            if (currData.objetivo) pontos += 20;

            setPercent(pontos);
            localStorage.setItem("usuario_logado_percent", String(pontos));
          }
        }
      } catch (error) {
        console.error("Erro ao atualizar dados do dashboard:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUserData();

    return () => {
      mounted = false;
    };
  }, []);

  const color =
    percent >= 80 ? "#22c55e" : percent >= 60 ? "#facc15" : "#ff4d4d";

  if (loading)
    return <div className={styles.loading}>Sincronizando CIJA...</div>;

  const defaultAvatar =
    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.welcomeText}>
            <h1>Seja Bem-vindo 👋</h1>
            <p>Seu crescimento profissional começa aqui.</p>
          </div>

          <div
            className={styles.userProfile}
            onClick={() => navigate("/perfil")}
          >
            <div className={styles.profileText}>
              <span className={styles.userName}>{perfil.nome}</span>
              <span className={styles.userType}>{perfil.tipo}</span>
            </div>

            <div className={styles.avatarWrapper}>
              <img
                src={perfil.avatar_url || defaultAvatar}
                alt="User"
                className={styles.avatar}
              />
              <div className={styles.onlineDot} />
            </div>
          </div>
        </header>

        <section className={styles.heroSection}>
          <div className={styles.curriculoCard}>
            <h3>Nível do seu Currículo</h3>

            <div className={styles.progressData}>
              <span className={styles.percentage}>{percent}%</span>
              <span
                className={styles.statusBadge}
                style={{
                  color: color,
                  backgroundColor: `${color}15`,
                  borderColor: color,
                }}
              >
                {percent >= 80
                  ? "Expert"
                  : percent >= 60
                    ? "Intermediário"
                    : "Iniciante"}
              </span>
            </div>

            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${percent}%`, backgroundColor: color }}
              />
            </div>

            <button
              className={styles.btnAction}
              onClick={() => navigate("/perfil")}
            >
              Melhorar Currículo
            </button>
          </div>

          <div className={styles.tipsCard}>
            <h3>Dicas para melhorar seu perfil 🚀</h3>
            <ul className={styles.tipsList}>
              <li>
                <span>✓</span> Adicione <b>cursos profissionalizantes</b>
              </li>
              <li>
                <span>✓</span> Descreva melhor suas <b>habilidades</b>
              </li>
              <li>
                <span>✓</span> Inclua <b>experiências voluntárias</b>
              </li>
              <li>
                <span>✓</span> Defina um <b>objetivo profissional claro</b>
              </li>
              <li>
                <span>✓</span> Atualize seus dados <b>regularmente</b>
              </li>
              <li>
                <span>✓</span> Revise sua <b>gramática</b>
              </li>
            </ul>
          </div>
        </section>

        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <h4>Vagas Recomendadas</h4>
            <h2>0</h2>
            <p>Compatíveis com seu perfil</p>
          </div>
          <div className={styles.statItem}>
            <h4>Empresas Interessadas</h4>
            <h2>0</h2>
            <p>Seu perfil está em destaque 🔥</p>
          </div>
          <div className={styles.statItem}>
            <h4>Mensagens</h4>
            <h2>0</h2>
            <p>Novas notificações</p>
          </div>
        </div>

        <div
          className={styles.floatingChat}
          onClick={() => navigate("/mensagens")}
        >
          💬 <div className={styles.badge}>0</div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
