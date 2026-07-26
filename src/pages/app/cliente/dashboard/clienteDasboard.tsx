import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../../../components/sideBar/sideBar";
import styles from "./clientDash.module.css";
import { supabase } from "supabaseClient";
import { useDocumentTitle } from "Hooks/useDocumentTitle";

interface Empresa {
  id_em: string;
  nome: string;
  descricao: string;
  cidade: string;
  estado: string;
  avatarempresa_url: string | null;
}

interface Vaga {
  id_vag: string;
  id_em: string;
  titulo: string;
  descricao: string;
  carga_horaria: number;
  salario: number;
  data_publicada: string;
  cidade: string;
  estado: string;
  tipo: string;
  contrato: string;
  empresa: Empresa | null;
  is_favorita?: boolean;
}

interface Filtros {
  busca: string;
  tipo: string;
  contrato: string;
  cidade: string;
  salarioMin: number;
  salarioMax: number;
}

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const ClockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 16 14" />
  </svg>
);
const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const DollarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 7h5a3.5 3.5 0 1 0 7H6" />
  </svg>
);
const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21l-7-5-7 5V5a2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </svg>
);
const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const XIcon = () => (
  <svg viewBox="0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const BuildingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
    <path d="M9 9h.01M9 12h.01M9 15h.01M15 12h.01M15 15h.01" />
  </svg>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState({ nome: "", avatar_url: "", id: "" });
  const [percent, setPercent] = useState(0);
  const [checks, setChecks] = useState<any>({});
  useDocumentTitle("CIJA - Dashboard Jovem Aprendiz");
  const [loading, setLoading] = useState(true);
  const [vagas, setVagas] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);
  const [tabAtiva, setTabAtiva] = useState<"vagas" | "empresas" | "mensagens">(
    "vagas",
  );

  const [showFiltros, setShowFiltros] = useState(false);
  const [sortBy, setSortBy] = useState<"recentes" | "salario">("recentes");
  const [filtros, setFiltros] = useState<Filtros>({
    busca: "",
    tipo: "",
    contrato: "",
    cidade: "",
    salarioMin: 0,
    salarioMax: 20000,
  });

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
        newChecks.descLen = descLen;
        newChecks.desc = descLen >= 50;
        if (descLen >= 100) pts += 20;
        else if (descLen >= 50) pts += 15;
        else if (descLen >= 20) pts += 8;
        else if (descLen > 0) pts += 3;

        const skills =
          currData?.competencias?.split(",").filter((s: string) => s.trim())
            .length || 0;
        newChecks.skillsCount = skills;
        newChecks.skills = skills >= 3;
        pts += Math.min(skills * 3, 15);

        let formCount = 0;
        try {
          const form = JSON.parse(currData?.curso || "[]");
          formCount = Array.isArray(form) ? form.length : 0;
          newChecks.formacao = formCount > 0;
          newChecks.formacaoCount = formCount;
          if (newChecks.formacao) pts += formCount >= 2 ? 15 : 10;
        } catch {
          newChecks.formacao = false;
          newChecks.formacaoCount = 0;
        }

        let expCount = 0;
        try {
          const exp = JSON.parse(currData?.experiencias || "{}");
          const expList = exp.experiencias || [];
          expCount = expList.length;
          newChecks.experiencia = expCount > 0;
          newChecks.expCount = expCount;
          if (expCount >= 2) pts += 20;
          else if (expCount === 1) pts += 12;
        } catch {
          newChecks.experiencia = false;
          newChecks.expCount = 0;
        }

        const finalPct = Math.min(pts, 100);
        setPercent(finalPct);
        setChecks(newChecks);

        const { count } = await supabase
          .from("mensagens")
          .select("*", { count: "exact", head: true })
          .eq("id_destinatario", user.id)
          .eq("lida", false);
        setMensagensNaoLidas(count || 0);

        if (finalPct >= 100) {
          const { data: vagasData, error } = await supabase
            .from("vaga")
            .select(
              "id_vag, titulo, descricao, salario, carga_horaria, data_publicada, id_em, cidade, estado, tipo, contrato",
            )
            .order("data_publicada", { ascending: false })
            .limit(3);

          if (!error && vagasData) {
            const idsEmpresas = Array.from(
              new Set(vagasData.map((v) => v.id_em).filter(Boolean)),
            );
            const { data: empresasData } = await supabase
              .from("empresa")
              .select(
                "id_em, nome, descricao, cidade, estado, avatarempresa_url",
              )
              .in("id_em", idsEmpresas);

            const empresasMap = new Map<string, Empresa>();
            empresasData?.forEach((e: Empresa) => empresasMap.set(e.id_em, e));

            const vagasComEmpresa = vagasData.map((vaga) => {
              const empresa = empresasMap.get(vaga.id_em);
              return {
                ...vaga,
                id: vaga.id_vag,
                empresa: empresa || {
                  nome: "Empresa Parceira",
                  cidade: vaga.cidade,
                  estado: vaga.estado,
                  avatarempresa_url: null,
                },
                localizacao: `${vaga.cidade}, ${vaga.estado}`,
              };
            });

            setVagas(vagasComEmpresa);
            const empresasUnicas = Array.from(
              new Map(
                empresasData?.slice(0, 3).map((e) => [e.id_em, e]),
              ).values(),
            );
            setEmpresas(empresasUnicas);
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
    if (percent >= 100) return [];
    const all = [];

    if (!checks.foto)
      all.push({
        id: "foto",
        title: "Adicione foto de perfil",
        desc: "+15 pontos • Aumenta credibilidade",
        done: false,
      });
    if (!checks.tel)
      all.push({
        id: "tel",
        title: "Complete seu telefone",
        desc: "+5 pontos • Para contato",
        done: false,
      });

    const d = checks.descLen || 0;
    if (d < 20)
      all.push({
        id: "d20",
        title: "Escreva sobre você",
        desc: `+8 pontos • ${d}/20 caracteres`,
        done: false,
      });
    else if (d < 50)
      all.push({
        id: "d50",
        title: "Amplie para 50 caracteres",
        desc: `+15 pontos • ${d}/50`,
        done: false,
      });
    else if (d < 100)
      all.push({
        id: "d100",
        title: "Chegue a 100 caracteres",
        desc: `+20 pontos • ${d}/100`,
        done: false,
      });

    const s = checks.skillsCount || 0;
    if (s < 3)
      all.push({
        id: "s3",
        title: `Adicione ${3 - s} competências`,
        desc: `+${(3 - s) * 3} pontos • mínimo 3`,
        done: false,
      });
    else if (s < 5)
      all.push({
        id: "s5",
        title: `Faltam ${5 - s} para o máximo`,
        desc: `+${(5 - s) * 3} pontos extras`,
        done: false,
      });

    const f = checks.formacaoCount || 0;
    if (f === 0)
      all.push({
        id: "f1",
        title: "Cadastre 1ª formação",
        desc: "+10 pontos",
        done: false,
      });
    else if (f === 1)
      all.push({
        id: "f2",
        title: "Adicione 2ª formação",
        desc: "+5 pontos extras",
        done: false,
      });

    const e = checks.expCount || 0;
    if (e === 0)
      all.push({
        id: "e1",
        title: "Adicione 1ª experiência",
        desc: "+12 pontos",
        done: false,
      });
    else if (e === 1)
      all.push({
        id: "e2",
        title: "Adicione 2ª experiência",
        desc: "+8 pontos extras",
        done: false,
      });

    return all.slice(0, 4);
  }, [checks, percent]);

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
    "https://www.gravatar.com/avatar/00000000000000?d=mp&f=y";

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
              {percent < 100
                ? `Completar perfil (+${100 - percent} pts)`
                : "Explorar vagas"}
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
                  {actions.map((a) => (
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
            <button
              className={`${styles.tab} ${tabAtiva === "vagas" ? styles.active : ""}`}
              onClick={() => setTabAtiva("vagas")}
            >
              Vagas Recomendadas{" "}
              <span className={styles.tabCount}>
                {vagasLiberadas ? vagas.length : 0}
              </span>
            </button>
            <button
              className={`${styles.tab} ${tabAtiva === "empresas" ? styles.active : ""}`}
              onClick={() => setTabAtiva("empresas")}
            >
              Empresas{" "}
              <span className={styles.tabCount}>{empresas.length}</span>
            </button>
            <button
              className={`${styles.tab} ${tabAtiva === "mensagens" ? styles.active : ""}`}
              onClick={() => setTabAtiva("mensagens")}
            >
              Mensagens{" "}
              <span className={styles.tabCount}>{mensagensNaoLidas}</span>
            </button>
          </div>

          {tabAtiva === "vagas" &&
            (vagasLiberadas ? (
              <div style={{ display: "grid", gap: "16px" }}>
                {vagas.map((vaga) => (
                  <div
                    key={vaga.id}
                    className={styles.vagaCard}
                    onClick={() => navigate(`/vaga-selecionada/${vaga.id}`)}
                  >
                    <div className={styles.vagaContent}>
                      <div className={styles.vagaHeader}>
                        <h4 className={styles.vagaTitle}>{vaga.titulo}</h4>
                        <span className={styles.vagaBadge}>Nova</span>
                      </div>
                      <div className={styles.vagaMeta}>
                        <span className={styles.vagaMetaItem}>
                          {vaga.empresa?.nome}
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
                        <span className={styles.vagaMetaItem}>
                          {vaga.contrato}
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
                          navigate(`/vaga-selecionada/${vaga.id}`);
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
            ))}

          {tabAtiva === "empresas" && (
            <div style={{ display: "grid", gap: "16px" }}>
              {empresas.length > 0 ? (
                empresas.map((emp) => (
                  <div key={emp.id_em} className={styles.empresaCard}>
                    <div className={styles.empresaContent}>
                      <div className={styles.empresaHeader}>
                        <div className={styles.empresaLogo}>
                          {emp.avatarempresa_url ? (
                            <img src={emp.avatarempresa_url} alt={emp.nome} />
                          ) : (
                            <BuildingIcon />
                          )}
                        </div>
                        <div>
                          <h4 className={styles.empresaNome}>{emp.nome}</h4>
                          <div className={styles.empresaMeta}>
                            <MapPinIcon />
                            <span>
                              {emp.cidade}, {emp.estado}
                            </span>
                          </div>
                        </div>
                      </div>
                      {emp.descricao && (
                        <p className={styles.empresaDesc}>{emp.descricao}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <BuildingIcon />
                  <h4 className={styles.emptyTitle}>Nenhuma empresa ainda</h4>
                  <p className={styles.emptyDesc}>
                    Complete seu perfil para ver empresas parceiras
                  </p>
                </div>
              )}
            </div>
          )}

          {tabAtiva === "mensagens" && (
            <div className={styles.emptyState}>
              <h4 className={styles.emptyTitle}>Nenhuma mensagem</h4>
              <p className={styles.emptyDesc}>
                Quando empresas entrarem em contato, aparecerá aqui
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
