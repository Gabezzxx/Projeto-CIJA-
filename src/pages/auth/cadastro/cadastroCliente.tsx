/* eslint-disable jsx-a11y/anchor-is-valid */
import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./cadastroCliente.module.css";
import { supabase } from "supabaseClient";
import cija_logo from "../../../assets/logo2.png";

import EyeClosedIcon from "../../../components/icons/EyeClosedIcon";
import EyeOpenIcon from "../../../components/icons/EyeOpenIcon";

import {
  validarCPF,
  validarIdade,
  validarTelefone,
  limparCPF,
} from "../../../utils/validations/cadastroValidation";

import {
  formatarCPF,
  formatarTelefone,
} from "../../../utils/validations/formatter";

const errorMessages: { [key: string]: string } = {
  nome: "Digite seu nome completo.",
  cpf: "CPF inválido.",
  data_nasc: "Você precisa ter pelo menos 18 anos.",
  telefone: "Telefone inválido.",
  email: "E-mail inválido.",
  endereco: "Digite seu endereço.",
  senha: "Senha inválida.",
  confirmSenha: "As senhas não coincidem.",
};

function AnimatedCheckIcon() {
  return (
    <svg
      className={styles.animatedCheck}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M5 13L9 17L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ValidationItem({ valid, text }: { valid: boolean; text: string }) {
  return (
    <div
      className={`${styles.validationItem} ${
        valid ? styles.valid : styles.invalid
      }`}
    >
      <div className={styles.validationIcon}>
        {valid ? (
          <AnimatedCheckIcon />
        ) : (
          <span className={styles.validationDot} />
        )}
      </div>
      <span>{text}</span>
    </div>
  );
}

export default function CadastroCliente() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    data_nasc: "",
    telefone: "",
    email: "",
    senha: "",
    confirmSenha: "",
    endereco: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalMessage, setGlobalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [success, setSuccess] = useState(false);

  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmSenha, setShowConfirmSenha] = useState(false);
  const [dateInputType, setDateInputType] = useState("text");

  // =========================================================
  // VALIDAÇÕES EM TEMPO REAL (ESTADO DERIVADO)
  // Como são calculadas no corpo do componente, atualizam instantaneamente
  // =========================================================
  const hasSequence = (text: string) => {
    const sequences = ["123456", "abcdef", "654321", "qwerty"];
    return sequences.some((seq) => text.toLowerCase().includes(seq));
  };

  const cpfValido = validarCPF(form.cpf);
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);

  const passwordRules = {
    minLength: form.senha.length >= 8,
    upperCase: /[A-Z]/.test(form.senha),
    lowerCase: /[a-z]/.test(form.senha),
    number: /\d/.test(form.senha),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(form.senha),
    noSequence: form.senha.length > 0 ? !hasSequence(form.senha) : false,
  };

  useEffect(() => {
    if (globalMessage && !success) {
      const timer = setTimeout(() => {
        setGlobalMessage("");
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [globalMessage, success]);

  const triggerError = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 450);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "cpf") {
      finalValue = formatarCPF(value);
    }

    if (name === "telefone") {
      finalValue = formatarTelefone(value);
    }

    setForm((prev) => ({
      ...prev,
      [name]: finalValue,
    }));

    // Limpa o erro do input assim que o usuário volta a digitar
    if (errors[name]) {
      const updatedErrors = { ...errors };
      delete updatedErrors[name];
      setErrors(updatedErrors);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!form.nome.trim() || form.nome.trim().split(" ").length < 2) {
      newErrors.nome = errorMessages.nome;
    }

    if (!cpfValido) {
      newErrors.cpf = errorMessages.cpf;
    }

    if (!validarIdade(form.data_nasc)) {
      newErrors.data_nasc = errorMessages.data_nasc;
    }

    if (!validarTelefone(form.telefone)) {
      newErrors.telefone = errorMessages.telefone;
    }

    if (!emailValido) {
      newErrors.email = errorMessages.email;
    }

    if (!form.endereco.trim()) {
      newErrors.endereco = errorMessages.endereco;
    }

    if (
      !passwordRules.minLength ||
      !passwordRules.upperCase ||
      !passwordRules.lowerCase ||
      !passwordRules.number ||
      !passwordRules.special ||
      !passwordRules.noSequence
    ) {
      newErrors.senha = errorMessages.senha;
    }

    if (form.senha !== form.confirmSenha) {
      newErrors.confirmSenha = errorMessages.confirmSenha;
    }

    return newErrors;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGlobalMessage("");

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      triggerError();
      return;
    }

    setLoading(true);
    const emailLower = form.email.trim().toLowerCase();

    try {
      const { data: existingUser } = await supabase
        .from("jovem_aprendiz")
        .select("email")
        .eq("email", emailLower)
        .maybeSingle();

      if (existingUser) {
        setGlobalMessage("Este e-mail já está cadastrado.");
        triggerError();
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailLower,
        password: form.senha,
        options: {
          data: {
            nome: form.nome,
            tipo_usuario: "jovem_aprendiz",
          },
        },
      });

      if (authError || !authData?.user) {
        throw authError || new Error("Erro ao criar conta.");
      }

      if (authData.user.identities && authData.user.identities.length === 0) {
        setGlobalMessage("Este e-mail já foi solicitado recentemente.");
        triggerError();
        setLoading(false);
        return;
      }

      const { confirmSenha, ...formToSend } = form;

      const { error: insertError } = await supabase
        .from("jovem_aprendiz")
        .insert([
          {
            id_ja: authData.user.id,
            ...formToSend,
            email: emailLower,
            telefone: `+55${form.telefone.replace(/\D/g, "")}`,
            cpf: limparCPF(form.cpf),
            email_confirmado: false,
          },
        ]);

      if (insertError) {
        await supabase.auth.signOut();
        throw insertError;
      }

      setSuccess(true);
      setGlobalMessage("Conta pré-registrada! Código enviado ao e-mail.");

      setTimeout(() => {
        navigate("/confirmar-email", {
          state: {
            emailAlvo: emailLower,
            tipoUsuario: "jovem_aprendiz",
          },
        });
      }, 3000);
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("rate limit") || err?.status === 429) {
        setGlobalMessage(
          "Muitos envios. Aguarde alguns minutos antes de tentar novamente.",
        );
      } else {
        setGlobalMessage(err.message || "Erro ao realizar cadastro.");
      }
      triggerError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.backgroundBlobs}>
        <div className={styles.blobTop} />
        <div className={styles.blobBottom} />
      </div>

      <img src={cija_logo} alt="Logo" className={styles.desktopLogo} />

      {globalMessage && <div className={styles.alert}>{globalMessage}</div>}

      <div className={styles.loginContainer}>
        {/* LEFT */}
        <div className={styles.left}>
          <img src={cija_logo} alt="Logo" className={styles.mobileLogo} />
          <h1>
            <span className={styles.titleTop}>Crie sua conta</span>
            <span className={styles.titleBottom}>
              e comece <span className={styles.titleHighlight}>agora</span>
              <span className={styles.titleExclamation}>!</span>
            </span>
          </h1>
          <p className={styles.tagline}>
            Cadastre-se para acessar oportunidades, vagas e recursos exclusivos
            da plataforma.
          </p>
        </div>

        {/* CARD */}
        <div className={`${styles.loginCard} ${isShaking ? styles.shake : ""}`}>
          {success ? (
            <div className={styles.successAnimation}>
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
              <h2>Código De confirmação Enviado!</h2>
              <p>
                Aguarde 3 segundos, estamos te redirecionando para a tela de
                validação...
              </p>
            </div>
          ) : (
            <div className={styles.cardContent}>
              <h2>Cadastro</h2>

              <form onSubmit={handleSubmit} noValidate>
                {/* NOME */}
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    name="nome"
                    placeholder="Nome completo"
                    value={form.nome}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.nome ? styles.error : ""}`}
                  />
                  {errors.nome && (
                    <p className={styles.errorMessage}>{errors.nome}</p>
                  )}
                </div>

                {/* CPF */}
                <div className={styles.inputGroup}>
                  <div className={styles.inputWrapper}>
                    <input
                      type="text"
                      name="cpf"
                      placeholder="CPF"
                      value={form.cpf}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.cpf ? styles.error : ""}`}
                    />
                    {cpfValido && (
                      <div className={styles.inputCheckWrapper}>
                        <AnimatedCheckIcon />
                      </div>
                    )}
                  </div>
                  {errors.cpf && (
                    <p className={styles.errorMessage}>{errors.cpf}</p>
                  )}
                </div>

                {/* DATA */}
                <div className={styles.inputGroup}>
                  <input
                    type={dateInputType}
                    name="data_nasc"
                    placeholder="Data de nascimento"
                    value={form.data_nasc}
                    onChange={handleChange}
                    onFocus={() => setDateInputType("date")}
                    onBlur={(e) => {
                      if (!e.target.value) {
                        setDateInputType("text");
                      }
                    }}
                    className={`${styles.input} ${styles.dateInput} ${errors.data_nasc ? styles.error : ""}`}
                  />
                  {errors.data_nasc && (
                    <p className={styles.errorMessage}>{errors.data_nasc}</p>
                  )}
                </div>

                {/* TELEFONE */}
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    name="telefone"
                    placeholder="Telefone"
                    value={form.telefone}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.telefone ? styles.error : ""}`}
                  />
                  {errors.telefone && (
                    <p className={styles.errorMessage}>{errors.telefone}</p>
                  )}
                </div>

                {/* EMAIL */}
                <div className={styles.inputGroup}>
                  <div className={styles.inputWrapper}>
                    <input
                      type="email"
                      name="email"
                      placeholder="E-mail"
                      value={form.email}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.email ? styles.error : ""}`}
                    />
                    {emailValido && (
                      <div className={styles.inputCheckWrapper}>
                        <AnimatedCheckIcon />
                      </div>
                    )}
                  </div>
                  {errors.email && (
                    <p className={styles.errorMessage}>{errors.email}</p>
                  )}
                </div>

                {/* ENDEREÇO */}
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    name="endereco"
                    placeholder="Endereço completo"
                    value={form.endereco}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.endereco ? styles.error : ""}`}
                  />
                  {errors.endereco && (
                    <p className={styles.errorMessage}>{errors.endereco}</p>
                  )}
                </div>

                {/* SENHA */}
                <div className={styles.inputGroup}>
                  <div className={styles.senhaBox}>
                    <input
                      type={showSenha ? "text" : "password"}
                      name="senha"
                      placeholder="Senha"
                      value={form.senha}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.senha ? styles.error : ""}`}
                    />
                    <button
                      type="button"
                      className={styles.toggleSenha}
                      onClick={() => setShowSenha(!showSenha)}
                    >
                      {showSenha ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                  </div>

                  <div className={styles.passwordValidation}>
                    <ValidationItem
                      valid={passwordRules.minLength}
                      text="8 caracteres"
                    />
                    <ValidationItem
                      valid={passwordRules.upperCase}
                      text="Letra maiúscula"
                    />
                    <ValidationItem
                      valid={passwordRules.lowerCase}
                      text="Letra minúscula"
                    />
                    <ValidationItem
                      valid={passwordRules.number}
                      text=" Possuí Número"
                    />
                    <ValidationItem
                      valid={passwordRules.special}
                      text="Caractere especial"
                    />
                    <ValidationItem
                      valid={passwordRules.noSequence}
                      text="Sem sequências"
                    />
                  </div>
                  {errors.senha && (
                    <p className={styles.errorMessage}>{errors.senha}</p>
                  )}
                </div>

                {/* CONFIRMAR SENHA */}
                <div className={styles.inputGroup}>
                  <div className={styles.senhaBox}>
                    <input
                      type={showConfirmSenha ? "text" : "password"}
                      name="confirmSenha"
                      placeholder="Confirmar senha"
                      value={form.confirmSenha}
                      onChange={handleChange}
                      className={`${styles.input} ${errors.confirmSenha ? styles.error : ""}`}
                    />
                    <button
                      type="button"
                      className={styles.toggleSenha}
                      onClick={() => setShowConfirmSenha(!showConfirmSenha)}
                    >
                      {showConfirmSenha ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                  </div>
                  {errors.confirmSenha && (
                    <p className={styles.errorMessage}>{errors.confirmSenha}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={styles.actionButton}
                >
                  {loading ? "Cadastrando..." : "Criar conta"}
                </button>
              </form>

              <div className={styles.footerActions}>
                <div className={styles.separator}>ou</div>
                <p className={styles.subLink}>
                  Já possui conta?{" "}
                  <a onClick={() => navigate("/")}>Fazer login</a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
