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

// Páginas do Professor
import MinhaAgenda from './pages/MinhaAgenda';
import MeusRecebimentos from './pages/MeusRecebimentos';

// Importação dos contextos
import { AulasFrequenciaProvider } from './contexts/AulasFrequenciaContext';

// URL dinâmica
const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

// Componente de Layout (com Sidebar) - Recebe o onLogout agora
function LayoutComSidebar({ children, onLogout, tipoUsuario, professorId }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  const location = useLocation();
  const navigate = useNavigate(); // <-- Inicializado o hook de navegação

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

  // Se não logado, mostra login
  if (!estaLogado) {
    return <Login aoLogar={(usuario) => {
      setUsuarioInfo(usuario || null);
      setEstaLogado(true);
    }} />;
  }

  const tipoUsuario = localStorage.getItem('@sonatta:tipo_usuario') || usuarioInfo?.tipo_usuario || 'admin';
  const professorId = localStorage.getItem('@sonatta:professor_id') || usuarioInfo?.professor_id || null;
  const ehProfessor = tipoUsuario === 'professor';

  // Se logado como professor, mostra painel restrito
  if (ehProfessor) {
    return (
      <AulasFrequenciaProvider>
        <Routes>
          <Route path="/" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId}><MinhaAgenda professorId={professorId} /></LayoutComSidebar>} />
          <Route path="/minha-agenda" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId}><MinhaAgenda professorId={professorId} /></LayoutComSidebar>} />
          <Route path="/meus-recebimentos" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId}><MeusRecebimentos professorId={professorId} /></LayoutComSidebar>} />
          <Route path="*" element={<Navigate to="/minha-agenda" replace />} />
        </Routes>
      </AulasFrequenciaProvider>
    );
  }

  // Se logado como admin, mostra painel completo com rotas
  return (
    <AulasFrequenciaProvider>
      <Routes>
        <Route path="/" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId}><Dashboard /></LayoutComSidebar>} />
        <Route path="/alunos" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId}><Alunos /></LayoutComSidebar>} />
        <Route path="/agenda" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId}><Agenda /></LayoutComSidebar>} />
        <Route path="/aulas-experimentais" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId}><AulasExperimentais /></LayoutComSidebar>} />
        <Route path="/professores" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId}><Professores /></LayoutComSidebar>} />
        <Route path="/financeiro" element={<LayoutComSidebar onLogout={handleLogout} tipoUsuario={tipoUsuario} professorId={professorId}><Financeiro /></LayoutComSidebar>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AulasFrequenciaProvider>
  );
}