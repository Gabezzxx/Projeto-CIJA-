import styles from "./mensagemEmpresa.module.css";
import React, { useEffect, useState } from "react";
import { SidebarEmpresa } from "../../../components/sideBar/sideBarEmpresa";
import { supabase } from "../../../supabaseClient";
import { useDocumentTitle } from "Hooks/useDocumentTitle";
import { useNavigate } from "react-router-dom";

interface Mensagem {
  id_msg: string;
  id_ja: string;
  id_em: string;
  enviado_por_jovem: boolean;
  conteudo: string;
  lida: boolean;
  data_envio: string;
}

interface Conversa {
  id_ja: string;
  nome: string;
  avatar_url: string | null;
  ultima_msg?: string;
  data_envio?: string;
}

const MensagemEmpresa: React.FC = () => {
  const [userId, setUserId] = useState<string>("");
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");

  const navigate = useNavigate();

  useDocumentTitle("Mensagens - Empresa");


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
      .select("id_ja, conteudo, data_envio")
      .eq("id_em", userId)
      .order("data_envio", { ascending: false });

    if (!data) return;

    const idsUnicos = Array.from(new Set(data.map((m) => m.id_ja)));

    const { data: candidatos } = await supabase
      .from("jovem_aprendiz")
      .select("id_ja, nome, avatar_url")
      .in("id_ja", idsUnicos);

    const lista: Conversa[] = idsUnicos.map((id) => {
      const pessoa = candidatos?.find((c) => c.id_ja === id);
      const ultima = data.find((m) => m.id_ja === id);

      return {
        id_ja: id,
        nome: pessoa?.nome || "Candidato",
        avatar_url: pessoa?.avatar_url || null,
        ultima_msg: ultima?.conteudo,
        data_envio: ultima?.data_envio,
      };
    });

    setConversas(lista);
  }



  useEffect(() => {
    if (!userId) return;

    carregarConversas();

    const interval = setInterval(() => {
      carregarConversas();
    }, 10000);

    return () => clearInterval(interval);
  }, [userId]);

  async function abrirConversa(id_ja: string) {
    setConversaAtiva(id_ja);

    const { data } = await supabase
      .from("mensagens")
      .select("*")
      .eq("id_em", userId)
      .eq("id_ja", id_ja)
      .order("data_envio", { ascending: true });

    setMensagens(data || []);
  }


  
  useEffect(() => {
    if (!conversaAtiva || !userId) return;

    const interval = setInterval(() => {
      abrirConversa(conversaAtiva);
    }, 3000);

    return () => clearInterval(interval);
  }, [conversaAtiva, userId]);

  // 🔹 enviar mensagem
  async function enviarMensagem() {
    if (!texto.trim() || !conversaAtiva) return;

    await supabase.from("mensagens").insert({
      id_em: userId,
      id_ja: conversaAtiva,
      conteudo: texto,
      enviado_por_jovem: false,
      lida: false,
      data_envio: new Date().toISOString(),
    });

    setTexto("");

    abrirConversa(conversaAtiva);
  }

  return (
    <div className={styles.container}>

      <div
        className={styles.sidebar}
        style={{ display: conversaAtiva ? "none" : "block" }}
      >
        <div className={styles.sidebarHeader}>
          Mensagens
        </div>

        <div
          className={styles.backButton}
          onClick={() => navigate(-1)}
        >
          ← Voltar
        </div>

        {conversas.map((c) => (
          <div
            key={c.id_ja}
            className={styles.conversaItem}
            onClick={() => abrirConversa(c.id_ja)}
          >
            <img
              src={c.avatar_url || "/avatar.png"}
              className={styles.avatar}
            />

            <div>
              <strong>{c.nome}</strong>
              <p>{c.ultima_msg}</p>
            </div>
          </div>
        ))}
      </div>

      {conversaAtiva && (
        <div className={styles.chatArea}>
          <div className={styles.chatHeader}>
            <button onClick={() => setConversaAtiva(null)}>
              ←
            </button>

            <h3>
              {conversas.find((c) => c.id_ja === conversaAtiva)?.nome}
            </h3>
          </div>

          <div className={styles.messages}>
            {mensagens.map((m) => (
              <div
                key={m.id_msg}
                className={
                  m.enviado_por_jovem
                    ? styles.msgLeft
                    : styles.msgRight
                }
              >
                {m.conteudo}
              </div>
            ))}
          </div>

          <div className={styles.inputArea}>
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Digite uma mensagem..."
              onKeyDown={(e) => {
                if (e.key === "Enter") enviarMensagem();
              }}
            />

            <button onClick={enviarMensagem}>
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MensagemEmpresa;