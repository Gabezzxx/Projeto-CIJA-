import { useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "supabaseClient";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  tipoEsperado: "jovem_aprendiz" | "empresa";
}

export default function ProtectedRoute({
  children,
  tipoEsperado,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Estado para verificar se o usuário tem o tipo correto
  const [userType, setUserType] = useState<"jovem_aprendiz" | "empresa" | null>(
    null,
  );
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserType(null);
      setChecking(false);
      return;
    }

    // Verificar tipo de usuário de forma eficiente
    const checkUserType = async () => {
      try {
        // Primeiro tentar pelo user_id (mais eficiente)
        let { data: jovem } = await supabase
          .from("jovem_aprendiz")
          .select("email_confirmado")
          .eq("user_id", user.id)
          .single();

        if (jovem) {
          setUserType("jovem_aprendiz");
          setEmailConfirmed(
            jovem.email_confirmado === true ||
              jovem.email_confirmado === "true",
          );
          setChecking(false);
          return;
        }

        let { data: empresa } = await supabase
          .from("empresa")
          .select("id_em")
          .eq("id_em", user.id)
          .single();

        if (empresa) {
          setUserType("empresa");
          setEmailConfirmed(true); // Empresas não precisam de confirmação de e-mail neste contexto
          setChecking(false);
          return;
        }

        // Se não encontrou por user_id, tentar por e-mail (apenas como fallback)
        if (user.email) {
          const email = user.email.trim().toLowerCase();

          const { data: jovemPorEmail } = await supabase
            .from("jovem_aprendiz")
            .select("email_confirmado")
            .eq("email", email)
            .single();

          if (jovemPorEmail) {
            setUserType("jovem_aprendiz");
            setEmailConfirmed(
              jovemPorEmail.email_confirmado === true ||
                jovemPorEmail.email_confirmado === "true",
            );
            setChecking(false);
            return;
          }

          const { data: empresaPorEmail } = await supabase
            .from("empresa")
            .select("id_em")
            .eq("email", email)
            .single();

          if (empresaPorEmail) {
            setUserType("empresa");
            setEmailConfirmed(true);
            setChecking(false);
            return;
          }
        }

        // Nenhum tipo encontrado
        setUserType(null);
        setChecking(false);
      } catch (err) {
        console.error("Erro ao verificar tipo de usuário:", err);
        setUserType(null);
        setChecking(false);
      }
    };

    checkUserType();
  }, [user]);

  if (checking) {
    // Estado de carregamento simples sem delay artificial
    return (
      <div
        style={
          {
            /* seu estilo de carregamento */
          }
        }
      >
        {/* Indicador de carregamento simples */}
      </div>
    );
  }

  if (!user) {
    // Não autenticado
    return tipoEsperado === "empresa" ? (
      <Navigate to="/loginEmpresa" replace />
    ) : (
      <Navigate to="/" replace />
    );
  }

  if (!userType) {
    // Usuário não encontrado em nenhuma tabela
    return tipoEsperado === "empresa" ? (
      <Navigate to="/loginEmpresa" replace />
    ) : (
      <Navigate to="/" replace />
    );
  }

  if (tipoEsperado === "jovem_aprendiz" && !emailConfirmed) {
    if (location.pathname !== "/confirmar-email") {
      return <Navigate to="/confirmar-email" replace />;
    }
    return <>{children}</>;
  }

  const temAcesso = userType === tipoEsperado;

  if (!temAcesso) {
    // Tentativa de acesso a painel errado
    return tipoEsperado === "empresa" ? (
      <Navigate to="/loginEmpresa" replace />
    ) : (
      <Navigate to="/" replace />
    );
  }

  return <>{children}</>;
}
