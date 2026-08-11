import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { Zap, ArrowLeft, Phone, ShieldCheck, Flame, ShoppingCart } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

export const Produits: React.FC = () => {
  const { products, setSelectedProduct, setActiveTab } = useApp();
  const [showDetail, setShowDetail] = useState(false);

  // Main Free Fire Product Info for single card
  const ffMainImage = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80';

  const handleSelectPack = (p: Product) => {
    setSelectedProduct(p);
    setActiveTab('paiement');
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* If showing main shop list (Single Product Card) */}
      {!showDetail ? (
        <div className="max-w-xl mx-auto space-y-6 pt-4">
          <div className="text-center space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-bold text-[#1E90FF] uppercase tracking-wider">
              Boutique Officielle
            </span>
            <h1 className="text-3xl font-black text-white">
              Catalogue Produits
            </h1>
            <p className="text-xs text-slate-400">
              Cliquez sur le produit ci-dessous pour voir la description complète et choisir votre pack.
            </p>
          </div>

          {/* SINGLE PRODUCT CARD */}
          <ScrollReveal direction="up">
            <div
              onClick={() => setShowDetail(true)}
              className="group p-6 rounded-3xl glass-card border border-white/12 hover:border-[#1E90FF]/60 cursor-pointer transition-all duration-300 hover:scale-[1.01] space-y-5 text-white shadow-2xl relative overflow-hidden"
            >
              <div className="relative rounded-2xl overflow-hidden h-56 bg-slate-900">
                <img
                  src={ffMainImage}
                  alt="Free Fire Top Up"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#FF0000] text-white text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-white" />
                  Populaire
                </span>
                <span className="absolute bottom-3 right-3 px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur-md text-[#1E90FF] text-xs font-black border border-blue-500/30 shadow-md">
                  {products.length} Packs Disponibles
                </span>
              </div>

              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-black text-white group-hover:text-[#1E90FF] transition-colors">
                  📢 𝑭𝑹𝑨𝒀𝒁𝑬𝑵 𝑺𝑯𝑶𝑷 - Free Fire
                </h2>
                <p className="text-xs font-bold text-slate-300">
                  🎮 Top Up par ID, à l'instant • ⚡ Rapide • Sécurisé • Fiable
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  📞 Tel : 41355116
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetail(true);
                }}
                className="w-full py-3.5 rounded-2xl bg-[#1E90FF] hover:bg-blue-600 text-white font-black text-xs shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ShoppingCart className="w-4 h-4" />
                Voir le produit & Choisir un pack
              </button>
            </div>
          </ScrollReveal>
        </div>
      ) : (
        /* PRODUCT DETAIL PAGE */
        <div className="max-w-4xl mx-auto space-y-6 pt-2">
          
          {/* Back Button */}
          <button
            onClick={() => setShowDetail(false)}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-2 border border-slate-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-[#1E90FF]" />
            Retour à la boutique
          </button>

          {/* Product Header & Description */}
          <ScrollReveal direction="up">
            <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/12 space-y-6 text-white shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 rounded-2xl overflow-hidden h-48 sm:h-56 bg-slate-900 border border-slate-800">
                  <img
                    src={ffMainImage}
                    alt="Free Fire"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="md:col-span-7 space-y-4">
                  <div className="space-y-1">
                    <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase border border-emerald-500/30">
                      Livraison Automatisée Par ID
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">
                      📢 𝑭𝑹𝑨𝒀𝒁𝑬𝑵 𝑺𝑯𝑶𝑷
                    </h1>
                    <p className="text-sm font-bold text-[#1E90FF]">
                      🎮 Top Up par ID, à l'instant
                    </p>
                  </div>

                  {/* Full Description Box */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-medium text-slate-300 leading-relaxed font-mono">
                    <p className="font-bold text-white text-sm">📢 𝑭𝑹𝑨𝒀𝒁𝑬𝑵 𝑺𝑯𝑶𝑷</p>
                    <p>🎮 Top Up par ID, à l'instant</p>
                    <p className="text-emerald-400 font-bold">⚡ Rapide • Sécurisé • Fiable</p>
                    <p className="text-amber-400 font-bold flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Tel : 41355116
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-[#1E90FF]" />
                    <span>Paiements acceptés : NATCASH & MonCash</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* PACKS SECTION - 2 COLUMNS ON MOBILE - SANS PHOTOS */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#1E90FF]" />
                Packs de Diamants Disponibles
              </h2>
              <span className="text-xs text-slate-400 font-bold">Sélectionnez un pack</span>
            </div>

            {/* 2 COLUMNS ON MOBILE (grid-cols-2) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPack(p)}
                  className="group p-4 rounded-2xl glass-card border border-white/10 hover:border-[#1E90FF] bg-slate-900/80 hover:bg-slate-900 flex flex-col justify-between space-y-3 cursor-pointer text-white transition-all shadow-md active:scale-95"
                >
                  {/* Ligne 1: Nom du pack */}
                  <div className="text-center pt-1">
                    <span className="font-extrabold text-white text-xs sm:text-sm block leading-snug">
                      {p.name}
                    </span>
                  </div>

                  {/* Ligne 2: Prix */}
                  <div className="text-center bg-slate-950/90 py-2 rounded-xl border border-white/5">
                    <span className="text-xs sm:text-sm font-black text-[#1E90FF]">
                      ➜ {p.priceHTG.toLocaleString('fr-FR')} HTG
                    </span>
                  </div>

                  {/* Bouton Acheter */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPack(p);
                    }}
                    className="w-full py-2 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-[11px] sm:text-xs shadow-md shadow-blue-500/20 transition-transform"
                  >
                    Acheter
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

