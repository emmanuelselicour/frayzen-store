import React from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  MessageCircle,
  Mail,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

export const AlertModal: React.FC = () => {
  const {
    notification,
    setNotification,
    setActiveTab,
    setIsDepositModalOpen,
    setIsVerifyModalOpen,
    setIsAuthModalOpen,
    natcashConfig
  } = useApp();

  if (!notification) return null;

  const isStockOrPinNotice =
    notification.message.toLowerCase().includes('pin') ||
    notification.message.toLowerCase().includes('stock') ||
    notification.message.toLowerCase().includes('attendez-nous') ||
    notification.message.toLowerCase().includes('contactez nous') ||
    notification.message.toLowerCase().includes('rupture');

  const isBalanceNotice =
    notification.message.toLowerCase().includes('solde') ||
    notification.message.toLowerCase().includes('portefeuille');

  const isEmailNotice =
    notification.message.toLowerCase().includes('email') &&
    (notification.message.toLowerCase().includes('vérifi') || notification.message.toLowerCase().includes('active'));

  const isAuthNotice =
    notification.message.toLowerCase().includes('connecter') ||
    notification.message.toLowerCase().includes('compte');

  const supportPhone = natcashConfig.supportPhone || natcashConfig.number || '41355116';
  const cleanPhone = supportPhone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('509') ? cleanPhone : `509${cleanPhone}`}?text=${encodeURIComponent('Bonjour FRAYZEN SHOP, je vous contacte au sujet d\'un pack de diamants Free Fire.')}`;

  const handleClose = () => {
    setNotification(null);
  };

  const isError = notification.type === 'error';
  const isSuccess = notification.type === 'success';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Outer Card with Animated Multi-Color Glowing Border */}
      <div className="relative w-full max-w-md my-auto p-[2.5px] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Glowing Background Blur Layer */}
        <div
          className={`absolute inset-0 ${
            isError ? 'animated-gradient-border-danger-glow' : 'animated-gradient-border-glow'
          } opacity-85`}
        />

        {/* Moving Animated Gradient Border */}
        <div
          className={`absolute inset-0 ${
            isError ? 'animated-gradient-border-danger' : 'animated-gradient-border'
          }`}
        />

        {/* Inner Content Card */}
        <div className="relative bg-[#0d121f]/95 backdrop-blur-2xl rounded-[22px] p-5 sm:p-7 text-white space-y-5 border border-white/10">
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors z-10"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon + Brand Badge */}
          <div className="text-center space-y-2 pt-1">
            <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
              {isSuccess ? (
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              ) : isStockOrPinNotice ? (
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Zap className="w-8 h-8" />
                </div>
              ) : isError ? (
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shadow-lg shadow-red-500/20">
                  <AlertCircle className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#1E90FF]/20 border border-[#1E90FF]/40 text-[#1E90FF] flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Info className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#1E90FF]/15 border border-[#1E90FF]/30 text-[#1E90FF] text-[10px] font-extrabold uppercase tracking-wider">
              {isStockOrPinNotice
                ? 'STOCK & LIVRAISON'
                : isSuccess
                ? 'SUCCÈS'
                : isError
                ? 'INFORMATION IMPORTANTE'
                : 'NOTIFICATION'}
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white">
              {isStockOrPinNotice
                ? 'Information sur le Stock'
                : isSuccess
                ? 'Opération Réussie !'
                : isError
                ? 'Notification'
                : 'FRAYZEN SHOP'}
            </h3>
          </div>

          {/* Main Message Box */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-200 leading-relaxed">
              {notification.message}
            </p>
            {isStockOrPinNotice && (
              <p className="text-xs text-amber-300/90 pt-1">
                Ou mèt kontakte sipò a dirèk sou WhatsApp pou plis enfòmasyon oswa pou rezève PIN ou.
              </p>
            )}
          </div>

          {/* Action Buttons based on notification context */}
          <div className="space-y-2.5 pt-1">
            
            {/* If out of stock / PIN notice -> Direct WhatsApp & Contact Page */}
            {isStockOrPinNotice && (
              <>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClose}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-transform active:scale-98"
                >
                  <MessageCircle className="w-4 h-4" />
                  Discuter direct sur WhatsApp ({supportPhone})
                </a>

                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    setActiveTab('contact');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#1E90FF]" />
                  Envoyer un message (Page Contact)
                </button>
              </>
            )}

            {/* If insufficient balance notice -> Recharger Wallet */}
            {isBalanceNotice && !isStockOrPinNotice && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  setIsDepositModalOpen(true);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-transform active:scale-98"
              >
                <Wallet className="w-4 h-4" />
                Recharger mon portefeuille (NATCASH / MonCash)
              </button>
            )}

            {/* If email verification notice -> Ouvrir vérification */}
            {isEmailNotice && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  setIsVerifyModalOpen(true);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition-transform active:scale-98"
              >
                <ShieldCheck className="w-4 h-4" />
                Vérifier mon adresse Gmail
              </button>
            )}

            {/* If auth required notice -> Ouvrir Auth Modal */}
            {isAuthNotice && !isEmailNotice && !isStockOrPinNotice && !isBalanceNotice && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-transform active:scale-98"
              >
                Se connecter / Créer un compte
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Main Dismiss Button */}
            <button
              type="button"
              onClick={handleClose}
              className={`w-full py-3 px-4 rounded-xl text-white font-extrabold text-xs sm:text-sm transition-all active:scale-98 ${
                isStockOrPinNotice || isBalanceNotice || isEmailNotice || isAuthNotice
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                  : isSuccess
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-md'
                  : 'bg-[#1E90FF] hover:bg-blue-600 shadow-md'
              }`}
            >
              {isStockOrPinNotice ? "D'accord, j'ai compris" : "D'accord"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
