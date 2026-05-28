import { Sidebar } from "../../../components/sideBar/sideBar";
import React from "react";
import styles from "./mensagens.module.css";

const Mensagens: React.FC = () => {
  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.content}>
        <h1>Mensagens 0 versao beta</h1>
        <p>Conteúdo da página...</p>
      </main>
    </div>
  );
};

export default Mensagens;
