import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product, WalletDeposit, ContactTicket, UserProfile, AdminStats, UserDetailedMetrics, DepositStatus, Order } from '../types';
import { Shield, LayoutDashboard, ShoppingBag, Wallet, Settings, MessageSquare, Plus, Trash2, Edit3, CheckCircle2, XCircle, AlertCircle, Save, Users, Award, RefreshCw, KeyRound, Lock, Eye, ArrowLeft, Flame, DollarSign, UserCheck, X, ShieldAlert, CreditCard, Calendar, Clock, Search, Filter, FileText, Check, Copy, Image as ImageIcon, Package } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

type AdminTab = 'stats' | 'produits' | 'commandes' | 'wallet' | 'config' | 'users' | 'contact';

export const AdminDashboard: React.FC = () => {
  const {
    products,
    natcashConfig,
    deposits,
    orders,
    tickets,
    adminStats,
    refreshData,
    showToast,
    setActiveTab
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      await fetchUsersDetailed();
      showToast('Toutes les données ont été actualisées avec succès !', 'success');
    } catch {
      showToast('Erreur lors de l\'actualisation des données.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

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
  const [newProdAllowedWallet, setNewProdAllowedWallet] = useState(true);
  const [newProdAllowedMoncash, setNewProdAllowedMoncash] = useState(false);
  const [newProdAllowedNatcash, setNewProdAllowedNatcash] = useState(false);

  // Edit Product Price / Payment Methods / Image State
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  const [editingPaymentMethodsProd, setEditingPaymentMethodsProd] = useState<Product | null>(null);
  const [editingImageProd, setEditingImageProd] = useState<Product | null>(null);
  const [editingImageUrl, setEditingImageUrl] = useState<string>('');
  const [editAllowedWallet, setEditAllowedWallet] = useState(true);
  const [editAllowedMoncash, setEditAllowedMoncash] = useState(false);
  const [editAllowedNatcash, setEditAllowedNatcash] = useState(false);

  // Users Tab Search State
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // PIN Codes Security Gate (Password: 04004749+)
  const [isPinSectionUnlocked, setIsPinSectionUnlocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinPasswordInput, setPinPasswordInput] = useState('');
  const [editingPinsProduct, setEditingPinsProduct] = useState<Product | null>(null);
  const [pinsTextarea, setPinsTextarea] = useState('');

  // Wallet Deposit Filters & Modal State
  const [depositFilter, setDepositFilter] = useState<'tous' | 'en_attente' | 'valide' | 'manque_preuve' | 'id_manquant' | 'rejete'>('tous');
  const [depositSearch, setDepositSearch] = useState('');
  const [selectedDepositForNote, setSelectedDepositForNote] = useState<WalletDeposit | null>(null);
  const [modalDepositStatus, setModalDepositStatus] = useState<DepositStatus>('en_attente');
  const [modalAdminNote, setModalAdminNote] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  // Orders Tab State & Modals
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'reussi' | 'en_attente' | 'echoue'>('all');
  const [orderMethodFilter, setOrderMethodFilter] = useState<'all' | 'wallet' | 'natcash_direct' | 'moncash_direct'>('all');
  const [selectedOrderModal, setSelectedOrderModal] = useState<Order | null>(null);
  const [modalOrderStatus, setModalOrderStatus] = useState<'reussi' | 'en_attente' | 'echoue'>('en_attente');
  const [modalOrderPinCode, setModalOrderPinCode] = useState('');
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  const handleOpenOrderModal = (ord: Order) => {
    setSelectedOrderModal(ord);
    setModalOrderStatus(ord.status);
    setModalOrderPinCode(ord.pinCodeDelivered || '');
  };

  const handleSaveOrderModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderModal) return;

    setIsUpdatingOrder(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrderModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: modalOrderStatus,
          pinCode: modalOrderPinCode.trim() || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Commande ${selectedOrderModal.id} mise à jour avec succès !`, 'success');
        setSelectedOrderModal(null);
        await refreshData();
      } else {
        showToast(data.error || 'Erreur lors de la mise à jour de la commande.', 'error');
      }
    } catch {
      showToast('Erreur réseau.', 'error');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const filteredOrders = orders.filter(ord => {
    if (orderStatusFilter !== 'all' && ord.status !== orderStatusFilter) {
      return false;
    }
    if (orderMethodFilter !== 'all' && ord.paymentMethod !== orderMethodFilter) {
      return false;
    }
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.toLowerCase().trim();
      const matchId = (ord.id || '').toLowerCase().includes(q);
      const matchUser = (ord.userName || '').toLowerCase().includes(q) || (ord.userEmail || '').toLowerCase().includes(q);
      const matchPlayerId = (ord.gamePlayerId || '').toLowerCase().includes(q);
      const matchTx = (ord.natcashTransactionId || '').toLowerCase().includes(q);
      const matchPin = (ord.pinCodeDelivered || '').toLowerCase().includes(q);
      const matchProduct = (ord.productName || '').toLowerCase().includes(q);
      return matchId || matchUser || matchPlayerId || matchTx || matchPin || matchProduct;
    }
    return true;
  });

  // Wallet Adjustment Form State
  const [adjustEmail, setAdjustEmail] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('500');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustNote, setAdjustNote] = useState('');
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);

  // Config Action Confirmation PIN Modal State
  const [isConfigPinModalOpen, setIsConfigPinModalOpen] = useState(false);
  const [configPinInput, setConfigPinInput] = useState('');
  const [configPinError, setConfigPinError] = useState('');

  const formatFullDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      const dateFormatted = d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const timeFormatted = d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const capitalized = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
      return `${capitalized} à ${timeFormatted}`;
    } catch {
      return dateStr;
    }
  };

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
        setIsPinModalOpen(false);
        showToast('Accès à la gestion des PINs déverrouillé !', 'success');
        setPinPasswordInput('');
      } else {
        showToast(data.error || 'Mot de passe incorrect.', 'error');
      }
    } catch {
      showToast('Erreur réseau.', 'error');
    }
  };

  // Save NATCASH, MonCash & Admin PIN Config (Prompts PIN validation)
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigPinInput('');
    setConfigPinError('');
    setIsConfigPinModalOpen(true);
  };

  // Execute save config after PIN validation
  const handleConfirmSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = natcashConfig.adminPin || '123456';
    if (
      configPinInput !== correctPin &&
      configPinInput !== '04004749' &&
      configPinInput !== '04004749+' &&
      configPinInput !== adminPinConfig
    ) {
      setConfigPinError('Code PIN Admin invalide pour valider cette action.');
      return;
    }

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
        showToast('Action validée ! Configuration et Code PIN Admin enregistrés.', 'success');
        setIsConfigPinModalOpen(false);
        setConfigPinInput('');
        await refreshData();
      } else {
        showToast('Erreur lors de la sauvegarde.', 'error');
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
      const allowedMethods: ('wallet' | 'moncash' | 'natcash')[] = [];
      if (newProdAllowedWallet) allowedMethods.push('wallet');
      if (newProdAllowedMoncash) allowedMethods.push('moncash');
      if (newProdAllowedNatcash) allowedMethods.push('natcash');
      if (allowedMethods.length === 0) allowedMethods.push('wallet');

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
          pinCodes: pinArray,
          allowedPaymentMethods: allowedMethods
        })
      });

      if (res.ok) {
        showToast('Produit ajouté avec succès au catalogue !', 'success');
        setIsProductModalOpen(false);
        setNewProdName('');
        setNewProdPins('');
        setNewProdAllowedWallet(true);
        setNewProdAllowedMoncash(false);
        setNewProdAllowedNatcash(false);
        await refreshData();
      }
    } catch {
      showToast('Erreur lors de l\'ajout du produit.', 'error');
    }
  };

  // Save Payment Methods for a Product
  const handleSaveProductPaymentMethods = async (productId: string) => {
    const allowedMethods: ('wallet' | 'moncash' | 'natcash')[] = [];
    if (editAllowedWallet) allowedMethods.push('wallet');
    if (editAllowedMoncash) allowedMethods.push('moncash');
    if (editAllowedNatcash) allowedMethods.push('natcash');
    if (allowedMethods.length === 0) allowedMethods.push('wallet');

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowedPaymentMethods: allowedMethods })
      });
      if (res.ok) {
        showToast('Modes de paiement mis à jour avec succès !', 'success');
        setEditingPaymentMethodsProd(null);
        await refreshData();
      } else {
        showToast('Erreur lors de la mise à jour des modes de paiement.', 'error');
      }
    } catch {
      showToast('Erreur réseau.', 'error');
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

  // Update Product Image URL
  const handleSaveProductImage = async (productId: string, imageUrl: string) => {
    if (!imageUrl || !imageUrl.trim()) {
      showToast('Veuillez fournir une URL d\'image valide.', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl.trim() })
      });
      if (res.ok) {
        showToast('Photo du produit mise à jour avec succès !', 'success');
        setEditingImageProd(null);
        setEditingImageUrl('');
        await refreshData();
      } else {
        showToast('Erreur lors de la mise à jour de la photo.', 'error');
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
  const handleUpdateDepositStatus = async (id: string, status: DepositStatus, adminNote?: string) => {
    try {
      const res = await fetch(`/api/wallet/deposits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote })
      });
      if (res.ok) {
        showToast(`Statut du dépôt mis à jour (${status})`, 'success');
        await refreshData();
        await fetchUsersDetailed();
        setSelectedDepositForNote(null);
        setModalAdminNote('');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Erreur lors de la mise à jour.', 'error');
      }
    } catch {
      showToast('Erreur de mise à jour.', 'error');
    }
  };

  // Update Ticket Status
  const handleUpdateTicketStatus = async (id: string, status: 'resolu' | 'en_cours' | 'nouveau') => {
    try {
      const res = await fetch(`/api/contact/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Statut du message mis à jour (${status})`, 'success');
        await refreshData();
      }
    } catch {
      showToast('Erreur lors de la mise à jour.', 'error');
    }
  };

  // Delete Ticket
  const handleDeleteTicket = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce message client ?')) return;
    try {
      const res = await fetch(`/api/contact/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Message supprimé !', 'success');
        await refreshData();
      }
    } catch {
      showToast('Erreur de suppression.', 'error');
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
          type: adjustType,
          adminNote: adjustNote
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
      setAdjustNote('');
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

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('accueil')}
              className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-[#1E90FF] hover:text-white font-bold text-xs flex items-center gap-1.5 border border-blue-500/30 transition-all shadow-sm"
              title="Retourner au site principal"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Retour au Site
            </button>

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
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 shadow-sm transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-[#1E90FF] ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Actualisation...' : 'Actualiser Données'}
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
            onClick={() => setActiveAdminTab('commandes')}
            className={`w-full p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
              activeAdminTab === 'commandes'
                ? 'bg-[#1E90FF] text-white shadow-md shadow-blue-500/20'
                : 'glass-card text-slate-300 hover:bg-slate-900 hover:text-white border border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-[#1E90FF]" />
              <span>Gestion Commandes</span>
            </div>
            {orders.filter(o => o.status === 'en_attente').length > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] animate-pulse">
                {orders.filter(o => o.status === 'en_attente').length}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                {orders.length}
              </span>
            )}
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
          
          {/* TAB 1: STATS & ANALYTICS */}
          {activeAdminTab === 'stats' && (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-black text-white">Tableau de Bord & Progression des Ventes</h2>
                  <p className="text-xs text-slate-400">
                    Analyse en temps réel de l'activité du site, des revenus, des packs les plus vendus et des meilleurs clients.
                  </p>
                </div>
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#1E90FF] ${isRefreshing ? 'animate-spin' : ''}`} /> Actualiser
                </button>
              </div>

              {/* 5 Key Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/80 to-slate-900 border border-blue-500/30 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-blue-300 font-extrabold uppercase tracking-wider">Chiffre d'Affaires Total</p>
                    <div className="p-2 rounded-xl bg-blue-500/20 text-[#1E90FF]">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-white">
                    {adminStats ? `${(adminStats.totalAmountPurchasedHTG ?? 0).toLocaleString('fr-FR')} HTG` : '0 HTG'}
                  </p>
                  <p className="text-[10px] text-slate-400">Total accumulé des achats réussis</p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/30 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-emerald-300 font-extrabold uppercase tracking-wider">Ventes Effectuées</p>
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-white">
                    {adminStats ? adminStats.totalSalesCount : 0} <span className="text-xs text-emerald-400 font-bold">achats</span>
                  </p>
                  <p className="text-[10px] text-slate-400">Commandes livrées avec succès</p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/80 to-slate-900 border border-purple-500/30 space-y-2 shadow-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-purple-300 font-extrabold uppercase tracking-wider">Clients Inscrits</p>
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-white">
                    {adminStats ? adminStats.totalUsersCount : 0} <span className="text-xs text-purple-300 font-bold">utilisateurs</span>
                  </p>
                  <p className="text-[10px] text-slate-400">Comptes enregistrés sur FRAYZEN</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-2 shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-amber-300 font-extrabold uppercase tracking-wider">Recharges Wallet en Attente</p>
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl font-black text-amber-400">
                    {adminStats ? adminStats.pendingDepositsCount : 0} <span className="text-xs text-slate-400 font-normal">à vérifier</span>
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-2 sm:col-span-2 shadow-md">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-cyan-300 font-extrabold uppercase tracking-wider">Produit vedette le plus vendu</p>
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                      <Flame className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-lg font-black text-white">
                    {adminStats ? adminStats.topSellingProduct : 'Aucun produit pour l\'instant'}
                  </p>
                </div>
              </div>

              {/* SECTION: BAREM & PROGRESSION DES PACKS VENDUS */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    Progression & Classement des Packs Diamants Vendus
                  </h3>
                  <span className="text-xs font-extrabold text-[#1E90FF]">
                    {adminStats?.packSales?.length || 0} Packs Actifs
                  </span>
                </div>

                {adminStats?.packSales && adminStats.packSales.length > 0 ? (
                  <div className="space-y-4">
                    {adminStats.packSales.map((pack) => {
                      const maxSales = adminStats.totalSalesCount || 1;
                      const percent = Math.min(100, Math.round((pack.count / maxSales) * 100));

                      return (
                        <div key={pack.productName} className="space-y-2 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <span className="font-extrabold text-white text-sm flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#1E90FF]"></span>
                              {pack.productName}
                            </span>
                            <div className="flex items-center gap-3 text-slate-300 font-mono text-xs">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-black">
                                {pack.count} {pack.count > 1 ? 'fois achte' : 'fois achte'}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-[#1E90FF] font-black">
                                {(pack.totalHTG ?? 0).toLocaleString('fr-FR')} HTG
                              </span>
                            </div>
                          </div>

                          {/* Visual Progress Bar */}
                          <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden p-0.5 border border-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#1E90FF] via-blue-500 to-cyan-400 transition-all duration-500 shadow-sm"
                              style={{ width: `${Math.max(8, percent)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Aucune statistique de pack disponible pour l'instant.</p>
                )}
              </div>

              {/* SECTION: TOP 10 DES ACHETEURS */}
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    Top 10 des Meilleurs Clients (Plus d'Achats)
                  </h3>
                  <span className="text-xs text-slate-400">Classement automatique par volume d'achat HTG</span>
                </div>

                {adminStats && adminStats.topBuyers && adminStats.topBuyers.length > 0 ? (
                  <div className="space-y-3">
                    {adminStats.topBuyers.map((buyer, idx) => {
                      const isTop1 = idx === 0;
                      const isTop2 = idx === 1;
                      const isTop3 = idx === 2;

                      return (
                        <div
                          key={buyer.email}
                          className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-md transition-all ${
                            isTop1
                              ? 'bg-amber-950/30 border-amber-500/50'
                              : isTop2
                              ? 'bg-slate-800/80 border-slate-400/50'
                              : isTop3
                              ? 'bg-orange-950/30 border-orange-500/40'
                              : 'bg-slate-950/80 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`w-9 h-9 rounded-2xl font-black flex items-center justify-center text-xs shadow-md shrink-0 ${
                              isTop1 ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-black' :
                              isTop2 ? 'bg-gradient-to-tr from-slate-300 to-slate-100 text-black' :
                              isTop3 ? 'bg-gradient-to-tr from-amber-700 to-amber-500 text-white' :
                              'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              #{idx + 1}
                            </div>

                            <div>
                              <p className="font-extrabold text-white text-sm">{buyer.userName}</p>
                              <p className="text-[11px] text-slate-400">{buyer.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                            <div className="text-left sm:text-right">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Volume Total</p>
                              <p className="font-black text-[#1E90FF] text-sm">{(buyer.totalAmountHTG ?? 0).toLocaleString('fr-FR')} HTG</p>
                            </div>

                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Achats</p>
                              <p className="font-extrabold text-emerald-400 text-xs">{buyer.ordersCount} fois achte</p>
                              {buyer.lastOrderDate && (
                                <p className="text-[9px] text-slate-500">{new Date(buyer.lastOrderDate).toLocaleDateString('fr-FR')}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Aucun acheteur enregistré pour l'instant.</p>
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
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-amber-400 text-base shrink-0">
                              💎
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-white text-sm">{p.name}</p>
                            <p className="text-[10px] text-slate-400">
                              Stock: {p.stock} | PINs dispo: <strong className="text-emerald-400">{p.pinCodes?.length || 0}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
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
                              <span className="font-black text-[#1E90FF] text-sm">{(p.priceHTG ?? 0).toLocaleString('fr-FR')} HTG</span>
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

                          {/* EDIT PRODUCT IMAGE BUTTON */}
                          <button
                            onClick={() => {
                              setEditingImageProd(p);
                              setEditingImageUrl(p.image || '');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-600 hover:text-white transition-colors flex items-center gap-1 font-bold text-[11px]"
                            title="Modifier la photo / image du produit"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                            Photo
                          </button>

                          {/* PAYMENT METHODS BUTTON */}
                          <button
                            onClick={() => {
                              setEditingPaymentMethodsProd(p);
                              const methods = p.allowedPaymentMethods && p.allowedPaymentMethods.length > 0
                                ? p.allowedPaymentMethods
                                : (p.category === 'free_fire' ? ['wallet'] : ['wallet', 'moncash', 'natcash']);
                              setEditAllowedWallet(methods.includes('wallet'));
                              setEditAllowedMoncash(methods.includes('moncash'));
                              setEditAllowedNatcash(methods.includes('natcash'));
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors flex items-center gap-1 font-bold text-[11px]"
                            title="Gérer les modes de paiement autorisés"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                            Paiement
                          </button>

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

                  {/* Image URL Field */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                    <label className="font-bold text-slate-300 block">
                      URL de la Photo / Image du Produit :
                    </label>
                    <input
                      type="url"
                      placeholder="https://... (Lien de l'image PNG / JPG)"
                      value={newProdImage}
                      onChange={e => setNewProdImage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-500 font-mono"
                    />
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] text-slate-400 font-bold">Propositions rapides :</span>
                      <button
                        type="button"
                        onClick={() => setNewProdImage('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80')}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10px]"
                      >
                        🔥 Free Fire Main
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProdImage('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80')}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-[10px]"
                      >
                        💎 Diamants
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProdImage('https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80')}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[10px]"
                      >
                        ⚔️ Mobile Legends
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProdImage('https://images.unsplash.com/photo-1556742049-0a670e4a4591?auto=format&fit=crop&w=800&q=80')}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-[10px]"
                      >
                        🎁 Cartes Cadeaux
                      </button>
                    </div>
                  </div>

                  <textarea
                    placeholder="Codes PINs (Un PIN par ligne pour la livraison automatique)"
                    value={newProdPins}
                    onChange={e => setNewProdPins(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs font-mono text-white placeholder-slate-500"
                  />

                  {/* Payment Methods selector */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      Modes de paiement autorisés pour ce produit :
                    </label>
                    <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={newProdAllowedWallet}
                          onChange={e => setNewProdAllowedWallet(e.target.checked)}
                          className="rounded border-slate-700 text-[#1E90FF] focus:ring-[#1E90FF]"
                        />
                        <span>Solde Wallet (Portefeuille)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={newProdAllowedMoncash}
                          onChange={e => setNewProdAllowedMoncash(e.target.checked)}
                          className="rounded border-slate-700 text-red-500 focus:ring-red-500"
                        />
                        <span>Direct MonCash</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={newProdAllowedNatcash}
                          onChange={e => setNewProdAllowedNatcash(e.target.checked)}
                          className="rounded border-slate-700 text-[#FF6321] focus:ring-[#FF6321]"
                        />
                        <span>Direct NATCASH</span>
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      * Par défaut pour les diamants Free Fire, seul le Solde Wallet est sélectionné.
                    </p>
                  </div>

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

              {/* Edit Product Payment Methods Modal */}
              {editingPaymentMethodsProd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-white/20 text-white space-y-5 shadow-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-[#1E90FF]" />
                        Modes de paiement autorisés
                      </h3>
                      <button
                        onClick={() => setEditingPaymentMethodsProd(null)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-white">{editingPaymentMethodsProd.name}</p>
                      <p className="text-xs text-slate-400">Cochez les modes de paiement avec lesquels les clients pourront acheter ce produit :</p>
                    </div>

                    <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editAllowedWallet}
                          onChange={e => setEditAllowedWallet(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 text-[#1E90FF] focus:ring-[#1E90FF]"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">Solde Portefeuille (Wallet)</p>
                          <p className="text-[10px] text-slate-400">Le client paye avec l'argent sur son compte FRAYZEN SHOP</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editAllowedMoncash}
                          onChange={e => setEditAllowedMoncash(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 text-red-500 focus:ring-red-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">Direct MonCash</p>
                          <p className="text-[10px] text-slate-400">Le client envoie un transfert direct MonCash</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editAllowedNatcash}
                          onChange={e => setEditAllowedNatcash(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 text-[#FF6321] focus:ring-[#FF6321]"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">Direct NATCASH</p>
                          <p className="text-[10px] text-slate-400">Le client envoie un transfert direct NATCASH</p>
                        </div>
                      </label>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        onClick={() => setEditingPaymentMethodsProd(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleSaveProductPaymentMethods(editingPaymentMethodsProd.id)}
                        className="px-5 py-2 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: GESTION DES COMMANDES (MES COMMANDES / ACHATS) */}
          {activeAdminTab === 'commandes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-[#1E90FF]" />
                    Gestion & Historique de Toutes les Commandes
                  </h2>
                  <p className="text-xs text-slate-400">
                    Consultez, filtrez et validez les commandes des clients (Solde Wallet, NATCASH, MonCash).
                  </p>
                </div>
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#1E90FF] ${isRefreshing ? 'animate-spin' : ''}`} /> Actualiser
                </button>
              </div>

              {/* Order Stats Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Commandes</p>
                  <p className="text-xl font-black text-white">{orders.length}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Réussies / Livrées</p>
                  <p className="text-xl font-black text-emerald-400">
                    {orders.filter(o => o.status === 'reussi').length}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-1">
                  <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">En Attente</p>
                  <p className="text-xl font-black text-amber-400">
                    {orders.filter(o => o.status === 'en_attente').length}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 space-y-1">
                  <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Échouées / Rejetées</p>
                  <p className="text-xl font-black text-rose-400">
                    {orders.filter(o => o.status === 'echoue').length}
                  </p>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-white/10 space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                  {/* Search Bar */}
                  <div className="relative w-full md:w-1/2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Rechercher par ID, Nom, Email, ID Joueur, PIN, Code Tx..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#1E90FF]"
                    />
                    {orderSearchQuery && (
                      <button
                        onClick={() => setOrderSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Payment Method Selector */}
                  <div className="w-full md:w-auto flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold shrink-0">Paiement:</span>
                    <select
                      value={orderMethodFilter}
                      onChange={(e) => setOrderMethodFilter(e.target.value as any)}
                      className="w-full md:w-auto px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-[#1E90FF]"
                    >
                      <option value="all">Tous les modes</option>
                      <option value="wallet">Portefeuille (Wallet)</option>
                      <option value="natcash_direct">NATCASH Direct</option>
                      <option value="moncash_direct">MonCash Direct</option>
                    </select>
                  </div>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400 font-bold flex items-center gap-1 my-auto mr-1">
                    <Filter className="w-3.5 h-3.5" /> Statut:
                  </span>
                  <button
                    onClick={() => setOrderStatusFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      orderStatusFilter === 'all'
                        ? 'bg-[#1E90FF] text-white shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Toutes ({orders.length})
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('en_attente')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      orderStatusFilter === 'en_attente'
                        ? 'bg-amber-500 text-black font-black'
                        : 'bg-slate-900 text-amber-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    🟡 En Attente ({orders.filter(o => o.status === 'en_attente').length})
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('reussi')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      orderStatusFilter === 'reussi'
                        ? 'bg-emerald-500 text-black font-black'
                        : 'bg-slate-900 text-emerald-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    🟢 Réussies ({orders.filter(o => o.status === 'reussi').length})
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('echoue')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      orderStatusFilter === 'echoue'
                        ? 'bg-rose-500 text-white font-black'
                        : 'bg-slate-900 text-rose-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    🔴 Échouées ({orders.filter(o => o.status === 'echoue').length})
                  </button>
                </div>
              </div>

              {/* Orders List */}
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
                  <CreditCard className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-400">Aucune commande ne correspond aux critères</p>
                  <p className="text-xs text-slate-500">
                    {orderSearchQuery || orderStatusFilter !== 'all' || orderMethodFilter !== 'all'
                      ? "Essayez de modifier votre recherche ou de changer les filtres."
                      : "Aucune commande enregistrée pour le moment."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map(ord => {
                    const ordDate = new Date(ord.createdAt);
                    const formattedDate = ordDate.toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    const formattedTime = ordDate.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    });

                    return (
                      <div
                        key={ord.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          ord.status === 'en_attente'
                            ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-950/20'
                            : ord.status === 'reussi'
                            ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                            : 'bg-rose-950/20 border-rose-500/30'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-black text-[#1E90FF] bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                                #{ord.id}
                              </span>

                              {ord.status === 'reussi' && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px] flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Réussie / Livrée
                                </span>
                              )}
                              {ord.status === 'en_attente' && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold text-[10px] flex items-center gap-1 animate-pulse">
                                  <AlertCircle className="w-3 h-3" /> En Attente de Validation
                                </span>
                              )}
                              {ord.status === 'echoue' && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 font-extrabold text-[10px] flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Échouée / Rejetée
                                </span>
                              )}

                              <span className="text-[10px] text-slate-400 font-bold px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700">
                                {ord.paymentMethod === 'wallet' ? 'Portefeuille (Wallet)' : ord.paymentMethod === 'moncash_direct' ? 'MonCash Direct' : 'NATCASH Direct'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                              <p className="font-bold text-white flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                {ord.userName}
                                <span className="text-slate-400 font-normal">({ord.userEmail})</span>
                              </p>
                              <span className="text-slate-600">•</span>
                              <p className="text-slate-400 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formattedDate} à {formattedTime}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                              <div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase block">Produit</span>
                                <span className="font-extrabold text-white">{ord.productName}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase block">Montant</span>
                                <span className="font-black text-[#1E90FF]">{ord.priceHTG.toLocaleString('fr-FR')} HTG</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase block">ID Joueur Free Fire</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono font-black text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                                    {ord.gamePlayerId || 'N/A'}
                                  </span>
                                  {ord.gamePlayerId && (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(ord.gamePlayerId);
                                        showToast('ID Joueur copié !', 'info');
                                      }}
                                      title="Copier ID Joueur"
                                      className="p-1 text-slate-400 hover:text-white"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {ord.natcashTransactionId && (
                                <div>
                                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Code Transaction Tx</span>
                                  <span className="font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                                    {ord.natcashTransactionId}
                                  </span>
                                </div>
                              )}
                            </div>

                            {ord.pinCodeDelivered && (
                              <div className="pt-2 flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400">PIN Livré:</span>
                                <span className="font-mono font-black text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-500/40 text-xs tracking-wider">
                                  {ord.pinCodeDelivered}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(ord.pinCodeDelivered!);
                                    showToast('Code PIN copié !', 'info');
                                  }}
                                  className="p-1 text-slate-400 hover:text-white"
                                  title="Copier le PIN"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                            <button
                              onClick={() => handleOpenOrderModal(ord)}
                              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold flex items-center gap-1.5 border border-slate-700 shadow-sm"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#1E90FF]" /> Modifier / Valider
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GESTION DE WALLET ET HISTORIQUE DES TRANSACTIONS */}
          {activeAdminTab === 'wallet' && (
            <div className="space-y-8">
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <Wallet className="w-6 h-6 text-[#1E90FF]" />
                      Historique & Gestion des Dépôts
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Validez les recharges, vérifiez les preuves et modifiez les statuts avec explications pour le client.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filtrer par nom, email, ID..."
                      value={depositSearch}
                      onChange={e => setDepositSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl glass-input text-xs text-white placeholder-slate-400 border border-slate-700 focus:border-[#1E90FF]"
                    />
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => setDepositFilter('tous')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                      depositFilter === 'tous'
                        ? 'bg-[#1E90FF] text-white shadow-md'
                        : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    Tous
                    <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-black">{deposits.length}</span>
                  </button>

                  <button
                    onClick={() => setDepositFilter('en_attente')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                      depositFilter === 'en_attente'
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    En attente
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-500/30 text-[10px] font-black">
                      {deposits.filter(d => d.status === 'en_attente').length}
                    </span>
                  </button>

                  <button
                    onClick={() => setDepositFilter('valide')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                      depositFilter === 'valide'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Validé / Terminé
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/30 text-[10px] font-black">
                      {deposits.filter(d => d.status === 'valide').length}
                    </span>
                  </button>

                  <button
                    onClick={() => setDepositFilter('manque_preuve')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                      depositFilter === 'manque_preuve'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Preuve manquante
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-500/30 text-[10px] font-black">
                      {deposits.filter(d => d.status === 'manque_preuve').length}
                    </span>
                  </button>

                  <button
                    onClick={() => setDepositFilter('id_manquant')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                      depositFilter === 'id_manquant'
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-orange-500/10 text-orange-300 border border-orange-500/30 hover:bg-orange-500/20'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    ID manquant
                    <span className="px-1.5 py-0.5 rounded-md bg-orange-500/30 text-[10px] font-black">
                      {deposits.filter(d => d.status === 'id_manquant').length}
                    </span>
                  </button>

                  <button
                    onClick={() => setDepositFilter('rejete')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                      depositFilter === 'rejete'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rejeté
                    <span className="px-1.5 py-0.5 rounded-md bg-red-500/30 text-[10px] font-black">
                      {deposits.filter(d => d.status === 'rejete').length}
                    </span>
                  </button>
                </div>

                {/* Deposits List */}
                {deposits.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">Aucune demande de dépôt enregistrée.</p>
                ) : deposits.filter(dep => {
                  const matchesFilter =
                    depositFilter === 'tous' ? true :
                    depositFilter === 'en_attente' ? dep.status === 'en_attente' :
                    depositFilter === 'valide' ? dep.status === 'valide' :
                    depositFilter === 'manque_preuve' ? dep.status === 'manque_preuve' :
                    depositFilter === 'id_manquant' ? dep.status === 'id_manquant' :
                    depositFilter === 'rejete' ? dep.status === 'rejete' : true;

                  if (!matchesFilter) return false;
                  if (!depositSearch.trim()) return true;

                  const q = depositSearch.toLowerCase().trim();
                  return (
                    (dep.userName && dep.userName.toLowerCase().includes(q)) ||
                    (dep.userEmail && dep.userEmail.toLowerCase().includes(q)) ||
                    (dep.userPhone && dep.userPhone.toLowerCase().includes(q)) ||
                    (dep.transactionId14 && dep.transactionId14.toLowerCase().includes(q))
                  );
                }).length === 0 ? (
                  <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                    <p className="text-xs text-slate-400">Aucun dépôt ne correspond à ce filtre ou recherche.</p>
                    <button
                      onClick={() => { setDepositFilter('tous'); setDepositSearch(''); }}
                      className="px-3 py-1 rounded-xl bg-slate-800 text-[#1E90FF] text-xs font-bold"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deposits.filter(dep => {
                      const matchesFilter =
                        depositFilter === 'tous' ? true :
                        depositFilter === 'en_attente' ? dep.status === 'en_attente' :
                        depositFilter === 'valide' ? dep.status === 'valide' :
                        depositFilter === 'manque_preuve' ? dep.status === 'manque_preuve' :
                        depositFilter === 'id_manquant' ? dep.status === 'id_manquant' :
                        depositFilter === 'rejete' ? dep.status === 'rejete' : true;

                      if (!matchesFilter) return false;
                      if (!depositSearch.trim()) return true;

                      const q = depositSearch.toLowerCase().trim();
                      return (
                        (dep.userName && dep.userName.toLowerCase().includes(q)) ||
                        (dep.userEmail && dep.userEmail.toLowerCase().includes(q)) ||
                        (dep.userPhone && dep.userPhone.toLowerCase().includes(q)) ||
                        (dep.transactionId14 && dep.transactionId14.toLowerCase().includes(q))
                      );
                    }).map(dep => (
                      <div key={dep.id} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs shadow-md text-white hover:border-slate-700 transition-all">
                        
                        {/* Header: User Info & Amount */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-white text-sm">{dep.userName}</span>
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-[#1E90FF] text-[10px] font-bold border border-blue-500/20">
                                {dep.paymentMethod === 'natcash' ? 'NATCASH' : dep.paymentMethod === 'moncash' ? 'MonCash' : 'Recharge Admin'}
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px] flex flex-wrap items-center gap-3 mt-0.5">
                              <span>📧 {dep.userEmail}</span>
                              <span>📞 {dep.userPhone}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`font-black text-lg ${dep.amountHTG >= 0 ? 'text-[#1E90FF]' : 'text-red-400'}`}>
                              {dep.amountHTG >= 0 ? `+${dep.amountHTG.toLocaleString('fr-FR')}` : dep.amountHTG.toLocaleString('fr-FR')} HTG
                            </span>
                          </div>
                        </div>

                        {/* Transaction ID & Detailed Date/Time/Day */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-[#FF6321] font-bold">ID Transaction: {dep.transactionId14}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(dep.transactionId14);
                                setCopiedTxId(dep.transactionId14);
                                setTimeout(() => setCopiedTxId(null), 2000);
                              }}
                              className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                              title="Copier ID"
                            >
                              {copiedTxId === dep.transactionId14 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] sm:justify-end">
                            <Calendar className="w-3.5 h-3.5 text-[#1E90FF]" />
                            <span>{formatFullDateTime(dep.createdAt)}</span>
                          </div>
                        </div>

                        {/* Screenshot Attachment */}
                        {dep.screenshotUrl && (
                          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-300 font-bold flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-amber-400" />
                                Preuve de paiement jointe :
                              </span>
                              <button
                                onClick={() => setZoomedImage(dep.screenshotUrl!)}
                                className="text-[#1E90FF] hover:underline font-bold flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> Agrandir
                              </button>
                            </div>
                            <img
                              src={dep.screenshotUrl}
                              alt="Preuve de dépôt"
                              onClick={() => setZoomedImage(dep.screenshotUrl!)}
                              className="max-h-36 rounded-xl border border-slate-700 cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          </div>
                        )}

                        {/* Current Status & Admin Note */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-[11px] font-bold">Statut :</span>
                            {dep.status === 'valide' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Validé / Crédité
                              </span>
                            )}
                            {dep.status === 'en_attente' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 animate-pulse">
                                <Clock className="w-3.5 h-3.5" /> En attente
                              </span>
                            )}
                            {dep.status === 'manque_preuve' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                                <AlertCircle className="w-3.5 h-3.5" /> Preuve manquante
                              </span>
                            )}
                            {dep.status === 'id_manquant' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30">
                                <AlertCircle className="w-3.5 h-3.5" /> ID manquant
                              </span>
                            )}
                            {dep.status === 'rejete' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 font-bold border border-red-500/30">
                                <XCircle className="w-3.5 h-3.5" /> Rejeté
                              </span>
                            )}
                          </div>

                          {/* Quick Actions Dropdown / Buttons */}
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => handleUpdateDepositStatus(dep.id, 'valide')}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                              title="Valider et créditer le compte du client"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Valider (+Solde)
                            </button>

                            <button
                              onClick={() => handleUpdateDepositStatus(dep.id, 'manque_preuve', 'Preuve de paiement manquante. Veuillez soumettre une capture lisible.')}
                              className="px-2.5 py-1 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                              title="Marquer comme manque de preuve"
                            >
                              <AlertCircle className="w-3 h-3" /> Preuve Manquante
                            </button>

                            <button
                              onClick={() => handleUpdateDepositStatus(dep.id, 'id_manquant', 'Numéro de transaction manquant ou invalide. Veuillez vérifier votre reçu.')}
                              className="px-2.5 py-1 rounded-xl bg-orange-600/80 hover:bg-orange-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                              title="Marquer comme ID transaction manquant"
                            >
                              <AlertCircle className="w-3 h-3" /> ID Manquant
                            </button>

                            <button
                              onClick={() => handleUpdateDepositStatus(dep.id, 'rejete')}
                              className="px-2.5 py-1 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                              title="Rejeter la demande"
                            >
                              <XCircle className="w-3 h-3" /> Rejeter
                            </button>

                            <button
                              onClick={() => {
                                setSelectedDepositForNote(dep);
                                setModalDepositStatus(dep.status);
                                setModalAdminNote(dep.adminNote || '');
                              }}
                              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#1E90FF] border border-blue-500/30 font-bold text-[11px] flex items-center gap-1"
                              title="Ajouter une note ou changer le statut manuellement"
                            >
                              <Edit3 className="w-3 h-3" /> Note/Statut...
                            </button>
                          </div>
                        </div>

                        {dep.adminNote && (
                          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 italic">
                            💬 <strong>Note Admin :</strong> {dep.adminNote}
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Admin Manual Wallet Adjustment Form */}
              <div className="p-6 rounded-2xl bg-red-950/40 border border-red-900/80 space-y-4 shadow-sm text-white">
                <h3 className="text-base font-extrabold text-red-400 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-400" />
                  Ajustement Manuel Direct de Wallet
                </h3>
                <p className="text-xs text-slate-300">
                  Administrateur ka ajoute oswa <strong>retire lajan nan wallet yon user</strong> si gen erè ou bien réclamation. Yon rantre ap kreye nan istorik la otomatikman.
                </p>

                <form onSubmit={handleAdjustWallet} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="relative sm:col-span-1">
                      <input
                        type="text"
                        required
                        placeholder="Rechercher nom, email, tél..."
                        value={adjustEmail}
                        onFocus={() => setShowUserSuggestions(true)}
                        onChange={e => {
                          setAdjustEmail(e.target.value);
                          setShowUserSuggestions(true);
                        }}
                        className="w-full px-3 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-400 border border-red-500/30"
                      />

                      {/* Autocomplete suggestions dropdown */}
                      {showUserSuggestions && adjustEmail.length >= 1 && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 space-y-1">
                          {detailedUsers.filter(u =>
                            (u.name && u.name.toLowerCase().includes(adjustEmail.toLowerCase())) ||
                            (u.email && u.email.toLowerCase().includes(adjustEmail.toLowerCase())) ||
                            (u.phone && u.phone.includes(adjustEmail))
                          ).slice(0, 6).map(u => (
                            <button
                              key={u.id || u.email}
                              type="button"
                              onClick={() => {
                                setAdjustEmail(u.email);
                                setShowUserSuggestions(false);
                              }}
                              className="w-full text-left p-2 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-between text-xs"
                            >
                              <div>
                                <p className="font-extrabold text-white">{u.name}</p>
                                <p className="text-[10px] text-slate-400">{u.email} {u.phone ? `• ${u.phone}` : ''}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-[#1E90FF] font-black text-[10px]">
                                {(u.walletBalanceHTG ?? 0).toLocaleString('fr-FR')} HTG
                              </span>
                            </button>
                          ))}
                          {detailedUsers.filter(u =>
                            (u.name && u.name.toLowerCase().includes(adjustEmail.toLowerCase())) ||
                            (u.email && u.email.toLowerCase().includes(adjustEmail.toLowerCase())) ||
                            (u.phone && u.phone.includes(adjustEmail))
                          ).length === 0 && (
                            <p className="p-2 text-[11px] text-slate-400 text-center">Aucun utilisateur trouvé.</p>
                          )}
                        </div>
                      )}
                    </div>

                    <input
                      type="number"
                      required
                      placeholder="Montant HTG"
                      value={adjustAmount}
                      onChange={e => setAdjustAmount(e.target.value)}
                      className="px-3 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-400"
                    />

                    <select
                      value={adjustType}
                      onChange={e => setAdjustType(e.target.value as any)}
                      className="px-3 py-2.5 rounded-xl glass-input text-xs text-white bg-slate-900 border-slate-700 font-bold"
                    >
                      <option value="add" className="bg-slate-900 text-emerald-400">Ajouter (+Solde)</option>
                      <option value="deduct" className="bg-slate-900 text-red-400">Retirer / Déduire (-Solde)</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Raison / Note optionnelle..."
                      value={adjustNote}
                      onChange={e => setAdjustNote(e.target.value)}
                      className="px-3 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-400 border border-slate-700"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs shadow-md flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" /> Appliquer l'Ajustement
                    </button>
                  </div>
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

          {/* TAB 5: USERS LIST WITH DETAILED MODAL & LIVE SEARCH SUGGESTIONS */}
          {activeAdminTab === 'users' && (() => {
            const filteredUsersList = detailedUsers.filter(u => {
              if (!userSearchQuery.trim()) return true;
              const q = userSearchQuery.toLowerCase().trim();
              const nameMatch = (u.name || '').toLowerCase().includes(q);
              const emailMatch = (u.email || '').toLowerCase().includes(q);
              const phoneMatch = (u.phone || '').toLowerCase().includes(q);
              const idMatch = (u.id || '').toLowerCase().includes(q);
              return nameMatch || emailMatch || phoneMatch || idMatch;
            });

            return (
              <div className="space-y-4 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h2 className="text-xl font-black text-white">Utilisateurs Enregistrés & Profils</h2>
                    <p className="text-xs text-slate-400">
                      Recherche instantanée par nom, email, ID utilisateur ou numéro de téléphone.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-blue-500/20 text-[#1E90FF] border border-blue-500/30 self-start sm:self-auto">
                    {filteredUsersList.length} / {detailedUsers.length} Utilisateur(s)
                  </span>
                </div>

                {/* SEARCH INPUT WITH LIVE SUGGESTIONS */}
                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-[#1E90FF] absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Rechercher utilisateur (Tapez un Nom, Email, ID ex: usr-..., ou Téléphone)..."
                      value={userSearchQuery}
                      onChange={e => setUserSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:border-[#1E90FF] focus:ring-1 focus:ring-[#1E90FF] font-medium shadow-inner"
                    />
                    {userSearchQuery && (
                      <button
                        onClick={() => setUserSearchQuery('')}
                        className="absolute right-3.5 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                        title="Effacer la recherche"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* INSTANT LIVE SUGGESTIONS CARDS */}
                  {userSearchQuery.trim().length >= 1 && (
                    <div className="p-3.5 rounded-2xl bg-slate-900/95 border border-blue-500/30 shadow-2xl space-y-2 animate-fade-in">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                        <span className="flex items-center gap-1.5 text-[#1E90FF]">
                          🔍 Suggestions instantanées pour "{userSearchQuery}" :
                        </span>
                        <span>{filteredUsersList.length} trouvé(s)</span>
                      </div>

                      {filteredUsersList.length === 0 ? (
                        <p className="text-xs text-amber-400 font-semibold p-2">
                          Aucun utilisateur ne correspond à votre recherche.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {filteredUsersList.slice(0, 6).map(u => (
                            <div
                              key={u.id || u.email}
                              onClick={() => setSelectedUserModal(u)}
                              className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 hover:border-[#1E90FF] cursor-pointer transition-all flex items-center justify-between text-xs group hover:scale-[1.02] shadow-md"
                            >
                              <div className="space-y-0.5 min-w-0 pr-2">
                                <p className="font-extrabold text-white truncate group-hover:text-[#1E90FF]">
                                  {u.name}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                  <span>ID: {u.id}</span>
                                  <span>• {u.phone}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-black text-[#1E90FF] bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20 shrink-0">
                                {u.walletBalanceHTG} HTG
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* USERS TABLE */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 uppercase font-bold text-[10px]">
                        <th className="py-3 px-3">Nom / ID</th>
                        <th className="py-3 px-3">Email</th>
                        <th className="py-3 px-3">Téléphone</th>
                        <th className="py-3 px-3">Solde Wallet</th>
                        <th className="py-3 px-3">Commandes</th>
                        <th className="py-3 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredUsersList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
                            Aucun utilisateur trouvé avec ces critères de recherche.
                          </td>
                        </tr>
                      ) : (
                        filteredUsersList.map(u => (
                          <tr
                            key={u.id}
                            onClick={() => setSelectedUserModal(u)}
                            className="hover:bg-slate-900/80 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-3 font-bold text-white">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#1E90FF]/20 text-[#1E90FF] font-black flex items-center justify-center text-xs shrink-0">
                                  {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <p className="font-extrabold text-white text-xs">{u.name}</p>
                                  <p className="text-[9px] font-mono text-slate-500">ID: {u.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-300 font-medium">{u.email}</td>
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
                                className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-[#1E90FF] font-bold text-[10px] hover:bg-[#1E90FF] hover:text-white transition-colors"
                              >
                                Fiche Profil
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* TAB 6: CONTACT TICKETS */}
          {activeAdminTab === 'contact' && (
            <div className="space-y-6 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-black text-white">Messages & Messages Clients</h2>
                  <p className="text-xs text-slate-400">
                    Consultez, répondez directement par WhatsApp ou téléphone, et gérez l'état des demandes soumises via la page Contact.
                  </p>
                </div>
                <button
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#1E90FF] ${isRefreshing ? 'animate-spin' : ''}`} /> Actualiser
                </button>
              </div>

              {tickets.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">Aucun message client pour l'instant.</p>
                  <p className="text-xs text-slate-500">Les messages envoyés depuis la page Contact s'afficheront ici en temps réel.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map(tkt => {
                    const isNew = !tkt.status || tkt.status === 'nouveau';
                    const isResolu = tkt.status === 'resolu';
                    const cleanPhone = (tkt.userPhone || '').replace(/\D/g, '');

                    return (
                      <div
                        key={tkt.id}
                        className={`p-5 rounded-3xl border space-y-3 text-xs shadow-lg transition-all ${
                          isNew
                            ? 'bg-gradient-to-r from-amber-950/40 to-slate-900 border-amber-500/40'
                            : isResolu
                            ? 'bg-slate-950/80 border-emerald-500/30'
                            : 'bg-slate-900/90 border-slate-800'
                        }`}
                      >
                        {/* Header info */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-2xl font-black flex items-center justify-center text-sm shadow-md ${
                              isNew ? 'bg-amber-500 text-black' : isResolu ? 'bg-emerald-500 text-black' : 'bg-blue-500 text-white'
                            }`}>
                              {tkt.userName ? tkt.userName.charAt(0).toUpperCase() : 'C'}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-white text-sm">{tkt.userName}</span>
                                {isNew && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[9px] uppercase tracking-wider">
                                    Nouveau
                                  </span>
                                )}
                                {isResolu && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[9px] uppercase tracking-wider border border-emerald-500/30">
                                    Résolu / Traité
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400">
                                {tkt.userEmail} {tkt.userPhone ? `• Tél: ${tkt.userPhone}` : ''}
                              </p>
                            </div>
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {tkt.createdAt ? new Date(tkt.createdAt).toLocaleString('fr-FR') : ''}
                          </span>
                        </div>

                        {/* Subject & Message */}
                        <div className="space-y-1.5">
                          <p className="font-extrabold text-[#1E90FF] text-xs uppercase tracking-wide">
                            Sujet: {tkt.subject}
                          </p>
                          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
                            {tkt.message}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                          <div className="flex flex-wrap items-center gap-2">
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Bonjour ${tkt.userName}, FRAYZEN SHOP à votre service concernant votre message: "${tkt.subject}"`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-md transition-all"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Direct
                              </a>
                            )}

                            {tkt.userPhone && (
                              <a
                                href={`tel:${tkt.userPhone}`}
                                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] flex items-center gap-1.5 shadow-md transition-all"
                              >
                                Appeler Client
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateTicketStatus(tkt.id, isResolu ? 'nouveau' : 'resolu')}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all ${
                                isResolu
                                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-black border border-emerald-500/30'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isResolu ? 'Marquer Non Lu' : 'Marquer Résolu'}
                            </button>

                            <button
                              onClick={() => handleDeleteTicket(tkt.id)}
                              className="p-1.5 rounded-xl bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white border border-red-800/60 transition-all"
                              title="Supprimer ce message"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                  {(selectedUserModal.walletBalanceHTG ?? 0).toLocaleString('fr-FR')} HTG
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
                {selectedUserModal.createdAt ? new Date(selectedUserModal.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
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

      {/* MODAL 4: CONFIRMATION PIN FOR CONFIG SAVE */}
      {isConfigPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md p-6 rounded-3xl glass-card border border-blue-500/40 shadow-2xl space-y-5 text-white text-center">
            <button
              onClick={() => setIsConfigPinModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#1E90FF]/20 p-2 flex items-center justify-center border border-blue-500/40">
              <KeyRound className="w-7 h-7 text-[#1E90FF]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Validation par Code PIN</h3>
              <p className="text-xs text-slate-300">
                Entrez votre <strong>Code PIN Administrateur</strong> (6 chiffres) pour valider l'enregistrement de la configuration et des numéros.
              </p>
            </div>

            <form onSubmit={handleConfirmSaveConfig} className="space-y-4">
              <input
                type="password"
                maxLength={8}
                required
                placeholder="•••••• (Code PIN)"
                value={configPinInput}
                onChange={e => setConfigPinInput(e.target.value)}
                className="w-full text-center text-xl tracking-widest px-4 py-3 rounded-xl glass-input text-white border-blue-500/50 font-mono"
                autoFocus
              />

              {configPinError && (
                <p className="text-xs text-red-400 font-bold">{configPinError}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfigPinModalOpen(false)}
                  className="w-1/2 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="w-1/2 py-3 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-xs shadow-md shadow-blue-500/20"
                >
                  {isSavingConfig ? 'Validation...' : 'Valider & Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Deposit Custom Status / Note Modal */}
      {selectedDepositForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#1E90FF]" />
                Mettre à jour le Statut du Dépôt
              </h3>
              <button onClick={() => setSelectedDepositForNote(null)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <p><strong className="text-slate-400">Client :</strong> {selectedDepositForNote.userName} ({selectedDepositForNote.userEmail})</p>
                <p><strong className="text-slate-400">Montant :</strong> <span className="text-[#1E90FF] font-black">{selectedDepositForNote.amountHTG} HTG</span></p>
                <p><strong className="text-slate-400">Transaction ID :</strong> <span className="font-mono text-[#FF6321]">{selectedDepositForNote.transactionId14}</span></p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Choisir le Statut :</label>
                <select
                  value={modalDepositStatus}
                  onChange={e => setModalDepositStatus(e.target.value as DepositStatus)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                >
                  <option value="valide">🟢 Validé / Crédité (+Solde)</option>
                  <option value="en_attente">🟡 En attente de traitement</option>
                  <option value="manque_preuve">🟣 Preuve de paiement manquante</option>
                  <option value="id_manquant">🟠 ID de transaction manquant</option>
                  <option value="rejete">🔴 Rejeté</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Message / Raison explicative pour le client :</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Preuve de paiement illisible, s'il vous plaît envoyez une capture nette avec le reçu complet."
                  value={modalAdminNote}
                  onChange={e => setModalAdminNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDepositForNote(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleUpdateDepositStatus(selectedDepositForNote.id, modalDepositStatus, modalAdminNote)}
                className="px-4 py-2.5 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white text-xs font-extrabold shadow-md"
              >
                Appliquer & Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Zoom Screenshot Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-3xl max-h-[90vh] p-2" onClick={e => e.stopPropagation()}>
            <button onClick={() => setZoomedImage(null)} className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/90 text-white hover:bg-slate-800 border border-slate-700">
              <X className="w-6 h-6" />
            </button>
            <img src={zoomedImage} alt="Preuve de paiement" className="max-w-full max-h-[85vh] rounded-2xl border border-slate-700 shadow-2xl object-contain" />
          </div>
        </div>
      )}

      {/* Product Image Editing Modal */}
      {editingImageProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-purple-400" />
                Changer la Photo du Produit
              </h3>
              <button onClick={() => setEditingImageProd(null)} className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-300">Produit : <span className="text-[#1E90FF]">{editingImageProd.name}</span></p>

              {/* Live Image Preview */}
              <div className="flex justify-center p-3 rounded-2xl bg-slate-950 border border-slate-800 min-h-[100px] items-center">
                {editingImageUrl ? (
                  <img
                    src={editingImageUrl}
                    alt="Aperçu du produit"
                    className="max-h-40 rounded-xl object-contain border border-slate-700 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-slate-500 italic py-6">Aucune image configurée (Entrez une URL ci-dessous)</span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">URL de la photo / image :</label>
                <input
                  type="url"
                  placeholder="https://... (Lien direct JPG, PNG ou WebP)"
                  value={editingImageUrl}
                  onChange={e => setEditingImageUrl(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono"
                />
              </div>

              {/* Suggestions / Presets */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Choix rapides d'images populaires :</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingImageUrl('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80')}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10px]"
                  >
                    🔥 Free Fire Main
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingImageUrl('https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80')}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-[10px]"
                  >
                    💎 Diamants FF
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingImageUrl('https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80')}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[10px]"
                  >
                    ⚔️ Mobile Legends
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingImageUrl('https://images.unsplash.com/photo-1556742049-0a670e4a4591?auto=format&fit=crop&w=800&q=80')}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-[10px]"
                  >
                    🎁 Cartes Cadeaux
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingImageProd(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleSaveProductImage(editingImageProd.id, editingImageUrl)}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold shadow-md"
              >
                Enregistrer la Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Traiter / Valider une commande */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-white/20 shadow-2xl space-y-5 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#1E90FF]" />
                Traiter Commande #{selectedOrderModal.id}
              </h3>
              <button
                onClick={() => setSelectedOrderModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Client:</span>
                  <span className="font-bold text-white">{selectedOrderModal.userName} ({selectedOrderModal.userEmail})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Produit & Prix:</span>
                  <span className="font-extrabold text-[#1E90FF]">{selectedOrderModal.productName} — {selectedOrderModal.priceHTG.toLocaleString('fr-FR')} HTG</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ID Joueur Free Fire:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded">
                      {selectedOrderModal.gamePlayerId || 'N/A'}
                    </span>
                    {selectedOrderModal.gamePlayerId && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOrderModal.gamePlayerId);
                          showToast('ID Joueur copié !', 'info');
                        }}
                        className="p-0.5 text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Paiement:</span>
                  <span className="font-bold text-white uppercase">{selectedOrderModal.paymentMethod}</span>
                </div>
                {selectedOrderModal.natcashTransactionId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transaction Tx:</span>
                    <span className="font-mono font-bold text-slate-200">{selectedOrderModal.natcashTransactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Date/Heure:</span>
                  <span className="text-slate-300">
                    {new Date(selectedOrderModal.createdAt).toLocaleDateString('fr-FR')} à {new Date(selectedOrderModal.createdAt).toLocaleTimeString('fr-FR')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-300 mb-1.5">Statut de la commande :</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOrderStatus('reussi')}
                    className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                      modalOrderStatus === 'reussi'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>🟢 Réussie / Livrée</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalOrderStatus('en_attente')}
                    className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                      modalOrderStatus === 'en_attente'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>🟡 En Attente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalOrderStatus('echoue')}
                    className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border transition-all ${
                      modalOrderStatus === 'echoue'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-400" />
                    <span>🔴 Échouée / Rejetée</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-300 mb-1">
                  Code PIN attribué au client :
                </label>
                <input
                  type="text"
                  placeholder="Ex: FF-PIN-100-84920491 (Laissez vide pour auto-générer)"
                  value={modalOrderPinCode}
                  onChange={(e) => setModalOrderPinCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono font-bold focus:outline-none focus:border-[#1E90FF]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Si le statut est "Réussie" et le champ est vide, un code PIN du stock ou un code unique sera automatiquement attribué.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveOrderModal}
                disabled={isUpdatingOrder}
                className="px-5 py-2.5 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white text-xs font-extrabold shadow-md flex items-center gap-2"
              >
                {isUpdatingOrder ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
