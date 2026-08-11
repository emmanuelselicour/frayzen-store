import React from 'react';
import { useApp } from '../context/AppContext';
import { Wallet as WalletIcon, ShieldCheck, Clock, CheckCircle2, XCircle, Plus, ArrowUpRight, Copy, Check } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

export const Wallet: React.FC = () => {
  const { user, deposits, setIsDepositModalOpen, natcashConfig, setIsAuthModalOpen } = useApp();

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Title */}
      <ScrollReveal direction="up">
        <div className="text-center space-y-2 pt-4">
          <span className="px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-bold text-[#1E90FF] uppercase tracking-wider">
            Portefeuille SÉCURISÉ
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Gestion de votre Wallet</h1>
          <p className="text-xs text-slate-400">Rechargez votre solde instantanément via NATCASH ou MonCash pour vos achats gaming</p>
        </div>
      </ScrollReveal>

      {/* Main Balance Card */}
      <ScrollReveal direction="up" delay={0.1}>
        <div className="p-8 rounded-[32px] glass-card border border-white/12 relative overflow-hidden shadow-xl space-y-6 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
                <WalletIcon className="w-4 h-4 text-[#1E90FF]" />
                <span>Solde Disponible</span>
              </div>
              <p className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                {user ? `${user.walletBalanceHTG.toLocaleString('fr-FR')} HTG` : '0 HTG'}
              </p>
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1 pt-1">
                <ShieldCheck className="w-4 h-4" />
                Compte Protégé Anti-Doublon NATCASH & MonCash
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {user ? (
                <button
                  onClick={() => setIsDepositModalOpen(true)}
                  className="px-6 py-4 rounded-2xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:scale-105 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Déposer (NATCASH / MonCash)
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-6 py-4 rounded-2xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-sm shadow-md"
                >
                  Se Connecter pour Recharger
                </button>
              )}
            </div>
          </div>

          {/* NATCASH & MonCash Quick Details Bar */}
          <div className="p-4 rounded-2xl bg-slate-950 text-white border-t-2 border-[#1E90FF] flex flex-col md:flex-row items-center justify-between gap-4 text-xs shadow-md">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-[#FF6321] text-white font-black text-[10px]">🟧 NATCASH</span>
                <span className="text-slate-300 font-mono"><strong className="text-white">{natcashConfig.number}</strong> ({natcashConfig.name})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-red-600 text-white font-black text-[10px]">🔴 MonCash</span>
                <span className="text-slate-300 font-mono"><strong className="text-white">{natcashConfig.moncashNumber || '47124969'}</strong> ({natcashConfig.moncashName || 'JOSELYNE TITY'})</span>
              </div>
            </div>
            <span className="text-slate-400 text-[11px] font-semibold">Validation automatique par code de transaction</span>
          </div>

        </div>
      </ScrollReveal>

      {/* Deposit Requests History */}
      <ScrollReveal direction="up" delay={0.2}>
        <div className="p-6 rounded-3xl glass-card border border-white/12 space-y-4 text-white">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#1E90FF]" />
          Historique de vos Dépôts NATCASH & MonCash
        </h3>

        {deposits.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <p>Vous n'avez effectué aucun dépôt pour le moment.</p>
            <p className="text-[11px] text-slate-500">Cliquez sur "Déposer (NATCASH / MonCash)" pour créditer votre portefeuille.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">ID Transaction</th>
                  <th className="py-3 px-4">Montant HTG</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Note Administrateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {deposits.map(dep => (
                  <tr key={dep.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {new Date(dep.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white tracking-wider">
                      {dep.transactionId14}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#1E90FF]">
                      +{dep.amountHTG.toLocaleString('fr-FR')} HTG
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {dep.status === 'valide' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Validé
                        </span>
                      )}
                      {dep.status === 'en_attente' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          En attente
                        </span>
                      )}
                      {dep.status === 'rejete' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                          <XCircle className="w-3.5 h-3.5" />
                          Rejeté
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 italic">
                      {dep.adminNote || 'En cours de vérification...'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </ScrollReveal>

    </div>
  );
};
