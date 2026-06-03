import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabaseClient";
import styles from "./menuEmpresa.module.css";
import { SidebarEmpresa } from "../../../components/sideBar/sideBarEmpresa";
import { useDocumentTitle } from "Hooks/useDocumentTitle";
interface Vaga {
  id_vag: string;
  id_em: string;
  titulo: string;
  descricao: string;
  carga_horaria: number;
  salario: number;
  data_publicada: string;
}

interface JovemAprendiz {
  id_ja: string;
  nome: string;
  email: string;
  avatar_url: string;
  data_cadastro: string;
}

const MenuEmpresa: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [vagas, setVagas] = useState<Vaga[]>([]);
  useDocumentTitle("CIJA - Menu da Empresa");
  const [metricas, setMetricas] = useState({
    vagasLancadas: 0,
    alcanceTotal: 0,
  });
  const [logoEmpresa, setLogoEmpresa] = useState<string>("");
  const [ultimoPerfil, setUltimoPerfil] = useState<JovemAprendiz | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    async function carregarDashboard() {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const uid = user.id;

        const { data: perfil } = await supabase
          .from("perfil_empresa")
          .select("logo")
          .eq("id_usuario", uid)
          .maybeSingle();

        if (perfil?.logo) {
          setLogoEmpresa(perfil.logo);
        }

        const { data: listaVagas, error } = await supabase
          .from("vaga")
          .select("*")
          .eq("id_em", uid)
          .order("data_publicada", { ascending: false });

        if (!error && listaVagas) {
          setVagas(listaVagas as Vaga[]);

          const { count: totalCandidaturas } = await supabase
            .from("candidaturas")
            .select("*", { count: "exact", head: true })
            .eq("id_empresa", uid);

          setMetricas({
            vagasLancadas: listaVagas.length,
            alcanceTotal: totalCandidaturas || 0,
          });
        }

        const { data: recentePerfil } = await supabase
          .from("jovem_aprendiz")
          .select("id_ja, nome, email, avatar_url, data_cadastro")
          .order("data_cadastro", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentePerfil) {
          setUltimoPerfil(recentePerfil as JovemAprendiz);
        }
      } catch (err) {
        console.error("Erro ao carregar dados da dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    carregarDashboard();
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <SidebarEmpresa />
        <div className={styles.mainWrapper}>
          <main
            className={styles.content}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p
              style={{
                fontSize: "18px",
                color: "#a855f7",
                fontWeight: 600,
              }}
            >
              Carregando painel de controle...
            </p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <SidebarEmpresa />

      <div className={styles.mainWrapper}>
        <main className={styles.content}>
          <div className={styles.header}>
            <h1>Início / Dashboard</h1>
            <p>
              Acompanhe em tempo real o desempenho das suas oportunidades
              publicadas.
            </p>
          </div>

          <div className={styles.gridTopoPrincipal}>
            <div className={styles.subGridMetricas}>
              <div className={styles.cardMetrica}>
                <div
                  className={`${styles.metaLabel} ${styles.metaLabelMetricas}`}
                >
                  Vagas Publicadas
                </div>
                <div className={styles.metaValor}>
                  {metricas.vagasLancadas}
                </div>
              </div>

              <div className={styles.cardMetrica}>
                <div
                  className={`${styles.metaLabel} ${styles.metaLabelMetricas}`}
                >
                  Interesses Recebidos
                </div>
                <div
                  className={styles.metaValor}
                  style={{ color: "#ffffff" }}
                >
                  {metricas.alcanceTotal}
                </div>
              </div>
            </div>

            <div className={styles.cardPerfilRecente}>
              <div className={styles.metaLabel}>Perfis Encontrados</div>

              {ultimoPerfil ? (
                <div className={styles.perfilConteudo}>
                  <div className={styles.perfilAvatar}>
                    {ultimoPerfil.avatar_url ? (
                      <img src={ultimoPerfil.avatar_url} alt="" />
                    ) : (
                      <div className={styles.avatarPlaceholder}>U</div>
                    )}
                  </div>

                  <div className={styles.perfilDados}>
                    <h3>{ultimoPerfil.nome}</h3>
                    <p>{ultimoPerfil.email}</p>
                    <span className={styles.perfilData}>
                      Cadastrado em:{" "}
                      {new Date(
                        ultimoPerfil.data_cadastro
                      ).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>
              ) : (
                <p className={styles.semPerfil}>
                  Nenhum perfil cadastrado.
                </p>
              )}
            </div>
          </div>

          <div style={{ marginTop: "40px" }}>
            <h2 className={styles.secaoTitulo}>Minhas Vagas Ativas</h2>

            {vagas.length === 0 ? (
              <p
                style={{
                  color: "#94a3b8",
                  fontStyle: "italic",
                  marginTop: "15px",
                }}
              >
                Você ainda não publicou nenhuma vaga no sistema. Vá até a tela
                de vagas para criar a sua primeira!
              </p>
            ) : (
              <div className={styles.vagasGrid}>
                {vagas.map((vaga) => (
                  <div
                    key={vaga.id_vag}
                    className={styles.cardVaga}
                    onClick={() => navigate("/vagasEmpresa")}
                  >
                    <div className={styles.cardVagaHeader}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div className={styles.miniLogoVaga}>
                          {logoEmpresa ? (
                            <img
                              src={logoEmpresa}
                              alt=""
                              className={styles.imagemPreview}
                            />
                          ) : (
                            <div style={{ color: "#94a3b8" }}>E</div>
                          )}
                        </div>

                        <div>
                          <h4 className={styles.vagaTituloText}>
                            {vaga.titulo}
                          </h4>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#94a3b8",
                            }}
                          >
                            Publicada em{" "}
                            {new Date(
                              vaga.data_publicada
                            ).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className={styles.vagaDescricaoText}>
                      {vaga.descricao}
                    </p>

                    <div className={styles.vagaInfoMeta}>
                      <span>{vaga.carga_horaria}h semanais</span>
                      <span>R$ {vaga.salario}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MenuEmpresa;