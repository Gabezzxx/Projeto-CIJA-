import { SidebarEmpresa } from "../../../components/sideBar/sideBarEmpresa";
import React, { useEffect, useState } from "react";
import styles from "./perfilEmpresa.module.css";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "Hooks/useDocumentTitle";

export default function PerfilEmpresa() {
  const navigate = useNavigate();
  useDocumentTitle("CIJA - Meu Perfil");

  const [empresa, setEmpresa] = useState<any>(null);
  const [stats, setStats] = useState({
    vagas: 0,
    candidatos: 0,
    processo: 0,
    contratados: 0,
  });
  const [atividades, setAtividades] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const uid = user.id;

    const { data: emp } = await supabase
      .from("empresa")
      .select("*")
      .eq("id_em", uid)
      .single();
    if (emp) setEmpresa(emp);

    const { data: vagas } = await supabase
      .from("vaga")
      .select("id_vag, titulo, data_publicada")
      .eq("id_em", uid)
      .order("data_publicada", { ascending: false });
    const vagasIds = vagas?.map((v) => v.id_vag) || [];

    const { count: vCount } = await supabase
      .from("vaga")
      .select("*", { count: "exact", head: true })
      .eq("id_em", uid);

    let c = 0,
      p = 0,
      h = 0;
    if (vagasIds.length > 0) {
      const { count: c1 } = await supabase
        .from("candidaturas")
        .select("*", { count: "exact", head: true })
        .in("id_vag", vagasIds);
      const { count: c2 } = await supabase
        .from("candidaturas")
        .select("*", { count: "exact", head: true })
        .in("id_vag", vagasIds)
        .eq("status", "em_processo");
      const { count: c3 } = await supabase
        .from("candidaturas")
        .select("*", { count: "exact", head: true })
        .in("id_vag", vagasIds)
        .eq("status", "contratado");
      c = c1 || 0;
      p = c2 || 0;
      h = c3 || 0;
    }
    setStats({
      vagas: vCount || 0,
      candidatos: c,
      processo: p,
      contratados: h,
    });

    const acts: any[] = [];

    if (vagas && vagas.length > 0) {
      acts.push({
        tipo: "vaga",
        titulo: "Nova vaga publicada",
        desc: `${vagas[0].titulo} - ${new Date(vagas[0].data_publicada).toLocaleDateString("pt-BR")}`,
        tempo: "há 2 horas",
      });
    }

    if (vagasIds.length > 0) {
      const { data: cand } = await supabase
        .from("candidaturas")
        .select(
          `created_at, vaga:vaga(titulo), jovem_aprendiz:jovem_aprendiz(nome, avatar_url)`,
        )
        .in("id_vag", vagasIds)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cand) {
        const ja = Array.isArray(cand.jovem_aprendiz)
          ? cand.jovem_aprendiz[0]
          : cand.jovem_aprendiz;
        const vg = Array.isArray(cand.vaga) ? cand.vaga[0] : cand.vaga;
        acts.push({
          tipo: "user",
          titulo: "Novo candidato inscrito",
          desc: `${ja?.nome || "Candidato"} se candidatou para a vaga de ${vg?.titulo || ""}`,
          tempo: "há 5 horas",
          foto: ja?.avatar_url,
        });
      }
    }

    // ÚLTIMA MENSAGEM - CÓPIA EXATA DA LÓGICA DO MensagemEmpresa
    const { data: mensagens } = await supabase
      .from("mensagens")
      .select("id_ja, conteudo, data_envio, lida, enviado_por_jovem")
      .eq("id_em", uid)
      .eq("enviado_por_jovem", true)
      .order("data_envio", { ascending: false })
      .limit(1);

    if (mensagens && mensagens.length > 0) {
      const ultima = mensagens[0];
      const { data: jovem } = await supabase
        .from("jovem_aprendiz")
        .select("nome")
        .eq("id_ja", ultima.id_ja)
        .maybeSingle();

      acts.push({
        tipo: "msg",
        titulo: "Mensagem recebida",
        desc: `Você recebeu uma mensagem de ${jovem?.nome || "Maria Eduarda"}`,
        tempo: "há 1 dia",
      });
    }

    setAtividades(acts);
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !empresa) return;

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Redimensionar imagem
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (ev) => {
        img.src = ev.target?.result as string;
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const size = 400;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d")!;

          const min = Math.min(img.width, img.height);
          const sx = (img.width - min) / 2;
          const sy = (img.height - min) / 2;

          ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);

          canvas.toBlob(
            async (blob) => {
              if (!blob) return;

              const path = `${user.id}/avatar-${Date.now()}.jpg`;
              const { error } = await supabase.storage
                .from("avatars")
                .upload(path, blob, {
                  upsert: true,
                  contentType: "image/jpeg",
                });

              if (error) {
                console.error(error);
                setUploading(false);
                return;
              }

              const { data } = supabase.storage
                .from("avatars")
                .getPublicUrl(path);
              await supabase
                .from("empresa")
                .update({ avatarempresa_url: data.publicUrl })
                .eq("id_em", user.id);

              setEmpresa({ ...empresa, avatarempresa_url: data.publicUrl });
              setUploading(false);
            },
            "image/jpeg",
            0.9,
          );
        };
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  }

  const formatDate = (d: string) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (!empresa) {
    return (
      <div className={styles.page}>
        <SidebarEmpresa />
        <main className={styles.main}>
          <div style={{ padding: 40, color: "#a78bfa" }}>Carregando...</div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <SidebarEmpresa />
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            <div className={styles.avatarWrap}>
              <img
                src={
                  empresa.avatarempresa_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(empresa.nome)}&background=7c3aed&color=fff`
                }
                alt={empresa.nome}
              />
              <label className={styles.editAvatar}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                >
                  <path d="" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </label>
            </div>
            <div className={styles.heroInfo}>
              <h1>
                {empresa.nome} <span className={styles.star}>★</span>
              </h1>
              <p className={styles.heroEmail}>{empresa.email}</p>
              <span className={styles.heroTag}>Empresa</span>
              <p className={styles.heroDesc}>
                Conectamos jovens talentos a oportunidades de aprendizado e
                crescimento profissional.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.container}>
          <div className={styles.leftCol}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="2"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                  Informações da empresa
                </h2>
                <button
                  className={styles.btnEdit}
                  onClick={() => navigate("/perfilEmpresa/editar")}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Editar informações
                </button>
              </div>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                    >
                      <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <div>
                    <label>Nome da empresa</label>
                    <p>{empresa.nome}</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                    >
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2" />
                    </svg>
                  </div>
                  <div>
                    <label>Telefone</label>
                    <p>{empresa.telefone}</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    </svg>
                  </div>
                  <div>
                    <label>Endereço</label>
                    <p>{empresa.endereco || "aquiiii"}</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 7l-10 5L2 7" />
                    </svg>
                  </div>
                  <div>
                    <label>E-mail</label>
                    <p>{empresa.email}</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                    </svg>
                  </div>
                  <div>
                    <label>Data cadastrada</label>
                    <p>{formatDate(empresa.data_cadastro)}</p>
                  </div>
                </div>
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    </svg>
                  </div>
                  <div>
                    <label>CNPJ</label>
                    <p>{empresa.cnpj}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="2"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  Atividade recente
                </h2>
              </div>
              <div className={styles.activityList}>
                {atividades.map((a, i) => (
                  <div key={i} className={styles.activityItem}>
                    <div className={`${styles.actIcon} ${styles[a.tipo]}`}>
                      {a.tipo === "vaga" && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                        >
                          <rect x="2" y="7" width="20" height="14" rx="2" />
                        </svg>
                      )}
                      {a.tipo === "user" &&
                        (a.foto ? (
                          <img
                            src={a.foto}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        ))}
                      {a.tipo === "msg" && (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                        >
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      )}
                    </div>
                    <div className={styles.actContent}>
                      <strong>{a.titulo}</strong>
                      <p>{a.desc}</p>
                    </div>
                    <span className={styles.actTime}>{a.tempo}</span>
                  </div>
                ))}
              </div>
              <button
                className={styles.linkBtn}
                onClick={() => navigate("/mensagensEmpresa")}
              >
                Ver todas as atividades
              </button>
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="2"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  Resumo da empresa
                </h2>
              </div>
              <div className={styles.statsList}>
                <div className={styles.statItem}>
                  <div>
                    <strong>{stats.vagas}</strong>
                    <span>Vagas publicadas</span>
                  </div>
                  <div className={styles.statIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                    >
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                    </svg>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div>
                    <strong>{stats.candidatos}</strong>
                    <span>Candidatos</span>
                  </div>
                  <div className={styles.statIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div>
                    <strong>{stats.processo}</strong>
                    <span>Em processo</span>
                  </div>
                  <div className={styles.statIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                </div>
                <div className={styles.statItem}>
                  <div>
                    <strong>{stats.contratados}</strong>
                    <span>Contratados</span>
                  </div>
                  <div className={styles.statIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="2"
                  >
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Ações rápidas
                </h2>
              </div>
              <div className={styles.actionsList}>
                <button onClick={() => navigate("/vagasEmpresa/nova")}>
                  <div className={styles.actionIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <div>
                    <strong>Criar nova vaga</strong>
                    <span>Publique uma nova oportunidade</span>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button onClick={() => navigate("/candidatosEmpresa")}>
                  <div className={styles.actionIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <strong>Ver candidatos</strong>
                    <span>Acompanhe os candidatos</span>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button onClick={() => navigate("/vagasEmpresa")}>
                  <div className={styles.actionIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                    >
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                    </svg>
                  </div>
                  <div>
                    <strong>Minhas vagas</strong>
                    <span>Gerencie suas vagas publicadas</span>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button onClick={() => navigate("/mensagensEmpresa")}>
                  <div className={styles.actionIcon}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#a78bfa"
                      strokeWidth="2"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <strong>Mensagens</strong>
                    <span>Veja suas conversas</span>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
