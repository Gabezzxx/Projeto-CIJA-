import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../../components/sideBar/sideBar";
import { supabase } from "supabaseClient";
import styles from "./perfil.module.css";
import { useDocumentTitle } from "Hooks/useDocumentTitle";
export default function Perfil() {
  const navigate = useNavigate();
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
  useDocumentTitle("CIJA - Perfil");
  const [cv, setCv] = useState({ desc: "", comp: "", exp: "{}", cur: "[]" });
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUid(user.id);
    await loadProfile(user.id, user.email || "");
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

      // PEGA FOTO DO BANCO (testa todos os campos possíveis)
      let avatarUrl = "";
      if (p.data) {
        avatarUrl =
          p.data.avatar_url ||
          p.data.avatar ||
          p.data.foto ||
          p.data.photo_url ||
          "";

        // Se não tem no banco, tenta buscar no storage direto
        if (!avatarUrl) {
          const { data: storageData } = supabase.storage
            .from("avatars")
            .getPublicUrl(`${userId}/avatar.jpg`);
          // Verifica se existe
          try {
            const res = await fetch(storageData.publicUrl, {
              method: "HEAD",
              cache: "no-store",
            });
            if (res.ok) avatarUrl = storageData.publicUrl;
          } catch {}
        }

        setProfile({
          nome: p.data.nome || "",
          email: p.data.email || userEmail,
          tel: (p.data.telefone || "").replace(/\D/g, ""),
          cidade: p.data.cidade || p.data.endereco || "São Paulo, Brasil",
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
    } catch (err) {
      console.error("Erro ao carregar:", err);
    } finally {
      setLoading(false);
    }
  };

  const phone = (t: string) => {
    const n = t.replace(/\D/g, "");
    return n.length >= 10
      ? `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`
      : t;
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

  const pctData = useMemo(() => {
    const details = {
      avatar: { pts: 0, max: 15, done: false },
      nome: { pts: 0, max: 5, done: false },
      email: { pts: 0, max: 5, done: false },
      tel: { pts: 0, max: 5, done: false },
      desc: { pts: 0, max: 20, done: false, chars: 0 },
      skills: { pts: 0, max: 15, done: false, count: 0 },
      formacao: { pts: 0, max: 15, done: false, count: 0 },
      experiencia: { pts: 0, max: 20, done: false, count: 0 },
    };

    if (profile.avatar) {
      details.avatar.pts = 15;
      details.avatar.done = true;
    }
    if (profile.nome?.length > 3) {
      details.nome.pts = 5;
      details.nome.done = true;
    }
    if (profile.email) {
      details.email.pts = 5;
      details.email.done = true;
    }
    if (profile.tel?.length >= 10) {
      details.tel.pts = 5;
      details.tel.done = true;
    }

    const descLen = cv.desc?.trim().length || 0;
    details.desc.chars = descLen;
    if (descLen >= 100) {
      details.desc.pts = 20;
      details.desc.done = true;
    } else if (descLen >= 50) {
      details.desc.pts = 15;
    } else if (descLen >= 20) {
      details.desc.pts = 8;
    } else if (descLen > 0) {
      details.desc.pts = 3;
    }

    details.skills.count = skills.length;
    details.skills.pts = Math.min(skills.length * 3, 15);
    details.skills.done = skills.length >= 5;

    details.formacao.count = cur.length;
    if (cur.length >= 2) {
      details.formacao.pts = 15;
      details.formacao.done = true;
    } else if (cur.length === 1) {
      details.formacao.pts = 10;
    }

    details.experiencia.count = exp.length;
    if (exp.length >= 2) {
      details.experiencia.pts = 20;
      details.experiencia.done = true;
    } else if (exp.length === 1) {
      details.experiencia.pts = 12;
    }

    const total = Object.values(details).reduce((sum, d) => sum + d.pts, 0);
    return { percent: Math.min(total, 100), details };
  }, [profile, cv, skills, exp, cur]);

  const pct = pctData.percent;

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;

    const previewUrl = URL.createObjectURL(file);
    setProfile((p) => ({ ...p, avatar: previewUrl }));

    try {
      // Converte para jpg 400x400
      const blob = await new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = 400;
          const ctx = canvas.getContext("2d")!;
          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;
          ctx.drawImage(img, x, y, size, size, 0, 0, 400, 400);
          canvas.toBlob((b) => (b ? resolve(b) : reject()), "image/jpeg", 0.9);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      const filePath = `${uid}/avatar.jpg`;

      // Remove antigo e faz upload
      await supabase.storage.from("avatars").remove([filePath]);
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, { upsert: true, cacheControl: "no-cache" });

      if (uploadError) throw uploadError;

      // Pega URL pública
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;

      // Salva em TODOS os campos possíveis do banco
      const { error: dbError } = await supabase
        .from("jovem_aprendiz")
        .update({
          avatar_url: publicUrl,
          avatar: publicUrl,
          foto: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id_ja", uid);

      if (dbError) throw dbError;

      // Atualiza na tela com cache bust
      const finalUrl = `${publicUrl}?v=${Date.now()}`;
      setProfile((p) => ({ ...p, avatar: finalUrl }));
      setAvatarVersion((v) => v + 1);

      // Recarrega do banco para confirmar
      setTimeout(() => loadProfile(uid, profile.email), 1000);
    } catch (err: any) {
      console.error("Erro upload:", err);
      alert("Erro ao enviar foto: " + err.message);
      loadProfile(uid, profile.email); // Restaura
    }
  };

  const saveSummary = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("curriculo").upsert(
        {
          id_ja: uid,
          descricao: summary.trim(),
          competencias: cv.comp,
          experiencias: cv.exp,
          curso: cv.cur,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id_ja" },
      );
      if (error) throw error;
      setCv((c) => ({ ...c, desc: summary.trim() }));
      setEditing(false);
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const descLen = summary.length;
  const descInfo = useMemo(() => {
    if (descLen === 0)
      return { text: "Escreva 20 caracteres para +8%", color: "#9CA3AF" };
    if (descLen < 20)
      return { text: `Faltam ${20 - descLen} para +8%`, color: "#F59E0B" };
    if (descLen < 50)
      return {
        text: `Faltam ${50 - descLen} para +7% (total 15%)`,
        color: "#F59E0B",
      };
    if (descLen < 100)
      return {
        text: `Faltam ${100 - descLen} para +5% (total 20%)`,
        color: "#F59E0B",
      };
    return { text: "✓ Máximo (+20%)", color: "#10B981" };
  }, [descLen]);

  if (loading)
    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.main}>
          <div style={{ padding: 40, color: "#9CA3AF" }}>
            Carregando perfil...
          </div>
        </main>
      </div>
    );

  const avatarSrc = profile.avatar
    ? `${profile.avatar}${profile.avatar.includes("?") ? "&" : "?"}v=${avatarVersion}`
    : " https://www.gravatar.com/avatar/00000000000000000000?d=mp&f=y";

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div className={styles.topText}>
            <h1>Revise e complete seu currículo</h1>
            <p>Mantenha suas informações atualizadas e aumente suas chances</p>
          </div>
          <button
            className={styles.editBtn}
            onClick={() => navigate("/curriculo")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 2.12L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Editar currículo
          </button>
        </div>

        <div className={styles.grid}>
          <section className={`${styles.card} ${styles.profileCard}`}>
            <div className={styles.profileMain}>
              <div className={styles.avatarBox}>
                <img key={avatarVersion} src={avatarSrc} alt={profile.nome} />
                <label className={styles.camBtn} title="Trocar foto">
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
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </label>
              </div>
              <div className={styles.profileInfo}>
                <h2>{profile.nome || "Seu Nome"}</h2>
                <span className={styles.tag}>{profile.titulo}</span>
                <div className={styles.contacts}>
                  <span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#A78BFA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
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
                      stroke="#A78BFA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0.7 2.81 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {phone(profile.tel)}
                  </span>
                  <span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#A78BFA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {profile.cidade}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.progressWrap}>
              <div className={styles.progressTop}>
                <span>Perfil completo</span>
                <strong style={{ color: pct >= 100 ? "#10B981" : "#7C3AED" }}>
                  {pct}%
                </strong>
              </div>
              <div className={styles.progressBar}>
                <div
                  style={{
                    width: `${pct}%`,
                    background: pct >= 100 ? "#10B981" : "#7C3AED",
                    height: "100%",
                    borderRadius: 4,
                    transition: "width 0.5s",
                  }}
                />
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "#9CA3AF",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 4,
                }}
              >
                <div>
                  Foto de perfil: {pctData.details.avatar.pts}/15{" "}
                  {pctData.details.avatar.done ? "Feito" : ""}{" "}
                </div>
                <div>Sobre: {pctData.details.desc.pts}/20</div>
                <div>Habilidades: {pctData.details.skills.pts}/15 </div>
                <div>Formação: {pctData.details.formacao.pts}/15 </div>
                <div>Experiências: {pctData.details.experiencia.pts}/20 </div>
                <div>Base: 15/15</div>
              </div>
            </div>
          </section>

          <section className={`${styles.card} ${styles.aboutCard}`}>
            <div className={styles.cardHeader}>
              <h3>Sobre {editing && `(${descLen})`}</h3>
              <button onClick={() => setEditing(!editing)} disabled={saving}>
                {editing ? "Cancelar" : "Editar"}
              </button>
            </div>
            {editing ? (
              <>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className={styles.textarea}
                  placeholder="Fale sobre você..."
                  rows={4}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: descInfo.color,
                      fontWeight: 500,
                    }}
                  >
                    {descInfo.text}
                  </div>
                  <button
                    className={styles.saveBtn}
                    onClick={saveSummary}
                    disabled={saving}
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "#1a24",
                    borderRadius: 2,
                    marginTop: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(descLen, 100)}%`,
                      background: descLen >= 100 ? "#10B981" : "#7C3AED",
                      transition: "width 0.2s",
                    }}
                  />
                </div>
              </>
            ) : (
              <p>{cv.desc || "Clique em Editar para adicionar um resumo..."}</p>
            )}
          </section>

          <section className={`${styles.card} ${styles.eduCard}`}>
            <div className={styles.cardHeader}>
              <h3>Formação acadêmica</h3>
              <button onClick={() => navigate("/curriculo")}>
                + Adicionar
              </button>
            </div>
            {cur.length === 0 ? (
              <p
                style={{
                  color: "#8A7AB8",
                  fontSize: 13,
                  textAlign: "center",
                  padding: "20px 0",
                }}
              >
                Nenhuma formação
              </p>
            ) : (
              cur.map((c: any, i: number) => (
                <div key={i} className={styles.itemRow}>
                  <div className={styles.itemIcon}>🎓</div>
                  <div>
                    <strong>{c.curso}</strong>
                    <p>{c.instituicao}</p>
                    <small>
                      {c.inicio} {c.fim ? `- ${c.fim}` : ""}
                    </small>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className={`${styles.card} ${styles.skillsCard}`}>
            <div className={styles.cardHeader}>
              <h3>Competências</h3>
              <button onClick={() => navigate("/curriculo")}>
                + Adicionar
              </button>
            </div>
            <div className={styles.skillList}>
              {skills.length > 0 ? (
                skills.map((s, i) => <span key={i}>{s}</span>)
              ) : (
                <span style={{ opacity: 0.5 }}>Nenhuma</span>
              )}
            </div>
            <div className={styles.skillProgress}>
              <div
                style={{ width: `${(pctData.details.skills.pts / 15) * 100}%` }}
              />
            </div>
            <small>
              {skills.length} de 5 • {pctData.details.skills.pts}/15 pts
            </small>
          </section>

          <section className={`${styles.card} ${styles.expCard}`}>
            <div className={styles.cardHeader}>
              <h3>Experiência</h3>
              <button onClick={() => navigate("/curriculo")}>
                + Adicionar
              </button>
            </div>
            {exp.length === 0 ? (
              <p
                style={{
                  color: "#8A7AB8",
                  fontSize: 13,
                  textAlign: "center",
                  padding: "20px 0",
                }}
              >
                Nenhuma experiência
              </p>
            ) : (
              exp.map((e: any, i: number) => (
                <div key={i} className={styles.itemRow}>
                  <div className={styles.itemIcon}>💼</div>
                  <div>
                    <strong>{e.cargo}</strong>
                    <p>{e.empresa}</p>
                    <small>
                      {e.inicio} {e.fim ? `- ${e.fim}` : "- Atual"}
                    </small>
                    {e.descricao && (
                      <p className={styles.desc}>{e.descricao}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>

          <section className={`${styles.card} ${styles.projCard}`}>
            <div className={styles.cardHeader}>
              <h3>Projetos</h3>
              <button onClick={() => navigate("/curriculo")}>
                + Adicionar
              </button>
            </div>
            {projs.length === 0 && (
              <div className={styles.emptyProj}>
                <h4>Nenhum projeto</h4>
                <button onClick={() => navigate("/curriculo")}>
                  + Adicionar projeto
                </button>
              </div>
            )}
          </section>

          <aside className={`${styles.card} ${styles.actionsCard}`}>
            <h3>Ações rápidas</h3>
            <button onClick={() => navigate("/curriculo")}>
              <div className={styles.actionIcon}>💼</div>
              <div>
                <strong>Adicionar experiência</strong>
                <span>Conte sua trajetória</span>
              </div>
            </button>
            <button onClick={() => navigate("/curriculo")}>
              <div className={styles.actionIcon}>🎓</div>
              <div>
                <strong>Adicionar formação</strong>
                <span>Cursos e certificações</span>
              </div>
            </button>
            <button onClick={() => navigate("/curriculo")}>
              <div className={styles.actionIcon}>🚀</div>
              <div>
                <strong>Adicionar projeto</strong>
                <span>Destaque projetos</span>
              </div>
            </button>
            <button onClick={() => navigate("/curriculo")}>
              <div className={styles.actionIcon}>⚡</div>
              <div>
                <strong>Adicionar competência</strong>
                <span>Suas habilidades</span>
              </div>
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}
