import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Phone, Mail, Lock, X, ArrowRight, ShieldCheck, LogIn, UserPlus } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, registerUser, loginUser } = useApp();
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (isLoginMode) {
      if (!emailOrPhone) {
        setIsSubmitting(false);
        return;
      }
      const success = await loginUser(emailOrPhone, password);
      setIsSubmitting(false);
      if (success) setIsAuthModalOpen(false);
    } else {
      if (!name || !email || !phone) {
        setIsSubmitting(false);
        return;
      }
      const success = await registerUser(name, email, phone, password);
      setIsSubmitting(false);
      if (success) setIsAuthModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md my-auto p-5 sm:p-8 rounded-3xl glass-card border border-white/15 shadow-2xl space-y-5 sm:space-y-6 text-white max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 transition-colors z-10"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#1E90FF] p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-[#1E90FF]" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white">
            {isLoginMode ? 'Connexion à votre compte' : 'Créer un compte FRAYZEN'}
          </h3>
          <p className="text-xs text-slate-400">
            {isLoginMode
              ? 'Saisissez vos identifiants pour vous connecter et accéder à votre solde.'
              : 'Créez un compte FRAYZEN SHOP pour recharger votre solde NATCASH / MonCash.'}
          </p>
        </div>

        {/* Tab Selector: Connexion vs Inscription */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setIsLoginMode(true)}
            className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
              isLoginMode
                ? 'bg-[#1E90FF] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setIsLoginMode(false)}
            className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
              !isLoginMode
                ? 'bg-[#1E90FF] text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLoginMode ? (
            /* LOGIN FORM */
            <>
              <div className="space-y-1">
                <label htmlFor="login-email-phone" className="text-xs font-bold text-slate-300">Adresse Email ou Téléphone</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="login-email-phone"
                    name="emailOrPhone"
                    type="text"
                    required
                    placeholder="Ex: jean.marc@gmail.com ou 50937882211"
                    value={emailOrPhone}
                    onChange={e => setEmailOrPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="login-password" className="text-xs font-bold text-slate-300">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>
            </>
          ) : (
            /* INSCRIPTION FORM */
            <>
              <div className="space-y-1">
                <label htmlFor="register-name" className="text-xs font-bold text-slate-300">Nom Complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="register-name"
                    name="name"
                    type="text"
                    required
                    placeholder="Ex: Jean Marc Joseph"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="register-email" className="text-xs font-bold text-slate-300">Adresse Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="register-email"
                    name="email"
                    type="email"
                    required
                    placeholder="Ex: jean.marc@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="register-phone" className="text-xs font-bold text-slate-300">Numéro Téléphone NATCASH / MonCash</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="Ex: 50937882211"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="register-password" className="text-xs font-bold text-slate-300">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    id="register-password"
                    name="password"
                    type="password"
                    placeholder="Créez votre mot de passe"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              'Vérification...'
            ) : isLoginMode ? (
              <>
                Se connecter <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                S'inscrire et continuer <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-center text-slate-400">
          En continuant, vous acceptez les conditions de service et la politique de sécurité de FRAYZEN SHOP.
        </p>
      </div>
    </div>
  );
};
