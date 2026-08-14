import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ExternalLink, Copy, Check, Gift, ShieldCheck, ArrowLeft, Gamepad2, Sparkles, CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

export const RedeemPins: React.FC = () => {
  const { orders, setActiveTab } = useApp();
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
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 uppercase tracking-wider inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Portail Officiel • redeem.hype.games
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Rechaje & Réclame Diamants Free Fire
            </h1>
          </div>
        </div>
      </ScrollReveal>

      {/* PIN Quick Copy Banner for Latest / Delivered PINs */}
      {latestPinOrder ? (
        <ScrollReveal direction="down">
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-blue-950/80 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-950/40 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Achat Réussi ! Kòd PIN ou a pare
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                      Disponib
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Produit: <strong className="text-white">{latestPinOrder.productName}</strong> • ID Joueur: <strong className="text-amber-300 font-mono">{latestPinOrder.gamePlayerId}</strong>
                  </p>
                </div>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {new Date(latestPinOrder.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>

            {/* The PIN Code Box with Giant One-Click Copy */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-950/90 border border-amber-500/40 shadow-inner">
              <div className="space-y-0.5 text-center sm:text-left">
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                  Kòd PIN Free Fire pou w antre sou sit la :
                </p>
                <p className="font-mono font-black text-amber-300 text-xl sm:text-2xl tracking-widest select-all">
                  {latestPinOrder.pinCodeDelivered}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(latestPinOrder.pinCodeDelivered!)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                {copiedPin === latestPinOrder.pinCodeDelivered ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>PIN Kopye !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Kopye PIN nan</span>
                  </>
                )}
              </button>
            </div>

            {/* If user has multiple PINs */}
            {pinOrders.length > 1 && (
              <div className="pt-2 flex items-center gap-2 overflow-x-auto text-xs pb-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold shrink-0">Lòt PINs ou yo:</span>
                {pinOrders.slice(1).map(ord => (
                  <button
                    key={ord.id}
                    onClick={() => handleCopy(ord.pinCodeDelivered!)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-mono text-[11px] shrink-0 flex items-center gap-1.5 transition-colors"
                  >
                    <span>{ord.pinCodeDelivered}</span>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      ) : (
        /* Info banner when no PIN yet */
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-[#1E90FF]" />
            <div>
              <h3 className="font-extrabold text-sm text-white">Portail d'activation de vos codes PIN</h3>
              <p className="text-xs text-slate-400">Dès que vous achetez un pack de diamants, votre code PIN s'affichera directement ici pour réclamation.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('produits')}
            className="px-4 py-2 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-bold text-xs shrink-0 shadow-md"
          >
            Acheter un Pack Free Fire
          </button>
        </div>
      )}

      {/* Instruction Steps in Haitian Creole & French */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
            <ShieldCheck className="w-4 h-4" /> Kijan pou w itilize kòd PIN nan sou redeem.hype.games :
          </p>
          <a
            href="https://redeem.hype.games/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
          >
            <span>Ouvri sou lòt onglet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px] text-slate-300">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
            <span className="font-black text-[#1E90FF] text-xs block">1. KOPYE KÒD LA</span>
            <p>Klike sou bouton vèt <strong className="text-emerald-400">« Kopye PIN nan »</strong> anwo a pou kòd la kopye otomatikman.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
            <span className="font-black text-amber-400 text-xs block">2. ANTRE SOU HYPEGAMES</span>
            <p>Dirèkteman nan kadran ki anba a, chwazi jwèt Free Fire epi mete <strong className="text-white">ID Joueur</strong> ou a.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
            <span className="font-black text-emerald-400 text-xs block">3. VALIDE & RESEVWA</span>
            <p>Kole kòd PIN ou te kopye a epi klike valide. Dyamant yo ap depoze sou kont Free Fire ou imedyatman !</p>
          </div>
        </div>
      </div>

      {/* Embedded Iframe wrapper for https://redeem.hype.games/ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <Gamepad2 className="w-4 h-4 text-[#1E90FF]" />
            Sit Web Ofisyèl redeem.hype.games (Entegre dirèkteman)
          </span>
          <span className="text-[10px] text-slate-500 font-mono">https://redeem.hype.games/</span>
        </div>

        <div className="relative rounded-3xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-2xl">
          <iframe
            src="https://redeem.hype.games/"
            title="Réclamer mes diamants Free Fire (redeem.hype.games)"
            className="w-full h-[700px] sm:h-[850px] border-0"
            allow="clipboard-write; clipboard-read"
          />
        </div>
      </div>

    </div>
  );
};
