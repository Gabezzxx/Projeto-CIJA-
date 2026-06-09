import { Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Login from "./pages/auth/login/login";
import Cadastro from "./pages/auth/cadastro/cadastroCliente";
import ClientDashboard from "pages/app/cliente/dashboard/clienteDasboard";
import RecuperarSenha from "./pages/auth/recuperarSenha/recuperarSenhaSendEmail";
import CriarNovaSenha from "pages/auth/recuperarSenha/criarSenha";
import Curriculo from "pages/app/cliente/curriculo";
import Vagas from "pages/app/cliente/vagas";
import Mensagens from "pages/app/cliente/mensagens";
import Perfil from "pages/app/cliente/perfil";
import LoginEmpresa from "pages/auth/login/loginEmpresa";
import CadastroEmpresa from "pages/auth/cadastro/cadastroEmpresa";
import MenuEmpresa from "pages/app/empresa/menuEmpresa";
import MensagemEmpresa from "pages/app/empresa/mensagemEmpresa";
import PerfilEmpresa from "pages/app/empresa/perfilEmpresa";
import VagasEmpresa from "pages/app/empresa/vagasEmpresa";
import CandidatosEmpresa from "pages/app/empresa/candidatosEmpresa";
import ConfirmarEmail from "pages/auth/cadastro/confirmarEmail";
import ProtectedRoute from "./routes/ProtectedRoute";
import Page404 from "pages/security/page404";
import Ajuda from "routes/ajudaSystem";
import Favoritos from "pages/app/cliente/favoritos";
import Candidaturas from "pages/app/cliente/candidaturas";
function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* =========================================================
             ROTAS PÚBLICAS
           ========================================================= */}
        <Route path="/" element={<Login />} />
        <Route path="*" element={<Page404 />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/recuperar-senha" element={<RecuperarSenha />} />
        <Route path="/criar-senha" element={<CriarNovaSenha />} />
        <Route path="/ajuda" element={<Ajuda />} />
        <Route path="/loginEmpresa" element={<LoginEmpresa />} />
        <Route path="/cadastroEmpresa" element={<CadastroEmpresa />} />

        {/* Rota de confirmação livre de validação rígida de tipo para não trancar o fluxo */}
        <Route path="/confirmar-email" element={<ConfirmarEmail />} />

        {/* =========================================================
             ROTAS DO JOVEM APRENDIZ
           ========================================================= */}
        <Route
          path="/clientDashboard"
          element={
            <ProtectedRoute tipoEsperado="jovem_aprendiz">
              <ClientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidaturas"
          element={
            <ProtectedRoute tipoEsperado="jovem_aprendiz">
              <Candidaturas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/curriculo"
          element={
            <ProtectedRoute tipoEsperado="jovem_aprendiz">
              <Curriculo />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vagas"
          element={
            <ProtectedRoute tipoEsperado="jovem_aprendiz">
              <Vagas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mensagens"
          element={
            <ProtectedRoute tipoEsperado="jovem_aprendiz">
              <Mensagens />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favoritos"
          element={
            <ProtectedRoute tipoEsperado="jovem_aprendiz">
              <Favoritos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute tipoEsperado="jovem_aprendiz">
              <Perfil />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            ROTAS DA EMPRESA
           ========================================================= */}
        <Route
          path="/menuEmpresa"
          element={
            <ProtectedRoute tipoEsperado="empresa">
              <MenuEmpresa />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mensagensEmpresa"
          element={
            <ProtectedRoute tipoEsperado="empresa">
              <MensagemEmpresa />
            </ProtectedRoute>
          }
        />

        <Route
          path="/perfilEmpresa"
          element={
            <ProtectedRoute tipoEsperado="empresa">
              <PerfilEmpresa />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vagasEmpresa"
          element={
            <ProtectedRoute tipoEsperado="empresa">
              <VagasEmpresa />
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidatosEmpresa"
          element={
            <ProtectedRoute tipoEsperado="empresa">
              <CandidatosEmpresa />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
