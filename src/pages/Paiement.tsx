import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Wallet, Smartphone, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Copy, Check, Gamepad2, Gift, ExternalLink } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

export const Paiement: React.FC = () => {
  const {
    products,
    selectedProduct,
    setSelectedProduct,
    user,
    setActiveTab,
    setIsAuthModalOpen,
    setIsVerifyModalOpen,
    setIsDepositModalOpen,
    natcashConfig,
    submitOrder
  } = useApp();

  const [currentProduct, setCurrentProduct] = useState(selectedProduct || products[0] || null);
  const [gamePlayerId, setGamePlayerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'natcash_direct' | 'moncash_direct'>('wallet');
  const [natcashTxId, setNatcashTxId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderResultPin, setOrderResultPin] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const activeProduct = selectedProduct || currentProduct;

  if (!activeProduct) {
    return (
      <div className="p-12 text-center glass-card rounded-3xl space-y-4">
        <Gamepad2 className="w-12 h-12 mx-auto text-[#1E90FF]" />
        <h2 className="text-2xl font-bold text-white">Aucun produit sélectionné</h2>
        <p className="text-xs text-gray-300">Veuillez choisir un produit dans le catalogue avant de passer au paiement.</p>
      </div>
    );
  }

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2500);
  };

  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!user.isEmailVerified) {
      setIsVerifyModalOpen(true);
      return;
    }

    if (!gamePlayerId.trim()) {
      setErrorMsg('Veuillez saisir votre ID Joueur / ID de compte Free Fire.');
      return;
    }

    if (paymentMethod === 'natcash_direct' || paymentMethod === 'moncash_direct') {
      const cleaned = natcashTxId.replace(/\s+/g, '').trim();
      if (!cleaned || cleaned.length < 4) {
        setErrorMsg(`Veuillez saisir un code de transaction ${paymentMethod === 'moncash_direct' ? 'MonCash' : 'NATCASH'} valide.`);
        return;
      }
    }

    setIsSubmitting(true);
    const res = await submitOrder(
      activeProduct.id,
      gamePlayerId,
      paymentMethod,
      (paymentMethod === 'natcash_direct' || paymentMethod === 'moncash_direct') ? natcashTxId : undefined
    );
    setIsSubmitting(false);

    if (res.success) {
      if (res.order && res.order.pinCodeDelivered) {
        setOrderResultPin(res.order.pinCodeDelivered);
      } else if (paymentMethod === 'wallet') {
        setOrderResultPin('FF-PIN-RECUPERATION-AUTOMATIQUE');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Title */}
      <ScrollReveal direction="up">
        <div className="text-center space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-bold text-[#1E90FF] uppercase tracking-wider">
            Paiement Sécurisé
          </span>
          <h1 className="text-3xl font-black text-white">Finaliser votre commande</h1>
          <p className="text-xs text-slate-400">Confirmation instantanée et livraison du code PIN en direct</p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Product Summary */}
        <ScrollReveal direction="right" className="lg:col-span-5">
          <div className="p-6 rounded-3xl glass-card border border-white/12 space-y-6 text-white">
          <h3 className="text-lg font-black text-white pb-3 border-b border-white/10 flex items-center justify-between">
            <span>Résumé du Produit</span>
            <span className="text-xs text-[#1E90FF] font-semibold">Étape 1/2</span>
          </h3>

          <div className="flex gap-4 items-center">
            <img
              src={activeProduct.image}
              alt={activeProduct.name}
              className="w-20 h-20 object-cover rounded-2xl border border-slate-800 shrink-0"
            />
            <div>
              <h4 className="font-extrabold text-white text-base">{activeProduct.name}</h4>
              <p className="text-xs text-slate-400">{activeProduct.description}</p>
              <p className="text-lg font-black text-[#1E90FF] mt-1">
                {(activeProduct?.priceHTG ?? 0).toLocaleString('fr-FR')} HTG
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs shadow-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Montant sous-total:</span>
              <span className="font-bold text-white">{activeProduct.priceHTG} HTG</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Frais de transaction NATCASH / MonCash:</span>
              <span className="font-bold text-emerald-400">0 HTG (Gratuit)</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black">
              <span className="text-white">Total à payer:</span>
              <span className="text-[#1E90FF]">{activeProduct.priceHTG} HTG</span>
            </div>
          </div>

          {/* Product selector if needed */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold text-slate-400">Changer de produit ?</label>
            <select
              value={activeProduct.id}
              onChange={e => {
                const found = products.find(p => p.id === e.target.value);
                if (found) {
                  setSelectedProduct(found);
                  setCurrentProduct(found);
                }
              }}
              className="w-full px-3 py-2 rounded-xl glass-input text-xs text-white bg-slate-900 border-slate-800"
            >
              {products.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name} ({p.priceHTG} HTG)
                </option>
              ))}
            </select>
          </div>
        </div>
      </ScrollReveal>

        {/* Right Column: Checkout Form */}
        <ScrollReveal direction="left" className="lg:col-span-7">
          <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/12 space-y-6 text-white">
          
          {orderResultPin ? (
            /* PIN Received Success Screen */
            <div className="text-center space-y-6 py-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-2xl font-black text-white">Achat Réussi !</h3>
                <p className="text-xs text-slate-400">Voici votre code PIN Free Fire prêt à l'emploi :</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-[#FF6321] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                <span className="text-xl font-mono font-black text-amber-300 tracking-wider">
                  {orderResultPin}
                </span>
                <button
                  onClick={() => handleCopyPin(orderResultPin)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform"
                >
                  {copiedPin ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedPin ? 'PIN Copié !' : 'Kopye PIN nan'}
                </button>
              </div>

              {/* Redeem Button linking to pin.wik.do */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => setActiveTab('redeempins')}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transform hover:scale-[1.02] transition-all"
                >
                  <Gift className="w-5 h-5 text-amber-300" />
                  Réclamer mes {activeProduct.name}
                  <ExternalLink className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-slate-400">
                  Cliquez sur le bouton ci-dessus pour accéder à <strong>pin.wik.do</strong> et charger directement vos diamants.
                </p>
              </div>

              <p className="text-[11px] text-slate-400 border-t border-white/10 pt-3">
                Vous pouvez également retrouver tous vos PINs dans l'onglet <strong className="text-white">Profil</strong> à tout moment.
              </p>

              <button
                onClick={() => {
                  setOrderResultPin(null);
                  setSelectedProduct(null);
                }}
                className="w-full py-3 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md"
              >
                Passer une autre commande
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirmPurchase} className="space-y-6">
              
              {/* Step 1: Game ID Input */}
              <div className="space-y-2">
                <label htmlFor="game-player-id" className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>ID Joueur / Game ID (Ex: Free Fire)</span>
                  <span className="text-[#1E90FF] text-[10px]">Requis pour l'attribution</span>
                </label>
                <div className="relative">
                  <Gamepad2 className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    id="game-player-id"
                    name="gamePlayerId"
                    type="text"
                    required
                    value={gamePlayerId}
                    onChange={e => setGamePlayerId(e.target.value)}
                    placeholder="Saisissez votre ID Joueur Free Fire (Ex: 298471029)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-white placeholder-slate-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Step 2: Payment Method Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300">
                  Choisissez le mode de paiement :
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Option 1: Wallet Balance */}
                  <div
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      paymentMethod === 'wallet'
                        ? 'bg-blue-950/60 border-[#1E90FF] shadow-md shadow-blue-500/20'
                        : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Wallet className="w-5 h-5 text-[#1E90FF]" />
                      {paymentMethod === 'wallet' && <CheckCircle2 className="w-4 h-4 text-[#1E90FF]" />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Solde Wallet</p>
                      <p className="text-[10px] text-slate-400">
                        Dispo: <strong className="text-white">{user ? `${user.walletBalanceHTG} HTG` : '0 HTG'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Direct NATCASH */}
                  <div
                    onClick={() => setPaymentMethod('natcash_direct')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      paymentMethod === 'natcash_direct'
                        ? 'bg-orange-950/60 border-[#FF6321] shadow-md shadow-orange-500/20'
                        : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Smartphone className="w-5 h-5 text-[#FF6321]" />
                      {paymentMethod === 'natcash_direct' && <CheckCircle2 className="w-4 h-4 text-[#FF6321]" />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Direct NATCASH</p>
                      <p className="text-[10px] text-slate-400">N° {natcashConfig.number} ({natcashConfig.name})</p>
                    </div>
                  </div>

                  {/* Option 3: Direct MonCash */}
                  <div
                    onClick={() => setPaymentMethod('moncash_direct')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      paymentMethod === 'moncash_direct'
                        ? 'bg-red-950/60 border-red-600 shadow-md shadow-red-500/20'
                        : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Smartphone className="w-5 h-5 text-red-500" />
                      {paymentMethod === 'moncash_direct' && <CheckCircle2 className="w-4 h-4 text-red-500" />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Direct MonCash</p>
                      <p className="text-[10px] text-slate-400">N° {natcashConfig.moncashNumber || '47124969'} ({natcashConfig.moncashName || 'JOSELYNE TITY'})</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Direct NATCASH instructions if selected */}
              {paymentMethod === 'natcash_direct' && (
                <div className="p-4 rounded-2xl bg-[#1a1c23] border-t-4 border-[#FF6321] text-white space-y-3 shadow-xl">
                  <label htmlFor="natcash-direct-tx" className="text-xs text-slate-200 font-semibold leading-relaxed block">
                    Envoyez <strong className="text-[#FF6321]">{activeProduct.priceHTG} HTG</strong> au numéro NATCASH <strong className="text-white">{natcashConfig.number} ({natcashConfig.name})</strong> puis entrez le code de transaction :
                  </label>
                  <input
                    id="natcash-direct-tx"
                    name="natcashTxId"
                    type="text"
                    required
                    value={natcashTxId}
                    onChange={e => setNatcashTxId(e.target.value)}
                    placeholder="Entrez votre code de transaction NATCASH (14 chiffres)"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-mono font-bold text-white placeholder-slate-400 focus:border-[#FF6321] focus:outline-none"
                  />
                </div>
              )}

              {/* Direct MonCash instructions if selected */}
              {paymentMethod === 'moncash_direct' && (
                <div className="p-4 rounded-2xl bg-[#1a1c23] border-t-4 border-red-600 text-white space-y-3 shadow-xl">
                  <label htmlFor="moncash-direct-tx" className="text-xs text-slate-200 font-semibold leading-relaxed block">
                    Envoyez <strong className="text-red-400">{activeProduct.priceHTG} HTG</strong> au numéro MonCash <strong className="text-white">{natcashConfig.moncashNumber || '47124969'} ({natcashConfig.moncashName || 'JOSELYNE TITY'})</strong> puis entrez le code de transaction :
                  </label>
                  <input
                    id="moncash-direct-tx"
                    name="moncashTxId"
                    type="text"
                    required
                    value={natcashTxId}
                    onChange={e => setNatcashTxId(e.target.value)}
                    placeholder="Entrez votre kòd/ID de transaction MonCash"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-xs font-mono font-bold text-white placeholder-slate-400 focus:border-red-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Insufficient Balance Notice */}
              {paymentMethod === 'wallet' && user && user.walletBalanceHTG < activeProduct.priceHTG && (
                <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Solde insuffisant dans votre portefeuille.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDepositModalOpen(true)}
                    className="px-3 py-1 rounded-lg bg-[#1E90FF] text-white font-bold text-[10px] shrink-0 shadow-sm"
                  >
                    + Recharger
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-4 rounded-2xl bg-[#1E90FF] hover:bg-blue-600 text-white font-black text-sm shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Traitement de la commande...' : `Payer ${activeProduct.priceHTG} HTG Maintenant`}
                <ArrowRight className="w-5 h-5" />
              </button>

            </form>
          )}

        </div>
        </ScrollReveal>

      </div>

    </div>
  );
};
