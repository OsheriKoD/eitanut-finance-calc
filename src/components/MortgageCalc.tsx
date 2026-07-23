'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Home, Wallet, PiggyBank, TrendingUp, RefreshCw,
  ChevronRight, MessageCircle, Phone, Mail, Send, Loader2, AlertTriangle, Check, Lightbulb,
} from 'lucide-react';
import { cn, formatCurrency, whatsappUrl } from '@/lib/utils';
import AnimatedCurrency from './AnimatedCurrency';

const PTI_RATE     = 0.40;
const ASSUMED_RATE = 5.0; // % annual — ממוצע משוקלל תמהיל סטנדרטי (פריים + קבועה)

function pmtPer100K(years: number): number {
  const r = ASSUMED_RATE / 100 / 12;
  const n = years * 12;
  return 100_000 * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

type PropType   = 'firstHome' | 'replacement' | 'investment';
type KnownField = 'income' | 'propertyValue' | 'equity' | 'monthlyPayment' | 'mortgageAmount';
type Step       = 'type' | 'field' | 'term' | 'input';

const LOAN_YEARS = [10, 15, 20, 25, 30];

const PROP_TYPES = [
  { id: 'firstHome'   as PropType, label: 'דירה ראשונה', badge: '75%', desc: 'מימון עד 75% משווי הנכס' },
  { id: 'replacement' as PropType, label: 'דירה חליפית', badge: '70%', desc: 'מימון עד 70% משווי הנכס' },
  { id: 'investment'  as PropType, label: 'להשקעה',      badge: '50%', desc: 'מימון עד 50% משווי הנכס' },
];

const LTV: Record<PropType, number> = {
  firstHome: 0.75, replacement: 0.70, investment: 0.50,
};

interface FieldDef {
  id: KnownField;
  label: string;
  desc: string;
  ph: string;
  Icon: React.ElementType;
  min: number;
  max: number;
  step: number;
}

const FIELDS: FieldDef[] = [
  { id: 'income',         label: 'הכנסה פנויה',   desc: 'הכנסה חודשית נטו של כל הלווים',  ph: '20,000',    Icon: Wallet,     min: 3_000,   max: 100_000,    step: 500 },
  { id: 'propertyValue',  label: 'שווי הדירה',    desc: 'שווי הנכס שאתם מעוניינים לרכוש', ph: '2,000,000', Icon: Home,       min: 500_000, max: 10_000_000, step: 50_000 },
  { id: 'equity',         label: 'הון עצמי',      desc: 'כמה הון עצמי יש לכם',            ph: '400,000',   Icon: PiggyBank,  min: 50_000,  max: 3_000_000,  step: 10_000 },
  { id: 'monthlyPayment', label: 'החזר חודשי',    desc: 'כמה תוכלו להחזיר בחודש',         ph: '5,000',     Icon: RefreshCw,  min: 1_500,   max: 30_000,     step: 500 },
  { id: 'mortgageAmount', label: 'משכנתא מבוקשת', desc: 'כמה אתם רוצים ללוות',            ph: '1,500,000', Icon: TrendingUp, min: 100_000, max: 10_000_000, step: 50_000 },
];

const COLOR = {
  gold:   { text: 'text-[#A07C28]',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  blue:   { text: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'  },
  green:  { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  purple: { text: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-200' },
  sky:    { text: 'text-sky-700',     bg: 'bg-sky-50',     border: 'border-sky-200' },
} as const;

type ColorKey = keyof typeof COLOR;

interface ResultCard { label: string; value: number; color: ColorKey; note?: string; isPercent?: boolean }

function compute(field: KnownField, val: number, ltv: number, years: number): ResultCard[] {
  const P      = pmtPer100K(years);
  const R      = PTI_RATE;
  const ltvPct = Math.round(ltv * 100);

  switch (field) {
    case 'income': {
      const pmt  = val * R;
      const mort = pmt / P * 100_000;
      const pv   = mort / ltv;
      const eq   = pv - mort;
      return [
        { label: 'החזר חודשי משוער',  value: pmt,  color: 'gold',   note: '40% מההכנסה' },
        { label: 'משכנתא מקסימלית',   value: mort, color: 'blue',   note: `${years} שנה • ${ASSUMED_RATE}%` },
        { label: 'שווי נכס מקסימלי',  value: pv,   color: 'sky',    note: `${ltvPct}% LTV` },
        { label: 'הון עצמי נדרש',     value: eq,   color: 'green',  note: `${100 - ltvPct}% משווי הנכס` },
      ];
    }
    case 'propertyValue': {
      const mort = val * ltv;
      const pmt  = mort / 100_000 * P;
      const inc  = pmt / R;
      const eq   = val - mort;
      return [
        { label: 'משכנתא מקסימלית',   value: mort, color: 'blue',   note: `${ltvPct}% משווי הנכס` },
        { label: 'הון עצמי נדרש',     value: eq,   color: 'green',  note: `${100 - ltvPct}% משווי הנכס` },
        { label: 'החזר חודשי משוער',  value: pmt,  color: 'gold',   note: `${years} שנה • ${ASSUMED_RATE}%` },
        { label: 'הכנסה פנויה נדרשת', value: inc,  color: 'purple', note: 'PTI 40%' },
      ];
    }
    case 'equity': {
      const pv   = val / (1 - ltv);
      const mort = pv * ltv;
      const pmt  = mort / 100_000 * P;
      const inc  = pmt / R;
      return [
        { label: 'שווי דירה מקסימלי', value: pv,   color: 'sky',    note: `${ltvPct}% LTV` },
        { label: 'משכנתא',            value: mort, color: 'blue',   note: `${years} שנה • ${ASSUMED_RATE}%` },
        { label: 'החזר חודשי משוער',  value: pmt,  color: 'gold',   note: `${years} שנה • ${ASSUMED_RATE}%` },
        { label: 'הכנסה פנויה נדרשת', value: inc,  color: 'purple', note: 'PTI 40%' },
      ];
    }
    case 'monthlyPayment': {
      const mort = val / P * 100_000;
      const inc  = val / R;
      const pv   = mort / ltv;
      const eq   = pv - mort;
      return [
        { label: 'משכנתא מקסימלית',   value: mort, color: 'blue',   note: `${years} שנה • ${ASSUMED_RATE}%` },
        { label: 'שווי נכס מקסימלי',  value: pv,   color: 'sky',    note: `${ltvPct}% LTV` },
        { label: 'הכנסה פנויה נדרשת', value: inc,  color: 'purple', note: 'PTI 40%' },
        { label: 'הון עצמי נדרש',     value: eq,   color: 'green',  note: `${100 - ltvPct}% משווי הנכס` },
      ];
    }
    case 'mortgageAmount': {
      const pmt = val / 100_000 * P;
      const inc = pmt / R;
      const pv  = val / ltv;
      const eq  = pv - val;
      return [
        { label: 'החזר חודשי משוער',  value: pmt, color: 'gold',   note: `${years} שנה • ${ASSUMED_RATE}%` },
        { label: 'הכנסה פנויה נדרשת', value: inc, color: 'purple', note: 'PTI 40%' },
        { label: 'שווי נכס נדרש',     value: pv,  color: 'sky',    note: `${ltvPct}% LTV` },
        { label: 'הון עצמי נדרש',     value: eq,  color: 'green',  note: `${100 - ltvPct}% משווי הנכס` },
      ];
    }
  }
}

export default function MortgageCalc() {
  const [step,      setStep]      = useState<Step>('type');
  const [propType,  setPropType]  = useState<PropType | null>(null);
  const [field,     setField]     = useState<KnownField | null>(null);
  const [loanYears, setLoanYears] = useState<number>(25);
  const [rawValue,  setRawValue]  = useState('');
  const [sliderVal, setSliderVal] = useState<number>(0);
  const [results,    setResults]    = useState<ResultCard[] | null>(null);
  const [name,       setName]       = useState('');
  const [phone,      setPhone]      = useState('');
  const [email,      setEmail]      = useState('');
  const [sending,    setSending]    = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [propValStr, setPropValStr] = useState('');
  const [ltvWarning, setLtvWarning] = useState<{
    actual: number; cap: number;
    minPropVal: number; maxAllowableMort: number;
    minEquityNeeded?: number; maxPropValForEquity?: number;
  } | null>(null);
  const [affordWarning, setAffordWarning] = useState<{
    mort: number; propVal: number; maxAffordableProperty: number;
    requiredEquity: number; requiredEquityPct: number; standardEquityPct: number;
  } | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const fmt = (v: string) => v.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const handleTypeSelect = (pt: PropType) => {
    setPropType(pt); setStep('field'); setResults(null); setPropValStr(''); setLtvWarning(null); setAffordWarning(null);
  };

  const handleFieldSelect = (f: KnownField) => {
    const fd = FIELDS.find(x => x.id === f)!;
    setField(f);
    const mid = Math.round((fd.min + fd.max) / 2 / fd.step) * fd.step;
    setSliderVal(mid);
    setRawValue('');
    setPropValStr('');
    setLtvWarning(null);
    setAffordWarning(null);
    setStep('term');
    setResults(null);
  };

  const handleTermSelect = (y: number) => {
    setLoanYears(y); setStep('input');
  };

  const handleBack = () => {
    setResults(null);
    setLtvWarning(null);
    setAffordWarning(null);
    if (step === 'input') setStep('term');
    else if (step === 'term') setStep('field');
    else if (step === 'field') setStep('type');
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setSliderVal(v);
    setRawValue(fmt(String(v)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9]/g, '');
    setRawValue(fmt(clean));
    const num = parseInt(clean, 10);
    if (!isNaN(num)) setSliderVal(num);
  };

  const handlePropValChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9]/g, '');
    setPropValStr(clean ? fmt(clean) : '');
  };

  const buildSummary = () => {
    if (!results || !field || !propType) return '';
    const propLabel  = PROP_TYPES.find(p => p.id === propType)?.label ?? '';
    const fieldLabel = FIELDS.find(f => f.id === field)?.label ?? '';
    return (
      `פרטי החישוב: ${propLabel} • ${fieldLabel}: ${rawValue} ₪ • ${loanYears} שנה • ריבית ${ASSUMED_RATE}%\n\n` +
      `תוצאות:\n` + results.map(c => `• ${c.label}: ${formatCurrency(c.value)}`).join('\n')
    );
  };

  const generatePDF = async (): Promise<{ blob: Blob; base64: string }> => {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
    ]);
    const el = reportRef.current!;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth  = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));
    return { blob: pdf.output('blob'), base64: pdf.output('datauristring').split(',')[1] };
  };

  const handleSendEmail = async () => {
    if (!email || !results) return;
    setSending(true);
    setSendStatus('idle');
    try {
      const { base64 } = await generatePDF();
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, pdfBase64: base64, summary: buildSummary() }),
      });
      setSendStatus(res.ok ? 'success' : 'error');
    } catch {
      setSendStatus('error');
    } finally {
      setSending(false);
    }
  };

  const handleCalculate = () => {
    const val = parseFloat(rawValue.replace(/,/g, ''));
    if (!val || !field || !propType) return;

    const ltvCap = LTV[propType];
    let cards = compute(field, val, ltvCap, loanYears);

    const propVal = propValStr ? parseFloat(propValStr.replace(/,/g, '')) : 0;
    if (propVal && field !== 'propertyValue') {
      const P = pmtPer100K(loanYears);
      let mort = 0;
      if      (field === 'monthlyPayment') mort = val / P * 100_000;
      else if (field === 'income')         mort = (val * PTI_RATE) / P * 100_000;
      else if (field === 'mortgageAmount') mort = val;
      else if (field === 'equity')         mort = Math.max(0, propVal - val);

      if (mort > 0) {
        const actualLtv        = mort / propVal;
        const maxAllowableMort = Math.round(propVal * ltvCap);
        const maxAffordableProperty = mort / ltvCap;

        if (actualLtv > ltvCap) {
          setLtvWarning({
            actual: actualLtv, cap: ltvCap,
            minPropVal: mort / ltvCap,
            maxAllowableMort,
            ...(field === 'equity' && {
              minEquityNeeded: Math.round(propVal * (1 - ltvCap)),
              maxPropValForEquity: Math.round(val / (1 - ltvCap)),
            }),
          });
          setAffordWarning(null);
        } else if ((field === 'income' || field === 'monthlyPayment') && propVal > maxAffordableProperty * 1.15) {
          // Mortgage this income/payment supports falls meaningfully short of what's needed to buy the
          // stated property at the standard equity ratio (>15% buffer, to avoid flagging minor equity excess).
          setLtvWarning(null);
          setAffordWarning({
            mort, propVal, maxAffordableProperty,
            requiredEquity: propVal - mort,
            requiredEquityPct: Math.round(((propVal - mort) / propVal) * 1000) / 10,
            standardEquityPct: Math.round((1 - ltvCap) * 100),
          });
        } else {
          setLtvWarning(null);
          setAffordWarning(null);
          const actualLtvPct = Math.round(actualLtv * 1000) / 10;
          if (field !== 'equity' && field !== 'mortgageAmount' && field !== 'income' && field !== 'monthlyPayment') {
            const equity = propVal - mort;
            cards = [...cards, { label: 'הון עצמי נדרש', value: equity, color: 'green' as ColorKey, note: `${(100 - actualLtvPct).toFixed(1)}% משווי הנכס` }];
          }
          cards = [...cards, { label: 'אחוז מימון בפועל', value: actualLtvPct, color: 'sky' as ColorKey, note: `תקרה: ${Math.round(ltvCap * 100)}%`, isPercent: true }];
        }
      } else {
        setLtvWarning(null);
        setAffordWarning(null);
      }
    } else {
      setLtvWarning(null);
      setAffordWarning(null);
    }

    setResults(cards);
    setSendStatus('idle');
    setTimeout(() => {
      document.getElementById('mort-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const fieldDef   = FIELDS.find(f => f.id === field);
  const stepNum    = step === 'type' ? 1 : step === 'field' ? 2 : step === 'term' ? 3 : 4;
  const sliderPct  = fieldDef
    ? Math.max(0, Math.min(100, Math.round(((sliderVal - fieldDef.min) / (fieldDef.max - fieldDef.min)) * 100)))
    : 0;

  const mainWaMsg = results
    ? `היי ליאור, חישבתי ${results[0]?.label}: ${formatCurrency(results[0]?.value)} ואשמח לייעוץ.`
    : 'היי ליאור, אשמח לקבל ייעוץ משכנתא.';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Progress bar — 4 steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className={cn(
            'h-1.5 rounded-full transition-all duration-400',
            n < stepNum   ? 'w-8 bg-[#C9A84C]' :
            n === stepNum ? 'w-12 bg-[#C9A84C]' : 'w-8 bg-[#BDD8EE]'
          )} />
        ))}
      </div>

      {/* Back button */}
      {step !== 'type' && (
        <button onClick={handleBack}
          className="flex items-center gap-1 text-sm text-[#4D6E88] hover:text-[#1A2C3D] transition-colors">
          <ChevronRight size={15} />
          חזרה
        </button>
      )}

      {/* ── Step 1: Property type ── */}
      {step === 'type' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p className="text-center text-[#4D6E88] text-xs mb-1">שלב 1 מתוך 4</p>
          <h3 className="text-center text-2xl font-bold text-[#1A2C3D] mb-8">מה מטרת הנכס?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PROP_TYPES.map(pt => (
              <button key={pt.id} onClick={() => handleTypeSelect(pt.id)}
                className="card-premium rounded-2xl p-6 text-center hover:border-[#C9A84C] hover:shadow-gold group cursor-pointer">
                <div className="text-3xl font-black text-[#C9A84C] mb-2 group-hover:scale-110 transition-transform duration-200">
                  {pt.badge}
                </div>
                <div className="text-[#1A2C3D] font-bold text-base mb-1">{pt.label}</div>
                <div className="text-[#4D6E88] text-xs">{pt.desc}</div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Step 2: Known field ── */}
      {step === 'field' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p className="text-center text-[#4D6E88] text-xs mb-1">שלב 2 מתוך 4</p>
          <h3 className="text-center text-2xl font-bold text-[#1A2C3D] mb-8">מה ידוע לך?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FIELDS.map(f => (
              <button key={f.id} onClick={() => handleFieldSelect(f.id)}
                className="card-premium rounded-2xl p-4 flex items-center gap-4 text-right hover:border-[#C9A84C] hover:shadow-gold group cursor-pointer">
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                  <f.Icon size={20} className="text-[#C9A84C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#1A2C3D] font-bold text-sm">{f.label}</div>
                  <div className="text-[#4D6E88] text-xs mt-0.5 leading-snug">{f.desc}</div>
                </div>
                <ChevronRight size={16} className="text-[#BDD8EE] group-hover:text-[#C9A84C] shrink-0 rotate-180 transition-colors" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Step 3: Loan term ── */}
      {step === 'term' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p className="text-center text-[#4D6E88] text-xs mb-1">שלב 3 מתוך 4</p>
          <h3 className="text-center text-2xl font-bold text-[#1A2C3D] mb-2">תקופת המשכנתא</h3>
          <p className="text-center text-[#4D6E88] text-sm mb-8">כמה שנים תרצו להחזיר?</p>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {LOAN_YEARS.map(y => (
              <button key={y} onClick={() => handleTermSelect(y)}
                className={cn(
                  'w-[88px] py-5 rounded-2xl font-bold text-xl transition-all duration-200',
                  loanYears === y
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
            {Math.round(pmtPer100K(loanYears))} ₪ לכל 100,000 ₪ &bull; ריבית משוערת {ASSUMED_RATE}%
          </div>
        </motion.div>
      )}

      {/* ── Step 4: Value input + slider ── */}
      {step === 'input' && fieldDef && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p className="text-center text-[#4D6E88] text-xs mb-1">שלב 4 מתוך 4</p>
          <h3 className="text-center text-2xl font-bold text-[#1A2C3D] mb-1">
            הזן את {fieldDef.label}
          </h3>
          <p className="text-center text-[#4D6E88] text-sm mb-6">{fieldDef.desc}</p>

          {/* Large ₪ input */}
          <div className="relative mb-5">
            <span className="absolute inset-y-0 right-5 flex items-center text-[#C9A84C] font-bold text-2xl pointer-events-none">
              ₪
            </span>
            <input
              type="text" inputMode="numeric"
              value={rawValue}
              onChange={handleInputChange}
              placeholder={fieldDef.ph}
              autoFocus
              className="input-dark w-full rounded-2xl py-5 pr-14 pl-5 text-2xl font-bold text-center tracking-wide"
            />
          </div>

          {/* Slider */}
          <div className="px-1 mb-2">
            <input
              type="range"
              min={fieldDef.min}
              max={fieldDef.max}
              step={fieldDef.step}
              value={sliderVal || fieldDef.min}
              onChange={handleSliderChange}
              className="range-track w-full"
              style={{
                background: `linear-gradient(to left, #C9A84C ${sliderPct}%, #BDD8EE ${sliderPct}%)`,
              }}
            />
            <div className="flex justify-between text-xs text-[#4D6E88] mt-1.5 px-0.5">
              <span>{formatCurrency(fieldDef.min)}</span>
              <span>{formatCurrency(fieldDef.max)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 glass-gold rounded-xl px-4 py-2.5 mb-6 text-center text-xs text-[#4D6E88]">
            <Lightbulb size={13} className="shrink-0" />
            {Math.round(pmtPer100K(loanYears))} ₪ לכל 100,000 ₪ &bull; {loanYears} שנה &bull; ריבית {ASSUMED_RATE}%
          </div>

          {/* Optional property value for LTV check */}
          {field !== 'propertyValue' && (
            <div className="card-premium rounded-2xl p-4 mb-4 space-y-2">
              <p className="text-xs font-semibold text-[#1A2C3D]">
                שווי הדירה <span className="text-[#4D6E88] font-normal">(אופציונלי — לחישוב הון עצמי ובדיקת LTV)</span>
              </p>
              <div className="relative">
                <span className="absolute inset-y-0 right-4 flex items-center text-[#C9A84C] font-bold text-lg pointer-events-none">₪</span>
                <input
                  type="text" inputMode="numeric"
                  value={propValStr}
                  onChange={handlePropValChange}
                  placeholder="2,000,000"
                  className="input-dark w-full rounded-xl py-3 pr-10 pl-4 text-base font-semibold tracking-wide"
                />
              </div>
            </div>
          )}

          <button onClick={handleCalculate}
            disabled={!rawValue}
            className="btn-gold w-full py-4 rounded-2xl font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            חשב עכשיו
          </button>
        </motion.div>
      )}

      {/* ── Results ── */}
      {results && (
        <motion.div id="mort-results"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-6 border-t border-[#BDD8EE]">

          <h4 className="text-center text-lg font-bold text-[#1A2C3D]">תוצאות החישוב</h4>
          <p className="text-center text-xs text-[#4D6E88]">
            {loanYears} שנה &bull; ריבית {ASSUMED_RATE}% &bull;{' '}
            {propType ? PROP_TYPES.find(p => p.id === propType)?.label : ''}
          </p>

          {/* LTV warning banner */}
          {ltvWarning && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-right space-y-2">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-red-700 text-sm mb-1">
                    אחוז המימון ({Math.round(ltvWarning.actual * 100)}%) חורג מהמותר לפי בנק ישראל
                  </div>
                  <div className="text-red-600 text-xs leading-relaxed">
                    {PROP_TYPES.find(p => p.id === propType)?.label} מוגבלת ל-{Math.round(ltvWarning.cap * 100)}% LTV.
                    {' '}{field === 'equity'
                      ? <>הון עצמי מינימלי לנכס זה: <strong>{formatCurrency(ltvWarning.minEquityNeeded!)}</strong>.</>
                      : <>שווי הדירה המינימלי לאישור: <strong>{formatCurrency(ltvWarning.minPropVal)}</strong>.</>
                    }
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-emerald-700 text-xs leading-relaxed">
                  <strong>מה כן אפשרי: </strong>
                  {field === 'equity'
                    ? <>עם הון עצמי זה ניתן לרכוש נכס עד <strong>{formatCurrency(ltvWarning.maxPropValForEquity!)}</strong> ({Math.round(ltvWarning.cap * 100)}% LTV)</>
                    : <>המשכנתא המקסימלית לנכס זה — <strong>{formatCurrency(ltvWarning.maxAllowableMort)}</strong> ({Math.round(ltvWarning.cap * 100)}% LTV)</>
                  }
                </div>
              </div>
            </div>
          )}

          {/* Affordability warning banner (income/monthlyPayment vs stated property value) */}
          {affordWarning && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-right space-y-2">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-red-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-bold text-red-700 text-sm mb-1">
                    ההכנסה שהזנתם אינה מספיקה לרכישת הנכס בשווי שציינתם
                  </div>
                  <div className="text-red-600 text-xs leading-relaxed">
                    לפי הנתונים שהזנתם, המשכנתא המקסימלית האפשרית היא <strong>{formatCurrency(affordWarning.mort)}</strong>.
                    {' '}עבור נכס בשווי <strong>{formatCurrency(affordWarning.propVal)}</strong> תזדקקו להון עצמי של{' '}
                    <strong>{formatCurrency(affordWarning.requiredEquity)}</strong> ({affordWarning.requiredEquityPct}%)
                    {' '}— משמעותית מעל ההון העצמי הסטנדרטי הנדרש ({affordWarning.standardEquityPct}%).
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-emerald-700 text-xs leading-relaxed">
                  <strong>מה כן אפשרי: </strong>
                  שווי הנכס המקסימלי לרכישה לפי נתונים אלו, בהון עצמי סטנדרטי — <strong>{formatCurrency(affordWarning.maxAffordableProperty)}</strong>
                </div>
              </div>
            </div>
          )}

          <div className={cn(
            'grid gap-3',
            results.length <= 2 ? 'grid-cols-2' :
            results.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
            results.length >= 5 ? 'grid-cols-2 sm:grid-cols-3' :
            'grid-cols-2'
          )}>
            {results.map((card, i) => {
              const c = COLOR[card.color];
              return (
                <motion.div key={`${card.label}-${i}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className={cn('rounded-2xl p-5 text-center border', c.bg, c.border)}>
                  <div className={cn('text-2xl font-black leading-tight mb-1', c.text)}>
                    {card.isPercent
                      ? `${card.value.toFixed(1)}%`
                      : <AnimatedCurrency value={card.value} duration={1.2 + i * 0.08} />
                    }
                  </div>
                  <div className="text-[#1A2C3D] text-xs font-semibold mt-1">{card.label}</div>
                  {card.note && (
                    <div className="text-[#4D6E88] text-xs mt-0.5">{card.note}</div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-xs text-[#4D6E88] px-4">
            החישוב מבוסס על הנחות ממוצעות בהתאם לרגולציית בנק ישראל. לייעוץ מדויק ואישי — פנו לליאור נגר.
          </p>

          {/* Send report form */}
          <div className="card-premium rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#1A2C3D] font-bold text-sm">
              <Mail size={15} className="text-[#C9A84C]" />
              קבל דוח PDF במייל
            </div>
            <p className="text-[#4D6E88] text-xs">הדוח יישלח ישירות למייל שלך עם כל פרטי החישוב</p>

            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="שם מלא" value={name}
                onChange={e => setName(e.target.value)}
                className="input-dark rounded-xl py-2.5 px-3 text-sm" />
              <input type="tel" placeholder="מס׳ פלאפון" value={phone}
                onChange={e => setPhone(e.target.value)}
                className="input-dark rounded-xl py-2.5 px-3 text-sm" />
            </div>
            <input type="email" placeholder="your@email.com" value={email}
              onChange={e => { setEmail(e.target.value); setSendStatus('idle'); }}
              className="input-dark w-full rounded-xl py-2.5 px-3 text-sm" />

            <button onClick={handleSendEmail} disabled={!email || sending}
              className={cn(
                'w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-40',
                sendStatus === 'success' ? 'bg-emerald-100 text-emerald-700' :
                sendStatus === 'error'   ? 'bg-red-100 text-red-700' : 'btn-gold'
              )}>
              {sending ? <Loader2 size={14} className="animate-spin" /> :
               sendStatus === 'success' ? '✓ נשלח!' :
               sendStatus === 'error'   ? '✗ שגיאה' :
               <><Send size={14} /> שלח למייל</>}
            </button>
          </div>

          {/* CTA */}
          <div className="card-premium rounded-2xl p-6 text-center">
            <div className="text-[#1A2C3D] font-bold text-lg mb-1">רוצה לבדוק אפשרויות ריאליות?</div>
            <div className="text-[#4D6E88] text-sm mb-4">
              ליאור נגר, יועץ משכנתאות מוסמך — ייעוץ ראשוני חינם
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href={whatsappUrl(mainWaMsg)} target="_blank" rel="noopener noreferrer"
                className="btn-gold px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
                <MessageCircle size={16} />
                שלח ב-WhatsApp
              </a>
              <a href="tel:+972525076504"
                className="btn-outline-gold px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2">
                <Phone size={16} />
                התקשר
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Hidden PDF report (captured by html2canvas) ── */}
      {results && (
        <div ref={reportRef} style={{
          position: 'fixed', left: '-9999px', top: 0,
          width: '794px', backgroundColor: '#ffffff',
          fontFamily: 'Arial, Helvetica, sans-serif',
          direction: 'rtl', color: '#1A2C3D',
        }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #1A2C3D 0%, #2A4560 100%)', padding: '32px', textAlign: 'center' }}>
            <div style={{ color: '#C9A84C', fontSize: '28px', fontWeight: 900, marginBottom: '4px' }}>איתנות פיננסית</div>
            <div style={{ color: '#BDD8EE', fontSize: '14px' }}>דוח חישוב משכנתא</div>
          </div>

          <div style={{ padding: '32px' }}>
            {/* Client info */}
            <div style={{ display: 'flex', gap: '32px', marginBottom: '16px' }}>
              {name  && <div style={{ fontSize: '15px' }}><strong>שם:</strong> {name}</div>}
              {phone && <div style={{ fontSize: '15px' }}><strong>טלפון:</strong> {phone}</div>}
              <div style={{ fontSize: '14px', color: '#4D6E88', marginRight: 'auto' }}>
                {new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {/* Calc details */}
            <div style={{ background: '#F4FAFE', border: '1px solid #BDD8EE', borderRadius: '8px', padding: '14px', marginBottom: '24px', fontSize: '14px', color: '#4D6E88', lineHeight: 1.7 }}>
              <strong style={{ color: '#1A2C3D' }}>פרטי החישוב: </strong>
              {PROP_TYPES.find(p => p.id === propType)?.label} &bull; {FIELDS.find(f => f.id === field)?.label}: {rawValue} ₪ &bull; {loanYears} שנה &bull; ריבית {ASSUMED_RATE}%
            </div>

            {/* Results grid */}
            <div style={{ display: 'grid', gridTemplateColumns: results.length === 3 ? 'repeat(3,1fr)' : 'repeat(2,1fr)', gap: '14px', marginBottom: '24px' }}>
              {results.map((card, ri) => {
                const palettes: Record<string, { bg: string; border: string; text: string }> = {
                  gold:   { bg: '#fffbf0', border: '#C9A84C', text: '#A07C28' },
                  blue:   { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8' },
                  green:  { bg: '#f0fdf4', border: '#86efac', text: '#15803d' },
                  purple: { bg: '#faf5ff', border: '#d8b4fe', text: '#7e22ce' },
                  sky:    { bg: '#f0f9ff', border: '#7dd3fc', text: '#0369a1' },
                };
                const c = palettes[card.color] ?? palettes.blue;
                return (
                  <div key={`pdf-${card.label}-${ri}`} style={{ background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: c.text, marginBottom: '4px' }}>{formatCurrency(card.value)}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A2C3D' }}>{card.label}</div>
                    {card.note && <div style={{ fontSize: '12px', color: '#4D6E88', marginTop: '2px' }}>{card.note}</div>}
                  </div>
                );
              })}
            </div>

            {/* Disclaimer */}
            <div style={{ background: '#fffbf0', border: '1px solid rgba(201,168,76,0.4)', borderRadius: '8px', padding: '12px', marginBottom: '24px' }}>
              <div style={{ color: '#A07C28', fontSize: '12px' }}>⚠️ החישוב מבוסס על הנחות ממוצעות בהתאם לרגולציית בנק ישראל. לייעוץ מדויק ואישי פנה לליאור נגר.</div>
            </div>

            {/* Footer */}
            <div style={{ background: '#1A2C3D', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
              <div style={{ color: '#C9A84C', fontWeight: 'bold', fontSize: '16px', marginBottom: '6px' }}>ליאור נגר | יועץ משכנתאות מוסמך</div>
              <div style={{ color: '#BDD8EE', fontSize: '13px' }}>📱 052-5076504 &nbsp;|&nbsp; ✉️ eitanut.finance@gmail.com</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
