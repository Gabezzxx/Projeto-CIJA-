import styles from "./mensagemEmpresa.module.css";
import React from "react";
import { SidebarEmpresa } from "../../../components/sideBar/sideBarEmpresa";


const MensagemEmpresa: React.FC = () => {
  return (
  <div className={styles.container}>
    <SidebarEmpresa />
    <main className={styles.main}>
      Dashboard em construção...
    </main>
  </div>
);
};

export default MensagemEmpresa;