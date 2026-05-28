/* eslint-disable jsx-a11y/anchor-is-valid */
import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./cadastroEmpresa.module.css";
import { supabase } from "supabaseClient";
import cija_logo from "../../../assets/logo2.png";

import EyeClosedIcon from "../../../components/icons/EyeClosedIcon";
import EyeOpenIcon from "../../../components/icons/EyeOpenIcon";

import {
  validarTelefone,
  validarCNPJ,
  limparCNPJ,
} from "../../../utils/validations/cadastroValidation";

import {
  formatarCNPJ,
  formatarTelefone,
} from "../../../utils/validations/formatter";

export default function CadastroEmpresa() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    cnpj: "",
    telefone: "",
    email: "",
    endereco: "",
    senha: "",
    confirmSenha: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalMessage, setGlobalMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmSenha, setShowConfirmSenha] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (globalMessage && !success) {
      const timer = setTimeout(() => setGlobalMessage(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [globalMessage, success]);

  const triggerError = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "cnpj") finalValue = formatarCNPJ(value);
    if (name === "telefone") finalValue = formatarTelefone(value);

    setForm((prev) => ({ ...prev, [name]: finalValue }));
  };

  const validations = {
    nome: form.nome.trim().length >= 3 && !/^\d+$/.test(form.nome.trim()),
    cnpj: validarCNPJ(form.cnpj),
    telefone: validarTelefone(form.telefone),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
    endereco: form.endereco.trim().length >= 5,
    senha: /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.senha),
    confirmSenha: form.senha.length > 0 && form.senha === form.confirmSenha,
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!validations.nome)
      newErrors.nome = "Nome inválido (mínimo 3 caracteres).";
    if (!validations.cnpj) newErrors.cnpj = "CNPJ inválido.";
    if (!validations.telefone) newErrors.telefone = "Telefone inválido.";
    if (!validations.email) newErrors.email = "Email inválido.";
    if (!validations.endereco) newErrors.endereco = "Endereço inválido.";
    if (!validations.senha) newErrors.senha = "Senha fraca.";
    if (!validations.confirmSenha)
      newErrors.confirmSenha = "As senhas não coincidem.";

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
      const { data: existingEmpresa } = await supabase
        .from("empresa")
        .select("email")
        .eq("email", emailLower)
        .maybeSingle();

      if (existingEmpresa) {
        setGlobalMessage("Este e-mail corporativo já está cadastrado.");
        triggerError();
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailLower,
        password: form.senha,
        options: {
          data: {
            tipo_usuario: "empresa",
          },
        },
      });

      if (error || !data.user) throw error;

      const { error: insertError } = await supabase.from("empresa").insert([
        {
          id_em: data.user.id,
          nome: form.nome,
          email: emailLower,
          endereco: form.endereco,
          telefone: `+55${form.telefone.replace(/\D/g, "")}`,
          cnpj: limparCNPJ(form.cnpj),
          email_confirmado: false,
        },
      ]);

      if (insertError) {
        await supabase.auth.signOut();
        throw insertError;
      }

      setSuccess(true);
      setGlobalMessage("Cadastro empresarial realizado! Código enviado.");

      setTimeout(() => {
        navigate("/confirmar-email", {
          state: { emailAlvo: emailLower, tipoUsuario: "empresa" },
        });
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setGlobalMessage(err.message || "Erro ao criar conta empresarial.");
      triggerError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.backgroundBlobs}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
      </div>

      {globalMessage && <div className={styles.alert}>{globalMessage}</div>}
      <img src={cija_logo} alt="CIJA" className={styles.desktopLogo} />

      <div className={styles.loginContainer}>
        <div className={styles.left}>
          <span className={styles.badge}>Plataforma Empresarial</span>
          <h1>
            Conecte sua empresa aos
            <br />
            <span> melhores talentos!</span>
          </h1>
          <p className={styles.tagline}>
            Gerencie vagas, encontre candidatos e fortaleça sua equipe.
          </p>
        </div>

        <div className={`${styles.loginCard} ${isShaking ? styles.shake : ""}`}>
          {success ? (
            <div className={styles.successAnimation}>
              <div className={styles.successIcon}>✓</div>
              <h2>Código OTP Corporativo Enviado!</h2>
              <p>Redirecionando em 3 segundos para validação...</p>
            </div>
          ) : (
            <div className={styles.cardContent}>
              <img src={cija_logo} alt="CIJA" className={styles.mobileLogo} />
              <h2>Cadastro Empresarial</h2>
              <form onSubmit={handleSubmit} noValidate>
                {/* Inputs padrão idênticos ao seu código anterior */}
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    name="nome"
                    placeholder="Nome da empresa"
                    value={form.nome}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.nome ? styles.error : ""}`}
                  />
                  {errors.nome && (
                    <p className={styles.errorMessage}>{errors.nome}</p>
                  )}
                </div>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    name="cnpj"
                    placeholder="CNPJ"
                    value={form.cnpj}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.cnpj ? styles.error : ""}`}
                  />
                  {errors.cnpj && (
                    <p className={styles.errorMessage}>{errors.cnpj}</p>
                  )}
                </div>
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
                <div className={styles.inputGroup}>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email empresarial"
                    value={form.email}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.email ? styles.error : ""}`}
                  />
                  {errors.email && (
                    <p className={styles.errorMessage}>{errors.email}</p>
                  )}
                </div>
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
                  </div>
                  {errors.senha && (
                    <p className={styles.errorMessage}>{errors.senha}</p>
                  )}
                </div>
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
                  </div>
                  {errors.confirmSenha && (
                    <p className={styles.errorMessage}>{errors.confirmSenha}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className={styles.actionButton}
                  disabled={loading}
                >
                  {loading ? "Criando conta..." : "Cadastrar Empresa"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
