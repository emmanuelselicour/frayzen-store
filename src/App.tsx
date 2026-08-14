import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { DepositModal } from './components/DepositModal';
import { EmailVerifyModal } from './components/EmailVerifyModal';
import { AlertModal } from './components/AlertModal';
import { Accueil } from './pages/Accueil';
import { Produits } from './pages/Produits';
import { Paiement } from './pages/Paiement';
import { Wallet } from './pages/Wallet';
import { Contact } from './pages/Contact';
import { Profil } from './pages/Profil';
import { AdminDashboard } from './pages/AdminDashboard';
import { RedeemPins } from './pages/RedeemPins';
import { MesCommandes } from './pages/MesCommandes';
import { Faq } from './pages/Faq';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();
  const isAdminView = activeTab === 'admin';

  return (
    <div className="min-h-screen flex flex-col bg-black text-slate-100 font-sans relative selection:bg-[#1E90FF] selection:text-white overflow-x-hidden">
      
      {/* Background Ambient Lights */}
      <div className="fixed top-[-100px] left-[-100px] w-96 h-96 bg-blue-400/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-50px] right-[-50px] w-[500px] h-[500px] bg-red-400/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Global Header (Hidden on Admin Panel only) */}
      {!isAdminView && <Header />}

      {/* Dynamic View Body with Scroll & Page Transition Animations */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 ${isAdminView ? 'pt-4 sm:pt-6 pb-6' : 'pt-24 sm:pt-28 pb-12'} relative z-10`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeTab === 'accueil' && <Accueil />}
            {activeTab === 'produits' && <Produits />}
            {activeTab === 'paiement' && <Paiement />}
            {activeTab === 'wallet' && <Wallet />}
            {activeTab === 'contact' && <Contact />}
            {activeTab === 'profil' && <Profil />}
            {activeTab === 'commandes' && <MesCommandes />}
            {activeTab === 'admin' && <AdminDashboard />}
            {activeTab === 'redeempins' && <RedeemPins />}
            {activeTab === 'faq' && <Faq />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Footer (Hidden on Admin Panel only) */}
      {!isAdminView && <Footer />}

      {/* Global Modals */}
      <AuthModal />
      <DepositModal />
      <EmailVerifyModal />
      <AlertModal />

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
