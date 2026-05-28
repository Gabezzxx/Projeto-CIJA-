import React, { useState } from "react";
import styles from "./Sidebar.module.css";
import cijaLogo from "../../assets/logo2.png";
import { useNavigate, useLocation } from "react-router-dom";

type MenuItem = {
  label: string;
  path: string;
};

// Definição dos itens do menu com seus respectivos caminhos
const menuItems: MenuItem[] = [
  { label: "Dashboard", path: "/menuEmpresa" },
  { label: "Ver candidatos", path: "/candidatosEmpresa" },
  { label: "Minhas Vagas", path: "/vagasEmpresa" },
  { label: "Mensagens", path: "/mensagensEmpresa" },
  { label: "Meu Perfil", path: "/perfilEmpresa" },
];

export const SidebarEmpresa: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false); // Fecha o menu ao clicar 
  };

  return (
    <>
      {/* Botão Hambúrguer - Visível apenas no Mobile */}
      <button className={styles.hamburger} onClick={toggleMenu} aria-label="Abrir Menu">
        <div className={`${styles.bar} ${isOpen ? styles.bar1 : ""}`}></div>
        <div className={`${styles.bar} ${isOpen ? styles.bar2 : ""}`}></div>
        <div className={`${styles.bar} ${isOpen ? styles.bar3 : ""}`}></div>
      </button>

      {/* Overlay para fechar o menu ao clicar fora */}
      {isOpen && <div className={styles.overlay} onClick={toggleMenu} />}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
        {/* Parte Superior: Logo e Nav */}
        <div className={styles.topContent}>
          <div className={styles.logoContainer}>
            <img src={cijaLogo} alt="Logo CIJA" className={styles.logo} />
            <p className={styles.subtitle}>Centro de Integração</p>
            <p className={styles.title}>Jovem Aprendiz</p>
          </div>

          <nav className={styles.menu}>
            {menuItems.map((item, index) => (
              <button
                key={index}
                className={`${styles.menuItem} ${location.pathname === item.path ? styles.active : ""
                  }`}
                onClick={() => handleNavigation(item.path)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Parte Inferior: Botão Sair */}
        <div className={styles.bottomContent}>
          <button className={styles.logout} onClick={() => handleNavigation("/loginEmpresa")}>
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};