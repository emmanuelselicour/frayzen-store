import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  HelpCircle,
  Search,
  ChevronDown,
  Flame,
  Wallet,
  KeyRound,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

interface FaqItem {
  id: string;
  category: 'freefire' | 'payment' | 'pins' | 'wallet' | 'security';
  question: string;
  answer: string;
  tags: string[];
}

export const Faq: React.FC = () => {
  const { setActiveTab, natcashConfig, setIsDepositModalOpen } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'ff-1': true, // Open first question by default
    'pay-1': true
  });

  const faqData: FaqItem[] = [
    {
      id: 'ff-1',
      category: 'freefire',
      question: 'Kòman pou mwen achte Diamants Free Fire sou FRAYZEN SHOP?',
      answer: 'Achte diamants Free Fire trè senp:\n1. Ale nan paj "Produits" oubyen "Accueil" epi chwazi pake diamants ou bezwen an.\n2. Antre ID Joueur (Player ID) Free Fire ou a egzakteman.\n3. Chwazi mòd de peman ou vle a (Solde Wallet, Direct NATCASH, oswa Direct MonCash).\n4. Inserer ID Tranzaksyon an si w ap peye pa NATCASH/MonCash, epi klike sou "Achte Kounye a". Recharj la ap fèt rapidman!',
      tags: ['free fire', 'diamants', 'id joueur', 'pake', 'achte']
    },
    {
      id: 'ff-2',
      category: 'freefire',
      question: 'Konbyen tan sa pran pou m resevwa diamants yo sou kont Free Fire mwen?',
      answer: 'Lè ou peye ak Solde Wallet ou, livraison an fèt **ouman & an tan reyèl**! Si se pa NATCASH oswa MonCash direct, ekip FRAYZEN SHOP la valide tranzaksyon an ant **1 a 5 minit** sèlman. Ou ka kontwole tout kòmand ou yo nan tab "Mes Commandes".',
      tags: ['délai', 'livraison', 'temps', 'instantané', 'rapid']
    },
    {
      id: 'ff-3',
      category: 'freefire',
      question: 'Kote m ka jwenn ID Joueur (Player ID) Free Fire mwen an?',
      answer: 'Ouvri jeu Free Fire la sou telefòn ou, klike sou foto profil ou ki anwo sou bò gòch la. W ap wè yon nimewo chif anba nom ou (egzanp: 1234567890). Se nimewo sa ki ID Joueur ou a! Ou ka kopye l dirèkteman epi kole l sou FRAYZEN SHOP.',
      tags: ['player id', 'id joueur', 'profil', 'jeu']
    },
    {
      id: 'pay-1',
      category: 'payment',
      question: 'Kòman pou m fè yon transfè pa NATCASH oubyen MonCash?',
      answer: `Pou w fè yon transfè:\n• **NATCASH**: Voye lajan an sou nimewo **${natcashConfig.number}** (${natcashConfig.name}).\n• **MonCash**: Voye lajan an sou nimewo **${natcashConfig.moncashNumber || '47124969'}** (${natcashConfig.moncashName || 'JOSELYNE TITY'}).\nApre transfè a fin fèt, kopye ID Tranzaksyon ou resevwa nan SMS la (oswa rantre l nan recharj wallet la).`,
      tags: ['natcash', 'moncash', 'numéro', 'transfert', 'sms']
    },
    {
      id: 'pay-2',
      category: 'payment',
      question: 'Kisa ki yon ID Tranzaksyon (Transaction ID) e kote m ka jwenn li?',
      answer: 'ID Tranzaksyon an se kòd unik SMS peman an voye ba ou lè w fin fè yon transfè NATCASH oswa MonCash (egzanp: `TX1234567890` oswa `2026081112345`). Li sèvi kòm prèv peman pou sistèm FRAYZEN SHOP la ka valide recharj ou a an sekirite.',
      tags: ['transaction id', 'id', 'sms', 'preuve', 'code']
    },
    {
      id: 'wallet-1',
      category: 'wallet',
      question: 'Ki sa ki Wallet (Portefeuille) FRAYZEN SHOP e ki avantaj li genyen?',
      answer: 'Wallet la se yon kont solde an goud (HTG) ou ka rechaje alavans sou FRAYZEN SHOP. Lè w gen lajan nan Wallet ou:\n• Achte diamants ak PINs fèt **an 1 sèl klick**, an tan reyèl san tann ni voye SMS chak fwa.\n• Ou gen aksè ak promokòd ak bon reduction eksklizif.\n• Tranzaksyon yo 100% otomatik ak an sekirite.',
      tags: ['wallet', 'portefeuille', 'solde', 'avantage', 'instant']
    },
    {
      id: 'wallet-2',
      category: 'wallet',
      question: 'Kòman pou m rechaje Solde Wallet mwen an?',
      answer: 'Klike sou bouton "+ Déposer" ki nan anèt sit la oubyen ale nan tab "Wallet". Antre montan an goud (HTG) ou vle depoze a, chwazi NATCASH oubyen MonCash, voye lajan an sou nimewo ki afiche a, epi rantre ID Tranzaksyon SMS la. Admin lan ap valide li rapidman e lajan an ap monte sou kont ou.',
      tags: ['déposer', 'recharger wallet', 'moncash', 'natcash']
    },
    {
      id: 'pins-1',
      category: 'pins',
      question: 'Kòman pou mwen réclamer yon Code PIN sou paj "Réclamer PINs"?',
      answer: 'Si ou achte yon pake diamants ki livwe an PIN (kòd), kopye kòd PIN ou resevwa nan kòmand ou an. Ale nan tab "Réclamer PINs", kole kòd PIN an ansanm ak Player ID Free Fire ou a, epi klike sou "Valider PIN". Diamants yo ap monte sou jwèt ou a dirèkteman!',
      tags: ['pin', 'réclamer', 'code pin', 'garena', 'valider']
    },
    {
      id: 'pins-2',
      category: 'pins',
      question: 'Kisa pou m fè si kòd PIN mwen an di "Déjà utilisé" oswa "Invalide"?',
      answer: 'Asire w ou pa t deja valide PIN sa a anvan. Si se yon nouvo PIN ou sot achte sou sit la ki gen yon sousi, kontakte sipò client an dirèkteman sou tab "Contact" oswa pa WhatsApp avèk ID kòmand ou an. Ekip teknik nou an ap rezoud sa an kèk minit.',
      tags: ['pin invalide', 'erreur', 'support', 'aide']
    },
    {
      id: 'sec-1',
      category: 'security',
      question: 'Èske enfòmasyon mwen ak lajan mwen an sekirite sou FRAYZEN SHOP?',
      answer: 'Wi, 100%! FRAYZEN SHOP itilize protokòl chifreman avanse ak sistèm modèn pèsonalize pou proteje kont ou ak tranzaksyon ou yo. Nou pa janm mande mot de passe jwèt Free Fire ou, sèlman Player ID ou.',
      tags: ['sécurité', 'fiable', 'confiance', 'protocole']
    },
    {
      id: 'sec-2',
      category: 'security',
      question: 'Kisa pou m fè si mwen bliye mot de passe FRAYZEN SHOP mwen an?',
      answer: 'Ou ka kontakte sipò client FRAYZEN SHOP an atravè paj "Contact" la oubyen pa WhatsApp. W ap bay email oubyen nimewo telefòn ou te enskri a e n ap ede w rekiperer kont ou an sekirite.',
      tags: ['mot de passe', 'oublié', 'récupération', 'compte']
    }
  ];

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const categories = [
    { id: 'all', label: 'Toutes les questions', icon: <HelpCircle className="w-4 h-4 text-[#1E90FF]" /> },
    { id: 'freefire', label: 'Free Fire & Diamants', icon: <Flame className="w-4 h-4 text-orange-500" /> },
    { id: 'payment', label: 'NATCASH & MonCash', icon: <Smartphone className="w-4 h-4 text-[#FF6321]" /> },
    { id: 'wallet', label: 'Portefeuille Wallet', icon: <Wallet className="w-4 h-4 text-blue-400" /> },
    { id: 'pins', label: 'Codes PINs', icon: <KeyRound className="w-4 h-4 text-amber-400" /> },
    { id: 'security', label: 'Sécurité & Compte', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> }
  ];

  const filteredFaqs = faqData.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesQuery =
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query) ||
      item.tags.some(t => t.toLowerCase().includes(query));

    return matchesCategory && matchesQuery;
  });

  // Schema.org FAQPage JSON-LD payload for search engines
  const faqSchemaData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqData.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer.replace(/\*\*/g, '')
      }
    }))
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Inject FAQ Structured Data schema dynamically for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaData) }}
      />

      {/* Hero Header Banner */}
      <ScrollReveal variant="fade-down">
        <div className="relative overflow-hidden rounded-3xl glass-card border border-white/12 p-8 sm:p-12 text-center space-y-4">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-red-500/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-[#1E90FF] font-extrabold text-xs uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" /> Centre d'Aide & Foire Aux Questions (FAQ)
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Kestion ki poze souvan sou <span className="text-[#1E90FF]">FRAYZEN SHOP</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            Trouvez rapidement toutes les réponses concernant l'achat de diamants Free Fire, le fonctionnement des recharges NATCASH et MonCash, le Portefeuille Wallet et l'utilisation des codes PINs.
          </p>

          {/* Search Input Bar */}
          <div className="pt-4 max-w-xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher une question (ex: Free Fire, MonCash, PIN, Wallet)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl glass-input text-xs sm:text-sm text-white placeholder-slate-400 border border-white/20 shadow-xl focus:border-[#1E90FF] focus:ring-1 focus:ring-[#1E90FF] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {categories.map(cat => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                isActive
                  ? 'bg-[#1E90FF] text-white shadow-lg shadow-blue-500/30 scale-105'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Accordion FAQ Questions List */}
      <div className="space-y-4">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map(faq => {
            const isOpen = !!openItems[faq.id];

            return (
              <ScrollReveal key={faq.id} variant="fade-up">
                <div
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? 'bg-slate-900/90 border-[#1E90FF]/50 shadow-xl shadow-blue-500/5'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Header / Question row */}
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-[#1E90FF] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isOpen ? 'bg-[#1E90FF]/20 text-[#1E90FF]' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <HelpCircle className="w-5 h-5" />
                      </div>
                      <span className="leading-snug">{faq.question}</span>
                    </div>

                    <div className={`p-1.5 rounded-xl bg-slate-800 text-slate-400 transition-transform duration-300 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#1E90FF] bg-blue-500/20' : ''
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Body / Answer text */}
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 space-y-3 animate-in fade-in duration-200">
                      <div className="whitespace-pre-wrap font-sans text-slate-300">
                        {faq.answer}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        {faq.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-400 text-[10px] font-mono border border-slate-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })
        ) : (
          <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-base font-bold text-white">Aucune question ne correspond à votre recherche.</p>
            <p className="text-xs text-slate-400">Essayez un autre mot-clé ou contactez notre équipe de support.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700"
            >
              Réinitialiser la recherche
            </button>
          </div>
        )}
      </div>

      {/* Bottom Contact / Help Call to Action */}
      <ScrollReveal variant="fade-up">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-950 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-[#1E90FF] font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Vous ne trouvez pas la réponse ?
            </div>
            <h3 className="text-lg font-black text-white">Nostri ayide w sou WhatsApp oubyen pa Mesaj</h3>
            <p className="text-xs text-slate-300">
              Sèvis kliyan FRAYZEN SHOP disponib 7j/7 pou reponn tout kestion w ak valide tranzaksyon w yo.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('produits')}
              className="px-5 py-3 rounded-2xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
            >
              <Flame className="w-4 h-4" /> Achte Diamants Now
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs border border-slate-700 transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" /> Kontakte Sipò
            </button>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
};
