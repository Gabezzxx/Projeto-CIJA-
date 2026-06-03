import { SidebarEmpresa } from "../../../components/sideBar/sideBarEmpresa";
import React, { useEffect, useState } from "react";
import styles from "./perfilEmpresa.module.css";
import { supabase } from "../../../supabaseClient";
import { validarTelefone } from "../../../utils/validations/cadastroValidation";
import { formatarTelefone } from "../../../utils/validations/formatter";
import { useDocumentTitle } from "Hooks/useDocumentTitle";
const PerfilEmpresa: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  useDocumentTitle("CIJA - Perfil da Empresa");
  const [editandoDados, setEditandoDados] = useState(false);
  const [erro, setErro] = useState({ nome: "", telefone: "", endereco: "" });

  const [dadosOriginais, setDadosOriginais] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    email: "",
    data_cadastro: "",
    cnpj: "",
  });

  const [dados, setDados] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    email: "",
    data_cadastro: "",
    cnpj: "",
  });

  // =========================
  // FORMAT DATE (CORRIGIDO ÚNICO)
  // =========================
  const formatDate = (d: string) => {
    if (!d) return "-";

    const [y, m, day] = d.split("-");

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

    return `${parseInt(day)} de ${meses[parseInt(m) - 1]} de ${y}`;
  };

  // =========================
  // FETCH DADOS
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const uid = userData.user.id;
      setUserId(uid);

      const { data: perfilEmpresa } = await supabase
        .from("empresa")
        .select(
          "nome, telefone, endereco, email, data_cadastro, avatarempresa_url, cnpj",
        )
        .eq("id_em", uid)
        .single();

      if (perfilEmpresa) {
        const telefoneLimpo = perfilEmpresa.telefone?.replace("+55", "") || "";

        const dadosFormatados = {
          ...perfilEmpresa,
          telefone: telefoneLimpo,
        };

        setDados(dadosFormatados);
        setDadosOriginais(dadosFormatados);

        if (perfilEmpresa.avatarempresa_url) {
          setAvatarUrl(`${perfilEmpresa.avatarempresa_url}?t=${Date.now()}`);
        }
      }
    };

    fetchData();
  }, []);

  // =========================
  // RESIZE IMAGE
  // =========================
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

  // =========================
  // UPLOAD AVATAR
  // =========================
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
        .from("empresa")
        .update({ avatarempresa_url: data.publicUrl })
        .eq("id_em", userId);

      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // VALIDAR NOME
  // =========================
  const validarNome = (nome: string) => {
    const r = /^[A-Za-zÀ-ÿ\s]+$/;

    if (!nome.trim()) return "Nome obrigatório.";
    if (!r.test(nome)) return "Nome inválido.";

    return "";
  };

  // =========================
  // CANCELAR
  // =========================
  const handleCancelarDados = () => {
    setDados(dadosOriginais);
    setErro({ nome: "", telefone: "", endereco: "" });
    setEditandoDados(false);
  };

  // =========================
  // SALVAR (CORRIGIDO)
  // =========================
  const salvarDados = async () => {
    if (!userId) return;

    const nomeErro = validarNome(dados.nome);

    const telefoneErro = validarTelefone(dados.telefone)
      ? ""
      : "Telefone inválido.";

    const enderecoErro = !dados.endereco.trim() ? "Endereço obrigatório." : "";

    setErro({
      nome: nomeErro,
      telefone: telefoneErro,
      endereco: enderecoErro,
    });

    if (nomeErro || telefoneErro || enderecoErro) return;

    await supabase
      .from("empresa")
      .update({
        nome: dados.nome,
        telefone: `+55${dados.telefone.replace(/\D/g, "")}`,
        endereco: dados.endereco,
      })
      .eq("id_em", userId);

    setDadosOriginais({ ...dados });
    setEditandoDados(false);
  };

  // =========================
  // UI
  // =========================
  return (
    <div className={styles.container}>
      <SidebarEmpresa />

      <main className={styles.content}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            <img
              src={
                avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  dados.nome || "Empresa",
                )}&background=7E22CE&color=fff`
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
            <h1>{dados.nome || "Seu perfilEmpresa"}</h1>
            <p>{dados.email}</p>
            <span className={styles.badge}>Empresa</span>
          </div>
        </div>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2>Dados da Empresa</h2>

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
              <label>NOME DA EMPRESA</label>
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
              <label>DATA CADASTRADA</label>
              <p>{formatDate(dados.data_cadastro)}</p>
            </div>

            <div className={styles.field}>
              <label>CNPJ</label>
              <p>{dados.cnpj}</p>
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
      </main>
    </div>
  );
};

export default PerfilEmpresa;
