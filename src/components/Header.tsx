import React, { useState, useEffect, useRef } from 'react';
import { useApp, TabType } from '../context/AppContext';
import { Shield, Wallet, User, Menu, X, ShieldAlert, Sparkles, LogOut, CheckCircle, AlertCircle, ShoppingCart, Gift, ShoppingBag, HelpCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    user,
    setUser,
    setIsDepositModalOpen,
    setIsVerifyModalOpen,
    setIsAuthModalOpen,
    natcashConfig
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoError, setLogoError] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Track scroll position for header glassmorphism effect
  useEffect(() => {
    const handleScrollState = () => {
      setIsScrolled(window.scrollY > 10);
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollState, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollState);
  }, [isMobileMenuOpen]);

  // Auto-close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        isMobileMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const navItems: { id: TabType; label: string; icon?: React.ReactNode }[] = [
    { id: 'accueil', label: 'Accueil' },
    { id: 'produits', label: 'Produits' },
    { id: 'paiement', label: 'Paiement' },
    { id: 'commandes', label: 'Mes Commandes', icon: <ShoppingBag className="w-4 h-4 text-[#1E90FF]" /> },
    { id: 'redeempins', label: 'Réclamer PINs', icon: <Gift className="w-4 h-4 text-amber-400" /> },
    { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-4 h-4 text-[#1E90FF]" /> },
    { id: 'faq', label: 'FAQ', icon: <HelpCircle className="w-4 h-4 text-emerald-400" /> },
    { id: 'contact', label: 'Contact' }
  ];

  const handleNavClick = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
      isScrolled 
        ? 'backdrop-blur-xl bg-black/90 border-b border-white/10 shadow-2xl py-1' 
        : 'backdrop-blur-md bg-black/75 border-b border-white/10 shadow-md py-2'
    } text-white`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div
            onClick={() => handleNavClick('accueil')}
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
          >
            {/* Logo image with fallback badge */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0">
              {!logoError ? (
                <img
                  src="/logo.jpeg"
                  alt="FRAYZEN SHOP Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-xl shadow-md transition-transform duration-300 group-hover:scale-105"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1E90FF] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 transition-transform duration-300 group-hover:scale-105">
                  <span className="text-white font-black text-sm sm:text-xl">F</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1">
                <span className="font-['Outfit'] font-black text-sm sm:text-lg md:text-2xl tracking-tight text-white">
                  FRAYZEN
                </span>
                <span className="font-['Outfit'] font-black text-sm sm:text-lg md:text-2xl tracking-tight text-[#1E90FF]">
                  SHOP
                </span>
              </div>
              <p className="hidden sm:block text-[9px] sm:text-[10px] tracking-widest text-slate-400 font-semibold uppercase -mt-0.5">
                Gaming & Recharges NATCASH
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Visible on lg screens and up) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 bg-slate-900/90 p-1.5 rounded-full border border-slate-800 backdrop-blur-md shrink-0">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 xl:px-4 py-1.5 rounded-full font-extrabold text-xs xl:text-sm whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-[#1E90FF] text-white shadow-md shadow-blue-500/30 scale-105'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Wallet, Profile, Admin (Visible on lg screens and up) */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3 shrink-0">
            {/* Wallet Quick Balance Button */}
            <div
              onClick={() => handleNavClick('wallet')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-400/60 transition-all cursor-pointer group shadow-sm whitespace-nowrap"
            >
              <div className="p-1 rounded-xl bg-[#1E90FF]/15 text-[#1E90FF]">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-tight">Wallet</p>
                <p className="text-xs xl:text-sm font-black text-white group-hover:text-[#1E90FF] transition-colors leading-tight">
                  {user ? `${(user.walletBalanceHTG ?? 0).toLocaleString('fr-FR')} HTG` : '0 HTG'}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDepositModalOpen(true);
                }}
                className="ml-0.5 px-2.5 py-1 text-[11px] font-extrabold bg-[#1E90FF] hover:bg-blue-600 text-white rounded-xl transition-transform active:scale-95 shadow-md shadow-blue-500/30"
              >
                + Déposer
              </button>
            </div>

            {/* Profile Button or Auth Trigger */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleNavClick('profil')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all text-xs font-bold whitespace-nowrap ${
                    activeTab === 'profil'
                      ? 'bg-slate-800 border-[#1E90FF] text-white shadow-sm'
                      : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-[#1E90FF] flex items-center justify-center text-white font-black text-[10px]">
                    {user.name.charAt(0)}
                  </div>
                  <span className="max-w-[90px] xl:max-w-[120px] truncate">{user.name}</span>
                  {user.isEmailVerified ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle
                      className="w-3.5 h-3.5 text-amber-400 animate-pulse cursor-pointer shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVerifyModalOpen(true);
                      }}
                      title="Email non vérifié. Cliquez pour vérifier."
                    />
                  )}
                </button>

                {/* Admin Button */}
                {user.isAdmin && (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className={`p-2 rounded-xl border transition-all shrink-0 ${
                      activeTab === 'admin'
                        ? 'bg-[#FF0000]/20 border-[#FF0000] text-[#FF0000] shadow-sm'
                        : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title="Panneau d'Administration"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 transition-all whitespace-nowrap"
              >
                <User className="w-4 h-4" />
                Connexion
              </button>
            )}
          </div>

          {/* Mobile/Tablet Menu Toggle Button (Visible below lg) */}
          <div className="flex lg:hidden items-center gap-2 shrink-0">
            <button
              onClick={() => handleNavClick('wallet')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[#1E90FF] text-xs font-bold shadow-sm whitespace-nowrap"
            >
              <Wallet className="w-3.5 h-3.5 inline mr-1" />
              {user ? `${user.walletBalanceHTG} HTG` : '0 HTG'}
            </button>

            <button
              ref={buttonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 hover:bg-slate-800 transition-all shadow-sm"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-[#1E90FF]" /> : <Menu className="w-6 h-6 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop for Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Custom Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div
          ref={menuRef}
          className="fixed top-16 sm:top-20 right-4 z-50 w-[80vw] max-w-sm rounded-3xl bg-[#0d0f14]/95 backdrop-blur-2xl border border-white/15 shadow-2xl p-5 flex flex-col justify-between max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200 lg:hidden text-white"
        >
          {/* Header section in drawer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#1E90FF] flex items-center justify-center text-white font-black text-sm shadow-md">
                  F
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">FRAYZEN SHOP</h4>
                  <p className="text-[9px] text-slate-400 uppercase font-semibold">Menu Navigation</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation links list */}
            <div className="space-y-1.5">
              {navItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold transition-all ${
                      isActive
                        ? 'bg-[#1E90FF] text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon}
                      {item.label}
                    </span>
                    {isActive && <CheckCircle className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User profile & actions in drawer bottom */}
          <div className="space-y-3 pt-4 border-t border-white/10 mt-auto">
            {user ? (
              <div className="space-y-2.5">
                <div
                  onClick={() => handleNavClick('profil')}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#1E90FF] flex items-center justify-center font-black text-xs text-white shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  {user.isEmailVerified ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
                      Vérifié
                    </span>
                  ) : (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsVerifyModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold shrink-0 animate-pulse"
                    >
                      Vérifier
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setIsDepositModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  + Déposer NATCASH / MonCash
                </button>

                {user.isAdmin && (
                  <button
                    onClick={() => handleNavClick('admin')}
                    className="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 text-red-300 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Panneau Admin
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsAuthModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-3.5 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                Connexion / Inscription
              </button>
            )}

            <p className="text-[9px] text-center text-slate-400 font-medium">
              FRAYZEN SHOP • NATCASH & MonCash 🇭🇹
            </p>
          </div>
        </div>
      )}
    </header>
  );
};

