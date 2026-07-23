'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Key, RefreshCw, Wrench, CreditCard, Briefcase,
  Droplets, Users, HelpCircle, ChevronRight, ChevronLeft,
  AlertTriangle, CheckCircle, TrendingUp, DollarSign,
  Calendar, Shield, MessageCircle, Phone, Building2, Banknote,
} from 'lucide-react';
import RangeSlider from './RangeSlider';
import AnimatedCurrency from './AnimatedCurrency';
import { calcMonthlyPayment } from '@/lib/calculations';
import { cn, formatCurrency } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type LoanPurpose   = 'purchase' | 'anyPurpose';
type PurchaseSub   = 'firstHome' | 'replacement' | 'investment' | 'refinance';
type AnyPurposeSub = 'renovation' | 'debtConsolidation' | 'business' | 'liquidity' | 'familyAssistance' | 'general';
type MortgageRank  = 'first' | 'second';
type FundingSource = 'bank' | 'nonBank';
type PurposeCat    = 'general' | 'renovation' | 'debtConsolidation' | 'business';

// ─── Constants ────────────────────────────────────────────────────────────────

const PURCHASE_SUBS: { id: PurchaseSub; label: string; icon: React.ElementType; ltv: string }[] = [
  { id: 'firstHome',   label: 'דירה ראשונה',   icon: Home,       ltv: '75%' },
  { id: 'replacement', label: 'דירה חלופית',   icon: RefreshCw,  ltv: '70%' },
  { id: 'investment',  label: 'להשקעה',         icon: TrendingUp, ltv: '50%' },
  { id: 'refinance',   label: 'מחזור משכנתא',   icon: RefreshCw,  ltv: '70%' },
];

const ANY_PURPOSE_SUBS: { id: AnyPurposeSub; label: string; icon: React.ElementType }[] = [
  { id: 'renovation',        label: 'שיפוץ',         icon: Wrench },
  { id: 'debtConsolidation', label: 'איחוד חובות',   icon: CreditCard },
  { id: 'business',          label: 'מטרה עסקית',    icon: Briefcase },
  { id: 'liquidity',         label: 'נזילות',         icon: Droplets },
  { id: 'familyAssistance',  label: 'סיוע משפחתי',   icon: Users },
  { id: 'general',           label: 'מטרה כללית',    icon: HelpCircle },
];

const PURPOSE_CATS: { id: PurposeCat; label: string }[] = [
  { id: 'general',           label: 'מטרה כללית' },
  { id: 'renovation',        label: 'שיפוץ' },
  { id: 'debtConsolidation', label: 'איחוד חובות' },
  { id: 'business',          label: 'מימון עסקי' },
];

