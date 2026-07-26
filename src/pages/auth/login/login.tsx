/* eslint-disable jsx-a11y/anchor-is-valid */
import { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./login.module.css";
import { supabase } from "supabaseClient";
import cija_logo from "../../../assets/logo2.png";
import EyeOpenIcon from "../../../components/icons/EyeOpenIcon";
import EyeClosedIcon from "../../../components/icons/EyeClosedIcon";
import { useDocumentTitle } from "Hooks/useDocumentTitle";
import {
  Mail, // Email
  Phone, // Telefone
  User, // CPF/Pessoa
  Building2, // CNPJ/Empresa
  MapPin, // Endereço
  Calendar, // Data
  CheckCircle, // Check verde
  XCircle, // X erro
  AlertCircle, // Aviso
} from "lucide-react";
import { StringList } from "@google/genai";
import { BooleanLiteral } from "typescript";


          //
export default function Login() {
  const navigate = useNavigate();
  useDocumentTitle("CIJA - Login Jovem Aprendiz");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalNotificacao, setGlobalNotificacao] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [vagas, setVagas] = useState(0);
  const [empresas, setEmpresas] = useState(0);
  const [suporte, setSuporte] = useState(0);

  
  useEffect(() => {
    const animateValue = (
      setter: React.Dispatch<React.SetStateAction<number>>,
      end: number,
      duration: number,
    ) => {
      let start = 0;
      const increment = end / (duration / 16);
      const counter = setInterval(() => {
        start += increment;
        if (start >= end) {
          setter(end);
          clearInterval(counter);
        } else {
          setter(Math.floor(start));
        }
      }, 16);
    };
    animateValue(setVagas, 500, 1800);
    animateValue(setEmpresas, 120, 1800);
    animateValue(setSuporte, 24, 1800);
  }, []);

  useEffect(() => {
    if (globalNotificacao) {
      const timer = setTimeout(() => setGlobalNotificacao(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [globalNotificacao]);

  const triggerErrorAnimation = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Digite um email válido.";
    }
    if (!senha.trim()) {
      newErrors.senha = "Digite sua senha.";
    }
    return newErrors;
  };

  const fazerLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalNotificacao(null);
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      triggerErrorAnimation();
      return;
    }

    setLoading(true);
    const emailFormatado = email.trim().toLowerCase();
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: emailFormatado,
          password: senha,
        });
      if (authError || !authData.user)
        throw new Error("E-mail ou senha inválidos.");

      const { data: cliente, error: clienteError } = await supabase
        .from("jovem_aprendiz")
        .select("email_confirmado")
        .eq("id_ja", authData.user.id)
        .maybeSingle();
      if (clienteError) throw clienteError;
      if (!cliente) {
        await supabase.auth.signOut();
        throw new Error("E-mail ou senha inválidos.");
      }
      

      

  
   
      const emailConfirmado =
        cliente.email_confirmado === true ||
        cliente.email_confirmado === "true";
      if (!emailConfirmado) {
        setGlobalNotificacao(
          "E-mail não verificado! Redirecionando para a ativação...",
        );
        setTimeout(
          () =>
            navigate("/confirmar-email", {
              state: {
                emailAlvo: emailFormatado,
                tipoUsuario: "jovem_aprendiz",
              },
            }),
          2500,
        );
        return;
      }
      setLoginSuccess(true);
      setTimeout(() => navigate("/clientDashboard", { replace: true }), 2000);
    } catch (err: any) {
      console.error(err);
      setGlobalNotificacao(err.message || "Erro ao realizar login.");
      triggerErrorAnimation();
    } finally {
      setLoading(false);
    }
  };

  const cardClasses = `${styles.loginCard} ${isShaking ? styles.shake : ""}`;

  return (
    <div className={styles.wrapper}>
      <div className={styles.backgroundBlobs}>
        <div className={styles.purpleBlob1}></div>
        <div className={styles.purpleBlob2}></div>
      </div>
      {globalNotificacao && (
        <div className={styles.alert}>{globalNotificacao}</div>
      )}
      <img src={cija_logo} alt="CIJA" className={styles.desktopLogo} />
      <div className={styles.loginContainer}>
        <div className={styles.left}>
          <span className={styles.badge}>Plataforma CIJA</span>
          <h1>
            Vamos <br />
            começar <span>!</span>
          </h1>
          <p className={styles.tagline}>
            Sua jornada para o futuro começa aqui.
            <br />
            Faça login para acessar sua conta.
          </p>
          <div className={styles.stats}>
            <div className={styles.statBox}>
              <h3>+{vagas}</h3>
              <p>Vagas</p>
            </div>
            <div className={styles.statBox}>
              <h3>+{empresas}</h3>
              <p>Empresas</p>
            </div>
            <div className={styles.statBox}>
              <h3>{suporte}h</h3>
              <p>Suporte</p>
            </div>
          </div>
        </div>
        <div className={cardClasses}>
          {loginSuccess ? (
            <div className={styles.successAnimation}>
              <div className={styles.successParticles}>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <svg
                className={styles.checkmark}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 52 52"
              >
                <circle
                  className={styles.checkmarkCircle}
                  cx="26"
                  cy="26"
                  r="25"
                  fill="none"
                />
                <path
                  className={styles.checkmarkCheck}
                  fill="none"
                  d="M14.1 27.2l7.1 7.2 16.7-16.8"
                />
              </svg>
              <h2>Login realizado!</h2>
              <p>Entrando no painel...</p>
            </div>
          ) : (
            <div className={styles.cardContent}>
              <img src={cija_logo} alt="CIJA" className={styles.mobileLogo} />
              <h2>Login</h2>
              <p>Faça seu login e aproveite nossas funcionalidades.</p>
              <form onSubmit={fazerLogin} noValidate>
                <div className={styles.inputGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="email@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${styles.input} ${errors.email ? styles.error : ""}`}
                  />
                  <Mail size={45} className={styles.inputIcon} />
                  {errors.email && (
                    <p className={styles.errorMessage}>{errors.email}</p>
                  )}
                </div>

                <div className={styles.inputGroup}>
                  <label>Senha</label>
                  <div className={styles.senhaBox}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className={`${styles.input} ${errors.senha ? styles.error : ""}`}
                    />
                    <button
                      type="button"
                      className={styles.toggleSenha}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                  </div>
                  {errors.senha && (
                    <p className={styles.errorMessage}>{errors.senha}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className={styles.actionButton}
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>
              <div className={styles.footerActions}>
                <p className={styles.subLink}>
                  <a onClick={() => navigate("/recuperar-senha")}>
                    Esqueceu sua senha?
                  </a>
                </p>
                <div className={styles.separator}>ou</div>
                <p className={styles.subLink}>
                  Não tem conta?{" "}
                  <a onClick={() => navigate("/cadastro")}>Cadastre-se</a>
                </p>
                <p className={styles.subLink}>
                  É uma empresa?{" "}
                  <a onClick={() => navigate("/loginEmpresa")}>
                    Área Empresarial
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
