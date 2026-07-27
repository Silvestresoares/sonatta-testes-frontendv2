import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom'; // <-- Adicionado useNavigate aqui
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import NotificationBanner from './components/NotificationBanner';
import { Menu } from 'lucide-react';

// Importações das páginas
import Dashboard from './pages/Dashboard'; 
import Alunos from './pages/Alunos';
import Agenda from './pages/Agenda';
import Financeiro from './pages/Financeiro';
import AulasExperimentais from './pages/AulasExperimentais';
import Professores from './pages/Professores';
import Responsaveis from './pages/Responsaveis';
import CursosTurmas from './pages/CursosTurmas';
import Materiais from './pages/Materiais';
import SuperAdmin from './pages/SuperAdmin';

// Páginas do Professor
import MinhaAgenda from './pages/MinhaAgenda';
import MinhasTurmas from './pages/MinhasTurmas';
import MeusRecebimentos from './pages/MeusRecebimentos';

// Páginas do Portal
import LoginPortal from './pages/Portal/LoginPortal';
import DashboardPortal from './pages/Portal/DashboardPortal';

// Importação dos contextos
import { AulasFrequenciaProvider } from './contexts/AulasFrequenciaContext';

// URL dinâmica
const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

// Nova Página
import AssinaturaSuspensa from './pages/AssinaturaSuspensa';

// Interceptor Global de Fetch
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  if (response.status === 402) {
    window.dispatchEvent(new Event('assinatura_suspensa'));
  }
  return response;
};

