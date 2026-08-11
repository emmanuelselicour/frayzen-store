import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Copy, Check, Gift, ExternalLink, ShieldCheck, Clock, CheckCircle2, XCircle, Gamepad2, ArrowRight, User } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

export const MesCommandes: React.FC = () => {
  const { user, orders, setActiveTab, setIsAuthModalOpen } = useApp();
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  const handleCopyPin = (pin: string, orderId: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedOrderId(orderId);
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center text-white space-y-6">
        <ScrollReveal direction="up">
          <div className="p-8 sm:p-12 rounded-3xl glass-card border border-white/15 shadow-2xl space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#1E90FF]/20 border border-[#1E90FF]/40 flex items-center justify-center text-[#1E90FF]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">Connexion Requise</h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Connectez-vous ou créez un compte FRAYZEN SHOP pour consulter l'historique de vos commandes, vos PINs reçus et vos reçus de paiements.
              </p>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-8 py-3.5 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-sm shadow-xl shadow-blue-500/20 inline-flex items-center gap-2 transition-transform active:scale-95"
            >
              <User className="w-4 h-4" /> Se connecter / S'inscrire <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </ScrollReveal>
      </div>
    );
  }

  const myOrders = orders.filter(o => o.userEmail.toLowerCase() === user.email.toLowerCase());
  const totalSpent = myOrders.filter(o => o.status === 'reussi').reduce((acc, o) => acc + o.priceHTG, 0);
  const successfulCount = myOrders.filter(o => o.status === 'reussi').length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 text-white">
      
      {/* Page Header */}
      <ScrollReveal direction="up">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#1E90FF]" />
              <h1 className="text-2xl sm:text-3xl font-black text-white">Mes Commandes</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Retrouvez l'historique complet de vos achats de diamants et vos codes PIN attribués.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('produits')}
            className="px-5 py-2.5 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-transform active:scale-95"
          >
            + Nouvelle Commande
          </button>
        </div>
      </ScrollReveal>

      {/* Summary Cards */}
      <ScrollReveal direction="up" delay={0.05}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl glass-card border border-white/10 bg-slate-900/80 space-y-1">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Commandes Passées</p>
            <p className="text-2xl font-black text-white">{myOrders.length}</p>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-emerald-500/20 bg-slate-900/80 space-y-1">
            <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Commandes Réussies</p>
            <p className="text-2xl font-black text-emerald-400">{successfulCount}</p>
          </div>

          <div className="p-4 rounded-2xl glass-card border border-blue-500/20 bg-slate-900/80 space-y-1">
            <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">Total Dépensé</p>
            <p className="text-2xl font-black text-blue-300">{(totalSpent ?? 0).toLocaleString('fr-FR')} HTG</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Orders List */}
      {myOrders.length === 0 ? (
        <ScrollReveal direction="up" delay={0.1}>
          <div className="p-10 rounded-3xl glass-card border border-white/10 text-center space-y-4">
            <ShoppingBag className="w-12 h-12 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Aucune commande pour le moment</h3>
              <p className="text-xs text-slate-400">
                Vous n'avez pas encore acheté de pack Free Fire. Choisissez un pack pour commencer.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('accueil')}
              className="px-6 py-2.5 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all"
            >
              Découvrir les Offres
            </button>
          </div>
        </ScrollReveal>
      ) : (
        <div className="space-y-4">
          {myOrders.map((ord, idx) => (
            <ScrollReveal key={ord.id} direction="up" delay={idx * 0.04}>
              <div className="p-5 rounded-2xl glass-card border border-white/10 bg-slate-900/90 hover:border-slate-700 transition-all space-y-4 shadow-lg">
                
                {/* Header: ID, Date, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-white text-sm">{ord.id}</span>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleString('fr-FR', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        }) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <Gamepad2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>ID Joueur : <strong className="text-white font-mono">{ord.gamePlayerId}</strong></span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0 self-start sm:self-center">
                    {ord.status === 'reussi' && (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Réussi
                      </span>
                    )}
                    {ord.status === 'en_attente' && (
                      <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-spin" /> En attente
                      </span>
                    )}
                    {ord.status === 'echoue' && (
                      <span className="px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold inline-flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" /> Échoué
                      </span>
                    )}
                  </div>
                </div>

                {/* Body: Product details & Payment method */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                  <div>
                    <h4 className="font-black text-white text-base">{ord.productName}</h4>
                    <p className="text-xs text-slate-400">
                      Moyen de paiement : <span className="text-slate-200 font-semibold uppercase">{ord.paymentMethod === 'wallet' ? 'Portefeuille Wallet' : ord.paymentMethod}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-lg font-black text-[#1E90FF]">
                      {(ord.priceHTG ?? 0).toLocaleString('fr-FR')} HTG
                    </span>
                  </div>
                </div>

                {/* Delivered PIN Code Box */}
                {ord.pinCodeDelivered ? (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-[#FF6321]/80 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Code PIN Attribué</span>
                        <span className="font-mono font-black text-amber-300 text-base tracking-wider">{ord.pinCodeDelivered}</span>
                      </div>

                      <button
                        onClick={() => handleCopyPin(ord.pinCodeDelivered!, ord.id)}
                        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform active:scale-95"
                      >
                        {copiedOrderId === ord.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copiedOrderId === ord.id ? 'PIN Copié !' : 'Kopye PIN nan'}
                      </button>
                    </div>

                    <button
                      onClick={() => setActiveTab('redeempins')}
                      className="w-full py-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Gift className="w-4 h-4 text-amber-400" />
                      Réclamer mes diamants sur pin.wik.do
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  ord.status === 'en_attente' && (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Votre paiement est en cours de vérification par un administrateur. Dès validation, votre PIN s'affichera ici.</span>
                    </div>
                  )
                )}

              </div>
            </ScrollReveal>
          ))}
        </div>
      )}

    </div>
  );
};
