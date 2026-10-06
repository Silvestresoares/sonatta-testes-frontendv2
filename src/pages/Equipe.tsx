import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Shield, Check, X, Key, Trash2, Edit3,
    Power, AlertCircle, Info, Lock, Eye, EyeOff
} from 'lucide-react';
import { API_URL } from '../utils/api';

// Interface das permissões possíveis configuradas pelo Dono
interface PermissoesConfig {
    alunos?: boolean;
    agenda?: boolean;
    experimentais?: boolean;
    turmas?: boolean;
    salas?: boolean;
    professores?: boolean;
    eventos?: boolean;
    materiais?: boolean;
    lojinha?: boolean;
    financeiro?: boolean;
    relatorios?: boolean;
    configuracoes?: boolean;
}

// Interface do colaborador
interface Colaborador {
    id: number;
    nome: string;
    email: string;
    tipo_usuario: 'admin' | 'secretaria';
    ativo: boolean;
    permissoes: PermissoesConfig;
    data_cadastro?: string;
}

// Lista dos módulos disponíveis com nomes amigáveis para a interface
const MODULOS_DISPONIVEIS: { chave: keyof PermissoesConfig; nome: string; descricao: string; sensivel?: boolean }[] = [
    { chave: 'alunos', nome: 'Alunos e Responsáveis', descricao: 'Visualizar e cadastrar fichas de alunos e responsáveis' },
    { chave: 'agenda', nome: 'Agenda e Calendário', descricao: 'Grade de horários, remarcações e calendário letivo' },
    { chave: 'experimentais', nome: 'Aulas Experimentais (CRM)', descricao: 'Funil de captação de novos alunos e leads' },
    { chave: 'turmas', nome: 'Cursos e Turmas', descricao: 'Gestão de turmas coletivas e instrumentos' },
    { chave: 'salas', nome: 'Salas e Locações', descricao: 'Salas físicas e agendamento de locação de espaço' },
    { chave: 'lojinha', nome: 'Lojinha / PDV', descricao: 'Venda de palhetas, instrumentos e livros no balcão' },
    { chave: 'eventos', nome: 'Eventos e Recitais', descricao: 'Organização de apresentações e audições' },
    { chave: 'materiais', nome: 'Arquivos e Partituras', descricao: 'Repositório de métodos e PDFs' },
    { chave: 'professores', nome: 'Professores (Cadastro)', descricao: 'Visualizar cadastro dos professores da escola' },
    { chave: 'financeiro', nome: 'Módulo Financeiro', descricao: 'Acesso ao caixa, mensalidades e faturamento', sensivel: true },
    { chave: 'relatorios', nome: 'Relatórios e BI', descricao: 'Gráficos de retenção, evasão e métricas', sensivel: true },
    { chave: 'configuracoes', nome: 'Configurações da Escola', descricao: 'Dados fiscais, PIX e integrações', sensivel: true },
];

// Permissões padrão sugeridas para Secretaria (focadas em atendimento diário)
const PERMISSOES_PADRAO_SECRETARIA: PermissoesConfig = {
    alunos: true,
    agenda: true,
    experimentais: true,
    turmas: true,
    salas: true,
    lojinha: true,
    eventos: true,
    materiais: true,
    professores: false,
    financeiro: false,
    relatorios: false,
    configuracoes: false,
};

