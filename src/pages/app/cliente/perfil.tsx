import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../../components/sideBar/sideBar";
import { supabase } from "supabaseClient";
import styles from "./perfil.module.css";
import { useDocumentTitle } from "Hooks/useDocumentTitle";

const phone = (v: string) => {
  if (!v) return "—";
  const d = v.replace(/\D/g, "");
  return d.length === 11
    ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    : v;
};

const calc = (user: any, cv: any) => {
  const checks = {
    avatar: !!user.avatar_url,
    nome: (user.nome || "").trim().length > 3,
    email: !!user.email,
    tel: (user.telefone || "").replace(/\D/g, "").length >= 10,
    desc: 0,
    skills: 0,
    formacao: 0,
    experiencia: 0,
  };
  const descLen = cv.descricao?.trim().length || 0;

  // ate quantos pontos user ganha  por caracteres na descricao adicionado
  checks.desc =
    descLen >= 100
      ? 20
      : descLen >= 50
        ? 15
        : descLen >= 20
          ? 8
          : descLen > 0
            ? 3
            : 0;
  const skills =
    cv.competencias?.split(",").filter((s: string) => s.trim()).length || 0;
  checks.skills = Math.min(skills * 3, 15);
  try {
    const form = JSON.parse(cv.curso || "[]");
    checks.formacao =
      Array.isArray(form) && form.length > 0 ? (form.length >= 2 ? 15 : 10) : 0;
  } catch {
    checks.formacao = 0;
  }
  try {
    const exp = JSON.parse(cv.experiencias || "{}");
    const expList = exp.experiencias || [];
    checks.experiencia =
      expList.length >= 2 ? 20 : expList.length === 1 ? 12 : 0;
  } catch {
    checks.experiencia = 0;
  }

  const pct = Math.min(
    15 +
      5 +
      5 +
      5 +
      checks.desc +
      checks.skills +
      checks.formacao +
      checks.experiencia,
    100,
  );
  return { percent: pct, details: checks };
  // calculo de % perfil
};

