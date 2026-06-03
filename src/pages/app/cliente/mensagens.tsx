import { Sidebar } from "../../../components/sideBar/sideBar";
import React from "react";
import styles from "./mensagens.module.css";
import { useDocumentTitle } from "Hooks/useDocumentTitle";
const Mensagens: React.FC = () => {
  useDocumentTitle("CIJA - Mensagens");
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
