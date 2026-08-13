import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, NatcashConfig, WalletDeposit, Order, UserProfile, ContactTicket, AdminStats, PinRecord } from '../types';
import confetti from 'canvas-confetti';

export type TabType = 'accueil' | 'produits' | 'paiement' | 'wallet' | 'commandes' | 'contact' | 'profil' | 'admin' | 'redeempins' | 'faq';

interface AppContextType {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  products: Product[];
  natcashConfig: NatcashConfig;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  deposits: WalletDeposit[];
  orders: Order[];
  tickets: ContactTicket[];
  adminStats: AdminStats | null;
  pins: PinRecord[];
  availablePins: PinRecord[];
  soldPins: PinRecord[];
  isDepositModalOpen: boolean;
  setIsDepositModalOpen: (open: boolean) => void;
  isVerifyModalOpen: boolean;
  setIsVerifyModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  setNotification: (notif: { type: 'success' | 'error' | 'info'; message: string } | null) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  refreshData: () => Promise<void>;
  registerUser: (name: string, email: string, phone: string, password?: string) => Promise<boolean>;
  loginUser: (emailOrPhone: string, password?: string) => Promise<boolean>;
  verifyUserEmail: (email: string) => Promise<boolean>;
  submitDeposit: (transactionId14: string, amountHTG: number, screenshotUrl?: string, paymentMethod?: 'natcash' | 'moncash') => Promise<boolean>;
  submitOrder: (productId: string, gamePlayerId: string, paymentMethod: 'wallet' | 'natcash_direct' | 'moncash_direct', natcashTxId?: string) => Promise<{ success: boolean; order?: Order }>;
  submitContactTicket: (name: string, email: string, phone: string, subject: string, message: string) => Promise<boolean>;
  deletePin: (pinId: string) => Promise<boolean>;
  triggerConfetti: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialTab = (): TabType => {
  const hash = window.location.hash.replace('#', '') as TabType;
  const validTabs: TabType[] = ['accueil', 'produits', 'paiement', 'wallet', 'commandes', 'contact', 'profil', 'admin', 'redeempins', 'faq'];
  if (hash && validTabs.includes(hash)) return hash;
  return 'accueil';
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<TabType>(getInitialTab);

  const setActiveTab = (newTab: TabType) => {
    if (newTab === activeTab) return;
    try {
      window.history.pushState({ tab: newTab }, '', `#${newTab}`);
    } catch {
      // silent
    }
    setActiveTabState(newTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const initialTab = getInitialTab();
    try {
      window.history.replaceState({ tab: initialTab }, '', `#${initialTab}`);
    } catch {
      // silent
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTabState(event.state.tab as TabType);
      } else {
        const hash = window.location.hash.replace('#', '') as TabType;
        const validTabs: TabType[] = ['accueil', 'produits', 'paiement', 'wallet', 'commandes', 'contact', 'profil', 'admin', 'redeempins'];
        if (hash && validTabs.includes(hash)) {
          setActiveTabState(hash);
        } else {
          setActiveTabState('accueil');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('frayzen_cached_products');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  const [natcashConfig, setNatcashConfig] = useState<NatcashConfig>({
    number: '41355116',
    name: 'HENRY',
    moncashNumber: '47124969',
    moncashName: 'JOSELYNE TITY',
    instructions: 'Envoyez le montant exact sur NATCASH ou MonCash',
    supportPhone: '+509 4135 5116',
    supportEmail: 'contact@frayzenshop.com'
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [deposits, setDeposits] = useState<WalletDeposit[]>(() => {
    try {
      const saved = localStorage.getItem('frayzen_cached_deposits');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('frayzen_cached_orders');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });

  const [tickets, setTickets] = useState<ContactTicket[]>([]);

  const [adminStats, setAdminStats] = useState<AdminStats | null>(() => {
    try {
      const saved = localStorage.getItem('frayzen_cached_stats');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return null;
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('frayzen_user');
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [pins, setPins] = useState<PinRecord[]>([]);
  const [availablePins, setAvailablePins] = useState<PinRecord[]>([]);
  const [soldPins, setSoldPins] = useState<PinRecord[]>([]);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('frayzen_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('frayzen_user');
    }
  }, [user]);

  useEffect(() => {
    if (orders.length > 0) {
      try { localStorage.setItem('frayzen_cached_orders', JSON.stringify(orders)); } catch { /* ignore */ }
    }
  }, [orders]);

  useEffect(() => {
    if (deposits.length > 0) {
      try { localStorage.setItem('frayzen_cached_deposits', JSON.stringify(deposits)); } catch { /* ignore */ }
    }
  }, [deposits]);

  useEffect(() => {
    if (products.length > 0) {
      try { localStorage.setItem('frayzen_cached_products', JSON.stringify(products)); } catch { /* ignore */ }
    }
  }, [products]);

  useEffect(() => {
    if (adminStats) {
      try { localStorage.setItem('frayzen_cached_stats', JSON.stringify(adminStats)); } catch { /* ignore */ }
    }
  }, [adminStats]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // fallback silent
    }
  };

  const refreshData = async () => {
    try {
      // Fetch Natcash config
      const resConfig = await fetch('/api/natcash-config');
      if (resConfig.ok) setNatcashConfig(await resConfig.json());

      // Fetch products
      const resProds = await fetch('/api/products');
      if (resProds.ok) {
        const freshProds = await resProds.json();
        setProducts(freshProds);
      }

      // Fetch user profile if logged in
      if (user?.email) {
        const resProfile = await fetch(`/api/user/profile/${encodeURIComponent(user.email)}`);
        if (resProfile.ok) {
          const freshUser = await resProfile.json();
          setUser(prev => ({ ...prev, ...freshUser }));
        } else if (resProfile.status === 404) {
          // If stored user doesn't exist on server, clear stale session
          setUser(null);
          localStorage.removeItem('frayzen_user');
        }

        // Fetch deposits and orders
        if (user.isAdmin) {
          const resDep = await fetch('/api/wallet/deposits');
          if (resDep.ok) {
            const freshDeps = await resDep.json();
            setDeposits(freshDeps);
          }

          const resOrd = await fetch('/api/orders');
          if (resOrd.ok) {
            const freshOrds = await resOrd.json();
            setOrders(freshOrds);
          }
        } else {
          const resDep = await fetch(`/api/wallet/deposits?email=${encodeURIComponent(user.email)}`);
          if (resDep.ok) {
            const freshDeps = await resDep.json();
            setDeposits(freshDeps);
          }

          const resOrd = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}`);
          if (resOrd.ok) {
            const freshOrds = await resOrd.json();
            setOrders(freshOrds);
          }
        }
      } else {
        const resDep = await fetch('/api/wallet/deposits');
        if (resDep.ok) {
          const freshDeps = await resDep.json();
          setDeposits(freshDeps);
        }

        const resOrd = await fetch('/api/orders');
        if (resOrd.ok) {
          const freshOrds = await resOrd.json();
          setOrders(freshOrds);
        }
      }

      // Always fetch admin stats, contact tickets and PINs
      try {
        const resStats = await fetch('/api/admin/stats');
        if (resStats.ok) {
          const freshStats = await resStats.json();
          setAdminStats(freshStats);
        }
      } catch { /* silent */ }

      try {
        const resPins = await fetch('/api/pins');
        if (resPins.ok) {
          const pinData = await resPins.json();
          setPins(pinData.pins || []);
          setAvailablePins(pinData.availablePins || []);
          setSoldPins(pinData.soldPins || []);
        }
      } catch { /* silent */ }

      try {
        const resTkt = await fetch('/api/contact');
        if (resTkt.ok) setTickets(await resTkt.json());
      } catch { /* silent */ }
    } catch (e) {
      console.error('Data refresh error:', e);
    }
  };

  useEffect(() => {
    refreshData();
  }, [user?.email, user?.isAdmin]);

  const registerUser = async (name: string, email: string, phone: string, password?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });
      
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        showToast('Réponse du serveur invalide.', 'error');
        return false;
      }

      if (!res.ok) {
        showToast(data.error || 'Erreur lors de la création du compte.', 'error');
        return false;
      }
      setUser(data);
      triggerConfetti();
      showToast(`Bienvenue ${data.name} ! Votre compte est créé avec succès.`, 'success');
      return true;
    } catch (err) {
      console.error('Register fetch exception:', err);
      showToast('Erreur de connexion au serveur.', 'error');
      return false;
    }
  };

  const loginUser = async (emailOrPhone: string, password?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password })
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        showToast('Réponse du serveur invalide.', 'error');
        return false;
      }

      if (!res.ok) {
        showToast(data.error || 'Erreur lors de la connexion.', 'error');
        return false;
      }
      setUser(data);
      showToast(`Ravi de vous revoir, ${data.name} !`, 'success');
      return true;
    } catch (err) {
      console.error('Login fetch exception:', err);
      showToast('Erreur de connexion au serveur.', 'error');
      return false;
    }
  };

  const verifyUserEmail = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erreur de vérification.', 'error');
        return false;
      }
      setUser(data.user);
      setIsVerifyModalOpen(false);
      triggerConfetti();
      showToast('Votre adresse email a été vérifiée avec succès !', 'success');
      return true;
    } catch {
      showToast('Erreur serveur.', 'error');
      return false;
    }
  };

  const submitDeposit = async (transactionId14: string, amountHTG: number, screenshotUrl?: string, paymentMethod: 'natcash' | 'moncash' = 'natcash'): Promise<boolean> => {
    if (!user) {
      setIsAuthModalOpen(true);
      showToast('Veuillez vous connecter pour effectuer un dépôt.', 'info');
      return false;
    }

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          transactionId14,
          amountHTG,
          screenshotUrl,
          paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erreur lors du dépôt.', 'error');
        return false;
      }

      setIsDepositModalOpen(false);
      triggerConfetti();
      showToast(data.message || 'Demande de dépôt envoyée !', 'success');
      await refreshData();
      return true;
    } catch {
      showToast('Erreur réseau lors du dépôt.', 'error');
      return false;
    }
  };

  const submitOrder = async (productId: string, gamePlayerId: string, paymentMethod: 'wallet' | 'natcash_direct' | 'moncash_direct', natcashTxId?: string): Promise<{ success: boolean; order?: Order }> => {
    if (!user) {
      setIsAuthModalOpen(true);
      showToast('Veuillez vous connecter pour acheter un produit.', 'info');
      return { success: false };
    }

    if (!user.isEmailVerified) {
      setIsVerifyModalOpen(true);
      showToast('Vérification d\'email requise pour effectuer un achat.', 'error');
      return { success: false };
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: user.email,
          productId,
          gamePlayerId,
          paymentMethod,
          natcashTransactionId: natcashTxId
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erreur lors de la commande.', 'error');
        return { success: false };
      }

      if (data.user) {
        setUser(prev => prev ? ({ ...prev, ...data.user }) : data.user);
      } else if (data.remainingWalletBalance !== undefined && user) {
        setUser(prev => prev ? ({ ...prev, walletBalanceHTG: data.remainingWalletBalance }) : null);
      }

      triggerConfetti();
      showToast(data.message || 'Commande réussie !', 'success');
      await refreshData();
      return { success: true, order: data.order };
    } catch {
      showToast('Erreur réseau lors de la commande.', 'error');
      return { success: false };
    }
  };

  const submitContactTicket = async (name: string, email: string, phone: string, subject: string, message: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message })
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erreur d\'envoi du message.', 'error');
        return false;
      }
      showToast('Votre message a été soumis à l\'équipe support avec succès.', 'success');
      await refreshData();
      return true;
    } catch {
      showToast('Erreur réseau.', 'error');
      return false;
    }
  };

  const deletePin = async (pinId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/pins/${encodeURIComponent(pinId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Code PIN supprimé avec succès', 'success');
        await refreshData();
        return true;
      }
      const errData = await res.json();
      showToast(errData.error || 'Erreur lors de la suppression du PIN', 'error');
      return false;
    } catch {
      showToast('Erreur réseau lors de la suppression du PIN', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab,
      user,
      setUser,
      products,
      natcashConfig,
      selectedProduct,
      setSelectedProduct,
      deposits,
      orders,
      tickets,
      adminStats,
      pins,
      availablePins,
      soldPins,
      isDepositModalOpen,
      setIsDepositModalOpen,
      isVerifyModalOpen,
      setIsVerifyModalOpen,
      isAuthModalOpen,
      setIsAuthModalOpen,
      notification,
      setNotification,
      showToast,
      refreshData,
      registerUser,
      loginUser,
      verifyUserEmail,
      submitDeposit,
      submitOrder,
      submitContactTicket,
      deletePin,
      triggerConfetti
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