export default function Perfil() {
  const navigate = useNavigate();
  const { idJa } = useParams<{ idJa?: string }>();
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    nome: "",
    email: "",
    tel: "",
    cidade: "São Paulo, Brasil",
    avatar: "",
    titulo: "Jovem Aprendiz",
  });
  const [cv, setCv] = useState({
    desc: "",
    comp: "",
    exp: '{"experiencias":[]}',
    cur: "[]",
  });
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const [vagasCount, setVagasCount] = useState(0);
  const [candidaturasCount, setCandidaturasCount] = useState(0);
  const [activeTab, setActiveTab] = useState("visao");

  useDocumentTitle("CIJA - Perfil");
  const visualizacaoEmpresa = !!idJa;

  const tabs = [
    { id: "visao", label: "Visão geral" },
    { id: "formacao", label: "Formação" },
    { id: "competencias", label: "Competências" },
    { id: "experiencia", label: "Experiência" },
    { id: "projetos", label: "Projetos" },
    { id: "documentos", label: "Documentos" },
  ];

  useEffect(() => {
    init();
  }, [idJa]);

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user && !idJa) {
      setLoading(false);
      return;
    }
    const perfilId = idJa ?? user?.id ?? null;
    if (!perfilId) {
      setLoading(false);
      return;
    }
    setUid(perfilId);
    await loadProfile(perfilId, user?.email || "");
    const { count: vCount } = await supabase
      .from("vaga")
      .select("id_vag", { count: "exact", head: true });
    setVagasCount(vCount || 0);
    const { count: cCount } = await supabase
      .from("candidaturas")
      .select("*", { count: "exact", head: true })
      .eq("id_ja", perfilId);
    setCandidaturasCount(cCount || 0);
  };

  const loadProfile = async (userId: string, userEmail: string) => {
    try {
      const [p, c] = await Promise.all([
        supabase
          .from("jovem_aprendiz")
          .select("*")
          .eq("id_ja", userId)
          .maybeSingle(),
        supabase
          .from("curriculo")
          .select("*")
          .eq("id_ja", userId)
          .maybeSingle(),
      ]);
      let avatarUrl = "";
      if (p.data) {
        avatarUrl = p.data.avatar_url || p.data.avatar || p.data.foto || "";
        if (!avatarUrl) {
          const { data } = supabase.storage
            .from("avatars")
            .getPublicUrl(`${userId}/avatar.jpg`);
          try {
            const res = await fetch(data.publicUrl, { method: "HEAD" });
            if (res.ok) avatarUrl = data.publicUrl;
          } catch {}
        }
        setProfile({
          nome: p.data.nome || "",
          email: p.data.email || userEmail,
          tel: (p.data.telefone || "").replace(/\D/g, "+"),
          cidade: p.data.cidade || "São Paulo, Brasil",
          avatar: avatarUrl,
          titulo: "Jovem Aprendiz",
        });
      }
      if (c.data) {
        setCv({
          desc: c.data.descricao || "",
          comp: c.data.competencias || "",
          exp: c.data.experiencias || '{"experiencias":[]}',
          cur: c.data.curso || "[]",
        });
        setSummary(c.data.descricao || "");
      }
    } finally {
      setLoading(false);
    }
  };

  const exp = useMemo(() => {
    try {
      return JSON.parse(cv.exp).experiencias || [];
    } catch {
      return [];
    }
  }, [cv.exp]);

  const cur = useMemo(() => {
    try {
      return JSON.parse(cv.cur);
    } catch {
      return [];
    }
  }, [cv.cur]);

  const skills = useMemo(
    () =>
      cv.comp
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [cv.comp],
  );

  const projs = useMemo(() => {
    try {
      return JSON.parse(cv.exp).projetos || [];
    } catch {
      return [];
    }
  }, [cv.exp]);

  const pctData = useMemo(
    () =>
      calc(profile, {
        ...cv,
        descricao: cv.desc,
        competencias: cv.comp,
        curso: cv.cur,
        experiencias: cv.exp,
      }),
    [profile, cv],
  );
  const pct = pctData.percent;

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid || visualizacaoEmpresa) return;
    const preview = URL.createObjectURL(file);
    setProfile((p) => ({ ...p, avatar: preview }));
    try {
      const blob = await new Promise<Blob>((res, rej) => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = c.height = 400;
          const ctx = c.getContext("2d")!;
          const s = Math.min(img.width, img.height);
          ctx.drawImage(
            img,
            (img.width - s) / 2,
            (img.height - s) / 2,
            s,
            s,
            0,
            0,
            400,
            400,
          );
          c.toBlob((b) => (b ? res(b) : rej()), "image/jpeg", 0.9);
        };
        img.src = URL.createObjectURL(file);
      });
      const path = `${uid}/avatar.jpg`;
      await supabase.storage.from("avatars").remove([path]);
      await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true });
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase
        .from("jovem_aprendiz")
        .update({ avatar_url: data.publicUrl })
        .eq("id_ja", uid);
      setProfile((p) => ({
        ...p,
        avatar: `${data.publicUrl}?v=${Date.now()}`,
      }));
      setAvatarVersion((v) => v + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const saveSummary = async () => {
    if (!uid) return;
    setSaving(true);
    await supabase.from("curriculo").upsert(
      {
        id_ja: uid,
        descricao: summary,
        competencias: cv.comp,
        experiencias: cv.exp,
        curso: cv.cur,
      },
      { onConflict: "id_ja" },
    );
    setCv((c) => ({ ...c, desc: summary }));
    setEditing(false);
    setSaving(false);
  };

  const initials =
    profile.nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "JA";
  const avatarSrc = profile.avatar
    ? `${profile.avatar}${profile.avatar.includes("?") ? "&" : "?"}v=${avatarVersion}`
    : "";

  if (loading) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.main}>
          <div className={styles.loading}>Carregando...</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {!visualizacaoEmpresa && <Sidebar />}
      <main className={styles.main}>
        <div className={styles.topGrid}>
          <section className={styles.headerCard}>
            <div className={styles.avatarBox}>
              {avatarSrc ? (
                <img src={avatarSrc} alt={profile.nome} />
              ) : (
                <div className={styles.avatarFallback}>{initials}</div>
              )}
              <span className={styles.online} />
              {!visualizacaoEmpresa && (
                <label className={styles.cam}>
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={uploadAvatar}
                  />
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </label>
              )}
            </div>
            <div className={styles.headerInfo}>
              <h1>{profile.nome || "Seu Nome"}</h1>
              <span className={styles.badge}>Jovem Aprendiz</span>
              <p className={styles.bio}>
                {cv.desc ||
                  "Estudante dedicado em busca da primeira oportunidade para desenvolver habilidades."}
              </p>
              <div className={styles.contacts}>
                <span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="2"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 5L2 7" />
                  </svg>
                  {profile.email}
                </span>
                <span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="2"
                  >
                    <path d="M22 16.92v3a2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 0 0 1 2 1.72" />
                  </svg>
                  {phone(profile.tel)}
                </span>
                <span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#a78bfa"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {profile.cidade}
                </span>
              </div>
            </div>
            {!visualizacaoEmpresa && (
              <button
                className={styles.editTop}
                onClick={() => navigate("/curriculo")}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            )}
          </section>
          <section className={styles.numbersCard}>
            {visualizacaoEmpresa && <h3>Perfil do candidato em números</h3>}
            {!visualizacaoEmpresa && <h3>Seu perfil em números</h3>}

            <svg viewBox="0 0 300 60" className={styles.chart}>
              <path
                d="M0 40 Q 50 20 100 35 T 200 25 T 300 30"
                fill="none"
                stroke="#7c3aed"
                strokeWidth="3"
                opacity="0.8"
              />
            </svg>
            <div className={styles.stats}>
              <div>
                <strong>{pct}%</strong>
                <span>Perfil completo</span>
              </div>
              <div>
                <strong>{vagasCount}</strong>
                <span>Vagas compatíveis</span>
              </div>
              <div>
                <strong>{candidaturasCount}</strong>
                <span>Candidaturas</span>
              </div>
            </div>
          </section>
      
        </div>

        <nav className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? styles.active : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.grid}>
          {activeTab === "visao" && (
            <>
              <section className={`${styles.card} ${styles.about}`}>
                <div className={styles.cardHead}>
                  <h3>Sobre mim</h3>
                  {!visualizacaoEmpresa && (
                    <button onClick={() => setEditing(!editing)}>
                      {editing ? "Cancelar" : "Editar"}
                    </button>
                  )}
                </div>
                {editing ? (
                  <>
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      rows={4}
                      className={styles.textarea}
                      placeholder="Fale sobre você..."
                    />
                    <button
                      className={styles.save}
                      onClick={saveSummary}
                      disabled={saving}
                    >
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                  </>
                ) : (
                  <p>
                    {cv.desc ||
                      "Sou estudante do ensino médio, comunicativo e organizado, buscando primeira oportunidade."}
                  </p>
                )}
                <div className={styles.tags}>
                  {(skills.length
                    ? skills
                    : [
                        "Proativo",
                        "Comunicativo",
                        "Organizado",
                        "Responsável",
                        "Aprendizado rápido",
                      ]
                  )
                    .slice(0, 5)
                    .map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                </div>
              </section>

              <section className={`${styles.card} ${styles.formacao}`}>
                <div className={styles.cardHead}>
                  <h3>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="#7c3aed"
                    >
                      <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
                    </svg>
                    Formação acadêmica
                  </h3>
                </div>
                {cur.length ? (
                  cur.map((c: any, i: number) => (
                    <div key={i} className={styles.item}>
                      <div className={styles.dot} />
                      <div>
                        <strong>{c.curso}</strong>
                        <p>{c.instituicao}</p>
                        <small>
                          {c.inicio} - {c.fim || "2026"}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.item}>
                    <div className={styles.dot} />
                    <div>
                      <strong>Ensino Médio</strong>
                      <p>Colégio Bento</p>
                      <small>2024 - 2026</small>
                      <small className={styles.meta}>Concluindo em 2026</small>
                    </div>
                  </div>
                )}
              </section>

              {!visualizacaoEmpresa && (
                <section className={`${styles.card} ${styles.acoes}`}>
                  <h3>Ações rápidas</h3>
                  {[
                    {
                      icon: "◎",
                      label: "Ver vagas recomendadas",
                      to: "/vagas",
                    },
                    {
                      icon: "✎",
                      label: "Atualizar currículo",
                      to: "/curriculo",
                    },
                    {
                      icon: "⬆",
                      label: "Enviar documentos",
                      to: "/documentos",
                    },
                    { icon: "✉", label: "Ver mensagens", to: "/mensagens" },
                  ].map((a) => (
                    <button key={a.label} onClick={() => navigate(a.to)}>
                      <span>{a.icon}</span>
                      {a.label}
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M9 18l6-6-6" />
                      </svg>
                    </button>
                  ))}
                </section>
              )}

              <section className={`${styles.card} ${styles.skills}`}>
                <div className={styles.cardHead}>
                  <h3>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="#7c3aed"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                    Competências
                  </h3>
                  {!visualizacaoEmpresa && (
                    <button onClick={() => navigate("/curriculo")}>
                      Editar
                    </button>
                  )}
                </div>
                <div className={styles.skillGrid}>
                  {(skills.length
                    ? skills
                    : [
                        "Informática básica",
                        "Trabalho em equipe",
                        "Pacote Office",
                        "Organização",
                        "Comunicação",
                        "Aprendizado rápido",
                      ]
                  )
                    .slice(0, 6)
                    .map((s, i) => (
                      <div key={s} className={styles.skill}>
                        <div className={styles.skillTop}>
                          <span>{s}</span>
                          <span>{90 - i * 2}%</span>
                        </div>
                        <div className={styles.bar}>
                          <div style={{ width: `${90 - i * 2}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
              </section>

              <section className={`${styles.card} ${styles.exp}`}>
                <div className={styles.cardHead}>
                  <h3>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="#7c3aed"
                    >
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                    </svg>
                    Experiência
                  </h3>
                </div>
                {exp.length ? (
                  exp.map((e: any, i: number) => (
                    <div key={i} className={styles.item}>
                      <strong>{e.cargo}</strong>
                      <p>{e.empresa}</p>
                    </div>
                  ))
                ) : (
                  <div className={styles.empty}>
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4c1d95"
                      strokeWidth="1.5"
                    >
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                      <circle cx="12" cy="13" r="3" />
                    </svg>
                    <p>Você ainda não adicionou experiências profissionais.</p>
                    {!visualizacaoEmpresa && (
                      <button onClick={() => navigate("/curriculo")}>
                        Adicionar experiência
                      </button>
                    )}
                  </div>
                )}
              </section>
              {!visualizacaoEmpresa && (
                <section className={`${styles.card} ${styles.dica}`}>
                  <h3>Dica para você</h3>
                  <p>
                    Adicionar cursos e certificações aumenta suas chances de ser
                    encontrado pelas empresas!
                  </p>
                  {!visualizacaoEmpresa && (
                    <button onClick={() => navigate("/curriculo")}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14v7" />
                      </svg>
                      Adicionar agora
                    </button>
                  )}
                </section>
              )}
            </>
          )}

          {activeTab === "formacao" && (
            <section
              className={`${styles.card} ${styles.formacao}`}
              style={{ gridColumn: "1/-1" }}
            >
              <div className={styles.cardHead}>
                <h3>Formação acadêmica</h3>
                {!visualizacaoEmpresa && (
                  <button onClick={() => navigate("/curriculo")}>
                    + Adicionar
                  </button>
                )}
              </div>
              {cur.length ? (
                cur.map((c: any, i: number) => (
                  <div
                    key={i}
                    className={styles.item}
                    style={{ marginBottom: "16px" }}
                  >
                    <div className={styles.dot} />
                    <div>
                      <strong>{c.curso}</strong>
                      <p>{c.instituicao}</p>
                      <small>
                        {c.inicio} - {c.fim || "Atual"}
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                <p
                  style={{
                    color: "#9ca3af",
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  Nenhuma formação cadastrada
                </p>
              )}
            </section>
          )}

          {activeTab === "competencias" && (
            <section
              className={`${styles.card} ${styles.skills}`}
              style={{ gridColumn: "1/-1" }}
            >
              <div className={styles.cardHead}>
                <h3>Competências</h3>
                {!visualizacaoEmpresa && (
                  <button onClick={() => navigate("/curriculo")}>
                    + Adicionar
                  </button>
                )}
              </div>
              <div className={styles.skillGrid}>
                {skills.length ? (
                  skills.map((s, i) => (
                    <div key={s} className={styles.skill}>
                      <div className={styles.skillTop}>
                        <span>{s}</span>
                        <span>{Math.min(100, 70 + i * 5)}%</span>
                      </div>
                      <div className={styles.bar}>
                        <div
                          style={{ width: `${Math.min(100, 70 + i * 5)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#9ca3af" }}>
                    Nenhuma competência adicionada
                  </p>
                )}
              </div>
            </section>
          )}

          {activeTab === "experiencia" && (
            <section
              className={`${styles.card} ${styles.exp}`}
              style={{ gridColumn: "1/-1" }}
            >
              <div className={styles.cardHead}>
                <h3>Experiência profissional</h3>
                {!visualizacaoEmpresa && (
                  <button onClick={() => navigate("/curriculo")}>
                    + Adicionar
                  </button>
                )}
              </div>
              {exp.length ? (
                exp.map((e: any, i: number) => (
                  <div
                    key={i}
                    className={styles.item}
                    style={{ marginBottom: "16px" }}
                  >
                    <div className={styles.dot} />
                    <div>
                      <strong>{e.cargo}</strong>
                      <p>{e.empresa}</p>
                      <small>
                        {e.inicio} - {e.fim || "Atual"}
                      </small>
                      {e.descricao && (
                        <p
                          style={{
                            marginTop: "6px",
                            color: "#d1d5db",
                            fontSize: "13px",
                          }}
                        >
                          {e.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>
                  <p>Nenhuma experiência cadastrada</p>
                  {!visualizacaoEmpresa && (
                    <button onClick={() => navigate("/curriculo")}>
                      Adicionar primeira experiência
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          {activeTab === "projetos" && (
            <section className={styles.card} style={{ gridColumn: "1/-1" }}>
              <div className={styles.cardHead}>
                <h3>Projetos</h3>
                {!visualizacaoEmpresa && (
                  <button onClick={() => navigate("/curriculo")}>
                    + Adicionar
                  </button>
                )}
              </div>
              {projs.length ? (
                projs.map((p: any, i: number) => (
                  <div key={i} className={styles.item}>
                    <strong>{p.nome}</strong>
                    <p>{p.descricao}</p>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>
                  <p>Nenhum projeto cadastrado</p>
                  {!visualizacaoEmpresa && (
                    <button onClick={() => navigate("/curriculo")}>
                      Adicionar projeto
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          {activeTab === "documentos" && (
            <section className={styles.card} style={{ gridColumn: "1/-1" }}>
              <div className={styles.cardHead}>
                <h3>Documentos</h3>
              </div>
              <div className={styles.empty}>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4c1d95"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 0 0 0 2 2h12a2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p>Em breve você poderá enviar RG, CPF e comprovantes aqui.</p>
              </div>
            </section>
          )}
        </div>

        {/*  sistema de ver perifl quando empresa/user acessa rota */}
        {visualizacaoEmpresa && (
          <button className={styles.voltar} onClick={() => navigate(-1)}>
            Voltar
          </button>
        )}
      </main>
    </div>
  );
}
