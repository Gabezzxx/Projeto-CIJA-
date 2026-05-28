import React, { useState } from "react";
import styles from "./Sidebar.module.css";
import cijaLogo from "../../assets/logo2.png";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";

type MenuItem = {
  label: string;
  path: string;
};

const menuItems: MenuItem[] = [
  { label: "Dashboard", path: "/clientDashboard" },
  { label: "Revisar Currículo", path: "/curriculo" },
  { label: "Minhas Vagas", path: "/vagas" },
  { label: "Mensagens", path: "/mensagens" },
  { label: "Meu Perfil", path: "/perfil" },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Controla qual rota está carregando e bloqueia cliques repetidos
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);

  const toggleMenu = () => {
    if (isNavigating) return; // Impede abrir/fechar o menu se estiver mudando de página
    setIsOpen(!isOpen);
  };

  const handleNavigation = (path: string) => {
    if (isNavigating || location.pathname === path) return; // Evita cliques duplos ou na aba atual

    setIsNavigating(true);
    setTargetPath(path); // Guarda a rota que o usuário quer ir para mostrar o visual de load

    setTimeout(() => {
      navigate(path);
      setIsOpen(false); // Fecha o menu lateral mobile
      setIsNavigating(false);
      setTargetPath(null);
    }, 1200); // 1,2 milissegundos = 1,2 segundos 
  };

  const handleLogout = async () => {
    if (isNavigating) return;
    await supabase.auth.signOut();
    localStorage.removeItem("usuario_logado");
    localStorage.removeItem("empresa_logada");
    navigate("/", { replace: true });
  };

  return (
    <>
      {/* Botão Hambúrguer - Visível apenas no Mobile */}
      <button
        className={styles.hamburger}
        onClick={toggleMenu}
        aria-label="Abrir Menu"
        disabled={isNavigating} // Desativa o botão se estiver carregando
      >
        <div className={`${styles.bar} ${isOpen ? styles.bar1 : ""}`}></div>
        <div className={`${styles.bar} ${isOpen ? styles.bar2 : ""}`}></div>
        <div className={`${styles.bar} ${isOpen ? styles.bar3 : ""}`}></div>
      </button>

      {/* Overlay para fechar o menu ao clicar fora */}
      {isOpen && <div className={styles.overlay} onClick={toggleMenu} />}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
        style={{ pointerEvents: isNavigating ? "none" : "auto" }} // Bloqueia interações na barra toda enquanto carrega
      >
        {/* Parte Superior: Logo e Nav */}
        <div className={styles.topContent}>
          <div className={styles.logoContainer}>
            <img src={cijaLogo} alt="Logo CIJA" className={styles.logo} />
            <p className={styles.subtitle}>Centro de Integração</p>
            <p className={styles.title}>Jovem Aprendiz</p>
          </div>

          <nav className={styles.menu}>
            {menuItems.map((item, index) => {
              const estáAcessando = targetPath === item.path;
              const estáAtivo = location.pathname === item.path;

              return (
                <button
                  key={index}
                  className={`${styles.menuItem} ${estáAtivo ? styles.active : ""} ${estáAcessando ? styles.loadingItem : ""}`}
                  onClick={() => handleNavigation(item.path)}
                  disabled={isNavigating}
                  style={{
                    opacity: isNavigating && !estáAcessando ? 0.6 : 1,
                    transition: "all 0.3s ease",
                  }}
                >
                  {/* Altera o texto se o botão específico foi clicado */}
                  {estáAcessando ? "Carregando..." : item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Parte Inferior: Botão Sair */}
        <div className={styles.bottomContent}>
          <button
            className={styles.logout}
            onClick={handleLogout}
            disabled={isNavigating}
          >
            Sair
          </button>
        </div>
      </aside>
    </>
  );
};
