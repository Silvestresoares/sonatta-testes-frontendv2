import React, { useState } from 'react';
import { BookOpen, Search, Printer, Shield, GraduationCap, UserCheck, Users, Calendar, DollarSign, MessageCircle, FileText, CheckCircle2, ChevronRight, Settings } from 'lucide-react';

interface ManualUsuarioProps {
  abaInicial?: 'admin' | 'professor' | 'aluno';
}

/**
 * Página Central de Manuais do Usuário
 * Explicação do bloco: Interface interativa integrada ao painel administrativo e docente,
 * permitindo consultar os manuais operacionais do Sonatta com busca em tempo real,
 * navegação rápida por abas e recurso de impressão/PDF.
 */
export default function ManualUsuario({ abaInicial = 'admin' }: ManualUsuarioProps) {
  const tipoUsuarioLocal = typeof window !== 'undefined' ? localStorage.getItem('@sonatta:tipo_usuario') : 'admin';
  const ehProfessor = tipoUsuarioLocal === 'professor';

  const [abaAtiva, setAbaAtiva] = useState<'admin' | 'professor' | 'aluno'>(
    ehProfessor ? 'professor' : abaInicial
  );
  const [busca, setBusca] = useState('');

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto text-zinc-100 animate-fadeIn">
      
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <BookOpen size={24} />
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Central de Manuais & Ajuda</h1>
          </div>
          <p className="text-zinc-400 text-sm">
            Guias operacionais e passo a passo de todas as funcionalidades do Sonatta.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Campo de Busca Rápida */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Buscar no manual..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <button
            onClick={handleImprimir}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-colors border border-zinc-700/60 shadow-sm print:hidden"
            title="Imprimir ou Salvar em PDF"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Seletor de Abas por Perfil */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3 overflow-x-auto print:hidden">
        {!ehProfessor && (
          <button
            onClick={() => setAbaAtiva('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              abaAtiva === 'admin'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Shield size={16} /> Manual do Administrador
          </button>
        )}

        <button
          onClick={() => setAbaAtiva('professor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            abaAtiva === 'professor'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <GraduationCap size={16} /> Manual do Professor
        </button>

        <button
          onClick={() => setAbaAtiva('aluno')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            abaAtiva === 'aluno'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <UserCheck size={16} /> Manual do Aluno / Responsável
        </button>
      </div>

      {/* Conteúdo: Manual do Administrador */}
      {abaAtiva === 'admin' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/20 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Guia de Gestão Escolar & Secretaria</h2>
              <p className="text-sm text-zinc-400">
                Instruções operacionais para gerenciamento pedagógico, financeiro, automações via WhatsApp e conformidade LGPD.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Alunos e Responsáveis */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold">
                <Users size={20} />
                <h3>Alunos & Matrículas</h3>
              </div>
              <ul className="text-sm text-zinc-300 space-y-2 list-disc list-inside">
                <li><strong>Cadastro Completo</strong>: Dados pessoais, instrumento, nível e dia de aula semanal.</li>
                <li><strong>Responsável Financeiro</strong>: Separação de cadastros para permitir que pais tenham múltiplos filhos.</li>
                <li><strong>Cálculo Proporcional</strong>: Mensalidade calculada automaticamente de acordo com o dia da 1ª aula.</li>
                <li><strong>Acesso ao Portal</strong>: Use o botão <em>"Copiar Link de Acesso"</em> para enviar via WhatsApp.</li>
              </ul>
            </div>

            {/* Card 2: Professores e Remuneração */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
              <div className="flex items-center gap-2.5 text-purple-400 font-bold">
                <GraduationCap size={20} />
                <h3>Professores & Repasses</h3>
              </div>
              <ul className="text-sm text-zinc-300 space-y-2 list-disc list-inside">
                <li><strong>Modelos Contratuais</strong>: Configure comissão (%) por aluno, valor por hora (R$/h) ou fixo.</li>
                <li><strong>Extrato Automático</strong>: O sistema consolida as aulas dadas nos diários de classe para gerar o repasse.</li>
                <li><strong>Chave Pix do Professor</strong>: Cadastre a chave para transferências rápidas e controle de baixas.</li>
              </ul>
            </div>

            {/* Card 3: Agenda e Funil CRM */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
              <div className="flex items-center gap-2.5 text-blue-400 font-bold">
                <Calendar size={20} />
                <h3>Agenda & Funil de Vendas (CRM)</h3>
              </div>
              <ul className="text-sm text-zinc-300 space-y-2 list-disc list-inside">
                <li><strong>Visualização da Grade</strong>: Aulas individuais (azuis), turmas (roxas) e experimentais (laranjas).</li>
                <li><strong>Trava de Matrícula</strong>: Aulas não aparecem antes da data em que o aluno começou na escola.</li>
                <li><strong>Funil Kanban</strong>: Arraste interessados de <em>Novo Contato</em> até <em>Matriculado</em>.</li>
                <li><strong>Feed iCal Mascarado</strong>: Sincronize o calendário da escola no Google Agenda de diretores.</li>
              </ul>
            </div>

            {/* Card 4: Gestão Financeira & Cobranças */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold">
                <DollarSign size={20} />
                <h3>Financeiro (Asaas & Pix)</h3>
              </div>
              <ul className="text-sm text-zinc-300 space-y-2 list-disc list-inside">
                <li><strong>Geração em Lote</strong>: O BullMQ gera mensalidades de todos os alunos sem travar a interface.</li>
                <li><strong>Cobrança Just-In-Time</strong>: O sistema gera o boleto na hora em que o aluno acessa o portal.</li>
                <li><strong>Baixa Automática</strong>: Webhooks liquidam a fatura no exato segundo em que o Pix é pago.</li>
                <li><strong>Exportação</strong>: Relatórios financeiros prontos para PDF e planilhas Excel (CSV).</li>
              </ul>
            </div>

            {/* Card 5: WhatsApp & Notificações */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
              <div className="flex items-center gap-2.5 text-teal-400 font-bold">
                <MessageCircle size={20} />
                <h3>WhatsApp Automatizado</h3>
              </div>
              <ul className="text-sm text-zinc-300 space-y-2 list-disc list-inside">
                <li><strong>Conexão via QR Code</strong>: Em <em>Configurações ➡️ WhatsApp</em>, conecte o número da escola com Baileys.</li>
                <li><strong>Disparos Automáticos</strong>: Lembretes de aula, aviso de fatura com Pix Copia e Cola e boas-vindas.</li>
              </ul>
            </div>

            {/* Card 6: LGPD & Contrato SaaS */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3">
              <div className="flex items-center gap-2.5 text-cyan-400 font-bold">
                <FileText size={20} />
                <h3>Segurança, LGPD & SaaS</h3>
              </div>
              <ul className="text-sm text-zinc-300 space-y-2 list-disc list-inside">
                <li><strong>Dossiê do Titular</strong>: Exporte em segundos todo o histórico de dados de qualquer CPF.</li>
                <li><strong>Anonimização</strong>: Exclua dados sensíveis com gravação de auditoria imutável.</li>
                <li><strong>Contrato SaaS B2B</strong>: Visualize e baixe o contrato assinado com carimbo SHA-256 e SLA.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo: Manual do Professor */}
      {abaAtiva === 'professor' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-900 border border-purple-500/20 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
              <GraduationCap size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Manual Docente do Sonatta</h2>
              <p className="text-sm text-zinc-400">
                Como consultar sua agenda, lançar diários de classe, gerenciar repertório e conferir seus repasses mensais.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prancheta e Diário de Classe */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2.5 text-purple-400 font-bold">
                <FileText size={20} />
                <h3>Diário de Classe (Lançamento de Aula)</h3>
              </div>
              <p className="text-xs text-zinc-400">Ao clicar no ícone de prancheta (📝) na sua agenda:</p>
              <ul className="text-sm text-zinc-300 space-y-2 list-disc list-inside">
                <li><strong>Presença</strong>: Marque Presente, Falta Justificada, Falta sem Justificativa ou Reposição.</li>
                <li><strong>Conteúdo Trabalhado</strong>: Fica visível no portal do aluno para consulta das matérias.</li>
                <li><strong>Tarefa de Casa</strong>: Orientações de exercícios e escalas para o aluno estudar durante a semana.</li>
                <li><strong>Notificação de Repasse</strong>: Ao salvar, o sistema notifica em tempo real o valor creditado do seu repasse!</li>
              </ul>
            </div>

            {/* Minha Agenda */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2.5 text-blue-400 font-bold">
                <Calendar size={20} />
                <h3>Minha Agenda & Contador de Aulas</h3>
              </div>
              <ul className="text-sm text-zinc-300 space-y-2 list-disc list-inside">
                <li><strong>Contador Cronológico</strong>: Ao lado do nome do aluno, veja o número exato da aula (ex: <em>Aula #14</em>).</li>
                <li><strong>Trava de Datas Futuras</strong>: A prancheta só fica ativa no dia da aula para manter a integridade pedagógica.</li>
                <li><strong>Aulas Experimentais</strong>: Alunos novos agendados pela secretaria aparecem destacados na sua grade.</li>
              </ul>
            </div>

            {/* Meus Alunos e Repertório */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold">
                <Users size={20} />
                <h3>Meus Alunos & Repertório Musical</h3>
              </div>
              <ul className="text-sm text-zinc-300 space-y-2 list-disc list-inside">
                <li><strong>Ficha do Aluno</strong>: Histórico de frequência e anotações pedagógicas passadas.</li>
                <li><strong>Repertório de Músicas</strong>: Cadastre as músicas que o aluno está aprendendo, tonalidades e links de partituras/cifras.</li>
                <li><strong>Turmas Coletivas</strong>: Faça a chamada dos grupos com um único clique em <em>Minhas Turmas</em>.</li>
              </ul>
            </div>

            {/* Meus Recebimentos e Ponto */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold">
                <DollarSign size={20} />
                <h3>Meus Recebimentos & Ponto</h3>
              </div>
              <ul className="text-sm text-zinc-300 space-y-2 list-disc list-inside">
                <li><strong>Extrato de Repasses</strong>: Consulte o total acumulado no mês de acordo com seu contrato (comissão/horas).</li>
                <li><strong>Registro de Ponto</strong>: Registre entrada e saída ao chegar e sair da escola.</li>
                <li><strong>Ajustes de Ponto</strong>: Caso esqueça de bater o ponto, envie uma solicitação com justificativa para a secretaria.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo: Manual do Aluno e Responsável */}
      {abaAtiva === 'aluno' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-zinc-900 to-zinc-900 border border-blue-500/20 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
              <UserCheck size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Guia do Portal do Aluno & Responsável</h2>
              <p className="text-sm text-zinc-400">
                Orientações para os alunos e pais acompanharem lições de casa, cronogramas e pagarem mensalidades.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Instalação no Celular */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold">
                <CheckCircle2 size={20} />
                <h3>Aplicativo no Celular (PWA)</h3>
              </div>
              <p className="text-sm text-zinc-300">
                O Portal pode ser instalado diretamente na tela inicial do celular sem ocupar memória:
              </p>
              <div className="text-xs space-y-1.5 text-zinc-400 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                <p>🤖 <strong>Android (Chrome)</strong>: Toque nos três pontinhos e em <em>"Adicionar à tela inicial"</em>.</p>
                <p>🍏 <strong>iPhone (Safari)</strong>: Toque em Compartilhar (⎋) e em <em>"Adicionar à Tela de Início"</em>.</p>
              </div>
            </div>

            {/* Card 2: Cronograma e Lições */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2.5 text-blue-400 font-bold">
                <Calendar size={20} />
                <h3>Cronograma & Lições de Casa</h3>
              </div>
              <ul className="text-sm text-zinc-300 space-y-2 list-disc list-inside">
                <li><strong>Alerta do Dia</strong>: Notificação interativa avisando o horário da aula no dia do curso.</li>
                <li><strong>Linha do Tempo</strong>: Veja o que foi ensinado pelo professor e as tarefas para praticar.</li>
                <li><strong>Partituras</strong>: Baixe materiais e cifras recomendadas pelo instrutor.</li>
              </ul>
            </div>

            {/* Card 3: Pagamento de Mensalidades */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold">
                <DollarSign size={20} />
                <h3>Pagamentos (Pix e Boleto)</h3>
              </div>
              <ul className="text-sm text-zinc-300 space-y-2 list-disc list-inside">
                <li><strong>Pix Copia e Cola</strong>: Pague com QR Code ou código e tenha confirmação imediata.</li>
                <li><strong>Boleto Bancário</strong>: Copie o código de barras ou imprima o boleto com desconto até o vencimento.</li>
                <li><strong>Histórico de Faturas</strong>: Consulte recibos de meses anteriores a qualquer momento.</li>
              </ul>
            </div>

            {/* Card 4: Gestão Multi-filhos */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center gap-2.5 text-teal-400 font-bold">
                <Users size={20} />
                <h3>Responsáveis com Múltiplos Filhos</h3>
              </div>
              <p className="text-sm text-zinc-300">
                Pais que possuem mais de um filho matriculado na escola podem alternar entre eles com apenas um toque no topo da tela do Portal, unificando os boletos e o acompanhamento pedagógico.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
