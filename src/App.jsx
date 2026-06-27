import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom'; // <-- Adicionado useNavigate aqui
import Login from './pages/Login';
import Sidebar from './components/Sidebar';

// Importações das páginas
import Dashboard from './pages/Dashboard'; 
import Alunos from './pages/Alunos';
import Agenda from './pages/Agenda';
import Financeiro from './pages/Financeiro';
import AulasExperimentais from './pages/AulasExperimentais';
import Professores from './pages/Professores';

// Importação dos contextos
import { AulasFrequenciaProvider } from './contexts/AulasFrequenciaContext';

// URL dinâmica
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Componente de Layout (com Sidebar) - Recebe o onLogout agora
function LayoutComSidebar({ children, onLogout }) {
  return (
    <div className="flex bg-zinc-950 text-white min-h-screen selection:bg-emerald-500 selection:text-black">
      <Sidebar onLogout={onLogout} /> {/* <-- Passando a função para dentro da Sidebar */}
      <main className="flex-1 flex flex-col overflow-hidden">
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
          setEstaLogado(true);
        } else {
          localStorage.removeItem('@sonatta:token');
          setEstaLogado(false);
        }
      } catch (erro) {
        console.error("Erro ao validar sessão:", erro);
        setEstaLogado(true);
      } finally {
        setCarregando(false);
      }
    };

    verificarToken();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('@sonatta:token');
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
    return <Login aoLogar={() => setEstaLogado(true)} />;
  }

  // Se logado, mostra painel com rotas
  return (
    <AulasFrequenciaProvider>
      <Routes>
        <Route path="/" element={<LayoutComSidebar onLogout={handleLogout}><Dashboard /></LayoutComSidebar>} />
        <Route path="/alunos" element={<LayoutComSidebar onLogout={handleLogout}><Alunos /></LayoutComSidebar>} />
        <Route path="/agenda" element={<LayoutComSidebar onLogout={handleLogout}><Agenda /></LayoutComSidebar>} />
        <Route path="/aulas-experimentais" element={<LayoutComSidebar onLogout={handleLogout}><AulasExperimentais /></LayoutComSidebar>} />
        <Route path="/professores" element={<LayoutComSidebar onLogout={handleLogout}><Professores /></LayoutComSidebar>} />
        <Route path="/financeiro" element={<LayoutComSidebar onLogout={handleLogout}><Financeiro /></LayoutComSidebar>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AulasFrequenciaProvider>
  );
}