import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Copy, Check, Upload, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';

export const DepositModal: React.FC = () => {
  const { isDepositModalOpen, setIsDepositModalOpen, natcashConfig, submitDeposit, user } = useApp();
  
  const [paymentMethod, setPaymentMethod] = useState<'natcash' | 'moncash'>('natcash');
  const [transactionId14, setTransactionId14] = useState('');
  const [amountHTG, setAmountHTG] = useState('1000');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isDepositModalOpen) return null;

  const currentNumber = paymentMethod === 'moncash' ? (natcashConfig.moncashNumber || '47124969') : natcashConfig.number;
  const currentName = paymentMethod === 'moncash' ? (natcashConfig.moncashName || 'JOSELYNE TITY') : natcashConfig.name;

  const handleCopyNumber = (numToCopy: string) => {
    navigator.clipboard.writeText(numToCopy);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanedTx = transactionId14.replace(/\s+/g, '').trim();

    if (!cleanedTx || cleanedTx.length < 4) {
      setErrorMsg(`Veuillez entrer un code ou ID de transaction ${paymentMethod === 'moncash' ? 'MonCash' : 'NATCASH'} valide.`);
      return;
    }

    const amount = Number(amountHTG);
    if (!amount || amount < 50) {
      setErrorMsg('Le montant minimum de dépôt est de 50 HTG.');
      return;
    }

    setIsSubmitting(true);
    const success = await submitDeposit(cleanedTx, amount, screenshotPreview || undefined, paymentMethod);
    setIsSubmitting(false);

    if (success) {
      setTransactionId14('');
      setScreenshotPreview(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg p-6 sm:p-8 my-8 rounded-3xl glass-card border border-white/15 shadow-2xl space-y-6 text-white">
        
        {/* Close button */}
        <button
          onClick={() => setIsDepositModalOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#1E90FF] p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-[#1E90FF]" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-white">Recharger Portefeuille Wallet</h3>
            <p className="text-xs text-slate-400 font-semibold">Dépôt instantané via NATCASH & MonCash</p>
          </div>
        </div>

        {/* Payment Method Tabs */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300">Choisissez le mode de paiement :</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod('natcash')}
              className={`p-3 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 transition-all ${
                paymentMethod === 'natcash'
                  ? 'bg-[#FF6321] text-white border-[#FF6321] shadow-md'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span>🟧 NATCASH</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('moncash')}
              className={`p-3 rounded-2xl border font-black text-xs flex items-center justify-center gap-2 transition-all ${
                paymentMethod === 'moncash'
                  ? 'bg-red-600 text-white border-red-600 shadow-md'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <span>🔴 MonCash</span>
            </button>
          </div>
        </div>

        {/* Payment Details Box */}
        <div className={`p-4 rounded-2xl border space-y-3 relative overflow-hidden shadow-sm ${
          paymentMethod === 'moncash' ? 'bg-red-950/40 border-red-800/80' : 'bg-slate-900/90 border-orange-500/30'
        }`}>
          
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm tracking-wide text-white">
              _FRAYZENSHOP HT_ 🇭🇹🔥
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              paymentMethod === 'moncash' ? 'bg-red-900/60 text-red-300 border border-red-700' : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
            }`}>
              {paymentMethod === 'moncash' ? '🔴 MonCash (Digicel)' : '🟧 NATCASH (Natcom)'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  NUMÉRO {paymentMethod.toUpperCase()}
                </p>
                <p className="text-base font-black text-white tracking-widest font-mono">{currentNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopyNumber(currentNumber)}
                className="p-2 rounded-lg bg-blue-900/40 text-[#1E90FF] hover:bg-[#1E90FF] hover:text-white transition-all"
                title="Copier le numéro"
              >
                {copiedNumber ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase">NOM DU DESTINATAIRE</p>
              <p className="text-base font-black text-white tracking-wider">{currentName}</p>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 font-medium leading-relaxed bg-slate-800/60 p-2.5 rounded-xl border border-slate-700 shadow-sm">
            Fè transfè a sou {currentNumber} ({currentName}). Voye screenshot oubyen antre kòd tranzaksyon an anba a ! 🫂🔥
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Deposit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="deposit-amount" className="text-xs font-bold text-slate-300">
              Montant Envoyé via {paymentMethod === 'moncash' ? 'MonCash' : 'NATCASH'} (en Gourdes HTG)
            </label>
            <input
              id="deposit-amount"
              name="amountHTG"
              type="number"
              min="50"
              required
              value={amountHTG}
              onChange={e => setAmountHTG(e.target.value)}
              placeholder="Ex: 1000"
              className="w-full px-4 py-3 rounded-xl glass-input text-base font-extrabold text-white placeholder-slate-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="deposit-transaction-id" className="text-xs font-bold text-slate-300">
                Code / ID de Transaction {paymentMethod === 'moncash' ? 'MonCash' : 'NATCASH'}
              </label>
              <span className="text-[10px] text-[#1E90FF] font-semibold">Vérification automatique</span>
            </div>
            <input
              id="deposit-transaction-id"
              name="transactionId14"
              type="text"
              required
              value={transactionId14}
              onChange={e => setTransactionId14(e.target.value)}
              placeholder={paymentMethod === 'moncash' ? 'Ex: Kòd/ID tranzaksyon MonCash' : 'Ex: 98472019482710 (14 chiffres)'}
              className="w-full px-4 py-3 rounded-xl glass-input text-base font-mono tracking-wider font-extrabold text-white placeholder-slate-500"
            />
            <p className="text-[10px] text-slate-400">
              Chak ID de transaction se yon sous inik. Le système vérifie les doublons automatiquement.
            </p>
          </div>

          {/* Optional Screenshot Upload */}
          <div className="space-y-1">
            <label htmlFor="deposit-screenshot" className="text-xs font-bold text-slate-300">
              Capture d'écran de confirmation (Optionnel)
            </label>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-[#1E90FF] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-900/60">
              <input
                id="deposit-screenshot"
                name="screenshot"
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {screenshotPreview ? (
                <div className="flex items-center justify-center gap-3">
                  <img src={screenshotPreview} alt="Screenshot preview" className="w-12 h-12 object-cover rounded-lg border border-slate-700" />
                  <span className="text-xs text-emerald-400 font-bold">Image chargée avec succès !</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 text-slate-400">
                  <Upload className="w-6 h-6 text-[#1E90FF]" />
                  <span className="text-xs font-semibold text-slate-300">Cliquez ou glissez la capture d'écran</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG ou WEBP jusqu'à 5MB</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-4 rounded-2xl bg-[#1E90FF] hover:bg-blue-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? 'Traitement en cours...' : `Envoyer la demande de dépôt ${paymentMethod.toUpperCase()}`}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

      </div>
    </div>
  );
};
