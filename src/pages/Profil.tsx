import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Mail, Phone, Calendar, Wallet, CheckCircle2, XCircle, Copy, Check, ExternalLink, ShieldCheck, ShoppingBag, LogOut, Gift } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

export const Profil: React.FC = () => {
  const { user, setUser, orders, setActiveTab, setIsVerifyModalOpen, setIsAuthModalOpen } = useApp();
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 rounded-3xl glass-card border border-white/12 text-center space-y-4 text-white">
        <User className="w-12 h-12 mx-auto text-[#1E90FF]" />
        <h2 className="text-2xl font-black text-white">Non Connecté</h2>
        <p className="text-xs text-slate-400">Veuillez vous connecter pour afficher les détails de votre profil et vos achats.</p>
        <button
          onClick={() => setIsAuthModalOpen(true)}
          className="w-full py-3 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md"
        >
          Se connecter
        </button>
      </div>
    );
  }

  const handleCopy = (pin: string, id: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPinId(id);
    setTimeout(() => setCopiedPinId(null), 2500);
  };

  const successfulOrders = orders.filter(o => o.status === 'reussi');
  const failedOrders = orders.filter(o => o.status === 'echoue');
  const pendingOrders = orders.filter(o => o.status === 'en_attente');

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Title */}
      <ScrollReveal direction="up">
        <div className="text-center space-y-2 pt-4">
          <span className="px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-bold text-[#1E90FF] uppercase tracking-wider">
            Compte Utilisateur
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Profil & Historique d'Achats</h1>
          <p className="text-xs text-slate-400">Gestion de vos informations personnelles et récupération de vos codes PINs</p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* User Information Card */}
        <ScrollReveal direction="right" className="lg:col-span-5">
          <div className="p-6 rounded-3xl glass-card border border-white/12 space-y-6 text-white">
          
          <div className="flex items-center gap-4 pb-4 border-b border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-[#1E90FF] p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-2xl text-[#1E90FF]">
                {user.name.charAt(0)}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">{user.name}</h3>
              <p className="text-xs text-slate-400">{user.email}</p>
              {user.isEmailVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Email Vérifié
                </span>
              ) : (
                <button
                  onClick={() => setIsVerifyModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 mt-1 animate-pulse underline"
                >
                  Email Non Vérifié (Vérifier maintenant)
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-sm">
              <span className="text-slate-400 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#1E90FF]" /> Numéro Téléphone:
              </span>
              <strong className="text-white font-mono">{user.phone}</strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between shadow-sm">
              <span className="text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF0000]" /> Date de Création:
              </span>
              <strong className="text-white">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: '2-digit', year: 'numeric'
                }) : 'N/A'}
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-800/80 flex items-center justify-between shadow-sm">
              <span className="text-slate-300 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#1E90FF]" /> Solde Wallet:
              </span>
              <strong className="text-lg font-black text-white">{(user.walletBalanceHTG ?? 0).toLocaleString('fr-FR')} HTG</strong>
            </div>

          </div>

          {/* Verification Callout if unverified */}
          {!user.isEmailVerified && (
            <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-800/80 space-y-2">
              <p className="text-xs text-amber-300 font-bold">Vérification Email Requise</p>
              <p className="text-[11px] text-amber-200">Ouvrez l'application Gmail pour confirmer votre compte.</p>
              <button
                onClick={() => window.open('https://mail.google.com', '_blank')}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Mail className="w-4 h-4" /> Ouvrir Gmail
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setUser(null)}
            className="w-full py-2.5 rounded-xl bg-slate-900/80 hover:bg-red-950/50 border border-slate-800 text-slate-300 hover:text-red-400 text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>

        </div>
        </ScrollReveal>

        {/* Purchases & Statistics Right Column */}
        <ScrollReveal direction="left" className="lg:col-span-7">
          <div className="space-y-6">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl glass-card border border-emerald-500/30 text-center shadow-sm">
              <p className="text-2xl font-black text-emerald-400">{successfulOrders.length}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Achats Réussis</p>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-amber-500/30 text-center shadow-sm">
              <p className="text-2xl font-black text-amber-300">{pendingOrders.length}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">En Attente</p>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-red-500/30 text-center shadow-sm">
              <p className="text-2xl font-black text-red-400">{failedOrders.length}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Achats Échoués</p>
            </div>
          </div>

          {/* Orders Table */}
          <div className="p-6 rounded-3xl glass-card border border-white/12 space-y-4 text-white">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#1E90FF]" />
              Vos Commandes & Codes PINs
            </h3>

            {orders.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Aucune commande enregistrée pour ce compte.</p>
            ) : (
              <div className="space-y-3">
                {orders.map(ord => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs shadow-sm text-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-sm">{ord.productName}</span>
                      <span className="font-black text-[#1E90FF]">{(ord.priceHTG ?? 0).toLocaleString('fr-FR')} HTG</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>ID Joueur: <strong className="text-white font-mono">{ord.gamePlayerId}</strong></span>
                      <span>{ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</span>
                    </div>

                    {ord.pinCodeDelivered && (
                      <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-[#FF6321]/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-amber-300 text-sm tracking-wider">{ord.pinCodeDelivered}</span>
                          <button
                            onClick={() => handleCopy(ord.pinCodeDelivered!, ord.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-md transition-transform active:scale-95"
                          >
                            {copiedPinId === ord.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedPinId === ord.id ? 'Copie !' : 'Kopye PIN nan'}
                          </button>
                        </div>
                        <button
                          onClick={() => setActiveTab('redeempins')}
                          className="w-full py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-extrabold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Gift className="w-3.5 h-3.5 text-amber-400" />
                          Réclamer mes diamants (redeem.hype.games)
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
        </ScrollReveal>

      </div>

    </div>
  );
};
