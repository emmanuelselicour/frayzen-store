import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Phone, Mail, Lock, X, ArrowRight, ShieldCheck, LogIn, UserPlus, ExternalLink, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, registerUser, loginUser, resendVerification } = useApp();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [verificationPending, setVerificationPending] = useState<{
    email: string;
    name?: string;
    message?: string;
  } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    if (isLoginMode) {
      if (!emailOrPhone || !password) {
        setAuthError('Veuillez renseigner votre email/téléphone et votre mot de passe.');
        setIsSubmitting(false);
        return;
      }
      const res = await loginUser(emailOrPhone, password);
      setIsSubmitting(false);
      if (res.requiresVerification) {
        setVerificationPending({
          email: res.email || emailOrPhone,
          name: res.name,
          message: res.message
        });
      } else if (res.success) {
        setVerificationPending(null);
        setAuthError(null);
        setIsAuthModalOpen(false);
      } else {
        setAuthError(res.message || 'Mot de passe ou email incorrect. Si vous n\'avez pas de compte, veuillez en créer un.');
      }
    } else {
      if (!name || !email || !phone || !password) {
        setAuthError('Tous les champs y compris le mot de passe sont obligatoires.');
        setIsSubmitting(false);
        return;
      }
      if (password.length < 4) {
        setAuthError('Le mot de passe doit contenir au moins 4 caractères.');
        setIsSubmitting(false);
        return;
      }
      const res = await registerUser(name, email, phone, password);
      setIsSubmitting(false);
      if (res.requiresVerification) {
        setVerificationPending({
          email: res.email || email,
          name: res.name || name,
          message: res.message
        });
      } else if (res.success) {
        setVerificationPending(null);
        setAuthError(null);
        setIsAuthModalOpen(false);
      } else {
        setAuthError(res.message || 'Erreur lors de la création du compte.');
      }
    }
  };

  const handleResend = async () => {
    if (!verificationPending?.email) return;
    setIsResending(true);
    await resendVerification(verificationPending.email);
    setIsResending(false);
  };

  const handleOpenGmail = () => {
    window.open('https://mail.google.com', '_blank');
  };

  const handleResetToLogin = () => {
    setVerificationPending(null);
    setIsLoginMode(true);
    if (verificationPending?.email) {
      setEmailOrPhone(verificationPending.email);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md my-auto p-5 sm:p-8 rounded-3xl glass-card border border-white/15 shadow-2xl space-y-5 sm:space-y-6 text-white max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={() => {
            setIsAuthModalOpen(false);
            setVerificationPending(null);
          }}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 transition-colors z-10"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {verificationPending ? (
          /* ================================================================= */
          /* VERIFICATION PENDING SCREEN (BLOCKING PROMPT)                     */
          /* ================================================================= */
          <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="relative w-16 h-16 mx-auto">
                <img
                  src="/logo.jpeg"
                  alt="FRAYZEN SHOP"
                  className="w-16 h-16 rounded-2xl object-cover border border-[#1E90FF]/40 shadow-lg mx-auto"
                  onError={(e) => {
                    // Fallback to icon if image fails
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
                Vérification Gmail Obligatoire
              </h3>
              <p className="text-xs text-slate-300">
                Kont ou a anrejistre, men li bezwen aktive avan w ka konekte.
              </p>
            </div>

            {/* Email target callout */}
            <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-[#1E90FF]/30 text-center space-y-1">
              <span className="text-[11px] text-slate-400">Email de confirmation envoyé à :</span>
              <p className="text-sm font-black text-[#1E90FF] break-all">
                {verificationPending.email}
              </p>
            </div>

            {/* Instructions box in Haitian Creole & French */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs leading-relaxed">
              <div className="flex items-start gap-2.5 text-amber-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-200 text-xs">Poukisa ou resevwa email sa a ?</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Pou pwoteje kont ou, sekirize lajan ou sou Natcash / MonCash, epi asire se ou menm ki resevwa recharges Free Fire yo.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-2.5 text-[11px] text-slate-300 space-y-1.5">
                <p className="font-bold text-white text-xs">📋 Sa ou dwe fè :</p>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#1E90FF]/20 text-[#1E90FF] flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                  <span>Ouvri aplikasyon <strong>Gmail</strong> ou a sou telefòn ou oswa sou òdinatè w.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#1E90FF]/20 text-[#1E90FF] flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                  <span>Chèche email ki gen tit <strong>"FRAYZEN SHOP - Confirmez votre compte"</strong> (Verifye tou nan spam/promotions si w pa wè l).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-[#1E90FF]/20 text-[#1E90FF] flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                  <span>Klike sou bouton <strong>"Confirmer mon compte"</strong> ki nan email la.</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleOpenGmail}
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-900/30 transition-transform active:scale-98"
              >
                <Mail className="w-4 h-4" />
                Ouvrir l'application Gmail
                <ExternalLink className="w-4 h-4 ml-1" />
              </button>

              <button
                type="button"
                onClick={handleResetToLogin}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mwen klike sou lyen an (Se connecter)
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                {isResending ? 'Envoi en cours...' : 'Renvoyer l\'email de confirmation'}
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setVerificationPending(null)}
                className="text-[11px] text-slate-400 hover:text-[#1E90FF] underline transition-colors"
              >
                ← Changer d'adresse email ou retourner
              </button>
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* STANDARD LOGIN / REGISTER FORM                                    */
          /* ================================================================= */
          <>
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
                onClick={() => {
                  setIsLoginMode(true);
                  setAuthError(null);
                }}
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
                onClick={() => {
                  setIsLoginMode(false);
                  setAuthError(null);
                }}
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

            {/* Error Message Banner */}
            {authError && (
              <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-xs space-y-2 animate-in fade-in duration-200">
                <div className="flex items-start gap-2 text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="font-semibold leading-relaxed">{authError}</p>
                </div>
                {isLoginMode && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(false);
                      setAuthError(null);
                    }}
                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline block"
                  >
                    👉 Vous n'avez pas de compte ? Cliquez ici pour en créer un
                  </button>
                )}
              </div>
            )}

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
                        required
                        minLength={4}
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
                        required
                        minLength={4}
                        placeholder="Créez votre mot de passe (min. 4 caractères)"
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
          </>
        )}
      </div>
    </div>
  );
};