export default function Equipe() {
    const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');

    // Estados dos modais
    const [modalAberto, setModalAberto] = useState(false);
    const [modoEdicao, setModoEdicao] = useState(false);
    const [colaboradorEditando, setColaboradorEditando] = useState<Colaborador | null>(null);

    // Estados do formulário de cadastro/edição
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [permissoes, setPermissoes] = useState<PermissoesConfig>(PERMISSOES_PADRAO_SECRETARIA);
    const [salvando, setSalvando] = useState(false);

    // Modal de Redefinir Senha
    const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
    const [colaboradorSenhaId, setColaboradorSenhaId] = useState<number | null>(null);
    const [novaSenha, setNovaSenha] = useState('');
    const [salvandoSenha, setSalvandoSenha] = useState(false);

    const token = localStorage.getItem('@sonatta:token');

    // Carrega lista de membros da equipe
    const carregarEquipe = async () => {
        setCarregando(true);
        setErro('');
        try {
            const res = await fetch(`${API_URL}/api/equipe`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const dados = await res.json();
            if (res.ok) {
                setColaboradores(dados);
            } else {
                setErro(dados.erro || 'Não foi possível carregar a equipe.');
            }
        } catch (e) {
            setErro('Erro de conexão com o servidor.');
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarEquipe();
    }, []);

    // Abre modal para cadastrar nova secretária
    const handleAbrirNovo = () => {
        setModoEdicao(false);
        setColaboradorEditando(null);
        setNome('');
        setEmail('');
        setSenha('');
        setPermissoes(PERMISSOES_PADRAO_SECRETARIA);
        setModalAberto(true);
    };

    // Abre modal para editar permissões de secretária existente
    const handleAbrirEditar = (c: Colaborador) => {
        setModoEdicao(true);
        setColaboradorEditando(c);
        setNome(c.nome);
        setEmail(c.email);
        setSenha('');
        setPermissoes(c.permissoes || {});
        setModalAberto(true);
    };

    // Alterna uma permissão individual
    const togglePermissao = (chave: keyof PermissoesConfig) => {
        setPermissoes(prev => ({
            ...prev,
            [chave]: !prev[chave]
        }));
    };

    // Salvar cadastro ou edição
    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        setSalvando(true);
        setErro('');
        setSucesso('');

        try {
            const url = modoEdicao && colaboradorEditando
                ? `${API_URL}/api/equipe/${colaboradorEditando.id}`
                : `${API_URL}/api/equipe`;

            const method = modoEdicao ? 'PUT' : 'POST';

            const payload: any = {
                nome,
                email,
                permissoes
            };

            if (!modoEdicao) {
                payload.senha = senha;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const dados = await res.json();

            if (res.ok) {
                setSucesso(modoEdicao ? 'Permissões atualizadas com sucesso!' : 'Usuário da secretaria cadastrado com sucesso!');
                setModalAberto(false);
                carregarEquipe();
            } else {
                setErro(dados.erro || 'Erro ao salvar colaborador.');
            }
        } catch (e) {
            setErro('Erro de comunicação com o servidor.');
        } finally {
            setSalvando(false);
        }
    };

    // Ativar ou suspender acesso
    const handleToggleStatus = async (colab: Colaborador) => {
        const novoStatus = !colab.ativo;
        if (!window.confirm(`Deseja ${novoStatus ? 'ativar' : 'suspender'} o acesso de ${colab.nome}?`)) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/equipe/${colab.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ativo: novoStatus })
            });

            if (res.ok) {
                setColaboradores(prev => prev.map(c => c.id === colab.id ? { ...c, ativo: novoStatus } : c));
                setSucesso(`Acesso ${novoStatus ? 'ativado' : 'suspenso'} com sucesso!`);
            } else {
                const dados = await res.json();
                alert(dados.erro || 'Erro ao alterar status.');
            }
        } catch (e) {
            alert('Erro de conexão ao alterar status.');
        }
    };

    // Redefinir senha da secretária
    const handleSalvarNovaSenha = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!colaboradorSenhaId || novaSenha.length < 6) {
            alert('A nova senha deve ter pelo menos 6 dígitos.');
            return;
        }

        setSalvandoSenha(true);
        try {
            const res = await fetch(`${API_URL}/api/equipe/${colaboradorSenhaId}/senha`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ novaSenha })
            });

            if (res.ok) {
                setSucesso('Senha redefinida com sucesso!');
                setModalSenhaAberto(false);
                setNovaSenha('');
            } else {
                const dados = await res.json();
                alert(dados.erro || 'Erro ao redefinir senha.');
            }
        } catch (e) {
            alert('Erro de conexão.');
        } finally {
            setSalvandoSenha(false);
        }
    };

    // Excluir secretária
    const handleExcluir = async (colab: Colaborador) => {
        if (!window.confirm(`Tem certeza que deseja remover permanentemente o acesso de ${colab.nome}?`)) {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/equipe/${colab.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setColaboradores(prev => prev.filter(c => c.id !== colab.id));
                setSucesso('Acesso removido com sucesso!');
            } else {
                const dados = await res.json();
                alert(dados.erro || 'Erro ao remover colaborador.');
            }
        } catch (e) {
            alert('Erro de conexão ao excluir.');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                            <Users size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Equipe & Secretaria</h1>
                            <p className="text-sm text-zinc-400">Gerencie colaboradores e defina as permissões de acesso da sua escola.</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleAbrirNovo}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
                >
                    <UserPlus size={18} />
                    Novo Usuário (Secretaria)
                </button>
            </div>

            {/* Alertas */}
            {sucesso && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Check size={18} />
                        <span>{sucesso}</span>
                    </div>
                    <button onClick={() => setSucesso('')} className="text-emerald-400 hover:text-white"><X size={16} /></button>
                </div>
            )}

            {erro && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={18} />
                        <span>{erro}</span>
                    </div>
                    <button onClick={() => setErro('')} className="text-red-400 hover:text-white"><X size={16} /></button>
                </div>
            )}

            {/* Lista de Colaboradores */}
            {carregando ? (
                <div className="text-center py-16 text-zinc-500">Carregando equipe da escola...</div>
            ) : colaboradores.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                    <Users size={40} className="mx-auto text-zinc-600 mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-1">Nenhum usuário de secretaria cadastrado</h3>
                    <p className="text-sm text-zinc-400 max-w-md mx-auto mb-5">
                        Cadastre membros da sua recepção ou secretaria para que eles possam operar o sistema com segurança.
                    </p>
                    <button
                        onClick={handleAbrirNovo}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all"
                    >
                        Cadastrar Primeiro Usuário
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {colaboradores.map((colab) => {
                        const ehAdmin = colab.tipo_usuario === 'admin';
                        const permissoesAtivas = Object.entries(colab.permissoes || {})
                            .filter(([_, ativo]) => ativo)
                            .map(([chave]) => chave);

                        return (
                            <div
                                key={colab.id}
                                className={`bg-zinc-900/80 border rounded-2xl p-5 flex flex-col justify-between transition-all backdrop-blur-sm ${ehAdmin
                                        ? 'border-blue-500/30 shadow-lg shadow-blue-500/5'
                                        : colab.ativo
                                            ? 'border-zinc-800 hover:border-zinc-700'
                                            : 'border-red-900/30 opacity-75'
                                    }`}
                            >
                                <div>
                                    {/* Cabeçalho do Card */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div>
                                            <h3 className="font-semibold text-white text-base leading-tight">{colab.nome}</h3>
                                            <p className="text-xs text-zinc-400 mt-0.5">{colab.email}</p>
                                        </div>

                                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${ehAdmin
                                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            }`}>
                                            {ehAdmin ? 'Dono / Admin' : 'Secretaria'}
                                        </span>
                                    </div>

                                    {/* Status */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`w-2 h-2 rounded-full ${colab.ativo ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                                        <span className="text-xs text-zinc-400 font-medium">
                                            {colab.ativo ? 'Acesso Ativo' : 'Acesso Suspenso'}
                                        </span>
                                    </div>

                                    {/* Badges de Permissões */}
                                    <div className="border-t border-zinc-800/80 pt-3 mb-4">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                            {ehAdmin ? 'Acesso Total' : `Permissões (${permissoesAtivas.length})`}
                                        </p>

                                        {ehAdmin ? (
                                            <span className="text-xs bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-md border border-blue-500/20">
                                                Acesso irrestrito a todos os módulos
                                            </span>
                                        ) : permissoesAtivas.length === 0 ? (
                                            <span className="text-xs text-zinc-500 italic">Nenhum módulo liberado</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                                {permissoesAtivas.map(chave => {
                                                    const modulo = MODULOS_DISPONIVEIS.find(m => m.chave === chave);
                                                    return (
                                                        <span
                                                            key={chave}
                                                            className={`text-[11px] px-2 py-0.5 rounded-md font-medium border ${modulo?.sensivel
                                                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                                                    : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                                                }`}
                                                        >
                                                            {modulo ? modulo.nome.split(' ')[0] : chave}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Ações (Apenas para Secretárias) */}
                                {!ehAdmin && (
                                    <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between gap-2">
                                        <button
                                            onClick={() => handleAbrirEditar(colab)}
                                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                                        >
                                            <Edit3 size={14} className="text-cyan-400" />
                                            Permissões
                                        </button>

                                        <button
                                            title="Redefinir Senha"
                                            onClick={() => {
                                                setColaboradorSenhaId(colab.id);
                                                setNovaSenha('');
                                                setModalSenhaAberto(true);
                                            }}
                                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <Key size={15} />
                                        </button>

                                        <button
                                            title={colab.ativo ? 'Suspender Acesso' : 'Ativar Acesso'}
                                            onClick={() => handleToggleStatus(colab)}
                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${colab.ativo
                                                    ? 'bg-zinc-800 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-400'
                                                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                }`}
                                        >
                                            <Power size={15} />
                                        </button>

                                        <button
                                            title="Excluir Colaborador"
                                            onClick={() => handleExcluir(colab)}
                                            className="p-1.5 bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL: Cadastrar ou Editar Usuário da Secretaria */}
            {modalAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                        {/* Cabeçalho do Modal */}
                        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <Shield className="text-cyan-400" size={20} />
                                <h2 className="text-lg font-bold text-white">
                                    {modoEdicao ? `Editar Permissões - ${nome}` : 'Cadastrar Usuário da Secretaria'}
                                </h2>
                            </div>
                            <button onClick={() => setModalAberto(false)} className="text-zinc-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Formulário com Scroll */}
                        <form onSubmit={handleSalvar} className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Dados Básicos */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-1.5">
                                        Nome Completo
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Maria Atendimento"
                                        value={nome}
                                        onChange={e => setNome(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-1.5">
                                        E-mail de Acesso
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="secretaria@escola.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-cyan-500 outline-none"
                                    />
                                </div>
                            </div>

                            {!modoEdicao && (
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-1.5">
                                        Senha Provisória Inicial (mínimo 6 dígitos)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={mostrarSenha ? 'text' : 'password'}
                                            required
                                            placeholder="••••••••"
                                            value={senha}
                                            onChange={e => setSenha(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white focus:border-cyan-500 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setMostrarSenha(!mostrarSenha)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                                        >
                                            {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Seção de Permissões Granulares */}
                            <div className="pt-3 border-t border-zinc-800">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                                            <Lock size={15} className="text-emerald-400" />
                                            Permissões de Acesso por Módulo
                                        </h3>
                                        <p className="text-xs text-zinc-400">Marque os módulos que este usuário da secretaria poderá visualizar e utilizar.</p>
                                    </div>

                                    {/* Atalhos Rápidos */}
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPermissoes(PERMISSOES_PADRAO_SECRETARIA)}
                                            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                        >
                                            Padrão Secretaria
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const todos: PermissoesConfig = {};
                                                MODULOS_DISPONIVEIS.forEach(m => todos[m.chave] = true);
                                                setPermissoes(todos);
                                            }}
                                            className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                        >
                                            Marcar Todos
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {MODULOS_DISPONIVEIS.map((m) => {
                                        const ativo = permissoes[m.chave] === true;
                                        return (
                                            <div
                                                key={m.chave}
                                                onClick={() => togglePermissao(m.chave)}
                                                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${ativo
                                                        ? m.sensivel
                                                            ? 'bg-amber-500/10 border-amber-500/40 text-white'
                                                            : 'bg-emerald-500/10 border-emerald-500/40 text-white'
                                                        : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                                                    }`}
                                            >
                                                <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${ativo
                                                        ? m.sensivel ? 'bg-amber-500 border-amber-500 text-black' : 'bg-emerald-500 border-emerald-500 text-black'
                                                        : 'border-zinc-700 bg-zinc-900'
                                                    }`}>
                                                    {ativo && <Check size={14} className="stroke-[3]" />}
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-semibold text-white">{m.nome}</span>
                                                        {m.sensivel && (
                                                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold uppercase">
                                                                Sensível
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">{m.descricao}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Botões do Rodapé */}
                            <div className="pt-4 border-t border-zinc-800 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalAberto(false)}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={salvando}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer"
                                >
                                    {salvando ? 'Salvando...' : modoEdicao ? 'Salvar Alterações' : 'Criar Usuário'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: Redefinir Senha */}
            {modalSenhaAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Key className="text-amber-400" size={20} />
                            <h2 className="text-lg font-bold text-white">Redefinir Senha do Usuário</h2>
                        </div>
                        <p className="text-xs text-zinc-400 mb-4">
                            Digite uma nova senha provisória de acesso. O colaborador poderá usar essa nova senha para entrar no sistema.
                        </p>

                        <form onSubmit={handleSalvarNovaSenha} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wide mb-1.5">
                                    Nova Senha (mínimo 6 dígitos)
                                </label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Nova senha"
                                    value={novaSenha}
                                    onChange={e => setNovaSenha(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-500 outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalSenhaAberto(false)}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={salvandoSenha}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all"
                                >
                                    {salvandoSenha ? 'Redefinindo...' : 'Atualizar Senha'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
