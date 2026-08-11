import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Sparkles, Zap, Smartphone, CheckCircle, ArrowRight, Flame, Lock, Wallet, Users, Award } from 'lucide-react';
import { Product } from '../types';
import { ScrollReveal } from '../components/ScrollReveal';

export const Accueil: React.FC = () => {
  const { products, setActiveTab, setSelectedProduct, setIsDepositModalOpen, natcashConfig, user } = useApp();

  const homeProducts = products.filter(p => ['ff-100', 'ff-200', 'ff-500'].includes(p.id));
  if (homeProducts.length === 0) {
    homeProducts.push(...products.slice(0, 3));
  }

  const handleBuyProduct = (p: Product) => {
    setSelectedProduct(p);
    setActiveTab('paiement');
  };

  return (
    <div className="space-y-16 pb-12">
      
      {/* Hero & Wallet Layout Grid */}
      <section className="pt-2">
        <ScrollReveal direction="up" delay={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Main Hero Gradient Card */}
            <div className="lg:col-span-8 p-8 sm:p-10 rounded-[40px] bg-gradient-to-br from-[#1E90FF] via-[#0077e6] to-[#0066cc] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-80 h-full bg-white/10 skew-x-12 translate-x-20 pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <span className="inline-block bg-[#FF0000] text-white text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider w-fit shadow-md">
                  OFFRE SPÉCIALE 🇭🇹
                </span>
                
                <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
                  Rechargez vos diamants<br />Free Fire Instantanément
                </h1>

                <p className="text-blue-100 max-w-lg text-sm font-medium leading-relaxed">
                  Système de PIN sécurisé avec livraison automatisée et validation de recharges en Gourdes HTG via NATCASH.
                </p>

                <div className="pt-4 flex flex-wrap gap-4">
                  <button
                    onClick={() => setActiveTab('produits')}
                    className="px-8 py-3.5 bg-white text-[#1E90FF] hover:bg-blue-50 rounded-2xl font-black text-sm shadow-xl transition-transform active:scale-95 flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4 fill-[#1E90FF]" />
                    Acheter Maintenant
                  </button>

                  <button
                    onClick={() => setActiveTab('produits')}
                    className="px-8 py-3.5 bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-2xl font-bold text-sm backdrop-blur-md transition-all active:scale-95"
                  >
                    Voir Catalogue
                  </button>
                </div>
              </div>
            </div>

            {/* Mon Wallet & Quick Info Column */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* Wallet Card */}
              <div className="p-6 rounded-3xl glass-card border border-white/12 shadow-xl space-y-3 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Mon Wallet</p>
                <h2 className="text-3xl font-black text-white">
                  {user ? (user.walletBalanceHTG ?? 0).toLocaleString('fr-FR') : '0'} <span className="text-sm font-medium text-slate-400">HTG</span>
                </h2>
                <button
                  onClick={() => setIsDepositModalOpen(true)}
                  className="mt-2 w-full py-3 bg-[#1E90FF] hover:bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Wallet className="w-4 h-4" />
                  Déposer avec NATCASH / MonCash
                </button>
              </div>

              {/* NATCASH & MonCash Terminal Dark Card */}
              <div className="p-6 rounded-[32px] bg-[#1a1c23] text-white shadow-2xl flex flex-col justify-between border-t-4 border-[#1E90FF] space-y-4">
                <div className="space-y-3">
                  <h4 className="text-[#1E90FF] font-bold text-xs tracking-widest uppercase">Méthodes de Paiement Officielles</h4>
                  
                  {/* NATCASH */}
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-[#FF6321]">🟧 NATCASH</span>
                      <span className="text-gray-300 font-bold">{natcashConfig.name}</span>
                    </div>
                    <p className="font-mono text-base tracking-widest text-white font-black">{natcashConfig.number}</p>
                  </div>

                  {/* MonCash */}
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-red-500">🔴 MonCash</span>
                      <span className="text-gray-300 font-bold">{natcashConfig.moncashName || 'JOSELYNE TITY'}</span>
                    </div>
                    <p className="font-mono text-base tracking-widest text-white font-black">{natcashConfig.moncashNumber || '47124969'}</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed italic">
                  Entrez le code / ID de transaction lors de vos recharges ou commandes directes.
                </p>
              </div>

            </div>

          </div>
        </ScrollReveal>
      </section>

      {/* Popular Products Showcase */}
      <section className="max-w-7xl mx-auto space-y-8">
        <ScrollReveal direction="up">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold text-[#1E90FF] uppercase tracking-widest">Offres Spéciales</span>
              <h2 className="text-3xl font-black text-white">Produits les plus vendus</h2>
            </div>
            <button
              onClick={() => setActiveTab('produits')}
              className="flex items-center gap-2 text-xs font-bold text-[#1E90FF] hover:text-blue-400 transition-colors"
            >
              <span>Voir tout le catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
          {homeProducts.map((p, idx) => (
            <ScrollReveal key={p.id} direction="up" delay={idx * 0.04}>
              <div
                onClick={() => handleBuyProduct(p)}
                className="group p-4 rounded-2xl glass-card border border-white/10 hover:border-[#1E90FF] bg-slate-900/80 hover:bg-slate-900 flex flex-col justify-between space-y-3 cursor-pointer text-white transition-all shadow-md active:scale-95"
              >
                {/* Line 1: Pack Title */}
                <div className="text-center pt-1">
                  <span className="font-extrabold text-white text-xs sm:text-sm block leading-snug">
                    {p.name}
                  </span>
                </div>

                {/* Line 2: Price */}
                <div className="text-center bg-slate-950/90 py-2 rounded-xl border border-white/5">
                  <span className="text-xs sm:text-sm font-black text-[#1E90FF]">
                    ➜ {(p.priceHTG ?? 0).toLocaleString('fr-FR')} HTG
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuyProduct(p);
                  }}
                  className="w-full py-2 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-[11px] sm:text-xs shadow-md shadow-blue-500/20 transition-transform"
                >
                  Acheter
                </button>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* How it works - Step by Step */}
      <section className="max-w-7xl mx-auto">
        <ScrollReveal direction="up">
          <div className="p-8 sm:p-12 rounded-[32px] glass-card border border-white/12 space-y-10 text-white">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-black text-[#1E90FF] uppercase tracking-widest">Guide Rapide</span>
              <h2 className="text-3xl font-black text-white">Comment acheter sur FRAYZEN SHOP ?</h2>
              <p className="text-xs text-slate-400">Procédure simple en 3 étapes sécurisées par NATCASH & MonCash</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ScrollReveal direction="up" delay={0.1}>
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative shadow-sm h-full">
                  <span className="w-10 h-10 rounded-xl bg-[#1E90FF] text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/30">1</span>
                  <h3 className="text-base font-extrabold text-white">Choisissez votre Pack</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Sélectionnez la quantité de diamants Free Fire ou la carte cadeau de votre choix dans notre catalogue.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.2}>
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative shadow-sm h-full">
                  <span className="w-10 h-10 rounded-xl bg-[#FF0000] text-white font-black text-lg flex items-center justify-center shadow-md shadow-red-500/30">2</span>
                  <h3 className="text-base font-extrabold text-white">Payez via NATCASH ou MonCash</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Effectuez le transfert vers <strong>NATCASH ({natcashConfig.number} - {natcashConfig.name})</strong> ou <strong>MonCash ({natcashConfig.moncashNumber || '47124969'} - {natcashConfig.moncashName || 'JOSELYNE TITY'})</strong>.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.3}>
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative shadow-sm h-full">
                  <span className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-500/30">3</span>
                  <h3 className="text-base font-extrabold text-white">Recevez votre PIN / Recharge</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Votre code PIN ou recharge directe sur votre ID Joueur est délivré instantanément.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Safety NATCASH Banner */}
      <section className="max-w-7xl mx-auto">
        <ScrollReveal direction="up">
          <div className="p-8 rounded-[32px] bg-gradient-to-r from-blue-600 via-[#1E90FF] to-indigo-700 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-amber-300 font-extrabold text-sm">
                <Shield className="w-5 h-5" />
                <span>Paiements & Dépôts 100% Sécurisés</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black">Portefeuille Wallet Sécurisé par NATCASH & MonCash</h3>
              <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
                Rechargez votre solde instantanément en toute tranquillité. Vos dépôts sont immédiatement validés pour des achats de dyamant sans attente.
              </p>
            </div>

            <button
              onClick={() => setIsDepositModalOpen(true)}
              className="px-8 py-4 rounded-2xl bg-white text-[#1E90FF] hover:bg-blue-50 font-black text-sm shadow-xl hover:scale-105 transition-all shrink-0"
            >
              Recharger Mon Wallet Maintenant
            </button>
          </div>
        </ScrollReveal>
      </section>

    </div>
  );
};
