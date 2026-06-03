import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../../../components/sideBar/sideBar";
import styles from "./clientDash.module.css";
import { supabase } from "supabaseClient";
import { useDocumentTitle } from "Hooks/useDocumentTitle";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState({ nome: "", avatar_url: "", id: "" });
  const [percent, setPercent] = useState(0);
  const [checks, setChecks] = useState<any>({});
  useDocumentTitle("CIJA - Dashboard Jovem Aprendiz");
  const [loading, setLoading] = useState(true);
  const [vagas, setVagas] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: jaData } = await supabase
          .from("jovem_aprendiz")
          .select("*")
          .eq("id_ja", user.id)
          .maybeSingle();

        if (!jaData) {
          setLoading(false);
          return;
        }

        setPerfil({
          nome: jaData.nome || "",
          avatar_url: jaData.avatar_url || jaData.avatar || jaData.foto || "",
          id: jaData.id_ja,
        });

        const { data: currData } = await supabase
          .from("curriculo")
          .select("*")
          .eq("id_ja", jaData.id_ja)
          .maybeSingle();

        let pts = 0;
        const newChecks: any = {};

        newChecks.foto = !!(jaData.avatar_url || jaData.avatar || jaData.foto);
        if (newChecks.foto) pts += 15;
        newChecks.nome = jaData.nome?.length > 3;
        if (newChecks.nome) pts += 5;
        newChecks.email = !!jaData.email;
        if (newChecks.email) pts += 5;
        newChecks.tel = jaData.telefone?.replace(/\D/g, "").length >= 10;
        if (newChecks.tel) pts += 5;

        const descLen = currData?.descricao?.trim().length || 0;
        newChecks.desc = descLen >= 50;
        if (descLen >= 100) pts += 20;
        else if (descLen >= 50) pts += 15;
        else if (descLen >= 20) pts += 8;
        else if (descLen > 0) pts += 3;

        const skills =
          currData?.competencias?.split(",").filter((s: string) => s.trim())
            .length || 0;
        newChecks.skills = skills >= 3;
        pts += Math.min(skills * 3, 15);

        try {
          const form = JSON.parse(currData?.curso || "[]");
          newChecks.formacao = Array.isArray(form) && form.length > 0;
          if (newChecks.formacao) pts += form.length >= 2 ? 15 : 10;
        } catch {
          newChecks.formacao = false;
        }

        try {
          const exp = JSON.parse(currData?.experiencias || "{}");
          const expList = exp.experiencias || [];
          newChecks.experiencia = expList.length > 0;
          if (expList.length >= 2) pts += 20;
          else if (expList.length === 1) pts += 12;
        } catch {
          newChecks.experiencia = false;
        }

        const finalPct = Math.min(pts, 100);
        setPercent(finalPct);
        setChecks(newChecks);

        if (finalPct >= 100) {
          const { data: vagasData, error } = await supabase
            .from("vaga")
            .select(
              "id_vag, titulo, descricao, salario, carga_horaria, data_publicada, id_em",
            )
            .order("data_publicada", { ascending: false })
            .limit(3);

          if (error) {
            console.error("Erro vagas:", error);
          } else if (vagasData) {
            const vagasComEmpresa = await Promise.all(
              vagasData.map(async (vaga) => {
                if (vaga.id_em) {
                  const { data: empresa } = await supabase
                    .from("empresa")
                    .select("nome_fantasia, razao_social")
                    .eq("id_em", vaga.id_em)
                    .maybeSingle();
                  return {
                    ...vaga,
                    id: vaga.id_vag,
                    empresa:
                      empresa?.nome_fantasia ||
                      empresa?.razao_social ||
                      "Empresa Parceira",
                    localizacao: "São Paulo, SP",
                  };
                }
                return {
                  ...vaga,
                  id: vaga.id_vag,
                  empresa: "Empresa Parceira",
                  localizacao: "São Paulo, SP",
                };
              }),
            );
            setVagas(vagasComEmpresa);
          }
        }
      } catch (e) {
        console.error("Erro:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const actions = useMemo(() => {
    const all = [
      {
        id: "foto",
        title: "Adicione foto de perfil",
        desc: "Aumenta sua credibilidade",
        done: checks.foto,
      },
      {
        id: "desc",
        title: "Escreva sobre você",
        desc: "Mínimo 50 caracteres",
        done: checks.desc,
      },
      {
        id: "skills",
        title: "Adicione competências",
        desc: "Pelo menos 3 habilidades",
        done: checks.skills,
      },
      {
        id: "formacao",
        title: "Cadastre formação",
        desc: "Cursos e escolaridade",
        done: checks.formacao,
      },
      {
        id: "exp",
        title: "Adicione experiência",
        desc: "Profissional ou voluntária",
        done: checks.experiencia,
      },
      {
        id: "tel",
        title: "Complete telefone",
        desc: "Para contato das empresas",
        done: checks.tel,
      },
    ];
    return all.filter((a) => !a.done);
  }, [checks]);

  const vagasLiberadas = percent >= 100;
  const color =
    percent >= 80 ? "#10B981" : percent >= 60 ? "#F59E0B" : "#7C3AED";
  const status =
    percent >= 100
      ? "COMPLETO"
      : percent >= 80
        ? "EXPERT"
        : percent >= 60
          ? "AVANÇADO"
          : "INICIANTE";
  const primeiroNome = perfil.nome.split(" ")[0] || "Usuário";
  const defaultAvatar =
    "https://www.gravatar.com/avatar/00000000000000000000?d=mp&f=y";

  if (loading) {
    return (
      <div className={styles.app}>
        <Sidebar />
        <main className={styles.main}>
          <div style={{ padding: 40, color: "#9CA3AF" }}>Carregando...</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Olá, {primeiroNome}</h1>
            <p>
              {vagasLiberadas
                ? `${vagas.length} vagas disponíveis`
                : `Complete seu perfil (${percent}%)`}
            </p>
          </div>
          <div className={styles.userCard} onClick={() => navigate("/perfil")}>
            <div className={styles.userAvatar}>
              <img
                src={
                  perfil.avatar_url
                    ? `${perfil.avatar_url}${perfil.avatar_url.includes("?") ? "&" : "?"}t=${Date.now()}`
                    : defaultAvatar
                }
                alt={perfil.nome}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultAvatar;
                }}
              />
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>
                {perfil.nome || "Usuário"}
              </span>
              <span className={styles.userBadge}>Candidato</span>
            </div>
          </div>
        </header>

        <div className={styles.grid2}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Nível do Currículo</h3>
            </div>
            <div className={styles.scoreWrap}>
              <div className={styles.scoreValue}>{percent}%</div>
              <div
                className={styles.expertBadge}
                style={{
                  background: `${color}15`,
                  color,
                  borderColor: `${color}30`,
                }}
              >
                {status}
              </div>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${percent}%`, background: color }}
              />
            </div>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Progresso</div>
                <div className={styles.metricValue}>{percent}%</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Status</div>
                <div
                  className={styles.metricValue}
                  style={{ fontSize: "14px" }}
                >
                  {vagasLiberadas ? "Liberado" : "Pendente"}
                </div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricLabel}>Vagas</div>
                <div className={styles.metricValue}>
                  {vagasLiberadas ? vagas.length : 0}
                </div>
              </div>
            </div>
            <button
              className={styles.btnPrimary}
              onClick={() => navigate(vagasLiberadas ? "/vagas" : "/perfil")}
            >
              {percent < 100 ? "Completar perfil" : "Explorar vagas"}
            </button>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Próximas ações</h3>
              <span className={styles.badgeCount}>
                {actions.length === 0
                  ? "Concluído"
                  : `${actions.length} pendentes`}
              </span>
            </div>
            {actions.length === 0 ? (
              <div className={styles.allDone}>
                <h4
                  style={{
                    margin: "0 0 8px",
                    color: "#10B981",
                    fontSize: "16px",
                    fontWeight: 600,
                  }}
                >
                  Perfil completo
                </h4>
                <p style={{ margin: 0, fontSize: "14px", color: "#9CA3AF" }}>
                  Você pode se candidatar às vagas
                </p>
              </div>
            ) : (
              <>
                <div className={styles.actions}>
                  {actions.slice(0, 4).map((a) => (
                    <div
                      key={a.id}
                      className={styles.actionItem}
                      onClick={() => navigate("/perfil")}
                    >
                      <div className={styles.checkbox} />
                      <div className={styles.actionContent}>
                        <div className={styles.actionTitle}>{a.title}</div>
                        <div className={styles.actionDesc}>{a.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  className={styles.linkMore}
                  onClick={() => navigate("/perfil")}
                >
                  Ver todas as ações
                </div>
              </>
            )}
          </div>
        </div>

        <div className={`${styles.card} ${styles.cardFull}`}>
          <div
            className={styles.cardHeader}
            style={{ border: "none", padding: 0, marginBottom: 24 }}
          >
            <h3 className={styles.cardTitle}>Oportunidades</h3>
          </div>
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${styles.active}`}>
              Vagas Recomendadas{" "}
              <span className={styles.tabCount}>
                {vagasLiberadas ? vagas.length : 0}
              </span>
            </button>
            <button className={styles.tab}>
              Empresas <span className={styles.tabCount}>0</span>
            </button>
            <button className={styles.tab}>
              Mensagens <span className={styles.tabCount}>0</span>
            </button>
          </div>

          {vagasLiberadas ? (
            <div style={{ display: "grid", gap: "16px" }}>
              {vagas.map((vaga) => (
                <div
                  key={vaga.id}
                  className={styles.vagaCard}
                  onClick={() => navigate(`/vagas/${vaga.id}`)}
                >
                  <div className={styles.vagaContent}>
                    <div className={styles.vagaHeader}>
                      <h4 className={styles.vagaTitle}>{vaga.titulo}</h4>
                      <span className={styles.vagaBadge}>Nova</span>
                    </div>
                    <div className={styles.vagaMeta}>
                      <span className={styles.vagaMetaItem}>
                        {vaga.empresa}
                      </span>
                      <span className={styles.vagaMetaItem}>•</span>
                      <span className={styles.vagaMetaItem}>
                        {vaga.localizacao}
                      </span>
                      <span className={styles.vagaMetaItem}>•</span>
                      <span className={styles.vagaMetaItem}>
                        {vaga.carga_horaria}h semanais
                      </span>
                      <span className={styles.vagaMetaItem}>•</span>
                      <span
                        className={`${styles.vagaMetaItem} ${styles.vagaSalario}`}
                      >
                        R${" "}
                        {Number(vaga.salario).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className={styles.vagaAction}>
                    <button
                      className={styles.btnCandidatar}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/vagas/${vaga.id}`);
                      }}
                    >
                      Ver detalhes
                    </button>
                  </div>
                </div>
              ))}
              <button
                className={styles.btnVerTodas}
                onClick={() => navigate("/vagas")}
              >
                Ver todas as vagas
              </button>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h4 className={styles.emptyTitle}>Complete seu perfil</h4>
              <p className={styles.emptyDesc}>
                Finalize seu cadastro para visualizar vagas personalizadas
              </p>
              <div style={{ marginTop: 24 }}>
                <div
                  style={{
                    height: 6,
                    background: "#0a0a0f",
                    borderRadius: 3,
                    overflow: "hidden",
                    maxWidth: 300,
                    margin: "0 auto",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${percent}%`,
                      background: "#7c3aed",
                      transition: "width 0.5s",
                    }}
                  />
                </div>
                <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 8 }}>
                  {percent}% concluído
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
