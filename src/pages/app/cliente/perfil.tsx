import { Sidebar } from "../../../components/sideBar/sideBar";
import React, { useEffect, useState } from "react";
import styles from "./perfil.module.css";
import { supabase } from "supabaseClient";
import { validarTelefone } from "../../../utils/validations/cadastroValidation";
import { formatarTelefone } from "../../../utils/validations/formatter";

const Perfil: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [editandoDados, setEditandoDados] = useState(false);
  const [editandoCurriculo, setEditandoCurriculo] = useState(false);
  const [erro, setErro] = useState({ nome: "", telefone: "", endereco: "" });

  const [dadosOriginais, setDadosOriginais] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    email: "",
    data_nasc: "",
  });
  const [dados, setDados] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    email: "",
    data_nasc: "",
  });

  const [curriculoOriginal, setCurriculoOriginal] = useState({
    descricao: "",
    competencias: "",
    experiencias: "",
    curso: "",
  });
  const [curriculo, setCurriculo] = useState({
    descricao: "",
    competencias: "",
    experiencias: "",
    curso: "",
  });

  const formatDate = (d: string) => {
    if (!d) return "-";
    const [y, m, day] = d.split("-");
    if (!y || !m || !day) return d;

    let year = y;
    if (year.startsWith("00")) year = "20" + year.slice(2);

    const meses = [
      "janeiro",
      "fevereiro",
      "março",
      "abril",
      "maio",
      "junho",
      "julho",
      "agosto",
      "setembro",
      "outubro",
      "novembro",
      "dezembro",
    ];
    return `${parseInt(day)} de ${meses[parseInt(m) - 1]} de ${year}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const uid = userData.user.id;
      setUserId(uid);

      const { data: perfil } = await supabase
        .from("jovem_aprendiz")
        .select("nome, telefone, endereco, email, data_nasc, avatar_url")
        .eq("id_ja", uid)
        .single();
      if (perfil) {
        const telefoneLimpo = perfil.telefone?.replace("+55", "") || "";
        const dadosFormatados = { ...perfil, telefone: telefoneLimpo };
        setDados(dadosFormatados);
        setDadosOriginais(dadosFormatados);

        // OTIMIZAÇÃO  FEITA AGORA:  Quebra de cache no carregamento inicial da página para n bugar a foto
        if (perfil.avatar_url) {
          setAvatarUrl(`${perfil.avatar_url}?t=${Date.now()}`);
        }
      }

      const { data: curriculoData } = await supabase
        .from("curriculo")
        .select("*")
        .eq("id_ja", uid)
        .single();
      if (curriculoData) {
        setCurriculo(curriculoData);
        setCurriculoOriginal(curriculoData);
      }
    };
    fetchData();
  }, []);

  const resizeImage = (file: File, size = 400): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => (img.src = e.target?.result as string);
      img.onload = () => {
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        canvas.toBlob((b) => (b ? resolve(b) : reject()), "image/jpeg", 0.92);
      };
      reader.readAsDataURL(file);
    });

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !userId) return;
    setUploading(true);
    try {
      const blob = await resizeImage(e.target.files[0], 400);
      const filePath = `${userId}/avatar.jpg`;

      await supabase.storage
        .from("avatars")
        .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      await supabase
        .from("jovem_aprendiz")
        .update({ avatar_url: data.publicUrl })
        .eq("id_ja", userId);

      // OTIMIZAÇÃO: Atualiza com timestamp para forçar a renderização imediata na Vercel
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setUploading(false);
    }
  };

  const validarNome = (nome: string) => {
    const r = /^[A-Za-zÀ-ÿ\s]+$/;
    if (!nome.trim() || nome.trim().split(/\s+/).length < 2)
      return "Nome completo é obrigatório.";
    if (!r.test(nome)) return "Nome inválido.";
    return "";
  };

  const handleCancelarDados = () => {
    setDados(dadosOriginais);
    setErro({ nome: "", telefone: "", endereco: "" });
    setEditandoDados(false);
  };

  const handleCancelarCurriculo = () => {
    setCurriculo(curriculoOriginal);
    setEditandoCurriculo(false);
  };

  const salvarDados = async () => {
    if (!userId) return;
    const n = validarNome(dados.nome);
    const t = validarTelefone(dados.telefone) ? "" : "Telefone inválido.";
    const e = !dados.endereco.trim() ? "Endereço obrigatório." : "";
    setErro({ nome: n, telefone: t, endereco: e });
    if (n || t || e) return;

    await supabase
      .from("jovem_aprendiz")
      .update({
        nome: dados.nome,
        telefone: `+55${dados.telefone.replace(/\D/g, "")}`,
        endereco: dados.endereco,
      })
      .eq("id_ja", userId);

    setDadosOriginais(dados);
    setEditandoDados(false);
  };

  const salvarCurriculo = async () => {
    if (!userId) return;
    await supabase.from("curriculo").upsert({ ...curriculo, id_ja: userId });
    setCurriculoOriginal(curriculo);
    setEditandoCurriculo(false);
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.content}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            <img
              src={
                avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(dados.nome || "JA")}&background=7E22CE&color=fff`
              }
              alt="Foto"
              className={styles.avatar}
            />
            <label className={styles.avatarEdit}>
              {uploading ? "..." : "✏️"}
              <input
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
                hidden
              />
            </label>
          </div>
          <div>
            <h1>{dados.nome || "Seu perfil"}</h1>
            <p>{dados.email}</p>
            <span className={styles.badge}>Jovem Aprendiz</span>
          </div>
        </div>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Dados pessoais</h2>
            {/* OTIMIZAÇÃO: Agora chama a função correta de cancelar para limpar estados */}
            <button
              className={styles.btnGhost}
              onClick={
                editandoDados
                  ? handleCancelarDados
                  : () => setEditandoDados(true)
              }
            >
              {editandoDados ? "Cancelar" : "Editar"}
            </button>
          </div>
          <div className={styles.grid3}>
            <div className={styles.field}>
              <label>NOME</label>
              {editandoDados ? (
                <input
                  value={dados.nome}
                  onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                />
              ) : (
                <p>{dados.nome}</p>
              )}
              {erro.nome && <span className={styles.err}>{erro.nome}</span>}
            </div>
            <div className={styles.field}>
              <label>TELEFONE</label>
              {editandoDados ? (
                <input
                  value={dados.telefone}
                  onChange={(e) =>
                    setDados({
                      ...dados,
                      telefone: formatarTelefone(e.target.value),
                    })
                  }
                />
              ) : (
                <p>{dados.telefone}</p>
              )}
              {erro.telefone && (
                <span className={styles.err}>{erro.telefone}</span>
              )}
            </div>
            <div className={styles.field}>
              <label>ENDEREÇO</label>
              {editandoDados ? (
                <input
                  value={dados.endereco}
                  onChange={(e) =>
                    setDados({ ...dados, endereco: e.target.value })
                  }
                />
              ) : (
                <p>{dados.endereco}</p>
              )}
              {erro.endereco && (
                <span className={styles.err}>{erro.endereco}</span>
              )}
            </div>
            <div className={styles.field}>
              <label>EMAIL</label>
              <p>{dados.email}</p>
            </div>
            <div className={styles.field}>
              <label>NASCIMENTO</label>
              <p>{formatDate(dados.data_nasc)}</p>
            </div>
          </div>
          {editandoDados && (
            <div className={styles.actions}>
              <button className={styles.btnPrimary} onClick={salvarDados}>
                Salvar dados
              </button>
            </div>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Currículo</h2>
            {/* OTIMIZAÇÃO: Agora chama a função correta de cancelar para o currículo */}
            <button
              className={styles.btnGhost}
              onClick={
                editandoCurriculo
                  ? handleCancelarCurriculo
                  : () => setEditandoCurriculo(true)
              }
            >
              {editandoCurriculo ? "Cancelar" : "Editar"}
            </button>
          </div>
          {editandoCurriculo ? (
            <div className={styles.formGrid}>
              <div className={styles.fieldFull}>
                <label>DESCRIÇÃO PROFISSIONAL</label>
                <textarea
                  rows={4}
                  value={curriculo.descricao}
                  onChange={(e) =>
                    setCurriculo({ ...curriculo, descricao: e.target.value })
                  }
                  placeholder="Fale sobre você..."
                />
              </div>
              <div className={styles.fieldFull}>
                <label>COMPETÊNCIAS</label>
                <textarea
                  rows={3}
                  value={curriculo.competencias}
                  onChange={(e) =>
                    setCurriculo({ ...curriculo, competencias: e.target.value })
                  }
                  placeholder="Ex: Excel, Comunicação..."
                />
              </div>
              <div className={styles.fieldFull}>
                <label>EXPERIÊNCIAS</label>
                <textarea
                  rows={3}
                  value={curriculo.experiencias}
                  onChange={(e) =>
                    setCurriculo({ ...curriculo, experiencias: e.target.value })
                  }
                />
              </div>
              <div className={styles.fieldFull}>
                <label>CURSO</label>
                <input
                  value={curriculo.curso}
                  onChange={(e) =>
                    setCurriculo({ ...curriculo, curso: e.target.value })
                  }
                />
              </div>
              <div className={styles.actions}>
                <button className={styles.btnPrimary} onClick={salvarCurriculo}>
                  Salvar currículo
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.cvGrid}>
              <div className={styles.cvCard}>
                <h4>Descrição</h4>
                <p>{curriculo.descricao || "Adicione um resumo sobre você"}</p>
              </div>
              <div className={styles.cvCard}>
                <h4>Competências</h4>
                <p>{curriculo.competencias || "—"}</p>
              </div>
              <div className={styles.cvCard}>
                <h4>Experiências</h4>
                <p>{curriculo.experiencias || "—"}</p>
              </div>
              <div className={styles.cvCard}>
                <h4>Curso</h4>
                <p>{curriculo.curso || "—"}</p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Perfil;
