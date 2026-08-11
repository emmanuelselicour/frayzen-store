import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, CheckCircle, ExternalLink, X, ShieldAlert } from 'lucide-react';

export const EmailVerifyModal: React.FC = () => {
  const { isVerifyModalOpen, setIsVerifyModalOpen, user, verifyUserEmail } = useApp();
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isVerifyModalOpen || !user) return null;

  const handleVerifyConfirm = async () => {
    setIsVerifying(true);
    await verifyUserEmail(user.email);
    setIsVerifying(false);
  };

  const handleOpenGmail = () => {
    window.open('https://mail.google.com', '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 rounded-3xl glass-card border border-white/15 shadow-2xl space-y-5 text-center text-white">
        
        <button
          onClick={() => setIsVerifyModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto rounded-full bg-[#1E90FF] p-1 flex items-center justify-center shadow-md">
          <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-[#1E90FF] animate-bounce" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-white">
            Vérification d'adresse Email Obligatoire
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Pour sécuriser votre compte <strong className="text-[#1E90FF]">{user.email}</strong> et débloquer les achats de diamants Free Fire et recharges portefeuille, vous devez confirmer votre adresse email.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-800/80 text-left flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200 leading-normal">
            Cliquez sur le bouton ci-dessous pour ouvrir votre application Gmail ou votre boîte mail. Un code/lien de vérification y a été envoyé.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleOpenGmail}
            className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-transform active:scale-95"
          >
            <Mail className="w-4 h-4" />
            Ouvrir l'application Gmail
            <ExternalLink className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={handleVerifyConfirm}
            disabled={isVerifying}
            className="w-full py-3 px-4 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" />
            {isVerifying ? 'Vérification en cours...' : 'J\'ai vérifié mon email sur Gmail'}
          </button>
        </div>

        <p className="text-[10px] text-slate-400">
          En cas de problème, contactez notre support NATCASH.
        </p>
      </div>
    </div>
  );
};
