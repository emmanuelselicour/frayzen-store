import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExternalLink, Copy, Check, Gift, ShieldCheck, ArrowLeft, Gamepad2 } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

export const RedeemPins: React.FC = () => {
  const { user, orders, setActiveTab } = useApp();
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  const pinOrders = orders.filter(o => o.pinCodeDelivered);
  const latestPinOrder = pinOrders[0];

  const handleCopy = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 text-white">
      
      {/* Top Header */}
      <ScrollReveal direction="up">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            onClick={() => setActiveTab('profil')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-colors shadow-sm self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Voir mes commandes
          </button>

          <div className="text-center sm:text-right">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Portail Officiel • pin.wik.do
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Réclamation de Diamants Free Fire</h1>
          </div>
        </div>
      </ScrollReveal>

      {/* PIN Quick Copy Banner */}
      {latestPinOrder && (
        <ScrollReveal direction="down">
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/90 via-slate-900 to-slate-950 border border-blue-500/30 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  <span className="font-extrabold text-sm text-white">Votre dernier Code PIN ({latestPinOrder.productName})</span>
                </div>
                <p className="text-xs text-slate-400">
                  ID Joueur: <strong className="text-white font-mono">{latestPinOrder.gamePlayerId}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-950/90 p-2 rounded-xl border border-white/10 shrink-0">
                <span className="font-mono font-black text-amber-300 text-base sm:text-lg px-2">
                  {latestPinOrder.pinCodeDelivered}
                </span>
                <button
                  onClick={() => handleCopy(latestPinOrder.pinCodeDelivered!)}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-transform active:scale-95"
                >
                  {copiedPin === latestPinOrder.pinCodeDelivered ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedPin === latestPinOrder.pinCodeDelivered ? 'Copie !' : 'Copier'}
                </button>
              </div>
            </div>

            {/* If user has multiple PINs */}
            {pinOrders.length > 1 && (
              <div className="pt-2 border-t border-white/10 flex items-center gap-2 overflow-x-auto text-xs pb-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold shrink-0">Autres PINs:</span>
                {pinOrders.slice(1).map(ord => (
                  <button
                    key={ord.id}
                    onClick={() => handleCopy(ord.pinCodeDelivered!)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[11px] shrink-0 flex items-center gap-1"
                  >
                    <span>{ord.pinCodeDelivered}</span>
                    <Copy className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      )}

      {/* Instruction Steps */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-2">
        <p className="font-bold text-amber-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Instructions d'activation sur pin.wik.do :
        </p>
        <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
          <li>Copiez votre code PIN ci-dessus.</li>
          <li>Entrez votre ID Joueur Free Fire dans le formulaire ci-dessous.</li>
          <li>Collez votre code PIN et validez pour recevoir instantanément vos diamants !</li>
        </ol>
      </div>

      {/* External Direct Link Button */}
      <div className="flex justify-end">
        <a
          href="https://pin.wik.do/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-md transition-all"
        >
          <span>Ouvrir https://pin.wik.do/ dans un nouvel onglet</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Embedded Iframe wrapper */}
      <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-slate-950 shadow-2xl">
        <iframe
          src="https://pin.wik.do/"
          title="Réclamer mes diamants Free Fire (pin.wik.do)"
          className="w-full h-[650px] sm:h-[800px] border-0"
          allow="clipboard-write; clipboard-read"
        />
      </div>

    </div>
  );
};
