'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, MessageCircle, Mail, MapPin,
  Menu, X, Calculator,
} from 'lucide-react';
import MortgageCalc from '@/components/MortgageCalc';
import PurposeCalc from '@/components/PurposeCalc';
import RefinanceCalc from '@/components/RefinanceCalc';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'mortgage',  label: 'חישוב משכנתא' },
  { id: 'purpose',   label: 'הלוואה לכל מטרה' },
  { id: 'refinance', label: 'מחזור משכנתה' },
] as const;

type Tab = typeof TABS[number]['id'];

const WA_BASE = 'https://wa.me/972525076504?text=';
const WA = WA_BASE + encodeURIComponent('היי ליאור, אשמח לקבל מידע נוסף על משכנתא.');
const WA_CARD = WA_BASE + encodeURIComponent('היי ליאור אשמח לקבל מידע נוסף ולשמוע עוד....');

export default function Home() {
  const [tab,      setTab]      = useState<Tab>('mortgage');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navItems = [
    { label: 'מחשבון', href: '#calculator' },
    { label: 'צור קשר', href: '#contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ── */}
      <header className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-[rgba(201,168,76,0.15)] shadow-sm'
          : 'bg-white/80 backdrop-blur-sm'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo */}
            <motion.div className="flex items-center gap-3 shrink-0"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-gold shrink-0">
                <Image src="/logo-header.png" alt="איתנות פיננסית" width={40} height={40} className="w-full h-full object-cover" />
              </div>
              <div className="text-right">
                <div className="text-[#C9A84C] font-bold text-base leading-none">איתנות פיננסית</div>
                <div className="text-stone-400 text-xs leading-none mt-0.5">Eitanut Finance</div>
              </div>
            </motion.div>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item, i) => (
                <motion.a key={item.href} href={item.href}
                  className="px-4 py-2 text-sm text-stone-600 hover:text-[#C9A84C] transition-colors duration-200 relative group"
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}>
                  {item.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-[#C9A84C] transition-all duration-300 group-hover:w-3/4" />
                </motion.a>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <a href="tel:+972525076504"
                className="hidden md:flex items-center gap-2 btn-outline-gold px-3 py-2 rounded-lg text-sm">
                <Phone size={14} />
                <span>052-5076504</span>
              </a>
              <a href={WA} target="_blank" rel="noopener noreferrer"
                className="hidden sm:block btn-gold px-4 py-2 rounded-lg text-sm font-semibold">
                ייעוץ חינם
              </a>
              <button className="lg:hidden btn-outline-gold p-2 rounded-lg"
                onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
                {menuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden bg-white border-t border-[rgba(201,168,76,0.12)] overflow-hidden shadow-sm">
              <div className="px-4 py-4 space-y-1">
                {navItems.map((item) => (
                  <a key={item.href} href={item.href}
                    className="block px-4 py-3 text-stone-600 hover:text-[#C9A84C] hover:bg-amber-50 rounded-lg transition-colors"
                    onClick={() => setMenuOpen(false)}>
                    {item.label}
                  </a>
                ))}
                <div className="pt-2 border-t border-[rgba(201,168,76,0.1)] mt-2 space-y-2">
                  <a href="tel:+972525076504"
                    className="flex items-center gap-2 px-4 py-3 text-stone-600 hover:text-[#C9A84C]">
                    <Phone size={16} />052-5076504
                  </a>
                  <a href={WA} target="_blank" rel="noopener noreferrer"
                    className="block btn-gold px-4 py-3 rounded-lg text-center font-semibold">
                    <MessageCircle size={16} className="inline ml-2" />
                    WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-16 overflow-hidden bg-[#E8F4FB]">
        <div className="absolute inset-0 hero-grid opacity-60" />
        <div className="absolute inset-0 hero-radial" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 glass-gold px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
              <span className="text-[#C9A84C] text-sm font-medium">ייעוץ ראשוני חינם</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1A2C3D] mb-4 leading-tight">
            מחשבון משכנתא{' '}
            <span className="text-gradient-gold">חכם ומדויק</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-[#4D6E88] text-lg sm:text-xl max-w-2xl mx-auto mb-8">
            חשב את המשכנתא שלך לפי תקנות בנק ישראל — וקבל ייעוץ אישי מליאור נגר, יועץ משכנתאות מוסמך
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-3 justify-center">
            <a href="#calculator" className="btn-gold px-8 py-3.5 rounded-xl font-bold text-base">
              התחל לחשב
            </a>
            <a href={WA} target="_blank" rel="noopener noreferrer"
              className="btn-outline-gold flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base">
              <MessageCircle size={18} />
              שלח WhatsApp
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Calculator Section ── */}
      <section id="calculator" className="relative py-20 overflow-hidden bg-[#F4FAFE]">
        <div className="absolute inset-0 hero-grid opacity-30" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)' }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="inline-flex items-center gap-2 glass-gold px-4 py-2 rounded-full mb-4">
              <Calculator size={14} className="text-[#C9A84C]" />
              <span className="text-[#C9A84C] text-sm font-medium">מחשבון מתקדם</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1A2C3D] mb-4">
              כלים פיננסיים חכמים
            </motion.h2>

            <div className="section-divider" />

            <motion.p
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-[#4D6E88] text-lg">
              חשב, השווה, קבל החלטות מושכלות
            </motion.p>
          </div>

          {/* Tab switcher */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex overflow-x-auto no-scrollbar gap-2 mb-10 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center">
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)}
                className={cn(
                  'shrink-0 whitespace-nowrap px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200',
                  tab === id ? 'btn-gold shadow-gold' : 'btn-outline-gold'
                )}>
                {label}
              </button>
            ))}
          </motion.div>

          {/* Tab content */}
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}>
            {tab === 'mortgage'  && <MortgageCalc />}
            {tab === 'purpose'   && <PurposeCalc />}
            {tab === 'refinance' && <RefinanceCalc />}
          </motion.div>
        </div>
      </section>

      {/* ── Contact Section ── */}
      <section id="contact" className="relative py-24 overflow-hidden bg-[#E8F4FB]">
        <div className="absolute inset-0 hero-grid opacity-40" />
        <div className="absolute inset-0 hero-radial opacity-60" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 glass-gold px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
            <span className="text-[#C9A84C] text-sm font-medium">צור קשר</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1A2C3D] mb-4">
            מוכן לצעד הבא?
          </motion.h2>

          <div className="section-divider" />

          <motion.p
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#4D6E88] text-lg mb-12">
            ליאור נגר ישמח לענות על כל שאלה — ייעוץ ראשוני ללא עלות
          </motion.p>

          {/* Contact cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <a href="tel:+972525076504"
              className="card-premium rounded-2xl p-6 group hover:border-[rgba(201,168,76,0.5)] transition-all text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-100 transition-colors">
                <Phone size={22} className="text-[#C9A84C]" />
              </div>
              <div className="text-stone-800 font-semibold mb-1">052-5076504</div>
              <div className="text-stone-400 text-sm">שיחה ישירה</div>
            </a>

            <a href={WA_CARD} target="_blank" rel="noopener noreferrer"
              className="card-premium rounded-2xl p-6 group hover:border-[rgba(37,211,102,0.5)] transition-all text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-100 transition-colors">
                <MessageCircle size={22} style={{ color: '#25D366' }} />
              </div>
              <div className="text-stone-800 font-semibold mb-1">WhatsApp</div>
              <div className="text-stone-400 text-sm">מענה מהיר</div>
            </a>

            <a href="mailto:Lior@eitanut-finance.co.il"
              className="card-premium rounded-2xl p-6 group hover:border-[rgba(201,168,76,0.5)] transition-all text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-100 transition-colors">
                <Mail size={22} className="text-[#C9A84C]" />
              </div>
              <div className="text-stone-800 font-semibold mb-1">Lior@eitanut-finance.co.il</div>
              <div className="text-stone-400 text-sm">אימייל</div>
            </a>
          </motion.div>

          {/* Lior card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="card-premium rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-6 gold-glow">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-gold shrink-0">
              <Image src="/logo-card.png" alt="ליאור נגר" width={80} height={80} className="w-full h-full object-cover" />
            </div>
            <div className="text-center sm:text-right flex-1">
              <div className="text-[#C9A84C] font-bold text-xl">ליאור נגר</div>
              <div className="text-stone-500 text-sm mb-3">יועץ משכנתאות מוסמך | איתנות פיננסית</div>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="glass-gold px-3 py-1 rounded-full text-xs text-[#C9A84C]">ייעוץ ראשוני חינם</span>
                <span className="glass-gold px-3 py-1 rounded-full text-xs text-[#C9A84C]">מומחה מוסמך</span>
              </div>
            </div>
            <a href={WA_CARD} target="_blank" rel="noopener noreferrer"
              className="btn-gold px-6 py-3 rounded-xl font-bold shrink-0 flex items-center gap-2 text-sm">
              <MessageCircle size={16} />שלח הודעה
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#D4ECF7] border-t border-[rgba(56,140,210,0.15)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden shadow-gold shrink-0">
                  <Image src="/logo-header.png" alt="איתנות פיננסית" width={40} height={40} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-[#C9A84C] font-bold text-lg">איתנות פיננסית</div>
                  <div className="text-[#4D6E88] text-xs">Eitanut Finance</div>
                </div>
              </div>
              <p className="text-[#4D6E88] text-sm leading-relaxed mb-6">
                ייעוץ משכנתאות מקצועי ואישי — מתכנן הפיננסי שלך לאורך כל הדרך.
              </p>
              <a href={WA_CARD} target="_blank" rel="noopener noreferrer"
                className="inline-flex w-9 h-9 rounded-full bg-[#25D366] items-center justify-center hover:scale-110 transition-transform"
                aria-label="WhatsApp">
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-[#C9A84C] font-semibold mb-4">ניווט מהיר</h3>
              <ul className="space-y-2">
                {[
                  { href: '#calculator', label: 'מחשבון' },
                  { href: '#contact',    label: 'צור קשר' },
                ].map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="text-[#4D6E88] hover:text-[#C9A84C] text-sm transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-[#C9A84C] font-semibold mb-4">פרטי קשר</h3>
              <div className="space-y-3">
                {[
                  { icon: <Phone size={14} className="text-[#C9A84C]" />, text: '052-5076504', href: 'tel:+972525076504' },
                  { icon: <Mail  size={14} className="text-[#C9A84C]" />, text: 'Lior@eitanut-finance.co.il', href: 'mailto:Lior@eitanut-finance.co.il' },
                  { icon: <MapPin size={14} className="text-[#C9A84C]" />, text: 'ישראל', href: null },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 shadow-sm">
                      {item.icon}
                    </div>
                    {item.href ? (
                      <a href={item.href} className="text-stone-600 hover:text-[#C9A84C] text-sm transition-colors">{item.text}</a>
                    ) : (
                      <span className="text-stone-600 text-sm">{item.text}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(201,168,76,0.15)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-400">
            <span>© {new Date().getFullYear()} Eitanut Finance · כל הזכויות שמורות ל OsheriKo</span>
            <span>רישיון יועץ משכנתאות מוסמך</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
