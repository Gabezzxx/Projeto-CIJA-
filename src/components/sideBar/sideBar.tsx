import React, { useState, useEffect, useCallback } from "react";
import styles from "./Sidebar.module.css";
import cijaLogo from "../../assets/logo2.png";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";

type MenuItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
};

// Ícones
const HomeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 10.5L12 3l9 7.5" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </svg>
);
const BriefcaseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M3 12h18" />
  </svg>
);
const ClipboardCheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 5h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
    <path d="M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2" />
    <path d="m9 14 2 2 4-4" />
  </svg>
);
const HeartIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 0 0 0 0-7.78z" />
  </svg>
);
const MailIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);
const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);
const LogoutIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
  </svg>
);
const TrendingUpIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 13" />
  </svg>
);

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userId, setUserId] = useState<string>("");
  const [naoLidas, setNaoLidas] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [targetPath, setTargetPath] = useState<string | null>(null);

  // DETECTA ABERTA/FECHADA - trava scroll do site no mobile
  useEffect(() => {
    const isMobile = window.innerWidth <= 992;
    if (isOpen && isMobile) {
      document.body.classList.add(styles.sidebarOpenBody);
    } else {
      document.body.classList.remove(styles.sidebarOpenBody);
    }
    return () => {
      document.body.classList.remove(styles.sidebarOpenBody);
    };
  }, [isOpen]);

  // Pega usuário
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUserId(data.user.id);
    };
    init();
  }, []);

  // Conta mensagens não lidas
  const carregarNaoLidas = useCallback(async () => {
    if (!userId) return;
    const { count } = await supabase
      .from("mensagens")
      .select("*", { count: "exact", head: true })
      .eq("id_ja", userId)
      .eq("enviado_por_jovem", false)
      .eq("lida", false);
    setNaoLidas(count || 0);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    carregarNaoLidas();
    const interval = setInterval(carregarNaoLidas, 5000);
    return () => clearInterval(interval);
  }, [carregarNaoLidas, userId]);

  // Fecha ao mudar de rota no mobile
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const menuItems: MenuItem[] = [
    { label: "Dashboard", path: "/clientDashboard", icon: <HomeIcon /> },
    { label: "Minhas Vagas", path: "/vagas", icon: <BriefcaseIcon /> },
    {
      label: "Candidaturas",
      path: "/candidaturas",
      icon: <ClipboardCheckIcon />,
    },
    {
      label: "Revisar Currículo",
      path: "/curriculo",
      icon: <ClipboardCheckIcon />,
    },
    { label: "Favoritos", path: "/favoritos", icon: <HeartIcon /> },
    {
      label: "Mensagens",
      path: "/mensagens",
      icon: <MailIcon />,
      badge: naoLidas,
    },
    { label: "Meu Perfil", path: "/perfil", icon: <UserIcon /> },
  ];

  const toggleMenu = () => {
    if (isNavigating) return;
    setIsOpen((prev) => !prev);
  };

  const handleNavigation = (path: string) => {
    if (isNavigating || location.pathname === path) {
      setIsOpen(false);
      return;
    }
    setIsNavigating(true);
    setTargetPath(path);

    // Navegação instantânea - quando fecha aparece o conteúdo normal
    navigate(path);
    setIsOpen(false);

    setTimeout(() => {
      setIsNavigating(false);
      setTargetPath(null);
    }, 300);
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
      {/* Botão hambúrguer - só aparece no mobile via CSS */}
      <button
        className={styles.hamburger}
        onClick={toggleMenu}
        aria-label={isOpen ? "Fechar Menu" : "Abrir Menu"}
        aria-expanded={isOpen}
        disabled={isNavigating}
      >
        <div className={`${styles.bar} ${isOpen ? styles.bar1 : ""}`}></div>
        <div className={`${styles.bar} ${isOpen ? styles.bar2 : ""}`}></div>
        <div className={`${styles.bar} ${isOpen ? styles.bar3 : ""}`}></div>
      </button>

      {/* Overlay escuro quando aberta no mobile */}
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={toggleMenu}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
        aria-hidden={!isOpen && window.innerWidth <= 992}
        style={{ pointerEvents: isNavigating ? "none" : "auto" }}
      >
        <div className={styles.topContent}>
          <div className={styles.logoContainer}>
            <img src={cijaLogo} alt="Logo CIJA" className={styles.logo} />
            <p className={styles.subtitle}>Centro de Integração</p>
            <p className={styles.title}>Jovem Aprendiz</p>
          </div>

          <nav className={styles.menu}>
            {menuItems.map((item) => {
              const estáAcessando = targetPath === item.path;
              const estáAtivo = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  className={`${styles.menuItem} ${estáAtivo ? styles.active : ""} ${estáAcessando ? styles.loadingItem : ""}`}
                  onClick={() => handleNavigation(item.path)}
                  disabled={isNavigating}
                  aria-current={estáAtivo ? "page" : undefined}
                >
                  <span className={styles.iconWrapper}>{item.icon}</span>
                  <span className={styles.menuLabel}>
                    {estáAcessando ? "Carregando..." : item.label}
                  </span>
                  {item.badge && item.badge > 0 && (
                    <span className={styles.badge}>
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className={styles.bottomContent}>
          <div className={styles.highlightCard}>
            <h4>Destaque seu perfil</h4>
            <p>Aumente suas chances de ser encontrado pelas empresas.</p>
            <button
              className={styles.improveBtn}
              onClick={() => handleNavigation("/curriculo")}
              disabled={isNavigating}
            >
              <TrendingUpIcon />
              <span>Melhorar perfil</span>
            </button>
          </div>

          <button
            className={styles.logout}
            onClick={handleLogout}
            disabled={isNavigating}
          >
            <span className={styles.iconWrapper}>
              <LogoutIcon />
            </span>
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
