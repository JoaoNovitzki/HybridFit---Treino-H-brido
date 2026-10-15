import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface Props {
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone PWA mode, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <>
        <button
          onClick={install}
          aria-label="Instalar aplicativo na tela inicial"
          className={`flex items-center gap-2 rounded-xl bg-[#BEF264] text-[#0B1016] font-semibold transition active:scale-95 shadow-lg shadow-[#BEF264]/20 ${
            variant === 'full'
              ? 'w-full justify-center py-3 px-4 text-sm'
              : 'py-1.5 px-3 text-xs'
          }`}
        >
          <Download className="w-4 h-4 text-[#0B1016]" />
          <span>Instalar App</span>
        </button>
      </>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          aria-label="Instruções para instalar no iPhone"
          className={`flex items-center gap-2 rounded-xl border border-[#BEF264]/40 bg-[#19222D] text-[#BEF264] font-medium transition active:scale-95 ${
            variant === 'full'
              ? 'w-full justify-center py-3 px-4 text-sm'
              : 'py-1.5 px-2.5 text-xs'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar no iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-[#19222D] border border-[#263342] p-5 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-[#263342]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#BEF264]/20 flex items-center justify-center text-[#BEF264]">
                    <Download className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">Instalar no iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0B1016]/60 border border-[#263342]">
                  <Share2 className="w-5 h-5 text-[#BEF264] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">1. Toque em Compartilhar</span>
                    <p className="text-xs text-gray-400 mt-0.5">Na barra de ferramentas inferior do Safari.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-[#0B1016]/60 border border-[#263342]">
                  <PlusSquare className="w-5 h-5 text-[#BEF264] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">2. Adicionar à Tela de Início</span>
                    <p className="text-xs text-gray-400 mt-0.5">Role o menu para baixo e toque em Adicionar à Tela de Início.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#BEF264] py-2.5 text-sm font-semibold text-[#0B1016] transition active:scale-95"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
