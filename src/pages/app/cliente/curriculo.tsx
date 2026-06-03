import React, { useEffect, useState, useRef } from "react";
import { Sidebar } from "../../../components/sideBar/sideBar";
import { supabase } from "supabaseClient";
import styles from "./curriculo.module.css";
import { useDocumentTitle } from "Hooks/useDocumentTitle";

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};
type Formacao = {
  instituicao: string;
  curso: string;
  inicio: string;
  fim: string;
  descricao: string;
};
type Experiencia = {
  cargo: string;
  empresa: string;
  inicio: string;
  fim: string;
  descricao: string;
};
type Idioma = { idioma: string; nivel: string };

export const Curriculo: React.FC = () => {
  useDocumentTitle("CIJA - Revisar Currículo");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [email, setEmail] = useState("");
  const [naturalidade, setNaturalidade] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [sobre, setSobre] = useState("");
  const [formacoes, setFormacoes] = useState<Formacao[]>([]);
  const [experiencias, setExperiencias] = useState<Experiencia[]>([]);
  const [idiomas, setIdiomas] = useState<Idioma[]>([]);
  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [progress, setProgress] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const fill =
      [nomeCompleto, telefone, sobre, email].filter(Boolean).length +
      (formacoes.length ? 1 : 0) +
      (experiencias.length ? 1 : 0) +
      (habilidades.length ? 1 : 0) +
      (avatarUrl ? 1 : 0);
    setProgress(Math.round((fill / 8) * 100));
  }, [
    nomeCompleto,
    telefone,
    sobre,
    formacoes,
    experiencias,
    habilidades,
    avatarUrl,
    email,
  ]);

  useEffect(() => {
    if (fetching || !userId || isFirstLoad.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => autoSave(), 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [
    nomeCompleto,
    telefone,
    endereco,
    sobre,
    formacoes,
    experiencias,
    idiomas,
    habilidades,
    naturalidade,
    linkedin,
    github,
  ]);

  function showToast(message: string, type: Toast["type"] = "info") {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }

  async function carregarDados() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const uid = userData.user.id;
      setUserId(uid);
      setEmail(userData.user.email || "");

      const { data: perfil } = await supabase
        .from("jovem_aprendiz")
        .select("nome, telefone, endereco, avatar_url")
        .eq("id_ja", uid)
        .maybeSingle();
      if (perfil) {
        setNomeCompleto(perfil.nome || "");
        setTelefone(
          perfil.telefone
            ? perfil.telefone.replace(/\D/g, "").replace(/^55/, "")
            : "",
        );
        setEndereco(perfil.endereco || "");
        if (perfil.avatar_url)
          setAvatarUrl(`${perfil.avatar_url}?t=${Date.now()}`);
      }

      const { data: cv } = await supabase
        .from("curriculo")
        .select("descricao, competencias, experiencias, curso")
        .eq("id_ja", uid)
        .maybeSingle();
      if (cv) {
        setSobre(cv.descricao || "");
        setHabilidades(
          cv.competencias
            ? cv.competencias
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [],
        );
        try {
          const f = JSON.parse(cv.curso || "[]");
          setFormacoes(Array.isArray(f) ? f : []);
        } catch {
          setFormacoes([]);
        }
        try {
          const exp = JSON.parse(cv.experiencias || "{}");
          setExperiencias(
            Array.isArray(exp.experiencias) ? exp.experiencias : [],
          );
          setIdiomas(Array.isArray(exp.idiomas) ? exp.idiomas : []);
          setLinkedin(exp.linkedin || "");
          setGithub(exp.github || "");
          setNaturalidade(exp.naturalidade || "");
        } catch {
          setExperiencias([]);
        }
      }
    } finally {
      setFetching(false);
      setTimeout(() => {
        isFirstLoad.current = false;
      }, 600);
    }
  }

  const resizeImage = (file: File, size = 800): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => (img.src = e.target?.result as string);
      img.onload = () => {
        const min = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(
          img,
          (img.width - min) / 2,
          (img.height - min) / 2,
          min,
          min,
          0,
          0,
          size,
          size,
        );
        canvas.toBlob((b) => (b ? resolve(b) : reject()), "image/jpeg", 0.9);
      };
      reader.readAsDataURL(file);
    });

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !userId) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      showToast("Imagem maior que 2MB", "error");
      return;
    }
    setUploading(true);
    try {
      const blob = await resizeImage(file, 400);
      const path = `${userId}/avatar.jpg`;
      await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase
        .from("jovem_aprendiz")
        .update({ avatar_url: data.publicUrl })
        .eq("id_ja", userId);
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
      showToast("Foto atualizada", "success");
    } catch {
      showToast("Falha no upload", "error");
    } finally {
      setUploading(false);
    }
  };

  async function autoSave() {
    if (!userId) return;
    setAutoSaving(true);
    const tel = telefone.replace(/\D/g, "").replace(/^55/, "");
    await supabase
      .from("jovem_aprendiz")
      .update({
        nome: nomeCompleto.trim(),
        telefone: tel ? `+55${tel}` : "",
        endereco: endereco.trim(),
      })
      .eq("id_ja", userId);
    await supabase.from("curriculo").upsert(
      {
        id_ja: userId,
        descricao: sobre.trim(),
        competencias: habilidades.join(", "),
        experiencias: JSON.stringify({
          experiencias,
          idiomas,
          linkedin,
          github,
          naturalidade,
        }),
        curso: JSON.stringify(formacoes),
      },
      { onConflict: "id_ja" },
    );
    setAutoSaving(false);
  }

  async function salvarAgora(e?: React.FormEvent) {
    e?.preventDefault();
    if (!userId) return;
    setLoading(true);
    await autoSave();
    setLoading(false);
    showToast("Currículo salvo", "success");
  }

  const addHabilidade = () => {
    const v = skillInput.trim();
    if (v && !habilidades.includes(v)) setHabilidades([...habilidades, v]);
    setSkillInput("");
  };

  const getInitials = () =>
    nomeCompleto
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("") || "JA";

  function gerarPdf() {
    const iniciais = getInitials();
    const avatar = avatarUrl
      ? `<img src="${avatarUrl.split("?")[0]}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;margin-bottom:14px;border:2px solid #7c3aed">`
      : `<div style="width:64px;height:64px;border-radius:50%;background:#1f2937;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;margin-bottom:14px;">${iniciais}</div>`;
    const telFmt = telefone
      ? `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7)}`
      : "(19) 99999-9999";
    const left = `${avatar}<h4>CONTATO</h4><p>${telFmt}<br>${email || "seu@email.com"}<br>${naturalidade || "Sua cidade"}</p><h4>LINKS</h4><p>${linkedin || "linkedin.com/in/..."}<br>${github || "github.com/..."}</p><h4>SKILLS</h4><ul>${habilidades.length ? habilidades.map((h) => `<li>${h}</li>`).join("") : "<li>Adicione habilidades</li>"}</ul>`;
    const right = `<h1>${nomeCompleto || "Seu Nome"}</h1><div class="role">JOVEM APRENDIZ</div><h2>FORMAÇÃO</h2>${(formacoes || []).map((f) => `<div class="blk"><strong>${f.instituicao || "Instituição"}</strong> - ${f.curso || "Curso"}<br><em>${f.inicio || ""}${f.fim ? ` - ${f.fim}` : ""}</em>${f.descricao ? `<p>${f.descricao}</p>` : ""}</div>`).join("") || "<p class='empty'>Adicione sua formação</p>"}<h2>SOBRE MIM</h2><p>${sobre || "Escreva um resumo profissional"}</p><h2>EXPERIÊNCIA</h2><ul>${(experiencias || []).map((e) => `<li><strong>${e.cargo || "Cargo"} - ${e.empresa || "Empresa"}</strong><br>${e.descricao || ""}</li>`).join("") || "<li class='empty'>Adicione experiências</li>"}</ul><h2>IDIOMAS</h2><ul>${(idiomas || []).map((i) => `<li>${i.idioma} - ${i.nivel}</li>`).join("") || "<li class='empty'>Adicione idiomas</li>"}</ul>`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title></title><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:'Inter',Arial,sans-serif}.cv{display:flex;width:210mm;height:297mm}.left{width:33%;background:#0b0f14;color:#e5e7eb;padding:32px 22px}.left h4{color:#a855f7;font-size:10px;text-transform:uppercase;letter-spacing:.8px;margin:22px 0 6px;font-weight:700}.left p{font-size:11px;line-height:1.5;margin:0 0 3px;word-break:break-word}.left ul{margin:0;padding-left:14px}.left li{font-size:11px;margin-bottom:3px}.right{width:67%;background:#fff;padding:36px 30px;color:#111}.right h1{font-size:22px;margin:0 0 2px;font-weight:700;letter-spacing:-.2px}.role{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:18px}.right h2{font-size:11px;font-weight:700;text-transform:uppercase;margin:18px 0 6px;display:flex;align-items:center;gap:8px}.right h2:after{content:"";flex:1;height:1px;background:#e5e7eb}.blk{margin-bottom:10px}.blk strong{font-size:12.5px}.blk em{font-size:10.5px;color:#6b7280}.blk p,.right p{font-size:12px;line-height:1.45;color:#374151;margin:2px 0 0}.right ul{padding-left:16px;margin:0}.right li{font-size:12px;margin-bottom:5px}.empty{color:#9ca3af;font-style:italic}</style></head><body><div class="cv"><div class="left">${left}</div><div class="right">${right}</div></div><script>window.onload=()=>setTimeout(()=>window.print(),400)</script></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) win.onafterprint = () => URL.revokeObjectURL(url);
  }

  if (fetching)
    return (
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.content}>
          <div className={styles.skeleton} />
        </main>
      </div>
    );

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.content}>
        <div className={styles.header}>
          <div>
            <h1>Revisar Currículo</h1>
            <p>Modelo profissional. Preencha e veja o preview ao vivo.</p>
          </div>
          <div className={styles.progressWrap}>
            <div className={styles.progressBar}>
              <div style={{ width: `${progress}%` }} />
            </div>
            <span>{autoSaving ? "Salvando..." : `${progress}% completo`}</span>
          </div>
        </div>
        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.avatarRow}>
              <div className={styles.avatar}>
                {avatarUrl ? <img src={avatarUrl} alt="" /> : getInitials()}
              </div>
              <label className={styles.uploadBtn}>
                {uploading ? "Enviando..." : "Trocar foto"}
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={uploadAvatar}
                  hidden
                />
              </label>
              <span className={styles.hint}>JPG ou PNG até 2MB</span>
            </div>
            <div className={styles.field}>
              <label>Nome Completo</label>
              <input
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                placeholder="Ex: Thiago Araújo"
              />
            </div>
            <div className={styles.two}>
              <div className={styles.field}>
                <label>Telefone</label>
                <input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(19) 99999-9999"
                />
              </div>
              <div className={styles.field}>
                <label>Naturalidade</label>
                <input
                  value={naturalidade}
                  onChange={(e) => setNaturalidade(e.target.value)}
                  placeholder="Paulínia - SP"
                />
              </div>
            </div>
            <div className={styles.two}>
              <div className={styles.field}>
                <label>LinkedIn</label>
                <input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="linkedin.com/in/seuusuario"
                />
              </div>
              <div className={styles.field}>
                <label>GitHub</label>
                <input
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="github.com/seuusuario"
                />
              </div>
            </div>
            <div className={styles.field}>
              <label>Endereço</label>
              <input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, bairro, cidade"
              />
            </div>
            <div className={styles.field}>
              <label>Sobre mim</label>
              <textarea
                rows={4}
                value={sobre}
                onChange={(e) => setSobre(e.target.value)}
                placeholder="Desenvolvedor Full Stack Júnior, 17 anos..."
              />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <h3>Formação</h3>
                <button
                  type="button"
                  onClick={() =>
                    setFormacoes([
                      ...(formacoes || []),
                      {
                        instituicao: "",
                        curso: "",
                        inicio: "",
                        fim: "",
                        descricao: "",
                      },
                    ])
                  }
                >
                  + Adicionar
                </button>
              </div>
              {(formacoes || []).map((f, i) => (
                <div key={i} className={styles.itemBox}>
                  <input
                    placeholder="Ex: Colégio Técnico Bento Quirino"
                    value={f.instituicao}
                    onChange={(e) => {
                      const c = [...formacoes];
                      c[i].instituicao = e.target.value;
                      setFormacoes(c);
                    }}
                  />
                  <input
                    placeholder="Ex: Técnico em Informática"
                    value={f.curso}
                    onChange={(e) => {
                      const c = [...formacoes];
                      c[i].curso = e.target.value;
                      setFormacoes(c);
                    }}
                  />
                  <div className={styles.two}>
                    <input
                      placeholder="Início (ex: 2024)"
                      value={f.inicio}
                      onChange={(e) => {
                        const c = [...formacoes];
                        c[i].inicio = e.target.value;
                        setFormacoes(c);
                      }}
                    />
                    <input
                      placeholder="Fim (ex: 2026 ou Atual)"
                      value={f.fim}
                      onChange={(e) => {
                        const c = [...formacoes];
                        c[i].fim = e.target.value;
                        setFormacoes(c);
                      }}
                    />
                  </div>
                  <textarea
                    placeholder="Descrição do curso"
                    rows={2}
                    value={f.descricao}
                    onChange={(e) => {
                      const c = [...formacoes];
                      c[i].descricao = e.target.value;
                      setFormacoes(c);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <h3>Experiência</h3>
                <button
                  type="button"
                  onClick={() =>
                    setExperiencias([
                      ...(experiencias || []),
                      {
                        cargo: "",
                        empresa: "",
                        inicio: "",
                        fim: "",
                        descricao: "",
                      },
                    ])
                  }
                >
                  + Adicionar
                </button>
              </div>
              {(experiencias || []).map((ex, i) => (
                <div key={i} className={styles.itemBox}>
                  <div className={styles.two}>
                    <input
                      placeholder="Ex: Desenvolvedor Júnior"
                      value={ex.cargo}
                      onChange={(e) => {
                        const c = [...experiencias];
                        c[i].cargo = e.target.value;
                        setExperiencias(c);
                      }}
                    />
                    <input
                      placeholder="Ex: Empresa X"
                      value={ex.empresa}
                      onChange={(e) => {
                        const c = [...experiencias];
                        c[i].empresa = e.target.value;
                        setExperiencias(c);
                      }}
                    />
                  </div>
                  <div className={styles.two}>
                    <input
                      placeholder="Início (ex: Jan 2024)"
                      value={ex.inicio}
                      onChange={(e) => {
                        const c = [...experiencias];
                        c[i].inicio = e.target.value;
                        setExperiencias(c);
                      }}
                    />
                    <input
                      placeholder="Fim (ex: Dez 2024 ou Atual)"
                      value={ex.fim}
                      onChange={(e) => {
                        const c = [...experiencias];
                        c[i].fim = e.target.value;
                        setExperiencias(c);
                      }}
                    />
                  </div>
                  <textarea
                    placeholder="Descreva suas atividades"
                    rows={2}
                    value={ex.descricao}
                    onChange={(e) => {
                      const c = [...experiencias];
                      c[i].descricao = e.target.value;
                      setExperiencias(c);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <h3>Idiomas</h3>
                <button
                  type="button"
                  onClick={() =>
                    setIdiomas([...(idiomas || []), { idioma: "", nivel: "" }])
                  }
                >
                  + Adicionar
                </button>
              </div>
              {(idiomas || []).map((id, i) => (
                <div key={i} className={styles.two}>
                  <input
                    placeholder="Ex: Inglês"
                    value={id.idioma}
                    onChange={(e) => {
                      const c = [...idiomas];
                      c[i].idioma = e.target.value;
                      setIdiomas(c);
                    }}
                  />
                  <input
                    placeholder="Ex: B2 Intermediário"
                    value={id.nivel}
                    onChange={(e) => {
                      const c = [...idiomas];
                      c[i].nivel = e.target.value;
                      setIdiomas(c);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className={styles.section}>
              <h3>Habilidades</h3>
              <div className={styles.tags}>
                {habilidades.map((h, i) => (
                  <span key={i} className={styles.tag}>
                    {h}
                    <button
                      onClick={() =>
                        setHabilidades(habilidades.filter((_, ix) => ix !== i))
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addHabilidade();
                    }
                  }}
                  placeholder="Digite e pressione Enter"
                />
              </div>
            </div>
            <div className={styles.actions}>
              <button
                onClick={salvarAgora}
                disabled={loading}
                className={styles.primary}
              >
                {loading ? "Salvando..." : "Salvar agora"}
              </button>
              <button onClick={gerarPdf} className={styles.secondary}>
                Gerar PDF
              </button>
            </div>
          </section>

          <aside className={styles.preview}>
            <div className={styles.previewTop}>Preview ao vivo</div>
            <div className={styles.cv}>
              <div className={styles.cvLeft}>
                <div className={styles.cvAvatar}>
                  {avatarUrl ? <img src={avatarUrl} alt="" /> : getInitials()}
                </div>
                <h4>CONTATO</h4>
                <p>
                  {telefone ? `+55${telefone}` : "(19) 99999-9999"}
                  <br />
                  {email || "seuemail@gmail.com"}
                  <br />
                  {naturalidade || "Sua cidade"}
                </p>
                <h4>LINKS</h4>
                <p>
                  {linkedin || "linkedin.com/in/..."}
                  <br />
                  {github || "github.com/..."}
                </p>
                <h4>SKILLS</h4>
                <ul>
                  {habilidades.length ? (
                    habilidades.map((h, i) => <li key={i}>{h}</li>)
                  ) : (
                    <li className={styles.empty}>Adicione habilidades</li>
                  )}
                </ul>
              </div>
              <div className={styles.cvRight}>
                <h1>{nomeCompleto || "Seu Nome Completo"}</h1>
                <h2>Formação</h2>
                {(formacoes || []).length ? (
                  (formacoes || []).map((f, i) => (
                    <div key={i} className={styles.block}>
                      <strong>{f.instituicao || "Instituição"}</strong> -{" "}
                      {f.curso || "Curso"}
                      <br />
                      <em>
                        {f.inicio}
                        {f.fim ? ` - ${f.fim}` : ""}
                      </em>
                      <p>{f.descricao}</p>
                    </div>
                  ))
                ) : (
                  <p className={styles.empty}>Adicione sua formação</p>
                )}
                <h2>Sobre mim</h2>
                <p>{sobre || "Escreva um resumo profissional"}</p>
                <h2>Experiência</h2>
                <ul>
                  {(experiencias || []).length ? (
                    (experiencias || []).map((e, i) => (
                      <li key={i}>
                        <strong>{e.cargo || "Cargo"}</strong> - {e.empresa}
                        <br />
                        {e.descricao}
                      </li>
                    ))
                  ) : (
                    <li className={styles.empty}>Adicione experiências</li>
                  )}
                </ul>
                <h2>Idiomas</h2>
                <ul>
                  {(idiomas || []).length ? (
                    (idiomas || []).map((id, i) => (
                      <li key={i}>
                        {id.idioma} - {id.nivel}
                      </li>
                    ))
                  ) : (
                    <li className={styles.empty}>Adicione idiomas</li>
                  )}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <div className={styles.toasts}>
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};
export default Curriculo;
