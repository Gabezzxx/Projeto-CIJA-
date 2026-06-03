import React from "react";
import { Link } from "react-router-dom";
import styles from "./page404.module.css";
import { useNavigate } from "react-router-dom";
//sistema de navegação para voltar para a página inicial
export const Page404: React.FC = () => {
  const navigate = useNavigate();
  const handleLinkback = () => {
    navigate("/");
  };

  return (
    <main className={styles.wrapper}>
      <div className={styles.container}>
        {/* ROBÔ ESQUERDA */}
        <section className={styles.robotArea}>
          <div className={styles.spotlight}></div>

          <svg
            className={styles.robot}
            viewBox="0 0 300 350"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Cabeça */}
            <rect
              x="90"
              y="40"
              width="120"
              height="90"
              rx="12"
              fill="#ffffff"
            />

            {/* Antenas */}
            <line
              x1="120"
              y1="35"
              x2="105"
              y2="15"
              stroke="#8b5cf6"
              strokeWidth="4"
            />
            <line
              x1="180"
              y1="35"
              x2="195"
              y2="15"
              stroke="#8b5cf6"
              strokeWidth="4"
            />

            {/* Olhos X */}
            <line
              x1="120"
              y1="75"
              x2="140"
              y2="95"
              stroke="#111"
              strokeWidth="4"
            />
            <line
              x1="140"
              y1="75"
              x2="120"
              y2="95"
              stroke="#111"
              strokeWidth="4"
            />

            <line
              x1="160"
              y1="75"
              x2="180"
              y2="95"
              stroke="#111"
              strokeWidth="4"
            />
            <line
              x1="180"
              y1="75"
              x2="160"
              y2="95"
              stroke="#111"
              strokeWidth="4"
            />

            {/* Boca triste */}
            <path
              d="M125 115 Q150 95 175 115"
              stroke="#111"
              strokeWidth="4"
              fill="none"
            />

            {/* Corpo */}
            <rect
              x="105"
              y="145"
              width="90"
              height="100"
              rx="10"
              fill="#e5e7eb"
            />

            {/* Braço esquerdo */}
            <line
              x1="105"
              y1="180"
              x2="45"
              y2="220"
              stroke="#c4b5fd"
              strokeWidth="8"
            />

            {/* Braço direito quebrado */}
            <line
              x1="195"
              y1="180"
              x2="250"
              y2="130"
              stroke="#c4b5fd"
              strokeWidth="8"
            />

            {/* Pernas */}
            <line
              x1="125"
              y1="245"
              x2="100"
              y2="300"
              stroke="#c4b5fd"
              strokeWidth="8"
            />

            <line
              x1="175"
              y1="245"
              x2="200"
              y2="300"
              stroke="#c4b5fd"
              strokeWidth="8"
            />

            {/* Peças caídas */}
            <circle cx="55" cy="255" r="8" fill="#8b5cf6" />
            <circle cx="230" cy="280" r="8" fill="#8b5cf6" />
            <circle cx="150" cy="320" r="8" fill="#8b5cf6" />
          </svg>
        </section>

        {/* TEXTO DIREITA */}
        <section className={styles.content}>
          <span className={styles.badge}>ERRO 404</span>

          <h1 className={styles.code}>404</h1>

          <h2 className={styles.title}>Página não encontrada</h2>

          <p className={styles.description}>
            O recurso que você tentou acessar não existe, foi removido ou teve
            seu endereço alterado.
          </p>

          <div className={styles.actions}>
            <button className={styles.primaryBtn} onClick={() => navigate("/")}>
              {" "}
              Voltar ao início
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Page404;
