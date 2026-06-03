import { useState } from "react";
import emailjs from "@emailjs/browser";
import styles from "./ajuda.module.css";

import logo from "../assets/logo2.png";

export default function Ajuda() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setToast(null);
    console.log("SERVICE:", process.env.REACT_APP_EMAILJS_SERVICE_ID);
    console.log("TEMPLATE:", process.env.REACT_APP_EMAILJS_TEMPLATE_ID);
    console.log("PUBLIC:", process.env.REACT_APP_EMAILJS_PUBLIC_KEY);
    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID!,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID!,

        {
          nome,
          email,
          assunto,
          mensagem,
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY!,
      );

      setToast({
        type: "success",
        text: "Mensagem enviada com sucesso.",
      });

      setNome("");
      setEmail("");
      setAssunto("");
      setMensagem("");
    } catch (err: any) {
      console.error(err);
      console.log(process.env.REACT_APP_EMAILJS_SERVICE_ID);
      setToast({
        type: "error",
        text: "Não foi possível enviar a mensagem.",
      });
    }

    setLoading(false);

    setTimeout(() => {
      setToast(null);
    }, 5000);
  }

  return (
    <main className={styles.page}>
      {toast && (
        <div
          className={
            toast.type === "success" ? styles.successToast : styles.errorToast
          }
        >
          <div className={styles.toastIcon}>
            {toast.type === "success" ? "✓" : "!"}
          </div>

          <span>{toast.text}</span>
        </div>
      )}

      <section className={styles.card}>
        <img src={logo} alt="CIJA" className={styles.logo} />

        <h1>Central de Ajuda</h1>

        <p className={styles.subtitle}>
          Descreva sua dúvida ou problema e nossa equipe receberá sua
          solicitação.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Nome</label>

            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              required
            />
          </div>

          <div className={styles.field}>
            <label>E-mail</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@gmail.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label>Assunto</label>

            <input
              type="text"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Ex: Problema no login"
              required
            />
          </div>

          <div className={styles.field}>
            <label>Mensagem</label>

            <textarea
              rows={5}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Explique seu problema..."
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Solicitação"}
          </button>
        </form>

        <small className={styles.footerText}>
          Seus dados serão usados apenas para responder sua solicitação.
        </small>
      </section>
    </main>
  );
}
