import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Settings,
    Trash2,
    Check,
    X,
    Info,
    AlertCircle,
    BookOpen,
    Coffee,
    Sun,
    Building2,
    MapPin,
    CheckSquare,
    Square,
    Plus,
    Loader2,
    CalendarRange,
    Clock
} from 'lucide-react';

interface IDiaCalendario {
    id: number;
    data_feriado: string; // YYYY-MM-DD
    descricao: string;
    tipo: 'feriado_nacional' | 'feriado_estadual' | 'feriado_municipal' | 'recesso' | 'facultativo' | 'evento';
}

interface IConfigAno {
    ano: number;
    data_inicio: string;
    data_fim: string;
    dias_semana_letivos: string;
}

interface IFeriadoSugestao {
    id: string;
    data: string; // YYYY-MM-DD
    nome: string;
    tipo: 'feriado_nacional' | 'feriado_estadual' | 'feriado_municipal' | 'facultativo';
    categoria: 'nacional' | 'estadual' | 'municipal';
    selecionadoPadrao: boolean;
}

const UFS_BRASIL = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const NOMES_MESES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DIAS_SEMANA_SIGLAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const DIAS_SEMANA_EXTENSO = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
];

interface CalendarioLetivoProps {
    modoVisualizacao?: boolean;
}

