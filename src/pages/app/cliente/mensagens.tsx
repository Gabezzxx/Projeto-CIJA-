import React, { useState, useEffect } from "react";
import { Sidebar } from "../../../components/sideBar/sideBar";
import styles from "./mensagens.module.css";
import { supabase } from "../../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "Hooks/useDocumentTitle";

interface Mensagem {
  id_msg: string;
  id_ja: string;
  id_em: string;
  enviado_por_jovem: boolean;
  conteudo: string;
  data_envio: string;
}

interface Conversa {
  id_em: string;
  nome: string;
  avatar_url: string | null;
  ultima_msg?: string;
}

const Mensagens: React.FC = () => {
  const [userId, setUserId] = useState("");
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [ativa, setAtiva] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const navigate = useNavigate();
  useDocumentTitle("Mensagens - Cliente");


  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUserId(data.user.id);
    };
    init();
  }, []);




  async function carregarConversas() {
    if (!userId) return;

    const { data } = await supabase
      .from("mensagens")
      .select("id_em, conteudo, data_envio")
      .eq("id_ja", userId)
      .order("data_envio", { ascending: false });

    if (!data) return;

    const idsUnicos = Array.from(new Set(data.map((m) => m.id_em)));

    const { data: empresas } = await supabase
      .from("empresa")
      .select("id_em,nome,avatarempresa_url")
      .in("id_em", idsUnicos);

    const lista: Conversa[] = idsUnicos.map((id) => {
      const empresa = empresas?.find((e) => e.id_em === id);
      const ultima = data.find((m) => m.id_em === id);

      return {
        id_em: id,
        nome: empresa?.nome || "Empresa",
        avatar_url: empresa?.avatarempresa_url || null,
        ultima_msg: ultima?.conteudo,
      };
    });

    setConversas(lista);
  }



  async function abrir(id_em: string) {
    setAtiva(id_em);

    const { data } = await supabase
      .from("mensagens")
      .select("*")
      .eq("id_ja", userId)
      .eq("id_em", id_em)
      .order("data_envio", { ascending: true });

    setMensagens(data || []);
  }



  async function enviar() {
  if (!texto.trim() || !ativa) return;

  if (texto.length > 2000) {
    alert("A mensagem pode ter no máximo 2000 caracteres.");
    return;
  }

  await supabase.from("mensagens").insert({
    id_ja: userId,
    id_em: ativa,
    conteudo: texto,
    enviado_por_jovem: true,
    lida: false,
    data_envio: new Date().toISOString(),
  });

  setTexto("");
  abrir(ativa);
}

  useEffect(() => {
    if (!ativa || !userId) return;

    const interval = setInterval(() => {
      abrir(ativa);
    }, 3000); // 3s

    return () => clearInterval(interval);
  }, [ativa, userId]);


  // polling
  useEffect(() => {
    if (!userId) return;

    carregarConversas();

    const interval = setInterval(() => {
      carregarConversas();
    }, 10000); // 10s

    return () => clearInterval(interval);
  }, [userId]);

  return (
  <div className={styles.container}>
    {!ativa ? (
      <>
        {/* LISTA DE CONVERSAS */}
        <div className={styles.sidebar}>
          <div className={styles.header}>Mensagens</div>

          <div
            className={styles.backButton}
            onClick={() => navigate(-1)}
          >
            ← Voltar
          </div>

          {conversas.map((c) => (
            <div
              key={c.id_em}
              className={styles.item}
              onClick={() => abrir(c.id_em)}
            >
              <img
                src={c.avatar_url || "/avatar.png"}
                alt={c.nome}
              />

              <div className={styles.info}>
                <strong>{c.nome}</strong>
                <p>{c.ultima_msg}</p>
              </div>
            </div>
          ))}
        </div>

        {/* TELA VAZIA */}
        <div className={styles.empty}>
          <h2>Comece a conversar</h2>
          <p>Selecione uma conversa para visualizar as mensagens.</p>
        </div>
      </>
    ) : (
      /* CHAT */
      <div className={styles.chat}>
        <div className={styles.top}>
          <button onClick={() => setAtiva(null)}>←</button>

          <h3>
            {conversas.find((c) => c.id_em === ativa)?.nome}
          </h3>
        </div>

        <div className={styles.msgs}>
          {mensagens.map((m) => (
            <div
              key={m.id_msg}
              className={
                m.enviado_por_jovem
                  ? styles.msgRight
                  : styles.msgLeft
              }
            >
              {m.conteudo}
            </div>
          ))}
        </div>

        <div className={styles.input}>
          <input
            value={texto}
            maxLength={2000}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Mensagem..."
            onKeyDown={(e) => {
              if (e.key === "Enter") enviar();
            }}
          />

          <button onClick={enviar}>Enviar</button>
        </div>
      </div>
    )}
  </div>
);}

export default Mensagens;