// Componente de Layout (com Sidebar) - Recebe o onLogout agora
function LayoutComSidebar({ children, onLogout, tipoUsuario, professorId }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const plano = localStorage.getItem('@sonatta:plano') || 'Vitalicio';
  const dataVencimento = localStorage.getItem('@sonatta:data_vencimento');
  let avisoBanner = null;

  if (tipoUsuario !== 'professor' && plano !== 'Vitalicio' && dataVencimento) {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const venc = new Date(dataVencimento);
    venc.setHours(0,0,0,0);
    
    const diffTime = venc - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      avisoBanner = <div className="bg-red-500/20 border-b border-red-500/50 text-red-200 p-3 text-center text-sm font-semibold">⚠️ Sua assinatura venceu há {Math.abs(diffDays)} dia(s). Regularize o pagamento para evitar o bloqueio total do sistema.</div>;
    } else if (diffDays <= 3) {
      avisoBanner = <div className="bg-amber-500/20 border-b border-amber-500/50 text-amber-200 p-3 text-center text-sm font-semibold">⚠️ Atenção! Sua assinatura vence em {diffDays === 0 ? 'hoje' : `${diffDays} dia(s)`}. Regularize o pagamento para evitar a suspensão.</div>;
    }
  }

  return (
    <div className="flex flex-col md:flex-row bg-zinc-950 text-white min-h-screen selection:bg-emerald-500 selection:text-black">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 z-30">
        <div className="text-emerald-400 text-3xl font-bold" style={{ fontFamily: "'Dancing Script', cursive" }}>
          Sonatta
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-400 hover:text-white rounded-md bg-zinc-800">
          <Menu size={24} />
        </button>
      </div>

      <Sidebar onLogout={onLogout} tipoUsuario={tipoUsuario} professorId={professorId} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {avisoBanner}
        <NotificationBanner />
        
        {/* Overlay para mobile quando a Sidebar está aberta */}
        {isSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const [estaLogado, setEstaLogado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [usuarioInfo, setUsuarioInfo] = useState(null);
  const [assinaturaSuspensa, setAssinaturaSuspensa] = useState(false);
  const location = useLocation();
  const navigate = useNavigate(); // <-- Inicializado o hook de navegação

  useEffect(() => {
    const handleSuspensa = () => setAssinaturaSuspensa(true);
    window.addEventListener('assinatura_suspensa', handleSuspensa);
    return () => window.removeEventListener('assinatura_suspensa', handleSuspensa);
  }, []);

  // Verifica token ao montar
  useEffect(() => {
    const verificarToken = async () => {
      const token = localStorage.getItem('@sonatta:token');
      
      if (!token) {
        setEstaLogado(false);
        setCarregando(false);
        return;
      }

      try {
        const resposta = await fetch(`${API_URL}/api/auth/me`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (resposta.ok) {
          const dados = await resposta.json();
          setUsuarioInfo(dados.usuario);
          localStorage.setItem('@sonatta:tipo_usuario', dados.usuario?.tipo_usuario || 'admin');
          localStorage.setItem('@sonatta:professor_id', dados.usuario?.professor_id || '');
          localStorage.setItem('@sonatta:is_super_admin', dados.usuario?.is_super_admin || false);
          localStorage.setItem('@sonatta:plano', dados.usuario?.plano || 'Vitalicio');
          localStorage.setItem('@sonatta:data_vencimento', dados.usuario?.data_vencimento_assinatura || '');
          setEstaLogado(true);
        } else {
          localStorage.removeItem('@sonatta:token');
          setEstaLogado(false);
        }
      } catch (erro) {
        console.error("Erro ao validar sessão:", erro);
        setEstaLogado(false);
      } finally {
        setCarregando(false);
      }
    };

    verificarToken();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('@sonatta:token');
    localStorage.removeItem('@sonatta:tipo_usuario');
    localStorage.removeItem('@sonatta:professor_id');
    localStorage.removeItem('@sonatta:usuario_nome');
    localStorage.removeItem('@sonatta:is_super_admin');
    setUsuarioInfo(null);
    setEstaLogado(false);
    navigate('/', { replace: true }); // <-- Força a rota a voltar para o início de forma limpa
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm tracking-wider">Validando sessão...</span>
        </div>
      </div>
    );
  }

  // Verificação de rotas exclusivas do Portal ANTES do bloqueio de login do admin
  if (location.pathname.startsWith('/portal')) {
    return (
      <Routes>
        <Route path="/portal/login" element={<LoginPortal />} />
        <Route path="/portal/dashboard" element={<DashboardPortal />} />
        <Route path="/portal/*" element={<Navigate to="/portal/login" />} />
      </Routes>
    );
  }

  // Se a assinatura estiver suspensa, trava a aplicação inteira
  if (assinaturaSuspensa) {
    return <AssinaturaSuspensa />;
  }

  // Se não logado, mostra login admin
  if (!estaLogado) {
    return <Login aoLogar={(usuario) => {
      setUsuarioInfo(usuario || null);
      setEstaLogado(true);
    }} />;
  }

  const tipoUsuario = localStorage.getItem('@sonatta:tipo_usuario') || usuarioInfo?.tipo_usuario || 'admin';
  const professorId = localStorage.getItem('@sonatta:professor_id') || usuarioInfo?.professor_id || null;
  const isSuperAdmin = localStorage.getItem('@sonatta:is_super_admin') === 'true' || usuarioInfo?.is_super_admin === true;
  const ehProfessor = tipoUsuario === 'professor';

  // Se logado como Super Admin, mostra APENAS o painel de Super Admin
  if (isSuperAdmin) {
    return (
      <Routes>
        <Route path="/" element={<SuperAdmin onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Se logado como professor, mostra painel restrito
  if (ehProfessor) {
    return (
      <AulasFrequenciaProvider>
        <Routes>
          <Route path="/" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin}><MinhaAgenda professorId={professorId} /></LayoutComSidebar>} />
          <Route path="/minha-agenda" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin}><MinhaAgenda professorId={professorId} /></LayoutComSidebar>} />
          <Route path="/minhas-turmas" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin}><MinhasTurmas /></LayoutComSidebar>} />
          <Route path="/meus-recebimentos" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin}><MeusRecebimentos professorId={professorId} /></LayoutComSidebar>} />
          <Route path="/materiais" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin}><Materiais /></LayoutComSidebar>} />
          <Route path="*" element={<Navigate to="/minha-agenda" replace />} />
        </Routes>
      </AulasFrequenciaProvider>
    );
  }

  // Se logado como admin, mostra painel completo com rotas
  return (
    <AulasFrequenciaProvider>
      <Routes>
        <Route path="/" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin}><Dashboard /></LayoutComSidebar>} />
        <Route path="/alunos" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin}><Alunos /></LayoutComSidebar>} />
        <Route path="/agenda" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin}><Agenda /></LayoutComSidebar>} />
        <Route path="/aulas-experimentais" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin}><AulasExperimentais /></LayoutComSidebar>} />
        <Route path="/professores" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin}><Professores /></LayoutComSidebar>} />
        <Route path="/responsaveis" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin}><Responsaveis /></LayoutComSidebar>} />
        <Route path="/cursos-turmas" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin}><CursosTurmas /></LayoutComSidebar>} />
        <Route path="/financeiro" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin}><Financeiro /></LayoutComSidebar>} />
        <Route path="/materiais" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin}><Materiais /></LayoutComSidebar>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AulasFrequenciaProvider>
  );
}