import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
const Login = React.lazy(() => import('./pages/Login'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
import Sidebar from './components/Sidebar';
import NotificationBanner from './components/NotificationBanner';
import UpdateToast from './components/UpdateToast';
import { Menu } from 'lucide-react';

// Importações das páginas
const Dashboard = React.lazy(() => import('./pages/Dashboard')); 
const Alunos = React.lazy(() => import('./pages/Alunos'));
const Agenda = React.lazy(() => import('./pages/Agenda'));
const Financeiro = React.lazy(() => import('./pages/Financeiro'));
const AulasExperimentais = React.lazy(() => import('./pages/AulasExperimentais'));
const Professores = React.lazy(() => import('./pages/Professores'));
const Responsaveis = React.lazy(() => import('./pages/Responsaveis'));
const CursosTurmas = React.lazy(() => import('./pages/CursosTurmas'));
const Salas = React.lazy(() => import('./pages/Salas'));
const LocacaoSalas = React.lazy(() => import('./pages/LocacaoSalas'));
const Lojinha = React.lazy(() => import('./pages/Lojinha'));
const MinhaAssinatura = React.lazy(() => import('./pages/MinhaAssinatura'));
const AssinaturaSuspensa = React.lazy(() => import('./pages/AssinaturaSuspensa'));
const Materiais = React.lazy(() => import('./pages/Materiais'));
const SuperAdmin = React.lazy(() => import('./pages/SuperAdmin'));
const Configuracoes = React.lazy(() => import('./pages/Configuracoes'));
const Feriados = React.lazy(() => import('./pages/Feriados'));
const Relatorios = React.lazy(() => import('./pages/Relatorios'));
const Eventos = React.lazy(() => import('./pages/Eventos'));

// Páginas do Professor
const MinhaAgenda = React.lazy(() => import('./pages/MinhaAgenda'));
const MinhasTurmas = React.lazy(() => import('./pages/MinhasTurmas'));
const MeusRecebimentos = React.lazy(() => import('./pages/MeusRecebimentos'));
const MeusAlunos = React.lazy(() => import('./pages/MeusAlunos'));

// Páginas do Portal
const LoginPortal = React.lazy(() => import('./pages/Portal/LoginPortal'));
const DashboardPortal = React.lazy(() => import('./pages/Portal/DashboardPortal'));

// URL dinâmica
const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

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
function LayoutComSidebar({ children, onLogout, tipoUsuario, professorId, isBlocked, currentRoute }) {
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
    const diasTolerancia = 3;
    
    if (plano === 'Trial 10 dias') {
      if (diffDays < -diasTolerancia) {
        avisoBanner = <div className="bg-red-500/20 border-b border-red-500/50 text-red-200 p-3 text-center text-sm font-semibold">⚠️ Seu período de teste expirou há {Math.abs(diffDays)} dia(s). Escolha um plano para restaurar o acesso!</div>;
      } else if (diffDays < 0) {
        avisoBanner = <div className="bg-amber-500/20 border-b border-amber-500/50 text-amber-200 p-3 text-center text-sm font-semibold">⚠️ Sua assinatura venceu há {Math.abs(diffDays)} dia(s), mas ainda está dentro da tolerância do sistema. Regularize para evitar o bloqueio.</div>;
      } else if (diffDays <= 3) {
        avisoBanner = <div className="bg-amber-500/20 border-b border-amber-500/50 text-amber-200 p-3 text-center text-sm font-semibold">⚠️ Seu período de teste acaba em {diffDays === 0 ? 'hoje' : `${diffDays} dia(s)`}. Vá em "Minha Assinatura" e escolha um plano.</div>;
      } else {
        avisoBanner = <div className="bg-blue-500/20 border-b border-blue-500/50 text-blue-200 p-3 text-center text-sm font-semibold">🎉 Você está no período de teste grátis (Restam {diffDays} dias). Aproveite todas as funcionalidades!</div>;
      }
    } else {
      if (diffDays < -diasTolerancia) {
        avisoBanner = <div className="bg-red-500/20 border-b border-red-500/50 text-red-200 p-3 text-center text-sm font-semibold">⚠️ Sua assinatura venceu há {Math.abs(diffDays)} dia(s). Regularize o pagamento para evitar o bloqueio total do sistema.</div>;
      } else if (diffDays < 0) {
        avisoBanner = <div className="bg-amber-500/20 border-b border-amber-500/50 text-amber-200 p-3 text-center text-sm font-semibold">⚠️ Sua assinatura venceu há {Math.abs(diffDays)} dia(s), mas ainda está dentro da tolerância do sistema. Regularize para evitar o bloqueio.</div>;
      } else if (diffDays <= 3) {
        avisoBanner = <div className="bg-amber-500/20 border-b border-amber-500/50 text-amber-200 p-3 text-center text-sm font-semibold">⚠️ Atenção! Sua assinatura vence em {diffDays === 0 ? 'hoje' : `${diffDays} dia(s)`}. Regularize o pagamento para evitar a suspensão.</div>;
      }
    }
  }

  return (
    <div className="flex flex-col md:flex-row bg-zinc-950 text-white min-h-screen selection:bg-emerald-500 selection:text-black">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900 z-30">
        <div className="flex items-center">
          {typeof window !== 'undefined' && localStorage.getItem('@sonatta:escola_logo') ? (
            <img src={localStorage.getItem('@sonatta:escola_logo')} alt={localStorage.getItem('@sonatta:escola_nome') || 'Escola'} className="max-h-8 object-contain" />
          ) : typeof window !== 'undefined' && localStorage.getItem('@sonatta:escola_nome') ? (
            <div className="text-white text-xl font-bold">
              {localStorage.getItem('@sonatta:escola_nome')}
            </div>
          ) : null}
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
        
        {isBlocked && currentRoute !== '/minha-assinatura' ? (
          <AssinaturaSuspensa />
        ) : (
          children
        )}
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
  const navigate = useNavigate();

  useEffect(() => {
    const handleSuspensa = () => setAssinaturaSuspensa(true);
    window.addEventListener('assinatura_suspensa', handleSuspensa);
    return () => window.removeEventListener('assinatura_suspensa', handleSuspensa);
  }, []);

  // SSE - Recebimento de Avisos Globais em Tempo Real
  const [avisoGlobal, setAvisoGlobal] = useState(null);
  useEffect(() => {
    const sse = new EventSource(`${API_URL}/api/avisos/stream`);

    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setAvisoGlobal(data.aviso || null);
      } catch (err) {
        console.error('Erro ao parsear aviso SSE', err);
      }
    };

    sse.onerror = () => {
      // O EventSource tentará reconectar automaticamente pelo navegador,
      // mas podemos fechar se quisermos lidar com falhas críticas.
    };

    return () => {
      sse.close();
    };
  }, []);

  // Verifica token ao montar
  useEffect(() => {
    const verificarToken = async () => {
      // 🕵️ Limpa a sessão se vier com a flag clearSession (links do email)
      const params = new URLSearchParams(window.location.search);
      if (params.get('clearSession') === '1') {
        localStorage.clear();
        setEstaLogado(false);
        setCarregando(false);
        // Limpa a URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

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
          localStorage.setItem('@sonatta:escola_nome', dados.usuario?.nome_escola || '');
          localStorage.setItem('@sonatta:escola_logo', dados.usuario?.logo_url || '');
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
    navigate('/', { replace: true });
  };

  const GlobalBanner = () => {
    if (!avisoGlobal) return null;
    return (
      <div className={`w-full z-[100] relative px-4 py-2 text-center text-sm font-semibold text-white shadow-md ${
        avisoGlobal.tipo === 'alert' ? 'bg-red-600' :
        avisoGlobal.tipo === 'success' ? 'bg-emerald-600' :
        'bg-blue-600'
      }`}>
        {avisoGlobal.mensagem}
      </div>
    );
  };

  const isPortalRoute = location.pathname.startsWith('/portal');

  const ativaLocalStorage = typeof window !== 'undefined' ? localStorage.getItem('@sonatta:ativa') : 'true';
  const isSuspendedLocally = ativaLocalStorage === 'false';
  
  const dataVencimento = typeof window !== 'undefined' ? localStorage.getItem('@sonatta:data_vencimento') : null;
  const plano = typeof window !== 'undefined' ? localStorage.getItem('@sonatta:plano') : 'Vitalicio';
  const tipoUsuarioLocal = typeof window !== 'undefined' ? localStorage.getItem('@sonatta:tipo_usuario') : 'admin';
  
  let isExpiredLocally = false;
  if (tipoUsuarioLocal !== 'professor' && plano !== 'Vitalicio' && dataVencimento) {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const venc = new Date(dataVencimento);
    venc.setHours(0,0,0,0);
    const diffTime = venc - hoje;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diasTolerancia = 3;
    if (diffDays < -diasTolerancia) {
      isExpiredLocally = true;
    }
  }

  const isBlocked = assinaturaSuspensa || isSuspendedLocally || isExpiredLocally;

  if (isPortalRoute) {
    return (
      <div className="flex flex-col min-h-screen">
        <GlobalBanner />
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-emerald-500">Carregando Tela...</div>}>
          <Routes>
          <Route path="/portal/login" element={<LoginPortal />} />
          <Route path="/portal/dashboard" element={<DashboardPortal />} />
          <Route path="*" element={<Navigate to="/portal/login" replace />} />
        </Routes>
          </Suspense>
        <UpdateToast />
      </div>
    );
  }

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

  // Se não logado, mostra as rotas públicas (Landing Page e Login)
  if (!estaLogado) {
    return (
      <div className="flex flex-col min-h-screen">
        <GlobalBanner />
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-emerald-500">Carregando Tela...</div>}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={
            <Login aoLogar={(usuario) => {
              setUsuarioInfo(usuario || null);
              setEstaLogado(true);
            }} />
          } />
          {/* Se a pessoa tentar entrar em algo não autorizado, manda pra home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </Suspense>
        <UpdateToast />
      </div>
    );
  }

  const tipoUsuario = localStorage.getItem('@sonatta:tipo_usuario') || usuarioInfo?.tipo_usuario || 'admin';
  const professorId = localStorage.getItem('@sonatta:professor_id') || usuarioInfo?.professor_id || null;
  const isSuperAdmin = usuarioInfo?.is_super_admin === true;
  const ehProfessor = tipoUsuario === 'professor';

  // Se logado como Super Admin, mostra APENAS o painel de Super Admin
  if (isSuperAdmin) {
    return (
      <div className="flex flex-col min-h-screen">
        <GlobalBanner />
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-emerald-500">Carregando Tela...</div>}>
          <Routes>
          <Route path="/" element={<SuperAdmin onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </Suspense>
        <UpdateToast />
      </div>
    );
  }

  // Se logado como professor, mostra painel restrito
  if (ehProfessor) {
    return (
      <div className="flex flex-col min-h-screen">
        <GlobalBanner />
          <Suspense fallback={<div className="flex h-screen items-center justify-center text-emerald-500">Carregando Tela...</div>}>
          <Routes>
            <Route path="/" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><MinhaAgenda professorId={professorId} /></LayoutComSidebar>} />
            <Route path="/minha-agenda" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><MinhaAgenda professorId={professorId} /></LayoutComSidebar>} />
            <Route path="/minhas-turmas" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><MinhasTurmas /></LayoutComSidebar>} />
            <Route path="/meus-alunos" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><MeusAlunos /></LayoutComSidebar>} />
            <Route path="/meus-recebimentos" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><MeusRecebimentos professorId={professorId} /></LayoutComSidebar>} />
            <Route path="/eventos" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Eventos /></LayoutComSidebar>} />
            <Route path="/materiais" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Materiais /></LayoutComSidebar>} />
            <Route path="*" element={<Navigate to="/minha-agenda" replace />} />
          </Routes>
          </Suspense>
          <UpdateToast />
      </div>
    );
  }

  // Se logado como admin, mostra painel completo com rotas
  return (
    <div className="flex flex-col min-h-screen">
      <GlobalBanner />
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-emerald-500">Carregando Tela...</div>}>
          <Routes>
          <Route path="/" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Dashboard /></LayoutComSidebar>} />
          <Route path="/alunos" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Alunos /></LayoutComSidebar>} />
          <Route path="/agenda" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Agenda /></LayoutComSidebar>} />
          <Route path="/aulas-experimentais" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><AulasExperimentais /></LayoutComSidebar>} />
          <Route path="/professores" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Professores /></LayoutComSidebar>} />
          <Route path="/responsaveis" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Responsaveis /></LayoutComSidebar>} />
          <Route path="/cursos-turmas" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><CursosTurmas /></LayoutComSidebar>} />
          <Route path="/salas" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Salas /></LayoutComSidebar>} />
          <Route path="/locacao-salas" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><LocacaoSalas /></LayoutComSidebar>} />
          <Route path="/financeiro" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Financeiro /></LayoutComSidebar>} />
          <Route path="/feriados" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Feriados /></LayoutComSidebar>} />
          <Route path="/relatorios" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Relatorios /></LayoutComSidebar>} />
          <Route path="/eventos" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Eventos /></LayoutComSidebar>} />
          <Route path="/materiais" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Materiais /></LayoutComSidebar>} />
          <Route path="/configuracoes" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Configuracoes /></LayoutComSidebar>} />
          <Route path="/lojinha" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><Lojinha /></LayoutComSidebar>} />
          <Route path="/minha-assinatura" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId} isSuperAdmin={isSuperAdmin} isBlocked={isBlocked} currentRoute={location.pathname}><MinhaAssinatura /></LayoutComSidebar>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </Suspense>
        <UpdateToast />
    </div>
  );
}
