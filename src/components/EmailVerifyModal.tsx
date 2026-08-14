import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, CheckCircle2, ExternalLink, X, AlertCircle, RefreshCw } from 'lucide-react';

export const EmailVerifyModal: React.FC = () => {
  const { isVerifyModalOpen, setIsVerifyModalOpen, user, verifyUserEmail, resendVerification } = useApp();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  if (!isVerifyModalOpen || !user) return null;

  const handleVerifyConfirm = async () => {
    setIsVerifying(true);
    await verifyUserEmail(user.email);
    setIsVerifying(false);
  };

  const handleResend = async () => {
    setIsResending(true);
    await resendVerification(user.email);
    setIsResending(false);
  };

  const handleOpenGmail = () => {
    window.open('https://mail.google.com', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md my-auto p-5 sm:p-7 rounded-3xl glass-card border border-white/15 shadow-2xl space-y-5 text-center text-white max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={() => setIsVerifyModalOpen(false)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="relative w-16 h-16 mx-auto">
            <img
              src="/logo.jpeg"
              alt="FRAYZEN SHOP"
              className="w-16 h-16 rounded-2xl object-cover border border-[#1E90FF]/40 shadow-lg mx-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1 border-2 border-slate-900 shadow">
              <Mail className="w-3.5 h-3.5 text-slate-950 font-bold" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1E90FF]/15 border border-[#1E90FF]/30 text-[#1E90FF] text-[11px] font-extrabold uppercase tracking-wider">
            FRAYZEN SHOP AUTH
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white">
            Vérification d'adresse Gmail
          </h3>
          <p className="text-xs text-slate-300">
            Pou sekirize kont ou sou FRAYZEN SHOP, ou dwe valide email ou sou Gmail.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-[#1E90FF]/30 text-center space-y-1">
          <span className="text-[11px] text-slate-400">Email de votre compte :</span>
          <p className="text-sm font-black text-[#1E90FF] break-all">
            {user.email}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5 text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-300">
              Ouvri Gmail ou, klike sou lyen konfimasyon <strong>FRAYZEN SHOP</strong> la pou aktive tout sèvis yo (Achte Diamonds, Depo Natcash/MonCash).
            </p>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            onClick={handleOpenGmail}
            className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-transform active:scale-98"
          >
            <Mail className="w-4 h-4" />
            Ouvrir l'application Gmail
            <ExternalLink className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={handleVerifyConfirm}
            disabled={isVerifying}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isVerifying ? 'Vérification en cours...' : 'J\'ai cliqué sur le lien (Valider)'}
          </button>

          <button
            onClick={handleResend}
            disabled={isResending}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
            {isResending ? 'Envoi en cours...' : 'Renvoyer l\'email de confirmation'}
          </button>
        </div>

        <p className="text-[10px] text-slate-400">
          Besoin d'aide ? Contactez notre support WhatsApp ou écrivez-nous dans l'onglet Contact.
        </p>
      </div>
    </div>
  );
};
