import React, { useState, useEffect } from "react";
import styles from "./sidebarEmpresa.module.css";
import cijaLogo from "../../assets/logo2.png";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M12 9v6M9 12h6" />
  </svg>
);
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const MessageIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18" />
    <path d="M18 17V9M13 17V5M8 17v-3" />
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06a1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 0 0 0-1.51 1z" />
  </svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const SidebarEmpresa: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);

  useEffect(() => {
    const loadBadge = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from("mensagens")
        .select("*", { count: "exact", head: true })
        .eq("id_destinatario", user.id)
        .eq("lida", false);
      setNaoLidas(count || 0);
    };
    loadBadge();
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { label: "Dashboard", path: "/menuEmpresa", icon: <DashboardIcon /> },
    { label: "Criar vaga", path: "/vagasEmpresa/nova", icon: <PlusIcon /> },
    {
      label: "Ver candidatos",
      path: "/candidatosEmpresa",
      icon: <UsersIcon />,
    },
    { label: "Minhas vagas", path: "/vagasEmpresa", icon: <BriefcaseIcon /> },
    {
      label: "Mensagens",
      path: "/mensagensEmpresa",
      icon: <MessageIcon />,
      badge: naoLidas,
    },
    { label: "Relatórios", path: "/relatorios", icon: <ChartIcon /> },
    { label: "Meu Perfil", path: "/perfilEmpresa", icon: <UserIcon /> },
    { label: "Configurações", path: "/configuracoes", icon: <SettingsIcon /> },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/loginEmpresa");
  };

  return (
    <>
      <button
        className={styles.hamburger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menu"
      >
        <span className={`${styles.bar} ${isOpen ? styles.bar1 : ""}`} />
        <span className={`${styles.bar} ${isOpen ? styles.bar2 : ""}`} />
        <span className={`${styles.bar} ${isOpen ? styles.bar3 : ""}`} />
      </button>
      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}>
        <div className={styles.top}>
          <div className={styles.logoBox}>
            <div className={styles.logoBg}>
              <img src={cijaLogo} alt="CIJA" />
            </div>
            <p className={styles.logoSub}>CENTRO DE INTEGRAÇÃO</p>
            <p className={styles.logoTitle}>Jovem Aprendiz</p>
          </div>

          <nav className={styles.nav}>
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`${styles.item} ${location.pathname === item.path ? styles.active : ""}`}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge ? (
                  <span className={styles.badge}>{item.badge}</span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        <div className={styles.bottom}>
          <button className={styles.logout} onClick={handleLogout}>
            <LogoutIcon />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};
