import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./criarSenha.module.css";
import { supabase } from "supabaseClient";
import cija_logo from "../../../assets/logo2.png";

import EyeOpenIcon from "../../../components/icons/EyeOpenIcon";
import EyeClosedIcon from "../../../components/icons/EyeClosedIcon";

export default function CriarNovaSenha() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notificacao, setNotificacao] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [emailExibicao, setEmailExibicao] = useState<string>("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // =========================
  // RECOVERY VALIDATION (VERCEL SAFE)
  // =========================
  useEffect(() => {
    const hash = window.location.hash;

    if (!hash.includes("access_token")) {
      setNotificacao("Link inválido ou expirado.");
      setTimeout(() => navigate("/recuperar-senha"), 2500);
      return;
    }

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        setNotificacao("Sessão inválida ou expirada.");
        setTimeout(() => navigate("/recuperar-senha"), 2500);
        return;
      }

      setEmailExibicao(data.session.user.email || "");
    };

    loadSession();
  }, [navigate]);

  const triggerErrorAnimation = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  // =========================
  // SENHA FORTE (OBRIGATÓRIO)
  // =========================

  const validatePassword = (senha: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=]).{6,}$/.test(
      senha,
    );
  };

  // =========================
  // UPDATE PASSWORD REAL
  // =========================
  const handleUpdatePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotificacao(null);

    if (!validatePassword(password)) {
      setNotificacao(
        "Senha fraca: mínimo 6 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial",
      );
      triggerErrorAnimation();
      return;
    }

    if (password !== confirmPassword) {
      setNotificacao("Senhas não coincidem");
      triggerErrorAnimation();
      return;
    }

    setLoading(true);

    // ATUALIZA A SENHA NO SUPABASE AUTH
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setLoading(false);
      setNotificacao(error.message);
      return;
    }

    const userId = data?.user?.id;

    // =========================
    // ATUALIZA TABELA (METADADOS)
    // =========================
    if (userId) {
      await supabase
        .from("jovem_aprendiz")
        .update({
          password_changed_at: new Date().toISOString(),
        })
        .eq("id_ja", userId);

      // =========================
      // HISTÓRICO (NETFLIX STYLE)
      // =========================
      await supabase.from("password_history").insert({
        user_id: userId,
        action: "PASSWORD_CHANGED",
        created_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
      });
    }

    // encerra sessão (segurança)
    await supabase.auth.signOut();

    setLoading(false);
    setSuccess(true);

    setTimeout(() => {
      navigate("/");
    }, 2500);
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${isShaking ? styles.shake : ""}`}>
        {success ? (
          <div className={styles.successBox}>
            <div className={styles.checkmark}>✔</div>
            <h2>Senha alterada com sucesso!</h2>
            <p>Redirecionando...</p>
          </div>
        ) : (
          <>
            {notificacao && <div className={styles.alert}>{notificacao}</div>}

            <img src={cija_logo} className={styles.logo} alt="cija-logo" />

            <h2>Criar Nova Senha</h2>

            {emailExibicao && (
              <p>
                <strong>{emailExibicao}</strong>
              </p>
            )}

            <form onSubmit={handleUpdatePassword}>
              <div className={styles.senhaBox}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.senhaInput}
                />
                <button
                  type="button"
                  className={styles.toggleSenha}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </button>
              </div>

              <div className={styles.senhaBox}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={styles.senhaInput}
                />
                <button
                  type="button"
                  className={styles.toggleSenha}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </button>
              </div>

              <button type="submit" disabled={loading} className={styles.submitSenha}>
                {loading ? "Salvando..." : "Atualizar senha"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
