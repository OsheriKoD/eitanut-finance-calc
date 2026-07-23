'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, MessageCircle, Phone, Mail, TrendingDown, TrendingUp, Calendar, AlertTriangle, Lightbulb, Check, Loader2 } from 'lucide-react';
import { cn, formatCurrency, whatsappUrl } from '@/lib/utils';
import AnimatedCurrency from './AnimatedCurrency';

const ASSUMED_RATE = 5.0; // % annual — ריבית משוערת למסלול חדש

function pmtPer100K(years: number): number {
  const r = ASSUMED_RATE / 100 / 12;
  const n = years * 12;
  return 100_000 * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

type RStep = 'details' | 'term';

const LOAN_YEARS = [10, 15, 20, 25, 30];

interface RefiResults {
  balance: number;
  oldPayment: number;
  oldYearsLeft: number;
  newTerm: number;
  newPayment: number;
  monthlySavings: number;
  totalOld: number;
  totalNew: number;
  totalDiff: number;
}

export default function RefinanceCalc() {
  const [rStep,   setRStep]   = useState<RStep>('details');
  const [balanceStr, setBalanceStr] = useState('');
  const [paymentStr, setPaymentStr] = useState('');
  const [yearsLeft, setYearsLeft] = useState<number | null>(null);
  const [newTerm, setNewTerm] = useState<number>(25);
  const [results, setResults] = useState<RefiResults | null>(null);
  const [name,      setName]      = useState('');
  const [phone,     setPhone]     = useState('');
  const [email,     setEmail]     = useState('');
  const [leadError,    setLeadError]    = useState('');
  const [sending,      setSending]      = useState(false);
  const [sendStatus,   setSendStatus]   = useState<'idle' | 'success' | 'error'>('idle');

  const fmt = (v: string) => v.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const handleNumInput = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9]/g, '');
    setter(clean ? fmt(clean) : '');
  };

  const balance    = parseFloat(balanceStr.replace(/,/g, '')) || 0;
  const oldPayment = parseFloat(paymentStr.replace(/,/g, '')) || 0;

  const canProceed = balance >= 50_000 && oldPayment >= 500 && yearsLeft !== null;

  const handleBack = () => setRStep('details');

  const calculate = (term: number) => {
    if (yearsLeft === null) return;
    setNewTerm(term);
    const newPayment = balance / 100_000 * pmtPer100K(term);
    const monthlySavings = oldPayment - newPayment;
    const totalOld = oldPayment * yearsLeft * 12;
    const totalNew = newPayment * term * 12;
    const totalDiff = totalOld - totalNew;

    setResults({
      balance, oldPayment, oldYearsLeft: yearsLeft, newTerm: term, newPayment,
      monthlySavings, totalOld, totalNew, totalDiff,
    });
    setSendStatus('idle');
    setTimeout(() => {
      document.getElementById('refi-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const buildSummary = () => {
    if (!results) return '';
    return (
      `יתרת משכנתה נוכחית: ${formatCurrency(results.balance)}\n` +
      `החזר חודשי נוכחי: ${formatCurrency(results.oldPayment)} (${results.oldYearsLeft} שנים נותרו)\n\n` +
      `מסלול חדש מוצע: ${results.newTerm} שנה • ריבית משוערת ${ASSUMED_RATE}%\n` +
      `החזר חודשי חדש: ${formatCurrency(results.newPayment)}\n` +
      `${results.monthlySavings >= 0 ? 'חיסכון' : 'תוספת'} חודשי: ${formatCurrency(Math.abs(results.monthlySavings))}\n\n` +
      `סה"כ תשלומים במסלול הנוכחי: ${formatCurrency(results.totalOld)}\n` +
      `סה"כ תשלומים במסלול החדש: ${formatCurrency(results.totalNew)}\n` +
      `${results.totalDiff >= 0 ? 'חיסכון כולל' : 'עלות נוספת כוללת'}: ${formatCurrency(Math.abs(results.totalDiff))}`
    );
  };

  const handleSendEmail = async () => {
    if (!name.trim() || !phone.trim() || !email.trim() || !results) {
      setLeadError('נא למלא שם, טלפון ומייל');
      return;
    }
    setLeadError('');
    setSending(true);
    setSendStatus('idle');
    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, summary: buildSummary(), toolName: 'מחזור משכנתה' }),
      });
      setSendStatus(res.ok ? 'success' : 'error');
    } catch {
      setSendStatus('error');
    } finally {
      setSending(false);
    }
  };

  const stepNum = rStep === 'details' ? 1 : 2;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Progress */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2].map(n => (
          <div key={n} className={cn(
            'h-1.5 rounded-full transition-all duration-400',
            n < stepNum   ? 'w-8 bg-[#C9A84C]' :
            n === stepNum ? 'w-12 bg-[#C9A84C]' : 'w-8 bg-[#BDD8EE]'
          )} />
        ))}
      </div>

      {/* Back */}
      {rStep !== 'details' && (
        <button onClick={handleBack}
          className="flex items-center gap-1 text-sm text-[#4D6E88] hover:text-[#1A2C3D] transition-colors">
          <ChevronRight size={15} />חזרה
        </button>
      )}

      {/* ── Step 1: current mortgage details ── */}
      {rStep === 'details' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p className="text-center text-[#4D6E88] text-xs mb-1">שלב 1 מתוך 2</p>
          <h3 className="text-center text-2xl font-bold text-[#1A2C3D] mb-1">המשכנתה הנוכחית שלך</h3>
          <p className="text-center text-[#4D6E88] text-sm mb-8">בדוק כמה תוכל/י לחסוך במחזור</p>

          <div className="space-y-5 mb-8">
            <div>
              <label className="text-[#4D6E88] text-xs font-semibold mb-2 block">יתרת משכנתה נוכחית</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-4 flex items-center text-[#C9A84C] font-bold text-lg pointer-events-none">₪</span>
                <input type="text" inputMode="numeric" value={balanceStr} onChange={handleNumInput(setBalanceStr)}
                  placeholder="1,200,000"
                  className="input-dark w-full rounded-xl py-3 pr-10 pl-4 text-base font-semibold tracking-wide" />
              </div>
            </div>

            <div>
              <label className="text-[#4D6E88] text-xs font-semibold mb-2 block">החזר חודשי נוכחי</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-4 flex items-center text-[#C9A84C] font-bold text-lg pointer-events-none">₪</span>
                <input type="text" inputMode="numeric" value={paymentStr} onChange={handleNumInput(setPaymentStr)}
                  placeholder="7,500"
                  className="input-dark w-full rounded-xl py-3 pr-10 pl-4 text-base font-semibold tracking-wide" />
              </div>
            </div>

            <div>
              <label className="text-[#4D6E88] text-xs font-semibold mb-3 block">תקופה נותרת</label>
              <div className="flex flex-wrap gap-2.5">
                {LOAN_YEARS.map(y => (
                  <button key={y} type="button" onClick={() => setYearsLeft(y)}
                    className={cn(
                      'flex-1 min-w-[64px] py-3.5 rounded-xl font-bold text-base transition-all duration-200',
                      yearsLeft === y
                        ? 'btn-gold shadow-gold'
                        : 'card-premium text-[#1A2C3D] hover:border-[#C9A84C] hover:shadow-gold'
                    )}>
                    {y}
                    <div className="text-[10px] font-normal mt-0.5 opacity-80">שנה</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={() => setRStep('term')} disabled={!canProceed}
            className="btn-gold w-full py-4 rounded-2xl font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed">
            המשך
          </button>
        </motion.div>
      )}

      {/* ── Step 2: new term ── */}
      {rStep === 'term' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p className="text-center text-[#4D6E88] text-xs mb-1">שלב 2 מתוך 2</p>
          <h3 className="text-center text-2xl font-bold text-[#1A2C3D] mb-2">פריסת המשכנתה החדשה</h3>
          <p className="text-center text-[#4D6E88] text-sm mb-8">לאיזו תקופה תרצו למחזר?</p>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {LOAN_YEARS.map(y => (
              <button key={y} onClick={() => calculate(y)}
                className={cn(
                  'w-[88px] py-5 rounded-2xl font-bold text-xl transition-all duration-200',
                  newTerm === y
                    ? 'btn-gold shadow-gold'
                    : 'card-premium text-[#1A2C3D] hover:border-[#C9A84C] hover:shadow-gold'
                )}>
                {y}
                <div className="text-xs font-normal mt-1 opacity-80">שנה</div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-1.5 glass-gold rounded-xl px-4 py-3 text-center text-xs text-[#4D6E88]">
            <Lightbulb size={13} className="shrink-0" />
            {Math.round(pmtPer100K(newTerm))} ₪ לכל 100,000 ₪ &bull; ריבית משוערת {ASSUMED_RATE}%
          </div>
        </motion.div>
      )}

      {/* ── Results ── */}
      {results && (
        <motion.div id="refi-results"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-6 border-t border-[#BDD8EE]">

          <h4 className="text-center text-lg font-bold text-[#1A2C3D]">תוצאות בדיקת המחזור</h4>
          <p className="text-center text-xs text-[#4D6E88]">
            {results.newTerm} שנה &bull; ריבית משוערת {ASSUMED_RATE}%
          </p>

          {/* Old vs new payment */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card-premium rounded-2xl p-5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#4D6E88] mb-1"><Calendar size={13} />החזר נוכחי</div>
              <div className="text-2xl font-black text-[#1A2C3D]">
                <AnimatedCurrency value={results.oldPayment} duration={0.8} />
              </div>
              <div className="text-xs text-[#4D6E88] mt-1">{results.oldYearsLeft} שנים נותרו</div>
            </div>
            <div className={cn('rounded-2xl p-5 text-center border',
              results.monthlySavings >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
            )}>
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#4D6E88] mb-1"><Calendar size={13} />החזר חדש</div>
              <div className={cn('text-2xl font-black', results.monthlySavings >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                <AnimatedCurrency value={results.newPayment} duration={1.0} />
              </div>
              <div className="text-xs text-[#4D6E88] mt-1">{results.newTerm} שנה חדשות</div>
            </div>
          </div>

          {/* Monthly savings */}
          <div className={cn('rounded-2xl p-5 flex items-center justify-between border',
            results.monthlySavings >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
          )}>
            <div className="flex items-center gap-3">
              {results.monthlySavings >= 0
                ? <TrendingDown size={22} className="text-emerald-600" />
                : <TrendingUp size={22} className="text-red-600" />}
              <div>
                <div className="text-xs text-[#4D6E88] mb-0.5">{results.monthlySavings >= 0 ? 'חיסכון חודשי' : 'תוספת חודשית'}</div>
                <div className={cn('text-2xl font-black', results.monthlySavings >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                  <AnimatedCurrency value={Math.abs(results.monthlySavings)} duration={1.2} />
                </div>
              </div>
            </div>
          </div>

          {/* Total comparison */}
          <div className="card-premium rounded-2xl p-5">
            <div className="text-xs font-semibold text-[#1A2C3D] mb-3">השוואת עלות כוללת לתקופה</div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-[#4D6E88]">מסלול נוכחי ({results.oldYearsLeft} שנים)</span>
              <span className="font-bold text-[#1A2C3D]">{formatCurrency(results.totalOld)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-3 pb-3 border-b border-[#BDD8EE]">
              <span className="text-[#4D6E88]">מסלול חדש ({results.newTerm} שנים)</span>
              <span className="font-bold text-[#1A2C3D]">{formatCurrency(results.totalNew)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn('text-sm font-bold', results.totalDiff >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                {results.totalDiff >= 0 ? 'חיסכון כולל' : 'עלות נוספת כוללת'}
              </span>
              <span className={cn('text-lg font-black', results.totalDiff >= 0 ? 'text-emerald-700' : 'text-red-600')}>
                {formatCurrency(Math.abs(results.totalDiff))}
              </span>
            </div>
          </div>

          {/* Tradeoff warning */}
          {results.monthlySavings > 0 && results.totalDiff < 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 leading-relaxed">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>שימו לב: ההחזר החודשי אמנם קטן, אך פריסה ל-{results.newTerm} שנים (לעומת {results.oldYearsLeft} הנותרות היום)
              משמעה תשלום ריבית נוסף לאורך זמן — ובסה&quot;כ תשלמו {formatCurrency(Math.abs(results.totalDiff))} יותר.</span>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>החישוב מבוסס על ריבית משוערת בלבד ואינו כולל עמלות פירעון מוקדם, שמאות או עלויות נלוות למחזור.</span>
          </div>

          {/* Send by email */}
          <div className="card-premium rounded-2xl p-5">
            <div className="flex items-center gap-2 text-[#1A2C3D] font-bold text-sm mb-1">
              <Mail size={15} className="text-[#C9A84C]" />
              שלח לי את החישוב
            </div>
            <p className="text-[#4D6E88] text-xs mb-3">מלאו שם, טלפון ומייל כדי לקבל את הסיכום</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input type="text" placeholder="שם מלא" value={name}
                onChange={e => { setName(e.target.value); setLeadError(''); }}
                className="input-dark rounded-xl py-2.5 px-3 text-sm" />
              <input type="tel" placeholder="מס׳ פלאפון" value={phone}
                onChange={e => { setPhone(e.target.value); setLeadError(''); }}
                className="input-dark rounded-xl py-2.5 px-3 text-sm" />
            </div>
            <div className="flex gap-2 mb-2">
              <input type="email" placeholder="your@email.com" value={email}
                onChange={e => { setEmail(e.target.value); setLeadError(''); setSendStatus('idle'); }}
                className="input-dark flex-1 rounded-xl py-2.5 px-3 text-sm" />
              <button onClick={handleSendEmail} disabled={sending}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40',
                  sendStatus === 'success' ? 'bg-emerald-100 text-emerald-700' :
                  sendStatus === 'error'   ? 'bg-red-100 text-red-700' : 'btn-gold'
                )}>
                {sending ? <Loader2 size={14} className="animate-spin" /> :
                 sendStatus === 'success' ? '✓ נשלח' :
                 sendStatus === 'error'   ? '✗ שגיאה' : 'שלח'}
              </button>
            </div>
            {leadError && <p className="text-red-600 text-xs text-center">{leadError}</p>}
          </div>

          {/* CTA */}
          <div className="card-premium rounded-2xl p-6 text-center">
            <div className="text-[#1A2C3D] font-bold text-lg mb-1">
              {results.totalDiff >= 0 ? `אפשר לחסוך ${formatCurrency(Math.abs(results.totalDiff))}` : 'בוא נבדוק את זה ביחד'}
            </div>
            <div className="text-[#4D6E88] text-sm mb-4">ליאור יבדוק איתך כדאיות מחזור מדויקת, כולל עמלות ותנאים אישיים</div>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href={whatsappUrl(`היי ליאור, בדקתי מחזור משכנתה — יתרה ${formatCurrency(results.balance)}, ואשמח לבדוק כדאיות מדויקת.`)}
                target="_blank" rel="noopener noreferrer"
                className="btn-gold inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm">
                <MessageCircle size={16} />שלח ב-WhatsApp
              </a>
              <a href="tel:+972525076504"
                className="btn-outline-gold inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm">
                <Phone size={16} />התקשר
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
