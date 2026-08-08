import React, { useState, useEffect } from 'react';
import { MessageCircle, QrCode, Link2, CheckCircle, AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { API_URL } from '../utils/api';

export default function WhatsAppConfig({ token }: { token: string }) {
  const [provider, setProvider] = useState<'native' | 'evolution'>('native');
  const [apiUrl, setApiUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [instanceName, setInstanceName] = useState('');
  
  const [statusNativo, setStatusNativo] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    carregarConfiguracao();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (provider === 'native') {
      verificarStatusNativo();
      interval = setInterval(verificarStatusNativo, 5000); // Polling a cada 5s
    }
    return () => clearInterval(interval);
  }, [provider]);

  const carregarConfiguracao = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/whatsapp/config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProvider(data.whatsapp_provider || 'native');
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider, apiUrl, apiKey, instanceName })
      });
      if (res.ok) {
        setMensagem({ tipo: 'success', texto: 'Configuração salva com sucesso!' });
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

  const verificarStatusNativo = async () => {
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatusNativo(data.status);
        if (data.qrCodeUrl) setQrCodeUrl(data.qrCodeUrl);
      }
    } catch (err) {
      console.error('Erro status nativo', err);
    }
  };

  const iniciarSessaoNativa = async () => {
    setStatusNativo('starting');
    try {
      await fetch(`${API_URL}/api/whatsapp/start`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMensagem({ tipo: 'success', texto: 'Iniciando sessão, aguarde o QR Code...' });
    } catch (err) {
      setMensagem({ tipo: 'error', texto: 'Erro ao iniciar sessão.' });
    }
  };

  const desconectarSessaoNativa = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar o WhatsApp?')) return;
    try {
      await fetch(`${API_URL}/api/whatsapp/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStatusNativo('disconnected');
      setQrCodeUrl('');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-zinc-400 p-4">Carregando WhatsApp...</div>;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mt-6">
      <h2 className="text-lg font-semibold text-white mb-4 border-b border-zinc-800 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} className="text-emerald-500" />
          Integração WhatsApp
        </div>
        <button 
          onClick={salvarConfiguracao}
          disabled={salvando}
          className="text-sm px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold rounded-md transition-colors disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar Provedor'}
        </button>
      </h2>

      {mensagem.texto && (
        <div className={`p-3 rounded-lg mb-4 text-sm font-medium ${mensagem.tipo === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
          {mensagem.texto}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-zinc-400 mb-2">Escolha o provedor de envio:</label>
        <div className="flex gap-4">
          <label className={`flex-1 border p-4 rounded-xl cursor-pointer transition-colors ${provider === 'native' ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'}`}>
            <input type="radio" name="provider" value="native" checked={provider === 'native'} onChange={() => setProvider('native')} className="hidden" />
            <div className="flex items-center gap-3">
              <QrCode size={24} className={provider === 'native' ? 'text-emerald-500' : 'text-zinc-500'} />
              <div>
                <div className="font-semibold text-white">QR Code Nativo</div>
                <div className="text-xs text-zinc-400">Totalmente gratuito. Gere o QR Code e escaneie com seu WhatsApp.</div>
              </div>
            </div>
          </label>
          <label className={`flex-1 border p-4 rounded-xl cursor-pointer transition-colors ${provider === 'evolution' ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'}`}>
            <input type="radio" name="provider" value="evolution" checked={provider === 'evolution'} onChange={() => setProvider('evolution')} className="hidden" />
            <div className="flex items-center gap-3">
              <Link2 size={24} className={provider === 'evolution' ? 'text-emerald-500' : 'text-zinc-500'} />
              <div>
                <div className="font-semibold text-white">API Externa (Evolution/Z-API)</div>
                <div className="text-xs text-zinc-400">Requer infraestrutura própria ou terceirizada. Mais leve para o servidor.</div>
              </div>
            </div>
          </label>
        </div>
      </div>

      {provider === 'native' && (
        <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 flex flex-col items-center">
          {statusNativo === 'connected' ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">WhatsApp Conectado!</h3>
                <p className="text-zinc-400 text-sm">Os lembretes e cobranças já estão sendo enviados automaticamente.</p>
              </div>
              <button onClick={desconectarSessaoNativa} className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/50 hover:bg-rose-500 hover:text-white rounded-lg transition-colors mx-auto">
                <LogOut size={16} /> Desconectar
              </button>
            </div>
          ) : statusNativo === 'qr_ready' && qrCodeUrl ? (
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-white">Escaneie o QR Code</h3>
              <p className="text-zinc-400 text-sm">Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e escaneie a imagem abaixo:</p>
              <div className="bg-white p-2 rounded-xl inline-block mx-auto">
                <img src={qrCodeUrl} alt="QR Code WhatsApp" className="w-64 h-64" />
              </div>
            </div>
          ) : statusNativo === 'starting' ? (
            <div className="text-center space-y-4 py-8">
              <RefreshCw size={32} className="text-emerald-500 animate-spin mx-auto" />
              <p className="text-zinc-400">Iniciando sessão do WhatsApp... isso pode levar alguns segundos.</p>
            </div>
          ) : (
            <div className="text-center space-y-4 py-8">
              <AlertTriangle size={32} className="text-zinc-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-white">WhatsApp Desconectado</h3>
                <p className="text-zinc-400 text-sm mb-4">Clique no botão abaixo para gerar o QR Code de conexão.</p>
                <button onClick={iniciarSessaoNativa} className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold rounded-lg transition-colors">
                  Gerar QR Code
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {provider === 'evolution' && (
        <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">URL da API (Evolution API)</label>
            <input
              type="text"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
              placeholder="Ex: https://minha-api.com.br"
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
              placeholder="Ex: escola_123"
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
