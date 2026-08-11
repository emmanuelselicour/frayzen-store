import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product, WalletDeposit, ContactTicket, UserProfile, AdminStats, UserDetailedMetrics } from '../types';
import { Shield, LayoutDashboard, ShoppingBag, Wallet, Settings, MessageSquare, Plus, Trash2, Edit3, CheckCircle2, XCircle, Save, Users, Award, RefreshCw, KeyRound, Lock, Eye, ArrowLeft, Flame, DollarSign, UserCheck, X, ShieldAlert } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

type AdminTab = 'stats' | 'produits' | 'wallet' | 'config' | 'users' | 'contact';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    natcashConfig,
    deposits,
    tickets,
    adminStats,
    refreshData,
    showToast
  } = useApp();

  // Admin PIN Gate State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('frayzen_admin_unlocked') === 'true';
  });
  const [adminPinInput, setAdminPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Active Tab State
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('stats');
  const [detailedUsers, setDetailedUsers] = useState<UserDetailedMetrics[]>([]);
  const [selectedUserModal, setSelectedUserModal] = useState<UserDetailedMetrics | null>(null);

  // Config Form State
  const [natNumber, setNatNumber] = useState(natcashConfig.number);
  const [natName, setNatName] = useState(natcashConfig.name);
  const [monNumber, setMonNumber] = useState(natcashConfig.moncashNumber || '47124969');
  const [monName, setMonName] = useState(natcashConfig.moncashName || 'JOSELYNE TITY');
  const [natPhone, setNatPhone] = useState(natcashConfig.supportPhone);
  const [natEmail, setNatEmail] = useState(natcashConfig.supportEmail);
  const [natInstructions, setNatInstructions] = useState(natcashConfig.instructions);
  const [adminPinConfig, setAdminPinConfig] = useState(natcashConfig.adminPin || '123456');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Products Category View: 'overview' (Single master card) or 'free_fire' (All packs)
  const [prodCategoryView, setProdCategoryView] = useState<'overview' | 'free_fire'>('overview');

  // New Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'free_fire' | 'passes' | 'mobile_legends' | 'cards'>('free_fire');
  const [newProdPrice, setNewProdPrice] = useState('500');
  const [newProdStock, setNewProdStock] = useState('50');
  const [newProdImage, setNewProdImage] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPins, setNewProdPins] = useState('');

  // Edit Product Price State
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');

  // PIN Codes Security Gate (Password: 04004749+)
  const [isPinSectionUnlocked, setIsPinSectionUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinPasswordInput, setPinPasswordInput] = useState('');
  const [editingPinsProduct, setEditingPinsProduct] = useState<Product | null>(null);
  const [pinsTextarea, setPinsTextarea] = useState('');

  // Wallet Adjustment Form State
  const [adjustEmail, setAdjustEmail] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('500');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('deduct');

  useEffect(() => {
    fetchUsersDetailed();
    refreshData();
  }, []);

  useEffect(() => {
    setNatNumber(natcashConfig.number);
    setNatName(natcashConfig.name);
    setMonNumber(natcashConfig.moncashNumber || '47124969');
    setMonName(natcashConfig.moncashName || 'JOSELYNE TITY');
    setNatPhone(natcashConfig.supportPhone);
    setNatEmail(natcashConfig.supportEmail);
    setNatInstructions(natcashConfig.instructions);
    setAdminPinConfig(natcashConfig.adminPin || '123456');
  }, [natcashConfig]);

  const fetchUsersDetailed = async () => {
    try {
      const res = await fetch('/api/admin/users-detailed');
      if (res.ok) {
        setDetailedUsers(await res.json());
      } else {
        const fallbackRes = await fetch('/api/users');
        if (fallbackRes.ok) {
          const raw = await fallbackRes.json();
          setDetailedUsers(raw.map((u: UserProfile) => ({
            ...u,
            totalPurchasesCount: 0,
            successfulPurchasesCount: 0,
            failedPurchasesCount: 0
          })));
        }
      }
    } catch {
      // silent
    }
  };

  // Verify Admin 6-digit PIN
  const handleVerifyAdminPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    try {
      const res = await fetch('/api/admin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPinInput })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAdminUnlocked(true);
        sessionStorage.setItem('frayzen_admin_unlocked', 'true');
        showToast('Accès Administrateur déverrouillé avec succès !', 'success');
      } else {
        setPinError(data.error || 'Code PIN 6 chiffres incorrect.');
      }
    } catch {
      setPinError('Erreur de réseau. Veuillez réespérer.');
    }
  };

  // Verify PIN Management Security Password (04004749+)
  const handleVerifyPinPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/verify-pin-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pinPasswordInput })
      });
      const data = await res.json();
      if (res.ok) {
        setIsPinSectionUnlocked(true);
        showToast('Accès à la gestion des PINs déverrouillé !', 'success');
        setPinPasswordInput('');
      } else {
        showToast(data.error || 'Mot de passe incorrect.', 'error');
      }
    } catch {
      showToast('Erreur réseau.', 'error');
    }
  };

  // Save NATCASH, MonCash & Admin PIN Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const res = await fetch('/api/natcash-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: natNumber,
          name: natName,
          moncashNumber: monNumber,
          moncashName: monName,
          instructions: natInstructions,
          supportPhone: natPhone,
          supportEmail: natEmail,
          adminPin: adminPinConfig
        })
      });
      if (res.ok) {
        showToast('Configuration et Code PIN Admin sauvegardés avec succès !', 'success');
        await refreshData();
      }
    } catch {
      showToast('Erreur lors de la sauvegarde.', 'error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Add Product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pinArray = newProdPins.split('\n').map(p => p.trim()).filter(Boolean);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProdName,
          category: newProdCategory,
          priceHTG: Number(newProdPrice),
          stock: Number(newProdStock),
          image: newProdImage || undefined,
          description: newProdDesc,
          pinCodes: pinArray
        })
      });

      if (res.ok) {
        showToast('Produit ajouté avec succès au catalogue !', 'success');
        setIsProductModalOpen(false);
        setNewProdName('');
        setNewProdPins('');
        await refreshData();
      }
    } catch {
      showToast('Erreur lors de l\'ajout du produit.', 'error');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Produit supprimé !', 'success');
        await refreshData();
      }
    } catch {
      showToast('Erreur de suppression.', 'error');
    }
  };

  // Update Product Price
  const handleUpdateProductPrice = async (productId: string) => {
    const num = Number(editingPrice);
    if (!num || isNaN(num) || num <= 0) {
      showToast('Veuillez saisir un prix valide.', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceHTG: num })
      });
      if (res.ok) {
        showToast('Prix du produit mis à jour avec succès !', 'success');
        setEditingProdId(null);
        await refreshData();
      } else {
        showToast('Erreur lors de la mise à jour du prix.', 'error');
      }
    } catch {
      showToast('Erreur réseau.', 'error');
    }
  };

  // Save PIN Codes for a Product Pack
  const handleSaveProductPins = async (productId: string) => {
    const pinArray = pinsTextarea.split('\n').map(p => p.trim()).filter(Boolean);
    try {
      const res = await fetch(`/api/products/${productId}/pins`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinCodes: pinArray })
      });
      if (res.ok) {
        showToast(`Codes PIN mis à jour (${pinArray.length} PINs enregistrés) !`, 'success');
        setEditingPinsProduct(null);
        await refreshData();
      } else {
        showToast('Erreur de sauvegarde des PINs.', 'error');
      }
    } catch {
      showToast('Erreur réseau.', 'error');
    }
  };

  // Update Deposit Status
  const handleUpdateDepositStatus = async (id: string, status: 'valide' | 'rejete' | 'en_attente') => {
    try {
      const res = await fetch(`/api/wallet/deposits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Statut mis à jour en '${status}'`, 'success');
        await refreshData();
        await fetchUsersDetailed();
      }
    } catch {
      showToast('Erreur de mise à jour.', 'error');
    }
  };

  // Manual Wallet Adjustment
  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustEmail || !adjustAmount) return;
    try {
      const res = await fetch('/api/wallet/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: adjustEmail,
          amountHTG: Number(adjustAmount),
          type: adjustType
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Erreur lors de l\'ajustement.', 'error');
        return;
      }

      showToast(data.message, 'success');
      await refreshData();
      await fetchUsersDetailed();
      setAdjustEmail('');
    } catch {
      showToast('Erreur réseau.', 'error');
    }
  };

  // IF ADMIN IS NOT UNLOCKED WITH 6-DIGIT PIN: SHOW PIN PROMPT
  if (!isAdminUnlocked) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 space-y-6 text-white text-center">
        <ScrollReveal direction="up">
          <div className="p-8 rounded-3xl glass-card border border-white/15 shadow-2xl space-y-6">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-[#1E90FF]/20 p-1 border border-blue-500/30 flex items-center justify-center">
              <Lock className="w-8 h-8 text-[#1E90FF]" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white">Connexion Administrateur</h1>
              <p className="text-xs text-slate-400">
                Saisissez votre code PIN à 6 chiffres pour déverrouiller le Panneau d'Administration FRAYZEN SHOP.
              </p>
            </div>

            <form onSubmit={handleVerifyAdminPin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="admin-pin-input" className="text-xs font-bold text-slate-300 block text-center">Code PIN Securisé</label>
                <input
                  id="admin-pin-input"
                  name="adminPinInput"
                  type="password"
                  maxLength={6}
                  required
                  placeholder="•••••• (PIN 6 chiffres)"
                  value={adminPinInput}
                  onChange={e => setAdminPinInput(e.target.value)}
                  className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 rounded-2xl glass-input text-white border-blue-500/40"
                  autoFocus
                />
                {pinError && <p className="text-xs text-red-400 font-bold">{pinError}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
              >
                <KeyRound className="w-4 h-4" />
                Déverrouiller l'Admin
              </button>
            </form>
          </div>
        </ScrollReveal>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 pt-4">
      
      {/* Header Banner */}
      <ScrollReveal direction="up">
        <div className="p-6 rounded-3xl glass-card border border-white/12 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1E90FF] p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#1E90FF]" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Panneau d'Administration</h1>
              <p className="text-xs text-slate-400">Gestion globale FRAYZEN SHOP, validation NATCASH/MonCash & Configuration</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsAdminUnlocked(false);
                sessionStorage.removeItem('frayzen_admin_unlocked');
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
              title="Verrouiller l'Admin"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Verrouiller
            </button>

            <button
              onClick={() => {
                refreshData();
                fetchUsersDetailed();
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-[#1E90FF]" />
              Actualiser Données
            </button>
          </div>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar Admin Navigation */}
        <div className="lg:col-span-3 space-y-2">
          
          <button
            onClick={() => setActiveAdminTab('stats')}
            className={`w-full p-3.5 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all ${
              activeAdminTab === 'stats'
                ? 'bg-[#1E90FF] text-white shadow-md shadow-blue-500/20'
                : 'glass-card text-slate-300 hover:bg-slate-900 hover:text-white border border-white/10'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Statistiques Globales
          </button>

          <button
            onClick={() => setActiveAdminTab('produits')}
            className={`w-full p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
              activeAdminTab === 'produits'
                ? 'bg-[#1E90FF] text-white shadow-md shadow-blue-500/20'
                : 'glass-card text-slate-300 hover:bg-slate-900 hover:text-white border border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-4 h-4" />
              <span>Gestion Produits</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-white text-[10px] font-bold">{products.length}</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('wallet')}
            className={`w-full p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
              activeAdminTab === 'wallet'
                ? 'bg-[#1E90FF] text-white shadow-md shadow-blue-500/20'
                : 'glass-card text-slate-300 hover:bg-slate-900 hover:text-white border border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-4 h-4" />
              <span>Gestion Wallet</span>
            </div>
            {deposits.filter(d => d.status === 'en_attente').length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#FF0000] text-white font-extrabold text-[10px] animate-pulse">
                {deposits.filter(d => d.status === 'en_attente').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('config')}
            className={`w-full p-3.5 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all ${
              activeAdminTab === 'config'
                ? 'bg-[#1E90FF] text-white shadow-md shadow-blue-500/20'
                : 'glass-card text-slate-300 hover:bg-slate-900 hover:text-white border border-white/10'
            }`}
          >
            <Settings className="w-4 h-4" />
            Config Numéros & PIN Admin
          </button>

          <button
            onClick={() => setActiveAdminTab('users')}
            className={`w-full p-3.5 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all ${
              activeAdminTab === 'users'
                ? 'bg-[#1E90FF] text-white shadow-md shadow-blue-500/20'
                : 'glass-card text-slate-300 hover:bg-slate-900 hover:text-white border border-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            Utilisateurs & Profils
          </button>

          <button
            onClick={() => setActiveAdminTab('contact')}
            className={`w-full p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
              activeAdminTab === 'contact'
                ? 'bg-[#1E90FF] text-white shadow-md shadow-blue-500/20'
                : 'glass-card text-slate-300 hover:bg-slate-900 hover:text-white border border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              <span>Messages & Tickets</span>
            </div>
            {tickets.filter(t => t.status === 'nouveau').length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px]">
                {tickets.filter(t => t.status === 'nouveau').length}
              </span>
            )}
          </button>

        </div>

        {/* Main Admin Content Area */}
        <div className="lg:col-span-9 p-6 sm:p-8 rounded-3xl glass-card border border-white/12 space-y-6 text-white">
          
          {/* TAB 1: STATS */}
          {activeAdminTab === 'stats' && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-white pb-3 border-b border-white/10">Statistiques des Ventes & Activité</h2>

              {/* 5 Key Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Montant Total Vendu</p>
                  <p className="text-2xl font-black text-[#1E90FF]">
                    {adminStats ? `${adminStats.totalAmountPurchasedHTG.toLocaleString('fr-FR')} HTG` : '0 HTG'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Nombre Total de Ventes</p>
                  <p className="text-2xl font-black text-emerald-400">
                    {adminStats ? adminStats.totalSalesCount : 0} commandes
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Nombre d'Utilisateurs</p>
                  <p className="text-2xl font-black text-white">
                    {adminStats ? adminStats.totalUsersCount : 0} inscrits
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1 sm:col-span-2 shadow-sm">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Produit le plus vendu</p>
                  <p className="text-lg font-black text-white">
                    {adminStats ? adminStats.topSellingProduct : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Top 10 Buyers List */}
              <div className="pt-4 space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  Top 10 des Acheteurs
                </h3>

                {adminStats && adminStats.topBuyers.length > 0 ? (
                  <div className="space-y-2">
                    {adminStats.topBuyers.map((buyer, idx) => (
                      <div key={buyer.email} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs shadow-sm text-white">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-[10px]">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="font-extrabold text-white">{buyer.userName}</p>
                            <p className="text-[10px] text-slate-400">{buyer.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-[#1E90FF]">{buyer.totalAmountHTG.toLocaleString('fr-FR')} HTG</p>
                          <p className="text-[10px] text-slate-400">{buyer.ordersCount} achats</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Aucun acheteur enregistré pour l'instant.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GESTION DE PRODUITS */}
          {activeAdminTab === 'produits' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-black text-white">Gestion des Produits & Stock PINs</h2>
                  <p className="text-xs text-slate-400">
                    Gérez vos catégories de jeux et les packs de diamants associés.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isPinSectionUnlocked ? (
                    <button
                      onClick={() => setIsPinModalOpen(true)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-500/30 shadow-sm"
                    >
                      <Lock className="w-4 h-4 text-amber-400" /> Déverrouiller PINs (04004749+)
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> PINs Déverrouillés
                    </span>
                  )}

                  <button
                    onClick={() => setIsProductModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-md"
                  >
                    <Plus className="w-4 h-4" /> Ajouter un pack
                  </button>
                </div>
              </div>

              {/* SINGLE MASTER CARD FOR FREE FIRE IF IN OVERVIEW MODE */}
              {prodCategoryView === 'overview' ? (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-300">Catégories de Produits Principales :</p>

                  <div
                    onClick={() => setProdCategoryView('free_fire')}
                    className="group p-6 rounded-3xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-[#1E90FF]/60 cursor-pointer transition-all duration-300 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-5">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 flex-shrink-0">
                        <img
                          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80"
                          alt="Free Fire"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <span className="absolute top-1 left-1 p-1 rounded-full bg-red-600">
                          <Flame className="w-3 h-3 text-white fill-white" />
                        </span>
                      </div>

                      <div className="space-y-1 text-center sm:text-left">
                        <h3 className="text-xl font-black text-white group-hover:text-[#1E90FF] transition-colors">
                          📢 Free Fire (Recharge Diamants)
                        </h3>
                        <p className="text-xs text-slate-400">
                          Top Up par ID, instantané & livraison automatique de codes PINs.
                        </p>
                        <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-[11px] text-slate-300 font-mono">
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-[#1E90FF] font-extrabold">
                            {products.length} Packs Configurés
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold">
                            Stock Total: {products.reduce((acc, p) => acc + (p.pinCodes?.length || 0), 0)} PINs
                          </span>
                        </div>
                      </div>
                    </div>

                    <button className="px-5 py-3 rounded-2xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 group-hover:scale-105 transition-transform">
                      <Eye className="w-4 h-4" />
                      Voir Packs & Prix Variable
                    </button>
                  </div>
                </div>
              ) : (
                /* EXPANDED VIEW: ALL FREE FIRE PACKS */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setProdCategoryView('overview')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4 text-[#1E90FF]" /> Retour à la vue générale
                    </button>
                    <span className="text-xs font-bold text-slate-400">
                      Packs de Diamants Variable Free Fire ({products.length})
                    </span>
                  </div>

                  {/* PRODUCTS TABLE / LIST */}
                  <div className="space-y-3">
                    {products.map(p => (
                      <div key={p.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-sm text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-amber-400 text-base">
                            💎
                          </div>
                          <div>
                            <p className="font-extrabold text-white text-sm">{p.name}</p>
                            <p className="text-[10px] text-slate-400">
                              Stock: {p.stock} | PINs dispo: <strong className="text-emerald-400">{p.pinCodes?.length || 0}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                          {editingProdId === p.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editingPrice}
                                onChange={e => setEditingPrice(e.target.value)}
                                className="w-24 px-2.5 py-1 rounded-xl glass-input text-xs text-white font-mono font-bold"
                              />
                              <button
                                onClick={() => handleUpdateProductPrice(p.id)}
                                className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs"
                              >
                                OK
                              </button>
                              <button
                                onClick={() => setEditingProdId(null)}
                                className="px-2 py-1 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-black text-[#1E90FF] text-sm">{p.priceHTG.toLocaleString('fr-FR')} HTG</span>
                              <button
                                onClick={() => {
                                  setEditingProdId(p.id);
                                  setEditingPrice(String(p.priceHTG));
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 text-[#1E90FF] hover:bg-[#1E90FF] hover:text-white transition-colors flex items-center gap-1 font-bold text-[11px]"
                                title="Modifier le prix"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Prix
                              </button>
                            </div>
                          )}

                          {/* PIN CODE MANAGEMENT BUTTON (Secured with password) */}
                          <button
                            onClick={() => {
                              if (!isPinSectionUnlocked) {
                                setIsPinModalOpen(true);
                              } else {
                                setEditingPinsProduct(p);
                                setPinsTextarea(p.pinCodes ? p.pinCodes.join('\n') : '');
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                              isPinSectionUnlocked
                                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                            title="Gérer les codes PIN"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                            PINs ({p.pinCodes?.length || 0})
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                            title="Supprimer le produit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Product Modal Form */}
              {isProductModalOpen && (
                <form onSubmit={handleAddProduct} className="p-6 rounded-2xl bg-slate-900/95 border border-slate-800 space-y-4 shadow-md text-white">
                  <h3 className="text-base font-extrabold text-white">Nouveau Pack de Diamants Free Fire</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      placeholder="Nom du produit (Ex: 1060 Diamants FF)"
                      value={newProdName}
                      onChange={e => setNewProdName(e.target.value)}
                      className="px-3.5 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-500"
                    />

                    <select
                      value={newProdCategory}
                      onChange={e => setNewProdCategory(e.target.value as any)}
                      className="px-3.5 py-2 rounded-xl glass-input text-xs text-white bg-slate-900 border-slate-700"
                    >
                      <option value="free_fire" className="bg-slate-900 text-white">Diamants Free Fire</option>
                      <option value="passes" className="bg-slate-900 text-white">Passes & Abonnements</option>
                      <option value="mobile_legends" className="bg-slate-900 text-white">Mobile Legends</option>
                      <option value="cards" className="bg-slate-900 text-white">Cartes Cadeaux</option>
                    </select>

                    <input
                      type="number"
                      required
                      placeholder="Prix en HTG (Ex: 1500)"
                      value={newProdPrice}
                      onChange={e => setNewProdPrice(e.target.value)}
                      className="px-3.5 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-500"
                    />

                    <input
                      type="number"
                      required
                      placeholder="Stock disponible (Ex: 50)"
                      value={newProdStock}
                      onChange={e => setNewProdStock(e.target.value)}
                      className="px-3.5 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-500"
                    />
                  </div>

                  <textarea
                    placeholder="Codes PINs (Un PIN par ligne pour la livraison automatique)"
                    value={newProdPins}
                    onChange={e => setNewProdPins(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono text-white placeholder-slate-500"
                  />

                  <div className="flex gap-2">
                    <button type="submit" className="px-5 py-2 rounded-xl bg-[#1E90FF] text-white font-bold text-xs shadow-md">
                      Enregistrer Pack
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsProductModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: GESTION DE WALLET */}
          {activeAdminTab === 'wallet' && (
            <div className="space-y-8">
              
              <div className="space-y-4">
                <h2 className="text-xl font-black text-white pb-3 border-b border-white/10">Demandes de Dépôts NATCASH & MonCash</h2>

                {deposits.length === 0 ? (
                  <p className="text-xs text-slate-400">Aucune demande de dépôt en attente.</p>
                ) : (
                  <div className="space-y-3">
                    {deposits.map(dep => (
                      <div key={dep.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs shadow-sm text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-extrabold text-white text-sm">{dep.userName}</span>
                            <span className="text-slate-400 text-[10px] ml-2">({dep.userEmail})</span>
                          </div>
                          <span className="font-black text-lg text-[#1E90FF]">+{dep.amountHTG} HTG</span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 font-mono">
                          <span className="text-[#FF6321] font-bold">ID Transaction: {dep.transactionId14}</span>
                          <span className="text-[10px] text-slate-400">{new Date(dep.createdAt).toLocaleString('fr-FR')}</span>
                        </div>

                        {dep.screenshotUrl && (
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block mb-1">Capture d'écran jointe :</span>
                            <img src={dep.screenshotUrl} alt="Screenshot" className="max-h-40 rounded-xl border border-slate-700" />
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-[10px] text-slate-400">Statut actuel: <strong className="text-white">{dep.status}</strong></span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateDepositStatus(dep.id, 'valide')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valider (+Solde)
                            </button>

                            <button
                              onClick={() => handleUpdateDepositStatus(dep.id, 'rejete')}
                              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Rejeter
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Manual Wallet Correction */}
              <div className="p-6 rounded-2xl bg-red-950/40 border border-red-900/80 space-y-4 shadow-sm text-white">
                <h3 className="text-base font-extrabold text-red-400 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  Ajustement Manuel de Wallet (Alerte Erreur)
                </h3>
                <p className="text-xs text-slate-300">
                  Administrateur ka ajoute oswa <strong>retire lajan nan wallet yon user</strong> si gen erè ou bien réclamation.
                </p>

                <form onSubmit={handleAdjustWallet} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <input
                    type="email"
                    required
                    placeholder="Email de l'utilisateur"
                    value={adjustEmail}
                    onChange={e => setAdjustEmail(e.target.value)}
                    className="px-3 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-500"
                  />

                  <input
                    type="number"
                    required
                    placeholder="Montant HTG"
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                    className="px-3 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-500"
                  />

                  <select
                    value={adjustType}
                    onChange={e => setAdjustType(e.target.value as any)}
                    className="px-3 py-2 rounded-xl glass-input text-xs text-white bg-slate-900 border-slate-700"
                  >
                    <option value="deduct" className="bg-slate-900 text-white">Retirer / Déduire (-)</option>
                    <option value="add" className="bg-slate-900 text-white">Ajouter (+)</option>
                  </select>

                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-sm"
                  >
                    Appliquer
                  </button>
                </form>
              </div>

            </div>
          )}

          {/* TAB 4: CONFIGURATION NATCASH, MONCASH & PIN ADMIN */}
          {activeAdminTab === 'config' && (
            <form onSubmit={handleSaveConfig} className="space-y-6 text-white">
              <h2 className="text-xl font-black text-white pb-3 border-b border-white/10">Configuration Paiement & Code PIN Admin</h2>

              {/* CODE PIN ADMIN MODIFIABLE */}
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
                  <KeyRound className="w-5 h-5" />
                  Code PIN Administrateur (6 chiffres)
                </div>
                <p className="text-xs text-slate-300">
                  Ce code PIN à 6 chiffres est demandé à chaque fois qu'un administrateur tente d'accéder au Panneau d'Administration. Vous pouvez le modifier ici à tout moment.
                </p>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={adminPinConfig}
                  onChange={e => setAdminPinConfig(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2.5 rounded-xl glass-input text-lg font-mono font-bold tracking-widest text-amber-300 border-amber-500/40"
                  placeholder="123456"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Numéro NATCASH Receveur</label>
                  <input
                    type="text"
                    required
                    value={natNumber}
                    onChange={e => setNatNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Nom du Compte NATCASH</label>
                  <input
                    type="text"
                    required
                    value={natName}
                    onChange={e => setNatName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Numéro MonCash Receveur</label>
                  <input
                    type="text"
                    required
                    value={monNumber}
                    onChange={e => setMonNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Nom du Compte MonCash</label>
                  <input
                    type="text"
                    required
                    value={monName}
                    onChange={e => setMonName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Téléphone Support</label>
                  <input
                    type="text"
                    value={natPhone}
                    onChange={e => setNatPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Email Support</label>
                  <input
                    type="email"
                    value={natEmail}
                    onChange={e => setNatEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-sm text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Enstriksyon Paiement Dépôt (Kréyol/Français)</label>
                <textarea
                  rows={3}
                  value={natInstructions}
                  onChange={e => setNatInstructions(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingConfig}
                className="py-3 px-6 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-md"
              >
                <Save className="w-4 h-4" />
                {isSavingConfig ? 'Sauvegarde...' : 'Enregistrer Modifications & PIN Admin'}
              </button>
            </form>
          )}

          {/* TAB 5: USERS LIST WITH DETAILED MODAL */}
          {activeAdminTab === 'users' && (
            <div className="space-y-4 text-white">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h2 className="text-xl font-black text-white">Utilisateurs Enregistrés & Profils</h2>
                <span className="text-xs text-slate-400 font-bold">
                  Cliquez sur un utilisateur pour voir sa fiche complète
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                      <th className="py-2.5 px-3">Nom</th>
                      <th className="py-2.5 px-3">Email</th>
                      <th className="py-2.5 px-3">Téléphone</th>
                      <th className="py-2.5 px-3">Solde Wallet</th>
                      <th className="py-2.5 px-3">Commandes</th>
                      <th className="py-2.5 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {detailedUsers.map(u => (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedUserModal(u)}
                        className="hover:bg-slate-900/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#1E90FF]/20 text-[#1E90FF] font-black flex items-center justify-center text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          {u.name}
                        </td>
                        <td className="py-3 px-3 text-slate-400">{u.email}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{u.phone}</td>
                        <td className="py-3 px-3 font-black text-[#1E90FF]">{u.walletBalanceHTG} HTG</td>
                        <td className="py-3 px-3 font-bold text-emerald-400">
                          {u.totalPurchasesCount || 0} achats
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserModal(u);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-[#1E90FF] font-bold text-[10px] hover:bg-[#1E90FF] hover:text-white"
                          >
                            Fiche Profil
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: CONTACT TICKETS */}
          {activeAdminTab === 'contact' && (
            <div className="space-y-4 text-white">
              <h2 className="text-xl font-black text-white pb-3 border-b border-white/10">Messages & Réclamations Clients</h2>

              {tickets.length === 0 ? (
                <p className="text-xs text-slate-400">Aucun ticket reçu.</p>
              ) : (
                <div className="space-y-3">
                  {tickets.map(tkt => (
                    <div key={tkt.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs shadow-sm text-white">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-white text-sm">{tkt.userName} ({tkt.userEmail})</span>
                        <span className="text-[10px] text-slate-400">{new Date(tkt.createdAt).toLocaleString('fr-FR')}</span>
                      </div>
                      <p className="font-bold text-[#1E90FF]">{tkt.subject}</p>
                      <p className="text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">{tkt.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* MODAL 1: USER DETAILED PROFILE BOX */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl glass-card border border-white/20 shadow-2xl space-y-6 text-white">
            <button
              onClick={() => setSelectedUserModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-[#1E90FF] p-0.5 shadow-md">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-2xl text-[#1E90FF]">
                  {selectedUserModal.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{selectedUserModal.name}</h3>
                <p className="text-xs text-slate-400">{selectedUserModal.email}</p>
                <p className="text-[11px] font-mono text-emerald-400 mt-0.5">📞 {selectedUserModal.phone}</p>
              </div>
            </div>

            {/* METRICS GRID FOR USER */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Solde sur le compte</span>
                <span className="text-xl font-black text-[#1E90FF]">
                  {selectedUserModal.walletBalanceHTG} HTG
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Nombre de fois achte</span>
                <span className="text-xl font-black text-white">
                  {selectedUserModal.totalPurchasesCount || 0} fois
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-1">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">Achat Réussi</span>
                <span className="text-xl font-black text-emerald-400">
                  {selectedUserModal.successfulPurchasesCount || 0}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60 space-y-1">
                <span className="text-[10px] text-red-400 font-bold uppercase block">Achat Échoué</span>
                <span className="text-xl font-black text-red-400">
                  {selectedUserModal.failedPurchasesCount || 0}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Date d'inscription :</span>
              <span className="font-mono text-white font-bold">
                {new Date(selectedUserModal.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAdjustEmail(selectedUserModal.email);
                  setActiveAdminTab('wallet');
                  setSelectedUserModal(null);
                }}
                className="w-full py-2.5 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-xs shadow-md"
              >
                Ajuster Solde Wallet de cet Utilisateur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PIN MANAGEMENT PASSWORD PROMPT (04004749+) */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md p-6 rounded-3xl glass-card border border-amber-500/30 shadow-2xl space-y-5 text-white text-center">
            <button
              onClick={() => setIsPinModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 p-2 flex items-center justify-center border border-amber-500/40">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Sécurité PIN Diamants</h3>
              <p className="text-xs text-slate-400">
                Saisissez le mot de passe de sécurité requis (<strong>04004749+</strong>) pour déverrouiller la gestion des codes PIN.
              </p>
            </div>

            <form onSubmit={handleVerifyPinPassword} className="space-y-4">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={pinPasswordInput}
                onChange={e => setPinPasswordInput(e.target.value)}
                className="w-full text-center text-lg px-4 py-2.5 rounded-xl glass-input text-white border-amber-500/40 font-mono"
                autoFocus
              />

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs shadow-md"
              >
                Déverrouiller la Section PINs
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT PRODUCT PINS TEXTAREA */}
      {editingPinsProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-6 rounded-3xl glass-card border border-white/20 shadow-2xl space-y-4 text-white">
            <button
              onClick={() => setEditingPinsProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <KeyRound className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Gestion des PINs: {editingPinsProduct.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Ajoutez un code PIN par ligne. Chaque achat utilisera et livrera un PIN de cette liste.
                </p>
              </div>
            </div>

            <textarea
              rows={8}
              value={pinsTextarea}
              onChange={e => setPinsTextarea(e.target.value)}
              placeholder="FF-PIN-11223344&#10;FF-PIN-55667788&#10;FF-PIN-99001122"
              className="w-full p-3.5 rounded-2xl glass-input text-xs font-mono text-amber-300 placeholder-slate-600 border-amber-500/30"
            />

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-mono">
                Nombre de PINs: <strong className="text-emerald-400">{pinsTextarea.split('\n').filter(p => p.trim()).length}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveProductPins(editingPinsProduct.id)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs shadow-md"
                >
                  Sauvegarder PINs
                </button>
                <button
                  onClick={() => setEditingPinsProduct(null)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
