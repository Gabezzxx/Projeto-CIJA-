import { useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "supabaseClient";

interface ProtectedRouteProps {
  children: ReactNode;
  tipoEsperado: "jovem_aprendiz" | "empresa"; // Define direto quem pode entrar aqui
}

export default function ProtectedRoute({
  children,
  tipoEsperado,
}: ProtectedRouteProps) {
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [isJovem, setIsJovem] = useState(false);
  const [isEmpresa, setIsEmpresa] = useState(false);
  const [emailConfirmado, setEmailConfirmado] = useState(true);
  const [timerConcluido, setTimerConcluido] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 🟢 Função utilitária para forçar a espera de 2.5 segundos
    const aguardarTempo = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    async function checarIdentidade() {
      try {
        // Dispara a requisição do Supabase e o timer de 2.5 segundos juntos
        const dadosSessionPromise = supabase.auth.getSession();
        const delayPromise = aguardarTempo(2500); // 2500ms = 2.5 segundos

        // Espera ambos terminarem (garante o tempo mínimo de carregamento visual)
        const [sessionResult] = await Promise.all([
          dadosSessionPromise,
          delayPromise,
        ]);
        const session = sessionResult.data.session;

        if (!session?.user) {
          if (mounted) setLoading(false);
          return;
        }

        const userId = session.user.id;
        const emailAuth = session.user.email?.trim().toLowerCase();

        // 1. Checa se é Jovem Aprendiz
        let { data: jovem } = await supabase
          .from("jovem_aprendiz")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        // Fallback por e-mail (caso o user_id esteja nulo no banco)
        if (!jovem && emailAuth) {
          const { data: listaJovens } = await supabase
            .from("jovem_aprendiz")
            .select("*");
          jovem =
            listaJovens?.find(
              (j) => j.email?.trim().toLowerCase() === emailAuth,
            ) || null;
        }

        if (jovem) {
          if (mounted) {
            setIsJovem(true);
            const verificado =
              jovem.email_confirmado === true ||
              String(jovem.email_confirmado) === "true";
            setEmailConfirmado(verificado);
            setLoading(false);
          }
          return;
        }

        // 2. Checa se é Empresa
        let { data: empresa } = await supabase
          .from("empresa")
          .select("*")
          .eq("id_em", userId)
          .maybeSingle();

        if (!empresa && emailAuth) {
          const { data: listaEmpresas } = await supabase
            .from("empresa")
            .select("*");
          empresa =
            listaEmpresas?.find(
              (e) => e.email?.trim().toLowerCase() === emailAuth,
            ) || null;
        }

        if (empresa) {
          if (mounted) {
            setIsEmpresa(true);
            setLoading(false);
          }
          return;
        }

        // Se não for nenhum dos dois
        if (mounted) setLoading(false);
      } catch (err) {
        console.error("Erro ao validar identidade:", err);
        if (mounted) setLoading(false);
      }
    }

    checarIdentidade();

    return () => {
      mounted = false;
    };
  }, []);

  // Determina se o usuário atual atende ao tipo que a rota exige
  const temAcesso =
    (tipoEsperado === "jovem_aprendiz" && isJovem) ||
    (tipoEsperado === "empresa" && isEmpresa);

  // Timer para mostrar a tela de erro antes de expulsar da página (Mantido em 3s para leitura do aviso)
  useEffect(() => {
    if (!loading && !temAcesso && (isJovem || isEmpresa)) {
      const timer = setTimeout(() => {
        setTimerConcluido(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loading, temAcesso, isJovem, isEmpresa]);

  // =========================================================
  // FLUXO DE DECISÃO VISUAL
  // =========================================================

  // 1. Carregando dados do Supabase + Tempo de espera artificial
  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          color: "#581c87",
          fontFamily: "sans-serif",
        }}
      >
        {/* Adicionado uma mini animação de pulso nativa para melhorar a experiência visual */}
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3e8ff",
            borderTopColor: "#581c87",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            marginBottom: "16px",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: "16px", fontWeight: 600, color: "#6b21a8" }}>
          Sincronizando ambiente seguro...
        </span>
      </div>
    );
  }

  // 2. Se não foi encontrado em nenhuma tabela (Não está logado)
  if (!isJovem && !isEmpresa) {
    return tipoEsperado === "empresa" ? (
      <Navigate to="/loginEmpresa" replace />
    ) : (
      <Navigate to="/" replace />
    );
  }

  // 3. Se for Jovem Aprendiz mas não confirmou o e-mail ainda
  if (isJovem && !emailConfirmado) {
    if (location.pathname !== "/confirmar-email") {
      return <Navigate to="/confirmar-email" replace />;
    }
    return <>{children}</>;
  }

  // 4. Se está logado mas tentou entrar no painel errado
  if (!temAcesso) {
    if (timerConcluido) {
      return tipoEsperado === "empresa" ? (
        <Navigate to="/loginEmpresa" replace />
      ) : (
        <Navigate to="/" replace />
      );
    }

    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fef2f2",
          fontFamily: "sans-serif",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "40px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
            maxWidth: "450px",
            width: "100%",
            borderTop: "6px solid #ef4444",
          }}
        >
          <h2
            style={{
              color: "#1e293b",
              margin: "0 0 10px 0",
              fontSize: "22px",
              fontWeight: 700,
            }}
          >
            Acesso Restrito
          </h2>
          <p
            style={{ color: "#64748b", margin: "0 0 24px 0", fontSize: "15px" }}
          >
            Esta área é exclusiva para{" "}
            {tipoEsperado === "empresa" ? "Empresas" : "Jovens Aprendizes"}.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              color: "#94a3b8",
              fontSize: "13px",
            }}
          >
            Redirecionando...
          </div>
        </div>
      </div>
    );
  }

  // 5. Tudo batendo perfeitamente! Abre a tela.
  return <>{children}</>;
}