const STEPS = ['מטרת ההלוואה', 'מבנה ההלוואה', 'פרטי ההלוואה', 'תוצאות'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function estimateRate(rank: MortgageRank, src: FundingSource) {
  if (rank === 'first'  && src === 'bank')    return { min: 5.0, max: 7.0,  mid: 6.0  };
  if (rank === 'first'  && src === 'nonBank') return { min: 7.0, max: 10.0, mid: 8.5  };
  return                                             { min: 9.5, max: 14.0, mid: 11.5 };
}

function maxLTVForPurpose(purpose: LoanPurpose, sub: PurchaseSub | AnyPurposeSub | null, rank: MortgageRank): number | null {
  if (rank === 'second') return null;
  if (purpose === 'anyPurpose') return 0.50;
  if (sub === 'firstHome')   return 0.75;
  if (sub === 'replacement') return 0.70;
  if (sub === 'investment')  return 0.50;
  if (sub === 'refinance')   return 0.70;
  return 0.50;
}

function riskLevel(ltv: number, pti: number | null): 'low' | 'medium' | 'high' {
  const p = pti ?? ltv * 0.5;
  if (ltv > 0.50 || p > 0.40) return 'high';
  if (ltv > 0.40 || p > 0.30) return 'medium';
  return 'low';
}

const RISK_LABEL: Record<string, string>  = { low: 'נמוך',   medium: 'בינוני',  high: 'גבוה'  };
const RISK_COLOR: Record<string, string>  = { low: 'text-emerald-400', medium: 'text-yellow-400', high: 'text-red-400' };
const RISK_BG:    Record<string, string>  = { low: 'bg-emerald-400/10', medium: 'bg-yellow-400/10', high: 'bg-red-400/10' };

// ─── Slide variants ───────────────────────────────────────────────────────────

const slide = (dir: number) => ({
  initial:  { opacity: 0, x: dir * 48 },
  animate:  { opacity: 1, x: 0 },
  exit:     { opacity: 0, x: dir * -48 },
  transition: { duration: 0.28, ease: 'easeInOut' },
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      {/* Step labels */}
      <div className="flex justify-between mb-3">
        {STEPS.map((label, i) => (
          <div key={label} className={cn('text-center text-[10px] sm:text-xs font-medium transition-colors',
            i <= step ? 'text-[#C9A84C]' : 'text-gray-600'
          )}>
            {/* On mobile show step number; on sm+ show full label */}
            <span className="sm:hidden">{i + 1}</span>
            <span className="hidden sm:inline">{label}</span>
          </div>
        ))}
      </div>
      {/* Bar */}
      <div className="relative h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: 'linear-gradient(90deg,#C9A84C,#E8C97A)' }}
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>
      {/* Dots */}
      <div className="flex justify-between mt-2">
        {STEPS.map((_, i) => (
          <div key={i}
            className={cn('w-3 h-3 rounded-full border-2 transition-all duration-300',
              i < step  ? 'bg-[#C9A84C] border-[#C9A84C]' :
              i === step? 'bg-[#0D0D0D] border-[#C9A84C] shadow-[0_0_8px_rgba(201,168,76,0.6)]' :
                          'bg-gray-800 border-gray-700'
            )}
          />
        ))}
      </div>
    </div>
  );
}

function SelectCard({ selected, onClick, icon: Icon, label, sub }: {
  selected: boolean; onClick: () => void;
  icon: React.ElementType; label: string; sub?: string;
}) {
  return (
    <button onClick={onClick}
      className={cn('w-full flex items-center gap-3 p-4 rounded-xl border text-right transition-all duration-200',
        selected
          ? 'border-[#C9A84C] bg-[rgba(201,168,76,0.08)] shadow-[0_0_12px_rgba(201,168,76,0.2)]'
          : 'border-[rgba(201,168,76,0.15)] bg-[rgba(26,26,26,0.6)] hover:border-[rgba(201,168,76,0.35)]'
      )}>
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
        selected ? 'bg-[rgba(201,168,76,0.2)]' : 'bg-[rgba(255,255,255,0.04)]'
      )}>
        <Icon size={18} className={selected ? 'text-[#C9A84C]' : 'text-gray-400'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn('font-semibold text-sm', selected ? 'text-[#C9A84C]' : 'text-gray-200')}>{label}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
      </div>
      {selected && <CheckCircle size={16} className="text-[#C9A84C] shrink-0" />}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LoanWizard() {
  const [step,         setStep]         = useState(0);
  const [dir,          setDir]          = useState(1);
  const [loanPurpose,  setLoanPurpose]  = useState<LoanPurpose | null>(null);
  const [purchaseSub,  setPurchaseSub]  = useState<PurchaseSub | null>(null);
  const [apSub,        setApSub]        = useState<AnyPurposeSub | null>(null);
  const [rank,         setRank]         = useState<MortgageRank>('first');
  const [source,       setSource]       = useState<FundingSource>('bank');
  const [purposeCat,   setPurposeCat]   = useState<PurposeCat>('general');
  const [loanYears,    setLoanYears]    = useState(15);
  const [loanAmount,   setLoanAmount]   = useState(500000);
  const [loanAmtInput, setLoanAmtInput] = useState('500,000');
  const [propValue,    setPropValue]    = useState('');
  const [monthlyIncome,setMonthlyIncome]= useState('');
  const [leadName,     setLeadName]     = useState('');
  const [leadPhone,    setLeadPhone]    = useState('');
  const [leadEmail,    setLeadEmail]    = useState('');
  const [leadNotes,    setLeadNotes]    = useState('');
  const [submitted,    setSubmitted]    = useState(false);

  const go = (next: number) => { setDir(next > step ? 1 : -1); setStep(next); };

  const canNext = useMemo(() => {
    if (step === 0) return loanPurpose !== null && (loanPurpose === 'purchase' ? purchaseSub !== null : apSub !== null);
    if (step === 1) return true;
    if (step === 2) return propValue.length > 0 && loanAmount >= 150000;
    return false;
  }, [step, loanPurpose, purchaseSub, apSub, propValue, loanAmount]);

  // When rank = second, force nonBank
  const handleRank = (r: MortgageRank) => {
    setRank(r);
    if (r === 'second') setSource('nonBank');
  };

  // Calculations
  const propVal = parseFloat(propValue.replace(/,/g, '')) || 0;
  const income  = parseFloat(monthlyIncome.replace(/,/g, '')) || 0;
  const sub     = loanPurpose === 'purchase' ? purchaseSub : apSub;
  const rateInfo= estimateRate(rank, source);
  const maxLTVVal = maxLTVForPurpose(loanPurpose ?? 'anyPurpose', sub, rank);
  const ltv     = propVal > 0 ? loanAmount / propVal : 0;
  const maxAllowed = propVal > 0 && maxLTVVal ? propVal * maxLTVVal : null;
  const ltvWarning = maxAllowed !== null && loanAmount > maxAllowed;

  const pmtMid  = calcMonthlyPayment(loanAmount, rateInfo.mid, loanYears);
  const pmtMin  = calcMonthlyPayment(loanAmount, rateInfo.min, loanYears);
  const pmtMax  = calcMonthlyPayment(loanAmount, rateInfo.max, loanYears);
  const total   = pmtMid * loanYears * 12;
  const interest= total - loanAmount;
  const pti     = income > 0 ? pmtMid / income : null;
  const reqIncome = pmtMid / 0.40;
  const risk    = riskLevel(ltv, pti);

  const fmtNum  = (v: string) => v.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const handleLoanAmtInput = (raw: string) => {
    const n = parseInt(raw.replace(/[^0-9]/g, '')) || 0;
    setLoanAmount(Math.min(10000000, Math.max(0, n)));
    setLoanAmtInput(fmtNum(raw.replace(/[^0-9]/g, '')));
  };
  const handleSliderAmt = (v: string) => {
    const n = parseInt(v);
    setLoanAmount(n);
    setLoanAmtInput(fmtNum(String(n)));
  };

  const submitLead = () => {
    const details = [
      `שם: ${leadName}`,
      `טלפון: ${leadPhone}`,
      leadEmail ? `אימייל: ${leadEmail}` : null,
      `מטרת הלוואה: ${loanPurpose === 'purchase' ? 'רכישת נכס' : 'הלוואה לכל מטרה'}`,
      `סכום: ${formatCurrency(loanAmount)}`,
      propVal > 0 ? `שווי נכס: ${formatCurrency(propVal)}` : null,
      `LTV: ${(ltv * 100).toFixed(1)}%`,
      `תשלום חודשי משוער: ${formatCurrency(pmtMid)}`,
      leadNotes ? `הערות: ${leadNotes}` : null,
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/972525076504?text=${encodeURIComponent(`היי ליאור, אני מעוניין/ת בייעוץ:\n${details}`)}`, '_blank');
    setSubmitted(true);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">
      <ProgressBar step={step} />

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} {...slide(dir)}>

            {/* ── STEP 0: Purpose ── */}
            {step === 0 && (
              <div className="card-premium rounded-3xl p-6 sm:p-8 space-y-6">
                <h3 className="text-xl font-bold text-white">מה מטרת ההלוואה?</h3>

                {/* Main purpose toggle */}
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { id: 'purchase'   as LoanPurpose, label: 'רכישת נכס',          icon: Home, sub: 'משכנתא לרכישה' },
                    { id: 'anyPurpose' as LoanPurpose, label: 'הלוואה לכל מטרה',     icon: Key,  sub: 'על בסיס נכס קיים' },
                  ]).map(({ id, label, icon, sub }) => (
                    <SelectCard key={id} selected={loanPurpose === id} onClick={() => { setLoanPurpose(id); setPurchaseSub(null); setApSub(null); }}
                      icon={icon} label={label} sub={sub} />
                  ))}
                </div>

                {/* Sub-type grid */}
                <AnimatePresence mode="wait">
                  {loanPurpose === 'purchase' && (
                    <motion.div key="purchase" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                      <p className="text-xs text-gray-500 mb-3">בחר סוג רכישה</p>
                      <div className="grid grid-cols-2 gap-2">
                        {PURCHASE_SUBS.map(({ id, label, icon, ltv }) => (
                          <SelectCard key={id} selected={purchaseSub === id}
                            onClick={() => setPurchaseSub(id)}
                            icon={icon} label={label} sub={`מימון עד ${ltv}`} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                  {loanPurpose === 'anyPurpose' && (
                    <motion.div key="any" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                      <p className="text-xs text-gray-500 mb-3">למה תשמש ההלוואה?</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ANY_PURPOSE_SUBS.map(({ id, label, icon }) => (
                          <SelectCard key={id} selected={apSub === id}
                            onClick={() => setApSub(id)}
                            icon={icon} label={label} />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ── STEP 1: Structure ── */}
            {step === 1 && (
              <div className="card-premium rounded-3xl p-6 sm:p-8 space-y-7">
                <h3 className="text-xl font-bold text-white">מבנה ההלוואה</h3>

                {/* Rank */}
                <div>
                  <p className="text-sm text-gray-400 mb-3 font-medium">דרגת משכנתא</p>
                  <div className="grid grid-cols-2 gap-3">
                    <SelectCard selected={rank === 'first'} onClick={() => handleRank('first')}
                      icon={Shield} label="דרגה ראשונה"
                      sub="עד 50% משווי הנכס — בנק ישראל" />
                    <SelectCard selected={rank === 'second'} onClick={() => handleRank('second')}
                      icon={Building2} label="דרגה שנייה"
                      sub="זמין דרך גופים חוץ-בנקאיים בלבד" />
                  </div>
                  {rank === 'second' && (
                    <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> מימון מקסימלי תלוי במדיניות המלווה ובחוב הקיים.
                    </p>
                  )}
                </div>

                {/* Funding source */}
                <div>
                  <p className="text-sm text-gray-400 mb-3 font-medium">מקור המימון</p>
                  <div className="grid grid-cols-2 gap-3">
                    <SelectCard selected={source === 'bank'} onClick={() => { if (rank !== 'second') setSource('bank'); }}
                      icon={Banknote} label="בנק"
                      sub={rank === 'second' ? 'לא זמין לדרגה שנייה' : 'ריבית: 5-7%'} />
                    <SelectCard selected={source === 'nonBank'} onClick={() => setSource('nonBank')}
                      icon={DollarSign} label="גוף חוץ-בנקאי"
                      sub={rank === 'second' ? 'ריבית: 9.5-14%' : 'ריבית: 7-10%'} />
                  </div>
                  {rank === 'second' && source === 'bank' && (
                    <p className="text-xs text-red-400 mt-2">בנקים אינם מעניקים משכנתאות בדרגה שנייה.</p>
                  )}
                </div>

                {/* Purpose category */}
                <div>
                  <p className="text-sm text-gray-400 mb-3 font-medium">קטגוריית המטרה</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PURPOSE_CATS.map(({ id, label }) => (
                      <button key={id} onClick={() => setPurposeCat(id)}
                        className={cn('py-2.5 px-4 rounded-xl text-sm font-medium border transition-all',
                          purposeCat === id
                            ? 'border-[#C9A84C] text-[#C9A84C] bg-[rgba(201,168,76,0.08)]'
                            : 'border-[rgba(201,168,76,0.15)] text-gray-400 hover:border-[rgba(201,168,76,0.3)]'
                        )}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: Details ── */}
            {step === 2 && (
              <div className="card-premium rounded-3xl p-6 sm:p-8 space-y-7">
                <h3 className="text-xl font-bold text-white">פרטי ההלוואה</h3>

                {/* Property value */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">שווי הנכס</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3 flex items-center text-[#C9A84C] font-bold pointer-events-none">₪</span>
                    <input type="text" inputMode="numeric" value={propValue}
                      onChange={(e) => setPropValue(fmtNum(e.target.value.replace(/[^0-9]/g,'')))}
                      placeholder="2,000,000"
                      className="input-dark w-full rounded-xl py-3 pr-8 pl-4 text-sm" />
                  </div>
                  {propVal > 0 && maxLTVVal && (
                    <p className="text-xs text-gray-500 mt-1.5">
                      מימון מקסימלי מותר: <span className="text-[#C9A84C] font-semibold">{formatCurrency(propVal * maxLTVVal)}</span> ({(maxLTVVal * 100).toFixed(0)}% LTV)
                    </p>
                  )}
                </div>

                {/* Loan amount */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    סכום ההלוואה
                    <span className="text-[#C9A84C] font-bold mr-2">{formatCurrency(loanAmount)}</span>
                  </label>
                  <div className="relative mb-3">
                    <span className="absolute inset-y-0 right-3 flex items-center text-[#C9A84C] font-bold pointer-events-none">₪</span>
                    <input type="text" inputMode="numeric" value={loanAmtInput}
                      onChange={(e) => handleLoanAmtInput(e.target.value)}
                      className="input-dark w-full rounded-xl py-3 pr-8 pl-4 text-sm" />
                  </div>
                  <RangeSlider min={150000} max={10000000} step={50000} value={loanAmount} onChange={handleSliderAmt} />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>₪150,000</span><span>₪10,000,000</span>
                  </div>
                  {ltvWarning && (
                    <div className="flex items-start gap-2 mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-400">
                        הסכום המבוקש ({formatCurrency(loanAmount)}) חורג מהמימון המקסימלי
                        ({formatCurrency(maxAllowed ?? 0)}) לפי תקנות בנק ישראל.
                      </p>
                    </div>
                  )}
                </div>

                {/* Loan term */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    תקופת הלוואה
                    <span className="text-[#C9A84C] font-bold mr-2">{loanYears} שנים</span>
                  </label>
                  <RangeSlider min={1} max={30} step={1} value={loanYears} onChange={(v) => setLoanYears(parseInt(v))} />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>שנה 1</span><span>15 שנים</span><span>30 שנים</span>
                  </div>
                </div>

                {/* Income (optional) */}
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">
                    הכנסה חודשית נטו
                    <span className="text-gray-500 text-xs font-normal mr-2">(אופציונלי — לחישוב PTI)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3 flex items-center text-[#C9A84C] font-bold pointer-events-none">₪</span>
                    <input type="text" inputMode="numeric" value={monthlyIncome}
                      onChange={(e) => setMonthlyIncome(fmtNum(e.target.value.replace(/[^0-9]/g,'')))}
                      placeholder="20,000"
                      className="input-dark w-full rounded-xl py-3 pr-8 pl-4 text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Results + Lead ── */}
            {step === 3 && (
              <div className="space-y-5">
                {/* Result cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'סכום הלוואה',       raw: loanAmount,  currency: true,  icon: <DollarSign size={16} className="text-[#C9A84C]" />,      color: 'text-[#C9A84C]' },
                    { label: 'תשלום חודשי משוער', raw: pmtMid,      currency: true,  icon: <Calendar size={16} className="text-blue-400" />,          color: 'text-blue-400' },
                    { label: 'הכנסה נדרשת',       raw: reqIncome,   currency: true,  icon: <Banknote size={16} className="text-purple-400" />,        color: 'text-purple-400' },
                    { label: 'LTV מינוף',          raw: ltv,         currency: false, icon: <Shield size={16} className="text-emerald-400" />,         color: 'text-emerald-400' },
                    { label: 'סה"כ ריבית',        raw: interest,    currency: true,  icon: <TrendingUp size={16} className="text-orange-400" />,      color: 'text-orange-400' },
                    { label: 'סה"כ להחזיר',       raw: total,       currency: true,  icon: <DollarSign size={16} className="text-gray-300" />,         color: 'text-gray-200' },
                  ].map((c, i) => (
                    <motion.div key={c.label}
                      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.06 }}
                      className="card-premium rounded-2xl p-4 text-center">
                      <div className="flex justify-center mb-2">{c.icon}</div>
                      <div className={cn('text-base sm:text-lg font-black leading-tight', c.color)}>
                        {c.currency
                          ? <AnimatedCurrency value={c.raw} duration={1.2 + i * 0.08} />
                          : `${(c.raw * 100).toFixed(1)}%`}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-1">{c.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Risk + rate band + PTI row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Risk */}
                  <div className={cn('card-premium rounded-2xl p-4 text-center border', RISK_BG[risk])}>
                    <div className="text-xs text-gray-400 mb-1">רמת סיכון</div>
                    <div className={cn('text-xl font-black', RISK_COLOR[risk])}>{RISK_LABEL[risk]}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {risk === 'low' ? 'LTV ו-PTI תקינים' : risk === 'medium' ? 'גבולי — מומלץ להתייעץ' : 'גבוה — נדרש ייעוץ מקצועי'}
                    </div>
                  </div>

                  {/* Rate band */}
                  <div className="card-premium rounded-2xl p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">ריבית משוערת</div>
                    <div className="text-xl font-black text-[#C9A84C]">{rateInfo.min}%–{rateInfo.max}%</div>
                    <div className="text-xs text-gray-500 mt-1">
                      תשלום בטווח: {formatCurrency(pmtMin)}–{formatCurrency(pmtMax)}
                    </div>
                  </div>

                  {/* PTI */}
                  <div className="card-premium rounded-2xl p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">
                      {pti !== null ? 'יחס החזר (PTI)' : 'הכנסה נדרשת (40% PTI)'}
                    </div>
                    <div className={cn('text-xl font-black', pti !== null ? RISK_COLOR[riskLevel(ltv, pti)] : 'text-white')}>
                      {pti !== null ? `${(pti*100).toFixed(1)}%` : formatCurrency(reqIncome)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {pti !== null
                        ? pti <= 0.30 ? 'מעולה — מתחת ל-30%' : pti <= 0.40 ? 'גבולי — 30-40%' : 'מעל מגבלת בנק ישראל'
                        : 'הכנסה חודשית מינימלית'}
                    </div>
                  </div>
                </div>

                {/* LTV warning */}
                {ltvWarning && (
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                    <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-red-400 font-semibold text-sm mb-0.5">חריגה ממגבלת LTV</div>
                      <div className="text-xs text-gray-400">
                        הסכום המבוקש חורג מהמימון המקסימלי המאושר. ייעוץ מקצועי יכול לסייע למצוא חלופות.
                      </div>
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div className="glass-gold rounded-2xl p-4 text-xs text-gray-400 leading-relaxed">
                  <strong className="text-[#C9A84C]">הערה חשובה:</strong> חישוב זה מבוסס על ריביות משוערות בלבד. הריבית בפועל עשויה להשתנות בהתאם לפרופיל הלוואה, סוג המלווה, שווי הנכס, דרגת המשכנתא ותנאי השוק. מחשבון זה מיועד למטרות הערכה בלבד ואינו מהווה הצעה מחייבת.
                </div>

                {/* Lead form */}
                {!submitted ? (
                  <div className="card-premium rounded-3xl p-6 sm:p-8 border border-[rgba(201,168,76,0.3)]">
                    <div className="text-center mb-6">
                      <div className="text-[#C9A84C] font-bold text-xl mb-1">רוצה אסטרטגיית מימון מותאמת אישית?</div>
                      <div className="text-gray-400 text-sm">ליאור נגר, יועץ משכנתאות מוסמך — ייעוץ ראשוני ללא עלות</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">שם מלא *</label>
                        <input value={leadName} onChange={(e) => setLeadName(e.target.value)}
                          placeholder="ישראל ישראלי"
                          className="input-dark w-full rounded-xl py-3 px-4 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">טלפון *</label>
                        <input value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)}
                          placeholder="050-000-0000" type="tel"
                          className="input-dark w-full rounded-xl py-3 px-4 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">אימייל</label>
                        <input value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)}
                          placeholder="email@example.com" type="email"
                          className="input-dark w-full rounded-xl py-3 px-4 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">הערות</label>
                        <input value={leadNotes} onChange={(e) => setLeadNotes(e.target.value)}
                          placeholder="כל מידע נוסף רלוונטי..."
                          className="input-dark w-full rounded-xl py-3 px-4 text-sm" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center">
                      <button
                        onClick={submitLead}
                        disabled={!leadName || !leadPhone}
                        className={cn('btn-gold flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm',
                          (!leadName || !leadPhone) && 'opacity-50 cursor-not-allowed'
                        )}>
                        <MessageCircle size={16} />
                        בקש ייעוץ חינם
                      </button>
                      <a href="tel:+972525076504"
                        className="btn-outline-gold flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm">
                        <Phone size={16} />
                        התקשר עכשיו
                      </a>
                    </div>
                  </div>
                ) : (
                  <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                    className="card-premium rounded-3xl p-8 text-center border border-emerald-500/30">
                    <CheckCircle size={40} className="text-emerald-400 mx-auto mb-3" />
                    <div className="text-emerald-400 font-bold text-xl mb-1">הפניה נשלחה!</div>
                    <div className="text-gray-400 text-sm">ליאור יחזור אליך בהקדם</div>
                  </motion.div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Navigation ── */}
      {step < 3 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => go(step - 1)}
            disabled={step === 0}
            className={cn('flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm btn-outline-gold',
              step === 0 && 'opacity-0 pointer-events-none'
            )}>
            <ChevronRight size={18} />
            חזור
          </button>

          <div className="text-xs text-gray-500">שלב {step + 1} מתוך {STEPS.length}</div>

          <button
            onClick={() => go(step + 1)}
            disabled={!canNext}
            className={cn('flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm',
              canNext ? 'btn-gold' : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
            )}>
            {step === 2 ? 'חשב' : 'המשך'}
            <ChevronLeft size={18} />
          </button>
        </div>
      )}

      {/* Back button on results */}
      {step === 3 && !submitted && (
        <div className="flex justify-start mt-4">
          <button onClick={() => go(2)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#C9A84C] transition-colors">
            <ChevronRight size={16} />
            חזור לעריכה
          </button>
        </div>
      )}
    </div>
  );
}
