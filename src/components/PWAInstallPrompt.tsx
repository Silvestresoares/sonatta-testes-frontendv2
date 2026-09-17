import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

/**
 * Componente para instalação inteligente de PWA
 * Suporta acionamento direto no Android/Chrome e guia interativo no iOS/Safari
 */
export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showIOSModal, setShowIOSModal] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // 1. Verifica se já está rodando como app instalado (Standalone)
        const isRunningStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        setIsStandalone(isRunningStandalone);
        if (isRunningStandalone) return;

        // 2. Verifica se o usuário já dispensou recentemente (últimas 24h)
        const lastDismissed = localStorage.getItem('@sonatta:pwa_dismissed');
        if (lastDismissed) {
            const diffHours = (Date.now() - Number(lastDismissed)) / (1000 * 60 * 60);
            if (diffHours < 24) {
                setDismissed(true);
            }
        }

        // 3. Detecta se é iOS (iPhone, iPad, iPod)
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isAppleDevice);

        // 4. Captura o evento nativo de instalação do Android/Chrome
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // 5. Detecta quando foi instalado com sucesso
        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            setIsStandalone(true);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    // Dispensar prompt por 24 horas
    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem('@sonatta:pwa_dismissed', String(Date.now()));
    };

    // Ação de clique no botão principal
    const handleInstallClick = async () => {
        if (isIOS) {
            // No iOS, abre o modal com o passo a passo visual
            setShowIOSModal(true);
            return;
        }

        if (deferredPrompt) {
            // No Android/Chrome, dispara a caixinha nativa de instalação
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        }
    };

    // Se já estiver instalado ou foi dispensado nas últimas 24h, não exibe nada
    if (isStandalone || dismissed) {
        return null;
    }

    // Se não for iOS e o navegador ainda não disparou o prompt do Android, não exibe
    if (!isIOS && !deferredPrompt) {
        return null;
    }

    return (
        <>
            {/* Banner / Botão Flutuante de Instalação */}
            <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-zinc-900/95 backdrop-blur-md border border-emerald-500/30 p-4 rounded-2xl shadow-2xl shadow-emerald-950/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                            <Smartphone size={22} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white leading-tight">Instale o App Sonatta</p>
                            <p className="text-xs text-zinc-400">Acesse suas aulas mais rápido</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleInstallClick}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs rounded-lg transition-all shadow-md active:scale-95"
                        >
                            <Download size={14} />
                            <span>Instalar</span>
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg transition-colors"
                            title="Lembrar mais tarde"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Passo a Passo para iOS */}
            {showIOSModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                            <div className="flex items-center gap-2">
                                <Smartphone className="text-emerald-400" size={20} />
                                <h3 className="text-lg font-bold text-white">Instalar no iPhone / iPad</h3>
                            </div>
                            <button
                                onClick={() => setShowIOSModal(false)}
                                className="text-zinc-400 hover:text-white p-1 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="py-5 space-y-4 text-sm text-zinc-300">
                            <p className="text-zinc-400 text-xs leading-relaxed">
                                No iOS, a instalação é feita pelo próprio Safari em 2 etapas rápidas:
                            </p>

                            <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg shrink-0">
                                    <Share size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">1. Toque em Compartilhar</p>
                                    <p className="text-xs text-zinc-400">
                                        Localize o botão com o ícone de seta para cima na barra inferior do Safari.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                                    <PlusSquare size={18} />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">2. Adicionar à Tela de Início</p>
                                    <p className="text-xs text-zinc-400">
                                        Role a lista de opções para baixo e toque em "Adicionar à Tela de Início".
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowIOSModal(false)}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-lg active:scale-95"
                        >
                            Entendido!
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