export default function CalendarioLetivo({ modoVisualizacao = false }: CalendarioLetivoProps) {
    const tipoUsuario = typeof window !== 'undefined' ? (localStorage.getItem('@sonatta:tipo_usuario') || localStorage.getItem('@sonatta:portal_tipo')) : null;
    const isSomenteLeitura = modoVisualizacao || tipoUsuario === 'professor' || tipoUsuario === 'aluno' || tipoUsuario === 'responsavel';

    const [ano, setAno] = useState<number>(new Date().getFullYear());
    const [uf, setUf] = useState<string>('ES');
    const [cidade, setCidade] = useState<string>('');
    const [dias, setDias] = useState<IDiaCalendario[]>([]);
    const [config, setConfig] = useState<IConfigAno | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [mensagemSucesso, setMensagemSucesso] = useState<string>('');
    const [erro, setErro] = useState<string>('');

    // Modais
    const [modalDiaAberto, setModalDiaAberto] = useState<boolean>(false);
    const [modalConfigAberto, setModalConfigAberto] = useState<boolean>(false);
    const [modalImportarAberto, setModalImportarAberto] = useState<boolean>(false);
    const [modalPeriodoAberto, setModalPeriodoAberto] = useState<boolean>(false);

    // Estados do Modal de Importação com Checkboxes
    const [sugestoes, setSugestoes] = useState<IFeriadoSugestao[]>([]);
    const [cidadesDisponiveis, setCidadesDisponiveis] = useState<string[]>([]);
    const [selecionadosIds, setSelecionadosIds] = useState<Set<string>>(new Set());
    const [carregandoSugestoes, setCarregandoSugestoes] = useState<boolean>(false);
    const [salvandoImportacao, setSalvandoImportacao] = useState<boolean>(false);
    const [ufImportar, setUfImportar] = useState<string>('ES');
    const [cidadeImportar, setCidadeImportar] = useState<string>('');

    // Adição rápida de feriado municipal personalizado
    const [mostrarFormNovoMunicipal, setMostrarFormNovoMunicipal] = useState<boolean>(false);
    const [novoFeriadoData, setNovoFeriadoData] = useState<string>('');
    const [novoFeriadoNome, setNovoFeriadoNome] = useState<string>('');

    // Form Dia Selecionado
    const [diaSelecionado, setDiaSelecionado] = useState<string>('');
    const [formTipo, setFormTipo] = useState<string>('recesso');
    const [formDescricao, setFormDescricao] = useState<string>('');
    const [diaExistenteId, setDiaExistenteId] = useState<number | null>(null);
    // Extensão para período dentro da modal de dia
    const [diaAplicarComoPeriodo, setDiaAplicarComoPeriodo] = useState<boolean>(false);
    const [diaDataFim, setDiaDataFim] = useState<string>('');

    // Form Modal Dedicada de Recesso/Período
    const [periodoDataInicio, setPeriodoDataInicio] = useState<string>('');
    const [periodoDataFim, setPeriodoDataFim] = useState<string>('');
    const [periodoTipo, setPeriodoTipo] = useState<string>('recesso');
    const [periodoDescricao, setPeriodoDescricao] = useState<string>('');
    const [salvandoPeriodo, setSalvandoPeriodo] = useState<boolean>(false);

    // Form Configuração do Ano Letivo
    const [formDataInicio, setFormDataInicio] = useState<string>('');
    const [formDataFim, setFormDataFim] = useState<string>('');

    useEffect(() => {
        carregarCalendario(ano);
    }, [ano]);

    const carregarCalendario = async (anoConsultar: number) => {
        setLoading(true);
        setErro('');
        try {
            const token = localStorage.getItem('@sonatta:token') || localStorage.getItem('@sonatta:portal_token');
            const response = await fetch(`${API_URL}/api/calendario-letivo/${anoConsultar}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Erro ao carregar dados do calendário');
            const data = await response.json();

            setDias(data.dias || []);
            setConfig(data.config || null);
            if (data.uf) {
                setUf(data.uf);
                setUfImportar(data.uf);
            }
            if (data.cidade) {
                setCidade(data.cidade);
                setCidadeImportar(data.cidade);
            }

            if (data.config) {
                setFormDataInicio(data.config.data_inicio ? data.config.data_inicio.substring(0, 10) : `${anoConsultar}-02-01`);
                setFormDataFim(data.config.data_fim ? data.config.data_fim.substring(0, 10) : `${anoConsultar}-12-20`);
            }
        } catch (err: any) {
            console.error(err);
            setErro('Falha ao sincronizar calendário com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    // Mapa rápido de dias por data (YYYY-MM-DD) para busca O(1)
    const mapaDias = React.useMemo(() => {
        const mapa = new Map<string, IDiaCalendario>();
        dias.forEach(d => mapa.set(d.data_feriado, d));
        return mapa;
    }, [dias]);

    // Cálculos de Resumo do Ano
    const metricas = React.useMemo(() => {
        let totalFeriados = 0;
        let totalRecessos = 0;
        let totalLetivos = 0;

        const dataInicioStr = config?.data_inicio ? config.data_inicio.substring(0, 10) : `${ano}-02-01`;
        const dataFimStr = config?.data_fim ? config.data_fim.substring(0, 10) : `${ano}-12-20`;

        const inicioAno = new Date(ano, 0, 1);
        const fimAno = new Date(ano, 11, 31);
        const cur = new Date(inicioAno);

        while (cur <= fimAno) {
            const mesStr = String(cur.getMonth() + 1).padStart(2, '0');
            const diaStr = String(cur.getDate()).padStart(2, '0');
            const dataIso = `${ano}-${mesStr}-${diaStr}`;
            const diaSemana = cur.getDay(); // 0 = Domingo ... 6 = Sábado

            const registro = mapaDias.get(dataIso);

            if (registro) {
                if (registro.tipo.includes('feriado')) totalFeriados++;
                else if (registro.tipo === 'recesso' || registro.tipo === 'facultativo') totalRecessos++;
            }

            // É letivo se: estiver dentro do período oficial, for de segunda a sábado e não for feriado/recesso
            const dentroPeriodo = dataIso >= dataInicioStr && dataIso <= dataFimStr;
            const diaValido = diaSemana >= 1 && diaSemana <= 6; // Seg a Sáb
            if (dentroPeriodo && diaValido && !registro) {
                totalLetivos++;
            }

            cur.setDate(cur.getDate() + 1);
        }

        return { totalFeriados, totalRecessos, totalLetivos };
    }, [ano, config, mapaDias]);

    // Clique em um dia do calendário
    const handleClickDia = (dataIso: string) => {
        setDiaSelecionado(dataIso);
        setDiaDataFim(dataIso);
        setDiaAplicarComoPeriodo(false);

        const reg = mapaDias.get(dataIso);
        if (reg) {
            setDiaExistenteId(reg.id);
            setFormTipo(reg.tipo);
            setFormDescricao(reg.descricao);
        } else {
            setDiaExistenteId(null);
            setFormTipo('recesso');
            setFormDescricao('');
        }
        setModalDiaAberto(true);
    };

    // Salva um período inteiro de datas (vários dias contínuos)
    const handleSalvarPeriodo = async (dataIni: string, dataFim: string, desc: string, tipo: string) => {
        if (!dataIni || !dataFim || !desc.trim()) {
            alert('Informe a data de início, término e a descrição do período.');
            return;
        }

        if (dataIni > dataFim) {
            alert('A data de início deve ser anterior ou igual à data de término.');
            return;
        }

        try {
            setSalvandoPeriodo(true);
            const token = localStorage.getItem('@sonatta:token');
            const res = await fetch(`${API_URL}/api/calendario-letivo/periodo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    data_inicio: dataIni,
                    data_fim: dataFim,
                    descricao: desc.trim(),
                    tipo: tipo
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.erro || 'Erro ao cadastrar período');
            }

            const data = await res.json();
            setModalPeriodoAberto(false);
            setModalDiaAberto(false);
            mostrarFeedback(data.mensagem || 'Período cadastrado com sucesso!');
            await carregarCalendario(ano);
        } catch (err: any) {
            alert(err.message || 'Erro ao salvar período');
        } finally {
            setSalvandoPeriodo(false);
        }
    };

    // Salva o dia individual ou período via modal de dia
    const handleSalvarDiaOuPeriodo = async (e: React.FormEvent) => {
        e.preventDefault();

        if (diaAplicarComoPeriodo) {
            await handleSalvarPeriodo(diaSelecionado, diaDataFim || diaSelecionado, formDescricao, formTipo);
            return;
        }

        if (!formDescricao.trim()) {
            alert('Informe uma descrição para este dia.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/calendario-letivo/dia`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
                },
                body: JSON.stringify({
                    data_feriado: diaSelecionado,
                    descricao: formDescricao.trim(),
                    tipo: formTipo
                })
            });

            if (!response.ok) throw new Error('Erro ao salvar dia');
            const novoDia = await response.json();

            setDias(prev => {
                const filtrados = prev.filter(d => d.data_feriado !== diaSelecionado);
                return [...filtrados, novoDia].sort((a, b) => a.data_feriado.localeCompare(b.data_feriado));
            });

            setModalDiaAberto(false);
            mostrarFeedback('Dia atualizado no calendário com sucesso!');
        } catch (err: any) {
            alert(err.message || 'Erro ao salvar');
        }
    };

    // Remove apenas o dia individual
    const handleRemoverDia = async () => {
        if (!diaSelecionado) return;
        try {
            const response = await fetch(`${API_URL}/api/calendario-letivo/dia/${diaSelecionado}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
                }
            });

            if (!response.ok) throw new Error('Erro ao remover registro');

            setDias(prev => prev.filter(d => d.data_feriado !== diaSelecionado));
            setModalDiaAberto(false);
            mostrarFeedback('Dia retornado para Letivo Normal.');
        } catch (err: any) {
            alert(err.message || 'Erro ao remover');
        }
    };

    // Remove todos os dias que compartilham a mesma descrição (ex: todo o recesso)
    const handleRemoverPeriodoPorDescricao = async (descricao: string) => {
        if (!confirm(`Deseja remover todos os dias cadastrados como "${descricao}"?`)) return;

        try {
            const token = localStorage.getItem('@sonatta:token');
            const res = await fetch(`${API_URL}/api/calendario-letivo/remover-periodo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ descricao })
            });

            if (!res.ok) throw new Error('Erro ao remover período');
            const data = await res.json();

            setModalDiaAberto(false);
            mostrarFeedback(data.mensagem || 'Recesso removido do calendário.');
            await carregarCalendario(ano);
        } catch (err: any) {
            alert(err.message || 'Erro ao remover período');
        }
    };

    // Salvar Configuração do Período Letivo Oficial
    const handleSalvarConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/calendario-letivo/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`
                },
                body: JSON.stringify({
                    ano,
                    data_inicio: formDataInicio,
                    data_fim: formDataFim
                })
            });

            if (!response.ok) throw new Error('Erro ao atualizar período letivo');
            const data = await response.json();

            setConfig(data.config);
            setModalConfigAberto(false);
            mostrarFeedback('Período do ano letivo atualizado com sucesso!');
        } catch (err: any) {
            alert(err.message || 'Erro ao atualizar período');
        }
    };

    // ==========================================
    // FLUXO DE IMPORTAÇÃO COM CAIXAS DE SELEÇÃO
    // ==========================================

    const carregarSugestoes = async (anoConsultar: number, ufConsultar: string, cidadeConsultar: string) => {
        setCarregandoSugestoes(true);
        try {
            const token = localStorage.getItem('@sonatta:token');
            const url = `${API_URL}/api/calendario-letivo/sugestoes?ano=${anoConsultar}&uf=${encodeURIComponent(ufConsultar)}&cidade=${encodeURIComponent(cidadeConsultar)}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Erro ao consultar sugestões de feriados.');
            const data = await res.json();

            const listaSugestoes: IFeriadoSugestao[] = data.sugestoes || [];
            setSugestoes(listaSugestoes);
            setCidadesDisponiveis(data.cidadesDisponiveis || []);

            // Marca por padrão os feriados sugeridos
            const novosIds = new Set<string>();
            listaSugestoes.forEach(item => {
                if (item.selecionadoPadrao) {
                    novosIds.add(item.id);
                }
            });
            setSelecionadosIds(novosIds);
        } catch (err: any) {
            console.error('Erro ao carregar sugestões:', err);
        } finally {
            setCarregandoSugestoes(false);
        }
    };

    const handleAbrirModalImportar = () => {
        setUfImportar(uf || 'ES');
        setCidadeImportar(cidade || '');
        setMostrarFormNovoMunicipal(false);
        setModalImportarAberto(true);
        carregarSugestoes(ano, uf || 'ES', cidade || '');
    };

    const handleTrocarUfImportar = (novaUf: string) => {
        setUfImportar(novaUf);
        carregarSugestoes(ano, novaUf, cidadeImportar);
    };

    const handleTrocarCidadeImportar = (novaCidade: string) => {
        setCidadeImportar(novaCidade);
        carregarSugestoes(ano, ufImportar, novaCidade);
    };

    const toggleSelecaoFeriado = (id: string) => {
        setSelecionadosIds(prev => {
            const novo = new Set(prev);
            if (novo.has(id)) {
                novo.delete(id);
            } else {
                novo.add(id);
            }
            return novo;
        });
    };

    const toggleSelecaoCategoria = (cat: 'nacional' | 'estadual' | 'municipal') => {
        const itensCat = sugestoes.filter(s => s.categoria === cat);
        const todosMarcados = itensCat.every(s => selecionadosIds.has(s.id));

        setSelecionadosIds(prev => {
            const novo = new Set(prev);
            if (todosMarcados) {
                itensCat.forEach(s => novo.delete(s.id));
            } else {
                itensCat.forEach(s => novo.add(s.id));
            }
            return novo;
        });
    };

    const selecionarTodos = () => {
        setSelecionadosIds(new Set(sugestoes.map(s => s.id)));
    };

    const desmarcarTodos = () => {
        setSelecionadosIds(new Set());
    };

    // Adiciona feriado municipal avulso na lista de importação
    const handleAdicionarFeriadoMunicipalManual = () => {
        if (!novoFeriadoData || !novoFeriadoNome.trim()) {
            alert('Informe a data e o nome do feriado municipal.');
            return;
        }

        const idNovo = `custom-${Date.now()}`;
        const novoItem: IFeriadoSugestao = {
            id: idNovo,
            data: novoFeriadoData,
            nome: `${novoFeriadoNome.trim()} (Feriado Municipal - ${cidadeImportar || 'Local'})`,
            tipo: 'feriado_municipal',
            categoria: 'municipal',
            selecionadoPadrao: true
        };

        setSugestoes(prev => [...prev, novoItem].sort((a, b) => a.data.localeCompare(b.data)));
        setSelecionadosIds(prev => new Set(prev).add(idNovo));
        setNovoFeriadoData('');
        setNovoFeriadoNome('');
        setMostrarFormNovoMunicipal(false);
    };

    // Salva os feriados selecionados via checkboxes
    const handleImportarSelecionados = async () => {
        const selecionados = sugestoes.filter(s => selecionadosIds.has(s.id));
        if (selecionados.length === 0) {
            alert('Selecione pelo menos um feriado na caixa de seleção para importar.');
            return;
        }

        try {
            setSalvandoImportacao(true);
            const token = localStorage.getItem('@sonatta:token');
            const res = await fetch(`${API_URL}/api/calendario-letivo/importar-selecionados`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ano,
                    feriados: selecionados.map(s => ({
                        data: s.data,
                        nome: s.nome,
                        tipo: s.tipo
                    }))
                })
            });

            if (!res.ok) throw new Error('Falha ao importar feriados selecionados.');
            const data = await res.json();

            setModalImportarAberto(false);
            mostrarFeedback(data.mensagem || `${selecionados.length} feriados importados com sucesso!`);
            await carregarCalendario(ano);
        } catch (err: any) {
            alert(err.message || 'Erro ao importar feriados');
        } finally {
            setSalvandoImportacao(false);
        }
    };

    const mostrarFeedback = (msg: string) => {
        setMensagemSucesso(msg);
        setTimeout(() => setMensagemSucesso(''), 4000);
    };

    // Calcula quantidade de dias entre duas datas ISO inclusivas
    const calcularDiasPeriodo = (inicio: string, fim: string) => {
        if (!inicio || !fim || inicio > fim) return 0;
        const d1 = new Date(inicio + 'T00:00:00');
        const d2 = new Date(fim + 'T00:00:00');
        const diff = d2.getTime() - d1.getTime();
        return Math.round(diff / (1000 * 3600 * 24)) + 1;
    };

    // Formata data ISO para exibição amigável: DD/MM (Dia da Semana)
    const formatarDataAmigavel = (dataIso: string) => {
        const partes = dataIso.split('-');
        if (partes.length !== 3) return dataIso;
        const dia = partes[2];
        const mes = partes[1];
        const dataObj = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
        const diaSemanaNome = DIAS_SEMANA_EXTENSO[dataObj.getDay()] || '';
        return `${dia}/${mes} (${diaSemanaNome})`;
    };

    // Renderiza um mês específico na grade anual
    const renderizarMes = (mesIndex: number) => {
        const primeiroDia = new Date(ano, mesIndex, 1);
        const totalDias = new Date(ano, mesIndex + 1, 0).getDate();
        const diaSemanaInicio = primeiroDia.getDay(); // 0 = Domingo

        const celulas = [];

        // Células vazias antes do dia 1
        for (let i = 0; i < diaSemanaInicio; i++) {
            celulas.push(<div key={`vazio-${i}`} className="h-7 w-7" />);
        }

        const dataInicioStr = config?.data_inicio ? config.data_inicio.substring(0, 10) : `${ano}-02-01`;
        const dataFimStr = config?.data_fim ? config.data_fim.substring(0, 10) : `${ano}-12-20`;

        // Dias do mês
        for (let dia = 1; dia <= totalDias; dia++) {
            const mesStr = String(mesIndex + 1).padStart(2, '0');
            const diaStr = String(dia).padStart(2, '0');
            const dataIso = `${ano}-${mesStr}-${diaStr}`;
            const dataObj = new Date(ano, mesIndex, dia);
            const diaSemana = dataObj.getDay();

            const registro = mapaDias.get(dataIso);
            const foraPeriodoLetivo = dataIso < dataInicioStr || dataIso > dataFimStr;
            const isDomingo = diaSemana === 0;

            let estilo = '';
            let title = '';

            if (registro) {
                if (registro.tipo === 'feriado_municipal') {
                    estilo = 'bg-blue-500/25 text-blue-300 border border-blue-500/50 font-bold hover:bg-blue-500/35 hover:text-white';
                    title = `${registro.descricao} (Feriado Municipal)`;
                } else if (registro.tipo === 'feriado_nacional' || registro.tipo === 'feriado_estadual') {
                    estilo = 'bg-red-500/25 text-red-300 border border-red-500/50 font-bold hover:bg-red-500/35 hover:text-white';
                    title = `${registro.descricao} (${registro.tipo === 'feriado_nacional' ? 'Feriado Nacional' : 'Feriado Estadual'})`;
                } else if (registro.tipo === 'recesso' || registro.tipo === 'facultativo') {
                    estilo = 'bg-amber-500/25 text-amber-300 border border-amber-500/50 font-bold hover:bg-amber-500/35 hover:text-white';
                    title = `${registro.descricao} (Recesso Escolar)`;
                } else if (registro.tipo === 'evento') {
                    estilo = 'bg-purple-500/25 text-purple-300 border border-purple-500/50 font-bold hover:bg-purple-500/35 hover:text-white';
                    title = `${registro.descricao} (Evento Escolar)`;
                }
            } else if (isDomingo || foraPeriodoLetivo) {
                // Domingo ou dia fora do período letivo oficial: mesma cor neutra de descanso
                estilo = 'bg-zinc-900/60 text-zinc-500 border border-zinc-800/40 hover:bg-zinc-800/50';
                title = isDomingo ? 'Domingo (Sem aulas)' : 'Fora do Período Letivo (Sem aulas)';
            } else {
                // Dia Letivo Normal dentro do período oficial: Verde vibrante e destacado!
                estilo = 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/60 font-bold shadow-sm hover:bg-emerald-500/45 hover:text-white';
                title = `Dia ${dia} - Dia Letivo Regular`;
            }

            celulas.push(
                <button
                    key={dataIso}
                    onClick={() => handleClickDia(dataIso)}
                    title={title}
                    className={`h-7 w-7 text-xs rounded-md flex items-center justify-center transition-all cursor-pointer ${estilo}`}
                >
                    {dia}
                </button>
            );
        }

        return (
            <div key={mesIndex} className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3.5 shadow-sm hover:border-zinc-700 transition-colors">
                <h3 className="text-sm font-semibold text-zinc-200 mb-2.5 flex items-center justify-between">
                    <span>{NOMES_MESES[mesIndex]}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{String(mesIndex + 1).padStart(2, '0')}/{ano}</span>
                </h3>

                {/* Cabeçalho dias da semana */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                    {DIAS_SEMANA_SIGLAS.map((sigla, i) => (
                        <span key={i} className={`text-[10px] font-semibold ${i === 0 ? 'text-red-400' : 'text-zinc-500'}`}>
                            {sigla}
                        </span>
                    ))}
                </div>

                {/* Grade dos dias */}
                <div className="grid grid-cols-7 gap-1">
                    {celulas}
                </div>
            </div>
        );
    };

    // Filtros de sugestões por categoria
    const sugestoesNacionais = sugestoes.filter(s => s.categoria === 'nacional');
    const sugestoesEstaduais = sugestoes.filter(s => s.categoria === 'estadual');
    const sugestoesMunicipais = sugestoes.filter(s => s.categoria === 'municipal');

    const totalSelecionados = sugestoes.filter(s => selecionadosIds.has(s.id)).length;

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <CalendarIcon className="text-emerald-500" size={30} />
                        Calendário do Ano Letivo
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">
                        Defina o período oficial de aulas, recessos escolares contínuos e feriados nacionais, estaduais e municipais.
                    </p>
                </div>

                {/* Controles de Ano e Ações */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Seletor de Ano */}
                    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                        <button
                            onClick={() => setAno(prev => prev - 1)}
                            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition"
                            title="Ano anterior"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="px-3 text-base font-bold text-white">{ano}</span>
                        <button
                            onClick={() => setAno(prev => prev + 1)}
                            className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition"
                            title="Próximo ano"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {!isSomenteLeitura && (
                        <>
                            {/* Botão Configurar Recesso / Período */}
                            <button
                                onClick={() => {
                                    setPeriodoDataInicio(`${ano}-07-15`);
                                    setPeriodoDataFim(`${ano}-07-31`);
                                    setPeriodoDescricao('Recesso Escolar de Julho');
                                    setPeriodoTipo('recesso');
                                    setModalPeriodoAberto(true);
                                }}
                                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                            >
                                <Coffee size={16} className="text-amber-400" />
                                + Recesso / Período
                            </button>

                            {/* Botão Importar Feriados com Seleção */}
                            <button
                                onClick={handleAbrirModalImportar}
                                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3.5 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                            >
                                <Sparkles size={16} className="text-amber-400" />
                                Importar Feriados ({uf}{cidade ? ` • ${cidade}` : ''})
                            </button>

                            {/* Botão Configurar Ano Letivo */}
                            <button
                                onClick={() => setModalConfigAberto(true)}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                            >
                                <Settings size={16} />
                                Configurar Período Letivo
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Alerta de Feedback */}
            {mensagemSucesso && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-xl text-sm animate-fade-in">
                    <Check size={18} className="text-emerald-400 shrink-0" />
                    <span>{mensagemSucesso}</span>
                </div>
            )}

            {erro && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-xl text-sm">
                    <AlertCircle size={18} className="text-red-400 shrink-0" />
                    <span>{erro}</span>
                </div>
            )}

            {/* Cards de Métricas e Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                        <BookOpen size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Dias Letivos</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{metricas.totalLetivos}</p>
                    <span className="text-[11px] text-zinc-500">Dias com aulas programadas</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-red-400 mb-1">
                        <Sun size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Feriados</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{metricas.totalFeriados}</p>
                    <span className="text-[11px] text-zinc-500">Nacionais, Estaduais e Municipais</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                        <Coffee size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Recessos</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{metricas.totalRecessos}</p>
                    <span className="text-[11px] text-zinc-500">Férias / Emendas escolares</span>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                        <Info size={16} />
                        <span className="text-xs font-semibold uppercase tracking-wider">Período Oficial</span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-200 mt-1">
                        {config?.data_inicio ? config.data_inicio.substring(8, 10) + '/' + config.data_inicio.substring(5, 7) : '01/02'} até {config?.data_fim ? config.data_fim.substring(8, 10) + '/' + config.data_fim.substring(5, 7) : '20/12'}
                    </p>
                    <span className="text-[11px] text-zinc-500">Início e encerramento letivo</span>
                </div>
            </div>

            {/* Legenda Explicativa */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/80">
                <span className="font-semibold text-zinc-300">Legenda do Calendário:</span>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-emerald-500/20 border border-emerald-500/50" />
                    <span className="text-emerald-300 font-medium">Dia Letivo</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-red-500/20 border border-red-500/50" />
                    <span>Feriado Nacional / Estadual</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-blue-500/20 border border-blue-500/50" />
                    <span>Feriado Municipal</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-amber-500/20 border border-amber-500/50" />
                    <span>Recesso Escolar</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-purple-500/20 border border-purple-500/50" />
                    <span>Evento / Apresentação</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-sm bg-zinc-900 border border-zinc-800 opacity-60" />
                    <span>Fora do Período / Domingos</span>
                </div>
            </div>

            {/* Grade dos 12 Meses */}
            {loading ? (
                <div className="text-center py-16 text-zinc-500 flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-emerald-500" size={28} />
                    Carregando calendário do ano letivo...
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 12 }, (_, i) => renderizarMes(i))}
                </div>
            )}

            {/* MODAL 1: Informações ou Edição de Dia Selecionado (com suporte a período) */}
            {modalDiaAberto && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-up">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <CalendarIcon size={18} className="text-emerald-500" />
                                {diaSelecionado.split('-').reverse().join('/')}
                            </h3>
                            <button onClick={() => setModalDiaAberto(false)} className="text-zinc-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {isSomenteLeitura ? (
                            <div className="space-y-4">
                                {diaExistenteId ? (
                                    <div className="p-4 rounded-xl bg-zinc-800/80 border border-zinc-700/80 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                                formTipo === 'feriado_municipal' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                                                formTipo.includes('feriado') ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                                                formTipo === 'evento' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                                                'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                            }`}>
                                                {formTipo === 'feriado_municipal' ? '🔵 Feriado Municipal' :
                                                 formTipo === 'feriado_nacional' ? '🔴 Feriado Nacional' :
                                                 formTipo === 'feriado_estadual' ? '🔴 Feriado Estadual' :
                                                 formTipo === 'evento' ? '🟣 Evento Escolar' :
                                                 '🟡 Recesso Escolar'}
                                            </span>
                                        </div>
                                        <p className="text-base font-medium text-white">{formDescricao}</p>
                                    </div>
                                ) : (diaSelecionado < (config?.data_inicio ? config.data_inicio.substring(0, 10) : `${ano}-02-01`) || diaSelecionado > (config?.data_fim ? config.data_fim.substring(0, 10) : `${ano}-12-20`)) ? (
                                    <div className="p-4 rounded-xl bg-zinc-800/50 text-center text-zinc-400 text-sm">
                                        Dia fora do período letivo oficial (sem aulas).
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-300 text-sm">
                                        Dia letivo regular programado no calendário escolar.
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setModalDiaAberto(false)}
                                    className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition"
                                >
                                    Fechar
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSalvarDiaOuPeriodo} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">Tipo do Dia / Período</label>
                                    <select
                                        value={formTipo}
                                        onChange={e => setFormTipo(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="recesso">🟡 Recesso Escolar / Emenda</option>
                                        <option value="feriado_municipal">🔵 Feriado Municipal</option>
                                        <option value="feriado_nacional">🔴 Feriado Nacional</option>
                                        <option value="feriado_estadual">🔴 Feriado Estadual</option>
                                        <option value="evento">🟣 Evento / Apresentação Escolar</option>
                                        <option value="facultativo">⚪ Ponto Facultativo</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">Descrição / Motivo</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ex: Recesso de Julho, Emenda de Feriado..."
                                        value={formDescricao}
                                        onChange={e => setFormDescricao(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>

                                {/* Opção de Estender para Período (Vários Dias) */}
                                <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/60 space-y-2.5">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={diaAplicarComoPeriodo}
                                            onChange={e => {
                                                setDiaAplicarComoPeriodo(e.target.checked);
                                                if (e.target.checked && (!diaDataFim || diaDataFim < diaSelecionado)) {
                                                    setDiaDataFim(diaSelecionado);
                                                }
                                            }}
                                            className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500 bg-zinc-900 h-4 w-4"
                                        />
                                        <span className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
                                            <CalendarRange size={14} />
                                            Aplicar a vários dias consecutivos (Período)
                                        </span>
                                    </label>

                                    {diaAplicarComoPeriodo && (
                                        <div className="space-y-2 pt-1 border-t border-zinc-700/40 animate-fade-in">
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div>
                                                    <span className="text-zinc-400 block mb-1">Data Início:</span>
                                                    <input
                                                        type="date"
                                                        value={diaSelecionado}
                                                        onChange={e => setDiaSelecionado(e.target.value)}
                                                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded p-2 text-xs outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <span className="text-zinc-400 block mb-1">Data Término:</span>
                                                    <input
                                                        type="date"
                                                        value={diaDataFim}
                                                        min={diaSelecionado}
                                                        onChange={e => setDiaDataFim(e.target.value)}
                                                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded p-2 text-xs outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-[11px] text-amber-400 font-medium">
                                                ⏱️ Duração: {calcularDiasPeriodo(diaSelecionado, diaDataFim)} dia(s) serão configurados.
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 pt-3 border-t border-zinc-800">
                                    <div className="flex items-center justify-between gap-3">
                                        {diaExistenteId ? (
                                            <button
                                                type="button"
                                                onClick={handleRemoverDia}
                                                className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-medium py-2 px-2.5 rounded-lg hover:bg-red-500/10 transition"
                                                title="Remove apenas este dia específico"
                                            >
                                                <Trash2 size={15} />
                                                Tornar Letivo
                                            </button>
                                        ) : <div />}

                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setModalDiaAberto(false)}
                                                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={salvandoPeriodo}
                                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition flex items-center gap-1.5"
                                            >
                                                {salvandoPeriodo ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                {diaAplicarComoPeriodo ? 'Salvar Período' : 'Salvar Dia'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Botão de conveniência para remover todo o período de mesmo nome */}
                                    {diaExistenteId && formTipo === 'recesso' && formDescricao && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoverPeriodoPorDescricao(formDescricao)}
                                            className="w-full text-center text-[11px] text-zinc-500 hover:text-red-400 transition py-1"
                                        >
                                            Remover todos os dias cadastrados como "{formDescricao}"
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL 2: Configurar Período Oficial do Ano Letivo */}
            {modalConfigAberto && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-up">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Settings size={18} className="text-emerald-500" />
                                Período Oficial das Aulas ({ano})
                            </h3>
                            <button onClick={() => setModalConfigAberto(false)} className="text-zinc-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSalvarConfig} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">Início do Ano Letivo</label>
                                <input
                                    type="date"
                                    required
                                    value={formDataInicio}
                                    onChange={e => setFormDataInicio(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">Término do Ano Letivo</label>
                                <input
                                    type="date"
                                    required
                                    value={formDataFim}
                                    onChange={e => setFormDataFim(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <div className="p-3 bg-zinc-800/60 rounded-lg text-xs text-zinc-400">
                                💡 Dias fora deste intervalo serão automaticamente considerados sem aula, ajudando o cálculo do total de dias letivos da escola.
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setModalConfigAberto(false)}
                                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition"
                                >
                                    Salvar Período
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: IMPORTAR FERIADOS COM CAIXAS DE SELEÇÃO E SUPORTE A FERIADOS MUNICIPAIS */}
            {modalImportarAberto && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-up">
                        {/* Cabeçalho Fixo */}
                        <div className="p-5 border-b border-zinc-800 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Sparkles size={18} className="text-amber-400" />
                                    Importar Feriados para o Calendário ({ano})
                                </h3>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    Marque ou desmarque nas caixas de seleção os feriados que deseja aplicar à sua escola.
                                </p>
                            </div>
                            <button
                                onClick={() => setModalImportarAberto(false)}
                                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Corpo com Scroll */}
                        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                            {/* Bloco de Localização da Escola (Estado e Cidade) */}
                            <div className="p-4 bg-zinc-800/50 border border-zinc-700/60 rounded-xl space-y-3">
                                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                    <MapPin size={14} />
                                    Localização da Escola
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Estado / UF */}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1">Estado / UF</label>
                                        <select
                                            value={ufImportar}
                                            onChange={e => handleTrocarUfImportar(e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                        >
                                            {UFS_BRASIL.map(sigla => (
                                                <option key={sigla} value={sigla}>{sigla}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Cidade */}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1 flex items-center justify-between">
                                            <span>Cidade da Escola</span>
                                            {cidadesDisponiveis.length > 0 && (
                                                <span className="text-[10px] text-zinc-400 font-normal">
                                                    {cidadesDisponiveis.length} cidades com feriados catalogados
                                                </span>
                                            )}
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                list="cidades-sugestoes"
                                                value={cidadeImportar}
                                                onChange={e => handleTrocarCidadeImportar(e.target.value)}
                                                placeholder="Digite ou selecione a cidade..."
                                                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                            <datalist id="cidades-sugestoes">
                                                {cidadesDisponiveis.map(c => (
                                                    <option key={c} value={c} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[11px] text-zinc-400">
                                    💡 Os feriados municipais abaixo serão ajustados de acordo com a cidade escolhida.
                                </p>
                            </div>

                            {/* Controles Globais de Seleção */}
                            <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-3">
                                <span className="text-zinc-400 font-medium">
                                    <strong className="text-white">{totalSelecionados}</strong> de {sugestoes.length} feriados marcados
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selecionarTodos}
                                        className="text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded hover:bg-emerald-500/10 transition"
                                    >
                                        Marcar Todos
                                    </button>
                                    <span className="text-zinc-600">|</span>
                                    <button
                                        type="button"
                                        onClick={desmarcarTodos}
                                        className="text-zinc-400 hover:text-zinc-300 font-medium px-2 py-1 rounded hover:bg-zinc-800 transition"
                                    >
                                        Desmarcar Todos
                                    </button>
                                </div>
                            </div>

                            {carregandoSugestoes ? (
                                <div className="text-center py-12 text-zinc-500 flex flex-col items-center gap-2">
                                    <Loader2 className="animate-spin text-emerald-500" size={24} />
                                    Carregando feriados para {ufImportar} {cidadeImportar ? `• ${cidadeImportar}` : ''}...
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* 1. SEÇÃO FERIADOS MUNICIPAIS */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                                                <Building2 size={15} />
                                                Feriados Municipais {cidadeImportar ? `(${cidadeImportar})` : ''} ({sugestoesMunicipais.length})
                                            </h4>
                                            {sugestoesMunicipais.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSelecaoCategoria('municipal')}
                                                    className="text-[11px] text-blue-400/80 hover:text-blue-300 transition"
                                                >
                                                    Alternar Categoria
                                                </button>
                                            )}
                                        </div>

                                        {sugestoesMunicipais.length > 0 ? (
                                            <div className="space-y-1.5">
                                                {sugestoesMunicipais.map(item => {
                                                    const marcado = selecionadosIds.has(item.id);
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => toggleSelecaoFeriado(item.id)}
                                                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                                                                marcado
                                                                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-100'
                                                                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                {marcado ? (
                                                                    <CheckSquare size={16} className="text-blue-400 shrink-0" />
                                                                ) : (
                                                                    <Square size={16} className="text-zinc-600 shrink-0" />
                                                                )}
                                                                <div>
                                                                    <span className="font-semibold text-white mr-2">
                                                                        {formatarDataAmigavel(item.data)}:
                                                                    </span>
                                                                    <span className={marcado ? 'text-zinc-200' : 'text-zinc-500'}>
                                                                        {item.nome}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 shrink-0 font-medium">
                                                                Municipal
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-zinc-800/40 border border-zinc-800 rounded-lg text-xs text-zinc-400">
                                                Nenhum feriado municipal padrão catalogado para "{cidadeImportar || 'a cidade informada'}".
                                                Se houver um feriado municipal (ex: padroeiro ou aniversário da cidade), você pode adicioná-lo abaixo.
                                            </div>
                                        )}

                                        {/* Botão e Form para adicionar Feriado Municipal Manual */}
                                        {!mostrarFormNovoMunicipal ? (
                                            <button
                                                type="button"
                                                onClick={() => setMostrarFormNovoMunicipal(true)}
                                                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium py-1 px-2 rounded hover:bg-blue-500/10 transition"
                                            >
                                                <Plus size={14} />
                                                Adicionar outro feriado municipal personalizado
                                            </button>
                                        ) : (
                                            <div className="p-3 bg-zinc-800/80 border border-zinc-700 rounded-xl space-y-2.5 animate-fade-in">
                                                <div className="text-xs font-semibold text-zinc-200">
                                                    Novo Feriado Municipal:
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    <input
                                                        type="date"
                                                        value={novoFeriadoData}
                                                        onChange={e => setNovoFeriadoData(e.target.value)}
                                                        className="bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2 text-xs outline-none focus:border-blue-500"
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Nome (Ex: Padroeiro da Cidade)"
                                                        value={novoFeriadoNome}
                                                        onChange={e => setNovoFeriadoNome(e.target.value)}
                                                        className="bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2 text-xs outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setMostrarFormNovoMunicipal(false)}
                                                        className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleAdicionarFeriadoMunicipalManual}
                                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
                                                    >
                                                        Incluir na Lista
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. SEÇÃO FERIADOS ESTADUAIS */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                                                <Sun size={15} />
                                                Feriados Estaduais ({ufImportar}) ({sugestoesEstaduais.length})
                                            </h4>
                                            {sugestoesEstaduais.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSelecaoCategoria('estadual')}
                                                    className="text-[11px] text-red-400/80 hover:text-red-300 transition"
                                                >
                                                    Alternar Categoria
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            {sugestoesEstaduais.length > 0 ? (
                                                sugestoesEstaduais.map(item => {
                                                    const marcado = selecionadosIds.has(item.id);
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => toggleSelecaoFeriado(item.id)}
                                                            className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                                                                marcado
                                                                    ? 'bg-red-500/10 border-red-500/40 text-red-100'
                                                                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                {marcado ? (
                                                                    <CheckSquare size={16} className="text-red-400 shrink-0" />
                                                                ) : (
                                                                    <Square size={16} className="text-zinc-600 shrink-0" />
                                                                )}
                                                                <div>
                                                                    <span className="font-semibold text-white mr-2">
                                                                        {formatarDataAmigavel(item.data)}:
                                                                    </span>
                                                                    <span className={marcado ? 'text-zinc-200' : 'text-zinc-500'}>
                                                                        {item.nome}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 shrink-0 font-medium">
                                                                Estadual ({ufImportar})
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-3 bg-zinc-800/40 border border-zinc-800 rounded-lg text-xs text-zinc-500">
                                                    Nenhum feriado estadual específico catalogado para {ufImportar}.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. SEÇÃO FERIADOS NACIONAIS */}
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                                <CalendarIcon size={15} />
                                                Feriados Nacionais e Móveis ({sugestoesNacionais.length})
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={() => toggleSelecaoCategoria('nacional')}
                                                className="text-[11px] text-emerald-400/80 hover:text-emerald-300 transition"
                                            >
                                                Alternar Categoria
                                            </button>
                                        </div>

                                        <div className="space-y-1.5">
                                            {sugestoesNacionais.map(item => {
                                                const marcado = selecionadosIds.has(item.id);
                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => toggleSelecaoFeriado(item.id)}
                                                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition select-none ${
                                                            marcado
                                                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-100'
                                                                : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2.5">
                                                            {marcado ? (
                                                                <CheckSquare size={16} className="text-emerald-400 shrink-0" />
                                                            ) : (
                                                                <Square size={16} className="text-zinc-600 shrink-0" />
                                                            )}
                                                            <div>
                                                                <span className="font-semibold text-white mr-2">
                                                                    {formatarDataAmigavel(item.data)}:
                                                                </span>
                                                                <span className={marcado ? 'text-zinc-200' : 'text-zinc-500'}>
                                                                    {item.nome}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded shrink-0 font-medium ${
                                                            item.tipo === 'facultativo'
                                                                ? 'bg-zinc-800 text-zinc-400'
                                                                : 'bg-emerald-500/20 text-emerald-300'
                                                        }`}>
                                                            {item.tipo === 'facultativo' ? 'Facultativo' : 'Nacional'}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Rodapé Fixo */}
                        <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                            <div className="text-xs text-zinc-400">
                                Total a importar: <strong className="text-emerald-400 font-bold">{totalSelecionados}</strong> feriados marcados
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={() => setModalImportarAberto(false)}
                                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    disabled={salvandoImportacao || totalSelecionados === 0}
                                    onClick={handleImportarSelecionados}
                                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition flex items-center gap-2 shadow-sm"
                                >
                                    {salvandoImportacao ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Importando...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            Importar {totalSelecionados} Selecionados
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 4: DEDICADA PARA CADASTRAR PERÍODO DE RECESSO / FÉRIAS (VÁRIOS DIAS) */}
            {modalPeriodoAberto && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-scale-up">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Coffee size={20} className="text-amber-400" />
                                    Cadastrar Período de Recesso / Férias ({ano})
                                </h3>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    Aplique o recesso escolar em vários dias contínuos de uma só vez.
                                </p>
                            </div>
                            <button
                                onClick={() => setModalPeriodoAberto(false)}
                                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Atalhos Rápidos */}
                        <div className="mb-4">
                            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                                Sugestões Rápidas:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPeriodoDescricao('Recesso Escolar de Julho');
                                        setPeriodoDataInicio(`${ano}-07-15`);
                                        setPeriodoDataFim(`${ano}-07-31`);
                                    }}
                                    className="text-xs bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-300 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700 transition"
                                >
                                    ☀️ Recesso de Julho (15 a 31)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPeriodoDescricao('Recesso de Fim de Ano');
                                        setPeriodoDataInicio(`${ano}-12-21`);
                                        setPeriodoDataFim(`${ano}-12-31`);
                                    }}
                                    className="text-xs bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-300 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700 transition"
                                >
                                    🎄 Fim de Ano (21 a 31/12)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPeriodoDescricao('Semana da Criança / Recesso de Outubro');
                                        setPeriodoDataInicio(`${ano}-10-12`);
                                        setPeriodoDataFim(`${ano}-10-16`);
                                    }}
                                    className="text-xs bg-zinc-800 hover:bg-amber-500/20 hover:text-amber-300 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-700 transition"
                                >
                                    🎈 Semana de Outubro (12 a 16)
                                </button>
                            </div>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSalvarPeriodo(periodoDataInicio, periodoDataFim, periodoDescricao, periodoTipo);
                            }}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">Tipo do Período</label>
                                <select
                                    value={periodoTipo}
                                    onChange={e => setPeriodoTipo(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                >
                                    <option value="recesso">🟡 Recesso Escolar / Férias</option>
                                    <option value="evento">🟣 Evento / Semana de Apresentações</option>
                                    <option value="facultativo">⚪ Ponto Facultativo Contínuo</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">Descrição do Período</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Recesso Escolar de Julho, Férias de Meio de Ano..."
                                    value={periodoDescricao}
                                    onChange={e => setPeriodoDescricao(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">Data de Início</label>
                                    <input
                                        type="date"
                                        required
                                        value={periodoDataInicio}
                                        onChange={e => setPeriodoDataInicio(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">Data de Término</label>
                                    <input
                                        type="date"
                                        required
                                        min={periodoDataInicio}
                                        value={periodoDataFim}
                                        onChange={e => setPeriodoDataFim(e.target.value)}
                                        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Duração em Tempo Real */}
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
                                <Clock size={16} className="text-amber-400 shrink-0" />
                                <span>
                                    <strong>{calcularDiasPeriodo(periodoDataInicio, periodoDataFim)} dia(s)</strong> serão marcados como {periodoTipo === 'recesso' ? 'Recesso' : periodoTipo} no calendário.
                                </span>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                                <button
                                    type="button"
                                    onClick={() => setModalPeriodoAberto(false)}
                                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={salvandoPeriodo}
                                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition flex items-center gap-2 shadow-sm"
                                >
                                    {salvandoPeriodo ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            Aplicar Período de Recesso
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
