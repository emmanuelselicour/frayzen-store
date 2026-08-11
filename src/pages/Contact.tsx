import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Mail, Phone, MessageSquare, Send, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';

export const Contact: React.FC = () => {
  const { user, natcashConfig, submitContactTicket } = useApp();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;

    setIsSubmitting(true);
    const success = await submitContactTicket(name, email, phone, subject, message);
    setIsSubmitting(false);

    if (success) {
      setSubmittedSuccess(true);
      setSubject('');
      setMessage('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Title */}
      <ScrollReveal direction="up">
        <div className="text-center space-y-2 pt-4">
          <span className="px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-bold text-[#1E90FF] uppercase tracking-wider">
            Support & Assistance
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Contactez l'Équipe FRAYZEN SHOP</h1>
          <p className="text-xs text-slate-400">Soumettez votre problème ou question. Notre équipe vous répondra rapidement.</p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Contact Info Cards */}
        <ScrollReveal direction="right" className="lg:col-span-5">
          <div className="space-y-4">
          
          <div className="p-6 rounded-3xl glass-card border border-white/12 space-y-4 text-white">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#1E90FF]" />
              Coordonnées Officielles
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 shadow-sm">
                <div className="p-2 rounded-lg bg-blue-500/10 text-[#1E90FF]">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Téléphone & Support</p>
                  <p className="font-extrabold text-white text-sm">{natcashConfig.supportPhone}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 shadow-sm">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Email Support</p>
                  <p className="font-extrabold text-white text-sm">{natcashConfig.supportEmail}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 shadow-sm">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Disponibilité</p>
                  <p className="font-extrabold text-white text-sm">Port-au-Prince, Haïti (7j/7 de 8h à 22h)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-blue-950/60 border border-blue-800/80 text-xs text-slate-300 space-y-2 shadow-sm">
            <h4 className="font-bold text-white text-sm">Assistance Dépôt NATCASH & MonCash</h4>
            <p>
              Pour toute vérification urgente de code de transaction NATCASH ou MonCash, vous pouvez également spécifier votre ID de transaction dans le message.
            </p>
          </div>
        </div>
      </ScrollReveal>

        {/* Contact Submission Form */}
        <ScrollReveal direction="left" className="lg:col-span-7">
          <div className="p-6 sm:p-8 rounded-3xl glass-card border border-white/12 space-y-6 text-white">
          
          {submittedSuccess ? (
            <div className="text-center py-8 space-y-4">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400" />
              <h3 className="text-2xl font-black text-white">Message Envoyé !</h3>
              <p className="text-xs text-slate-400">
                Votre demande a été soumise avec succès au panneau d'administration FRAYZEN SHOP.
              </p>
              <button
                onClick={() => setSubmittedSuccess(false)}
                className="px-6 py-2.5 rounded-xl bg-[#1E90FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-xl font-black text-white pb-2 border-b border-white/10 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#1E90FF]" />
                Formulaire de Support Client
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="contact-name" className="text-xs font-bold text-slate-300">Votre Nom Complet</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Jean Marc"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-email" className="text-xs font-bold text-slate-300">Votre Email</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Ex: jean.marc@gmail.com"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="contact-phone" className="text-xs font-bold text-slate-300">Numéro Téléphone (Optionnel)</label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Ex: 50937882211"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-subject" className="text-xs font-bold text-slate-300">Sujet du problème</label>
                  <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Ex: Problème Dépôt NATCASH ou PIN"
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="contact-message" className="text-xs font-bold text-slate-300">Message / Détails de la demande</label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Expliquez en détail votre problème ou question..."
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs text-white placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#1E90FF] hover:bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre le message au Support'}
              </button>
            </form>
          )}

        </div>
        </ScrollReveal>

      </div>

    </div>
  );
};
