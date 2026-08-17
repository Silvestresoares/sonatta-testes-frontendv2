import React, { useState, useEffect } from 'react';
import { MessageCircle, Link2, CheckCircle, AlertTriangle, RefreshCw, LogOut, Save } from 'lucide-react';
import { API_URL } from '../utils/api';

export default function WhatsAppConfig({ token }: { token: string }) {
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [instanceName, setInstanceName] = useState('');
  
  const [status, setStatus] = useState<string>('disconnected');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    carregarConfiguracao();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (apiUrl && apiKey && instanceName) {
      verificarStatus();
      interval = setInterval(verificarStatus, 5000); // Polling a cada 5s
    }
    return () => clearInterval(interval);
  }, [apiUrl, apiKey, instanceName]);

  const carregarConfiguracao = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/whatsapp/config`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApiUrl(data.whatsapp_api_url || '');
        setApiKey(data.whatsapp_api_key || '');
        setInstanceName(data.whatsapp_instance || '');
      }
    } catch (err) {
      console.error('Erro ao buscar configs whatsapp', err);
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracao = async () => {
    setSalvando(true);
    setMensagem({ tipo: '', texto: '' });
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider: 'evolution', apiUrl, apiKey, instanceName })
      });
      if (res.ok) {
        setMensagem({ tipo: 'success', texto: 'Configuração salva com sucesso!' });
        verificarStatus();
      } else {
        setMensagem({ tipo: 'error', texto: 'Erro ao salvar configuração.' });
      }
    } catch (err) {
      setMensagem({ tipo: 'error', texto: 'Erro de conexão.' });
    } finally {
      setSalvando(false);
      setTimeout(() => setMensagem({ tipo: '', texto: '' }), 3000);
    }
  };

  const verificarStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.status);
      }
    } catch (err) {
      console.error('Erro status', err);
    }
  };

  const iniciarSessao = async () => {
    setStatus('starting');
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      const data = await res.json();
      
      if (data.status === 'qr_ready' && data.qrCodeUrl) {
        setQrCodeUrl(data.qrCodeUrl);
        setStatus('qr_ready');
      } else if (data.status === 'connected') {
        setStatus('connected');
      } else {
        setMensagem({ tipo: 'error', texto: 'Erro ao iniciar sessão: ' + (data.error || 'Falha desconhecida') });
        setStatus('disconnected');
      }
    } catch (err) {
      setMensagem({ tipo: 'error', texto: 'Erro de conexão ao iniciar sessão.' });
      setStatus('disconnected');
    }
  };

  const desconectarSessao = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar o WhatsApp desta instância?')) return;
    try {
      await fetch(`${API_URL}/api/whatsapp/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('@sonatta:token')}` }
      });
      setStatus('disconnected');
      setQrCodeUrl('');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-zinc-400 p-4">Carregando WhatsApp...</div>;

  const isConfigured = apiUrl && apiKey && instanceName;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-6">
      <h2 className="text-lg font-semibold text-white mb-4 border-b border-zinc-800 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} className="text-emerald-500" />
          Integração WhatsApp API
        </div>
        <button 
          onClick={salvarConfiguracao}
          disabled={salvando}
          className="flex items-center gap-2 text-sm px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold rounded-md transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {salvando ? 'Salvando...' : 'Salvar API'}
        </button>
      </h2>

      {mensagem.texto && (
        <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${mensagem.tipo === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
          {mensagem.texto}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Configurações */}
        <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 mb-2 text-zinc-300 font-semibold">
            <Link2 size={18} className="text-emerald-500" /> Configuração da Evolution API
          </div>
          <p className="text-xs text-zinc-400 mb-4">Insira os dados da sua instalação da Evolution API para conectar o sistema ao seu número.</p>
          
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">URL da API</label>
            <input
              type="text"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              placeholder="Ex: https://api.seudominio.com"
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Global API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Sua chave de acesso"
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Nome da Instância</label>
            <input
              type="text"
              value={instanceName}
              onChange={e => setInstanceName(e.target.value)}
              placeholder="Ex: sonatta_v2"
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Lado Direito: Status e QR Code */}
        <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 flex flex-col items-center justify-center min-h-[300px]">
          {!isConfigured ? (
            <div className="text-center space-y-4">
              <AlertTriangle size={32} className="text-zinc-500 mx-auto" />
              <p className="text-zinc-400 text-sm">Preencha e salve as configurações ao lado para gerenciar sua conexão com o WhatsApp.</p>
            </div>
          ) : status === 'connected' ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">WhatsApp Conectado!</h3>
                <p className="text-zinc-400 text-sm">Os envios de mensagens já estão ativos e passando pela Evolution API.</p>
              </div>
              <button onClick={desconectarSessao} className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/50 hover:bg-rose-500 hover:text-white rounded-lg transition-colors mx-auto">
                <LogOut size={16} /> Desconectar Instância
              </button>
            </div>
          ) : status === 'qr_ready' && qrCodeUrl ? (
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-white">Escaneie o QR Code</h3>
              <p className="text-zinc-400 text-sm">Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie:</p>
              <div className="bg-white p-2 rounded-xl inline-block mx-auto">
                <img src={qrCodeUrl.startsWith('data:image') ? qrCodeUrl : `data:image/png;base64,${qrCodeUrl}`} alt="QR Code WhatsApp" className="w-64 h-64 object-contain" />
              </div>
            </div>
          ) : status === 'starting' ? (
            <div className="text-center space-y-4 py-8">
              <RefreshCw size={32} className="text-emerald-500 animate-spin mx-auto" />
              <p className="text-zinc-400">Solicitando QR Code da Evolution API...</p>
            </div>
          ) : (
            <div className="text-center space-y-4 py-8">
              <AlertTriangle size={32} className="text-zinc-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-white">WhatsApp Desconectado</h3>
                <p className="text-zinc-400 text-sm mb-4">Sua instância está configurada, mas não conectada. Clique abaixo para gerar o QR Code.</p>
                <button onClick={iniciarSessao} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold rounded-lg transition-colors">
                  Gerar QR Code de Conexão
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
