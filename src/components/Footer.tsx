import React from 'react';
import { useApp } from '../context/AppContext';
import { Shield, Smartphone, Mail, Heart, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setActiveTab, natcashConfig } = useApp();

  return (
    <footer className="mt-16 border-t border-white/10 bg-black/80 backdrop-blur-md py-10 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <img
                  src="/logo.jpeg"
                  alt="FRAYZEN SHOP Logo"
                  className="w-9 h-9 object-contain rounded-xl shadow-md"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextElementSibling) {
                      (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                    }
                  }}
                />
                <div
                  style={{ display: 'none' }}
                  className="w-9 h-9 bg-[#1E90FF] rounded-xl items-center justify-center shadow-md shadow-blue-500/20"
                >
                  <span className="text-white font-black text-lg">F</span>
                </div>
              </div>
              <span className="font-['Outfit'] font-black text-xl text-white tracking-tight">
                FRAYZEN <span className="text-[#1E90FF]">SHOP</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Plateforme numéro 1 pour l'achat instantané de diamants Free Fire, passes de combat et cartes cadeaux gaming avec recharges portefeuille sécurisées par NATCASH & MonCash.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-[#1E90FF]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Paiement 100% Sécurisé via NATCASH & MonCash</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Liens Rapides</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-300">
              <li>
                <button onClick={() => setActiveTab('accueil')} className="hover:text-[#1E90FF] transition-colors">
                  Accueil
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('produits')} className="hover:text-[#1E90FF] transition-colors">
                  Produits & Diamants
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('paiement')} className="hover:text-[#1E90FF] transition-colors">
                  Paiement Direct
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('wallet')} className="hover:text-[#1E90FF] transition-colors">
                  Recharge Portefeuille Wallet
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('faq')} className="hover:text-[#1E90FF] transition-colors">
                  Foire Aux Questions (FAQ)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('contact')} className="hover:text-[#1E90FF] transition-colors">
                  Contact & Support
                </button>
              </li>
            </ul>
          </div>

          {/* Payment Method Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Moyens de Paiement</h4>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#FF6321]">🟧 NATCASH</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px]">Actif</span>
              </div>
              <p className="text-slate-300 font-mono">N°: <strong className="text-white">{natcashConfig.number}</strong> ({natcashConfig.name})</p>
              
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="font-bold text-red-500">🔴 MonCash</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px]">Actif</span>
              </div>
              <p className="text-slate-300 font-mono">N°: <strong className="text-white">{natcashConfig.moncashNumber || '47124969'}</strong> ({natcashConfig.moncashName || 'JOSELYNE TITY'})</p>

              <p className="text-[10px] text-slate-400 leading-tight pt-1">
                Veuillez fournir un ID de transaction valide lors des recharges.
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Assistance Client</h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#1E90FF]" />
                <span>{natcashConfig.supportPhone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FF0000]" />
                <span>{natcashConfig.supportEmail}</span>
              </li>
              <li className="text-[11px] text-slate-400 mt-2">
                Service client disponible 7j/7 de 8h à 22h.
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright & Live Server Badge */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-medium text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} FRAYZEN SHOP. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#1E90FF] transition-colors">Conditions d'utilisation</a>
            <a href="#" className="hover:text-[#1E90FF] transition-colors">Politique de Confidentialité</a>
            <a href="#" className="hover:text-[#1E90FF] transition-colors">Support 24/7</a>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="font-bold text-slate-300">Service Actif 24/7</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
