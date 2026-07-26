import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./page404.module.css";
import { useDocumentTitle } from "../../Hooks/useDocumentTitle";
import cijaLogo from "../../../src/assets/logo2.png";
import errorImg from "../../assets/404error-img.svg";

export default function Page404() {
  const navigate = useNavigate();
  useDocumentTitle("404 - Página Não Encontrada");

  return (
    <main className={styles.wrapper}>
      <header className={styles.header}>
        <img src={cijaLogo} alt="CIJA" className={styles.logo} />

        <nav className={styles.nav}>
          <button onClick={() => navigate("/")}>Login</button>
          
          <button onClick={() => navigate("/cadastro")}>Cadastro</button>

          <button onClick={() => navigate("/ajuda")}>Ajuda</button>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.left}>
          <img src={errorImg} alt="Erro 404" className={styles.heroImage} />
        </div>

        <div className={styles.right}>
          <span className={styles.badge}>ERRO 404</span>

          <h1>404</h1>

          <h2>Página não encontrada</h2>

          <p>
            A página que você está procurando não existe ou foi movida para
            outro endereço. Mas não se preocupe, estamos aqui para ajudar.
          </p>

          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={() => navigate("/")}>
              Voltar ao início
            </button>

            <button
              className={styles.secondaryBtn}
              onClick={() => navigate("/")}
            >
              Fazer login
            </button>
          </div>
        </div>
      </section>

      <section className={styles.helpCard}>
        <div>
          <h3>Precisa de ajuda?</h3>

          <p>
            Nossa equipe está pronta para ajudar você a acessar sua conta ou
            encontrar o que procura.
          </p>
        </div>

        <button onClick={() => navigate("/ajuda")}>Central de Ajuda</button>
      </section>

      <footer className={styles.footer}>
        <img src={cijaLogo} alt="CIJA" />

        <span>
          © {new Date().getFullYear()} CIJA - Centro Integração Jovem Aprendiz
        </span>
      </footer>
    </main>
  );
}
