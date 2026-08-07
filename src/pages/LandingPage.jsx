import React, { useState } from 'react';
import { PlayCircle, CheckCircle, Guitar, ArrowRight, MessageCircle, Mail } from 'lucide-react';


import { API_URL } from '../utils/api';
export default function LandingPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const [nomeEscola, setNomeEscola] = useState('');
  const [emailCadastro, setEmailCadastro] = useState('');
  const [telefoneCadastro, setTelefoneCadastro] = useState('');
  const [documentoCadastro, setDocumentoCadastro] = useState('');
  const [senhaCadastro, setSenhaCadastro] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagemExibida, setImagemExibida] = useState('/print_dashboard.png');

  const handleCadastro = async (e) => {
    e.preventDefault();

    if (!nomeEscola || !emailCadastro || !senhaCadastro) {
      return alert("Preencha todos os campos obrigatórios!");
    }

    if (senhaCadastro !== confirmarSenha) {
      return alert("As senhas não coincidem!");
    }

    setLoading(true);
    try {
      const resposta = await fetch(`${API_URL}/api/auth/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_escola: nomeEscola,
          nome: nomeEscola,
          telefone_comercial: telefoneCadastro,
          documento: documentoCadastro,
          email: emailCadastro,
          senha: senhaCadastro
        })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert("Escola cadastrada com sucesso! Agora você já pode fazer login.");
        window.location.href = '/login';
      } else {
        alert(dados.erro || "Erro ao cadastrar escola.");
      }
    } catch (erro) {
      console.error("Erro na requisição de cadastro:", erro);
      alert("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-emerald-500 selection:text-black">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
        {`
          @keyframes slowPan {
            0% { transform: scale(1.0) translate(0, 0); }
            50% { transform: scale(1.05) translate(-1%, 0); }
            100% { transform: scale(1.0) translate(0, 0); }
          }
          .animate-slow-pan {
            animation: slowPan 25s ease-in-out infinite;
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
          }
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          @keyframes float-delayed {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
          }
          .animate-float-delayed {
            animation: float-delayed 8s ease-in-out infinite 2s;
          }
        `}
      </style>

      {/* Navbar (Sticky Glassmorphism) */}
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-zinc-800/50 bg-zinc-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-3xl font-bold text-emerald-500 tracking-tight hover:text-emerald-400 transition-colors"
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            Sonatta
          </button>
          <div className="flex items-center gap-6">
            <a href="#funcionalidades" className="hidden sm:block text-sm font-medium text-zinc-400 hover:text-white transition-colors">Funcionalidades</a>
            <a href="#contato" className="hidden sm:block text-sm font-medium text-zinc-400 hover:text-white transition-colors">Contato</a>
            <a href="/login" className="px-5 py-2 text-sm font-bold bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-colors border border-zinc-700">
              Fazer Login
            </a>
            <button
              onClick={() => setModalAberto(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-2 text-sm font-bold rounded-full transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              Testar Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden border-b border-zinc-900">
        {/* Background Image Animado */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat animate-slow-pan opacity-20"
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
        {/* Gradiente Escuro por cima */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/80 to-zinc-950"></div>
        {/* Grid Overlay para textura */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')]"></div>


        {/* Background Gradients Centrais */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-40 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 blur-[120px] rounded-full mix-blend-screen"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-sm font-medium text-zinc-300 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            O sistema definitivo para Escolas de Música
          </div>

          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
            Gestão <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">moderna</span> para <br className="hidden md:block" />
            sua escola decolar.
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Centralize suas turmas, alunos, pagamentos e agenda de professores em uma plataforma rápida, intuitiva e feita por músicos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setModalAberto(true)}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2"
            >
              <PlayCircle size={24} /> Comece seu Teste Grátis
            </button>
            <a
              href="#funcionalidades"
              className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg text-white border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
            >
              Conhecer Funcionalidades
            </a>
          </div>

          {/* Social Proof */}
          <div className="mt-16 pt-8 border-t border-zinc-800/50 flex flex-wrap justify-center gap-8 text-zinc-500 font-medium">

            <span className="flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500" /> Cancele quando quiser</span>
            <span className="flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500" /> 10 dias de teste grátis</span>
          </div>
        </div>
      </section>

      {/* Funcionalidades / Dashboard Showcase */}
      <section id="funcionalidades" className="py-20 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Tudo o que sua escola precisa</h2>
            <p className="text-zinc-400 text-lg">Substitua planilhas desorganizadas por um painel inteligente.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {/* Card 1 */}
              <button
                onClick={() => setImagemExibida('/print_alunos.png')}
                className={`w-full text-left p-6 rounded-2xl border transition-all ${imagemExibida === '/print_alunos.png' ? 'bg-zinc-800 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700'}`}
              >
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 text-emerald-400">
                  <Guitar size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Gestão de Turmas e Alunos</h3>
                <p className="text-zinc-400">Matrículas, frequências, histórico de aulas e comunicação direta pelo Portal do Aluno.</p>
              </button>

              {/* Card 2 */}
              <button
                onClick={() => setImagemExibida('/print_financeiro.png')}
                className={`w-full text-left p-6 rounded-2xl border transition-all ${imagemExibida === '/print_financeiro.png' ? 'bg-zinc-800 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700'}`}
              >
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-4 text-cyan-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Financeiro Automatizado com Asaas</h3>
                <p className="text-zinc-400">Emissão de boletos e PIX com baixa automática, cobranças recorrentes e relatórios de inadimplência.</p>
              </button>

              <button
                onClick={() => setImagemExibida('/print_agenda.png')}
                className={`w-full text-left p-6 rounded-2xl border transition-all ${imagemExibida === '/print_agenda.png' ? 'bg-zinc-800 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700'}`}
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 text-purple-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Agenda de Professores</h3>
                <p className="text-zinc-400">Cada professor tem seu próprio acesso para lançar presenças, visualizar a agenda do dia e verificar recebimentos.</p>
              </button>
              {/* Card 4 */}
              <button
                onClick={() => setImagemExibida('/print_portal.png')}
                className={`w-full text-left p-6 rounded-2xl border transition-all ${imagemExibida === '/print_portal.png' ? 'bg-zinc-800 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700'}`}
              >
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4 text-indigo-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Portal do Aluno</h3>
                <p className="text-zinc-400">Seus alunos (ou responsáveis) acompanham cronograma, registros de aula e pagamentos num portal exclusivo e moderno.</p>
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-3xl rounded-full"></div>



              <img
                key={imagemExibida}
                src={imagemExibida}
                alt="Demonstração do Sistema"
                className="relative z-10 rounded-xl border border-zinc-800 shadow-2xl transform lg:rotate-2 hover:rotate-0 blur-[2px] transition-all duration-500 animate-in fade-in zoom-in-95"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contato Section */}
      <section id="contato" className="py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">Ficou com alguma dúvida?</h2>
          <p className="text-zinc-400 text-lg mb-10">
            Nossa equipe está à disposição para ajudar você a migrar sua escola para o Sonatta sem dores de cabeça.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a
              href="https://wa.me/5527996335293"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1ebd5a] text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
            >
              <MessageCircle size={24} />
              Chamar no WhatsApp
            </a>
            <a
              href="mailto:silvestresoares.educ@gmail.com"
              className="flex items-center justify-center gap-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg"
            >
              <Mail size={24} />
              Enviar E-mail
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 py-10 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="text-2xl font-bold text-zinc-500 mb-4 md:mb-0" style={{ fontFamily: "'Dancing Script', cursive" }}>Sonatta</div>
          <p className="text-zinc-600 text-sm">© {new Date().getFullYear()} Sonatta. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Modal de Cadastro (Glassmorphism Premium) */}
      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setModalAberto(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3 className="text-2xl font-bold text-white mb-2">Crie sua Escola</h3>
            <p className="text-sm text-zinc-400 mb-6">Você terá 10 dias de teste grátis com acesso total.</p>

            <form onSubmit={handleCadastro} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Nome da Escola / Empresa *</label>
                <input
                  type="text" required placeholder="Sua Escola de Música"
                  value={nomeEscola} onChange={e => setNomeEscola(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Telefone (Opcional)</label>
                  <input
                    type="text" placeholder="(11) 99999-9999"
                    value={telefoneCadastro} onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      val = val.replace(/^(\d{2})(\d)/g, '($1) $2');
                      val = val.replace(/(\d)(\d{4})$/, '$1-$2');
                      setTelefoneCadastro(val);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-1">CNPJ / CPF (Opcional)</label>
                  <input
                    type="text" placeholder="Apenas números"
                    value={documentoCadastro} onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 11) {
                        val = val.replace(/(\d{3})(\d)/, '$1.$2');
                        val = val.replace(/(\d{3})(\d)/, '$1.$2');
                        val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                      } else {
                        val = val.replace(/^(\d{2})(\d)/, '$1.$2');
                        val = val.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                        val = val.replace(/\.(\d{3})(\d)/, '.$1/$2');
                        val = val.replace(/(\d{4})(\d)/, '$1-$2');
                      }
                      setDocumentoCadastro(val);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-1">E-mail de Login *</label>
                <input
                  type="email" required placeholder="adm@escola.com"
                  value={emailCadastro} onChange={e => setEmailCadastro(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Senha *</label>
                  <input
                    type="password" required placeholder="••••••••"
                    value={senhaCadastro} onChange={e => setSenhaCadastro(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Confirmar *</label>
                  <input
                    type="password" required placeholder="••••••••"
                    value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-zinc-950 font-bold py-3 rounded-xl text-[15px] transition-all shadow-lg mt-4 flex justify-center items-center gap-2"
              >
                {loading ? 'Criando Escola...' : 'Finalizar Cadastro'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
