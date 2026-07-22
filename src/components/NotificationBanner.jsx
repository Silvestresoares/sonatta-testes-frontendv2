import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

const _envApi = import.meta.env.VITE_API_URL;
const _defaultLocal = 'http://localhost:3005';
const API_URL = (typeof window !== 'undefined' && window.location && window.location.hostname.includes('localhost')) ? _defaultLocal : (_envApi || _defaultLocal);

// Base64 to Uint8Array converter (necessário para a chave VAPID)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      if (Notification.permission === 'default') {
        setIsVisible(true);
      } else if (Notification.permission === 'granted') {
        // Tenta se inscrever em background se já deu permissão mas falhou antes
        handleSubscribe(true);
      }
    }
  }, []);

  const handleSubscribe = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      
      if (permission === 'granted') {
        // Obter o registro do Service Worker
        const registration = await navigator.serviceWorker.ready;
        
        // Pegar a chave pública VAPID das variáveis de ambiente
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error('VAPID Public Key não encontrada no .env');
          setIsVisible(false);
          return;
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        // Inscreve no Push Manager
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        // Enviar a inscrição para o backend
        const token = localStorage.getItem('@sonatta:token');
        const response = await fetch(`${API_URL}/api/notificacoes/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(subscription)
        });

        if (response.ok) {
          console.log('Inscrito para notificações com sucesso!');
        } else {
          console.error('Erro ao enviar inscrição para o backend.');
        }
      }
    } catch (error) {
      console.error('Erro ao tentar se inscrever para notificações:', error);
    } finally {
      setIsVisible(false);
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-emerald-600 text-white px-4 py-3 shadow-md flex items-center justify-between relative z-50">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-500 p-2 rounded-full">
          <Bell size={20} className="text-white animate-pulse" />
        </div>
        <div>
          <p className="font-semibold text-sm">Ative as Notificações</p>
          <p className="text-xs text-emerald-100">Receba avisos de aulas desmarcadas ou agendadas mesmo com o app fechado.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={handleSubscribe} 
          disabled={isLoading}
          className="bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-1.5 rounded-md text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
        >
          {isLoading ? 'Ativando...' : 'Ativar Agora'}
        </button>
        <button onClick={() => setIsVisible(false)} className="p-1.5 hover:bg-emerald-500 rounded-md transition-colors">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
