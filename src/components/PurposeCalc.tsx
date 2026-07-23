'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, MessageCircle, Phone, Mail, Key, Percent, Wallet, AlertTriangle, Lightbulb, Check, Loader2 } from 'lucide-react';
import { cn, formatCurrency, whatsappUrl } from '@/lib/utils';
import AnimatedCurrency from './AnimatedCurrency';

function calcMonthlyPayment(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
}

type Grade   = 'first' | 'second';
type Funder  = 'bank' | 'nonBank';
type Purpose = 'general' | 'renovation';
type PStep   = 'details' | 'term' | 'input';

const LOAN_YEARS = [10, 15, 20, 25, 30];

const RATES: Record<Funder, number> = { bank: 6.5, nonBank: 9.0 };

interface Track { label: string; sub: string; pmt: number; note?: string; color: 'gold' | 'blue' | 'purple' }

const COLOR = {
  gold:   { text: 'text-[#A07C28]',  bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-[#A07C28]' },
  blue:   { text: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700' },
  purple: { text: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
} as const;

export default function PurposeCalc() {
  const [pStep,   setPStep]   = useState<PStep>('details');
  const [grade,   setGrade]   = useState<Grade>('first');
  const [funder,  setFunder]  = useState<Funder>('bank');
  const [purpose, setPurpose] = useState<Purpose>('general');
  const [years,   setYears]   = useState<number>(20);
  const [loanAmt, setLoanAmt] = useState('500,000');
  const [propVal, setPropVal] = useState('');
  const [sliderVal, setSliderVal] = useState<number>(500_000);
  const [results,   setResults]   = useState<null | { tracks: Track[]; income: number; ltv: number | null; loanNum: number }>(null);
  const [name,      setName]      = useState('');
  const [phone,     setPhone]     = useState('');
  const [email,     setEmail]     = useState('');
  const [leadError,    setLeadError]    = useState('');
  const [sending,      setSending]      = useState(false);
  const [sendStatus,   setSendStatus]   = useState<'idle' | 'success' | 'error'>('idle');

  const fmt = (v: string) => v.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const MIN = 150_000; const MAX = 10_000_000; const STEP = 50_000;
  const sliderPct = Math.max(0, Math.min(100, Math.round(((sliderVal - MIN) / (MAX - MIN)) * 100)));

  const handleBack = () => {
    if (pStep === 'input') setPStep('term');
    else if (pStep === 'term') setPStep('details');
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setSliderVal(v);
    setLoanAmt(fmt(String(v)));
  };

  const handleLoanInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[^0-9]/g, '');
    setLoanAmt(fmt(clean));
    const num = parseInt(clean, 10);
    if (!isNaN(num)) setSliderVal(Math.min(MAX, Math.max(MIN, num)));
  };

  const calculate = () => {
    const L = parseFloat(loanAmt.replace(/,/g, ''));
    if (!L) return;
    const pv  = parseFloat(propVal.replace(/,/g, '')) || null;
    const rate = RATES[funder];
    const r    = rate / 100 / 12;

    const pmtSpitzer    = calcMonthlyPayment(L, rate, years);
    const pmtGraceFirst = L * r;
    const pmtGracePost  = years > 1 ? calcMonthlyPayment(L, rate, years - 1) : pmtSpitzer;
    const pmtBalloon    = L * r;

    const tracks: Track[] = [
      {
        label: 'שפיצר',
        sub: 'החזר קבוע לכל התקופה',
        pmt: pmtSpitzer,
        color: 'gold',
      },
      {
        label: 'גרייס',
        sub: 'ריבית בלבד שנה ראשונה',
        pmt: pmtGraceFirst,
        note: `לאחר שנה: ${formatCurrency(pmtGracePost)}/חודש`,
        color: 'blue',
      },
      {
        label: 'בלון מלא',
        sub: 'ריבית בלבד לאורך כל התקופה',
        pmt: pmtBalloon,
        note: `תשלום סיום: ${formatCurrency(L)}`,
        color: 'purple',
      },
    ];

    setResults({ tracks, income: pmtSpitzer / 0.40, ltv: pv ? Math.round(L / pv * 100) : null, loanNum: L });
    setSendStatus('idle');
    setTimeout(() => {
      document.getElementById('purpose-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const buildSummary = () => {
    if (!results) return '';
    const gradeLabel   = grade === 'first' ? 'דרגה ראשונה' : 'דרגה שניה';
    const funderLabel  = funder === 'bank'  ? 'בנקאי'       : 'חוץ בנקאי';
    const purposeLabel = purpose === 'general' ? 'כל מטרה' : 'שיפוצים';
    return (
      `סכום הלוואה: ${formatCurrency(results.loanNum)}\n` +
      `פרטים: ${purposeLabel} • ${funderLabel} • ${gradeLabel} • ${years} שנה • ריבית ${rate}%\n` +
      (results.ltv ? `אחוז מימון (LTV): ${results.ltv}%\n` : '') +
      `\nהשוואת מסלולים:\n` +
      results.tracks.map(t => `• ${t.label}: ${formatCurrency(t.pmt)}/חודש`).join('\n') +
      `\n\nהכנסה פנויה נדרשת (שפיצר): ${formatCurrency(results.income)}`
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
        body: JSON.stringify({ name, phone, email, summary: buildSummary(), toolName: 'הלוואה לכל מטרה' }),
      });
      setSendStatus(res.ok ? 'success' : 'error');
    } catch {
      setSendStatus('error');
    } finally {
      setSending(false);
    }
  };

  const stepNum = pStep === 'details' ? 1 : pStep === 'term' ? 2 : 3;
  const rate = RATES[funder];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Progress */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map(n => (
          <div key={n} className={cn(
            'h-1.5 rounded-full transition-all duration-400',
            n < stepNum   ? 'w-8 bg-[#C9A84C]' :
            n === stepNum ? 'w-12 bg-[#C9A84C]' : 'w-8 bg-[#BDD8EE]'
          )} />
        ))}
      </div>

      {/* Back */}
      {pStep !== 'details' && (
        <button onClick={handleBack}
          className="flex items-center gap-1 text-sm text-[#4D6E88] hover:text-[#1A2C3D] transition-colors">
          <ChevronRight size={15} />חזרה
        </button>
      )}

      {/* ── Step 1: details ── */}
      {pStep === 'details' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p className="text-center text-[#4D6E88] text-xs mb-1">שלב 1 מתוך 3</p>
          <h3 className="text-center text-2xl font-bold text-[#1A2C3D] mb-8">סוג ומסלול</h3>

          {/* Grade */}
          <div className="mb-6">
            <p className="text-[#4D6E88] text-xs font-semibold mb-3 text-center">דרגת המשכנתא</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'first'  as Grade, label: 'דרגה ראשונה', desc: 'עד 50% משווי הנכס' },
                { id: 'second' as Grade, label: 'דרגה שניה',   desc: 'חוץ בנקאי בלבד' },
              ]).map(g => (
                <button key={g.id} onClick={() => setGrade(g.id)}
                  className={cn(
                    'rounded-2xl p-4 text-center transition-all duration-200',
                    grade === g.id
                      ? 'btn-gold shadow-gold'
                      : 'card-premium text-[#1A2C3D] hover:border-[#C9A84C]'
                  )}>
                  <div className="font-bold text-sm">{g.label}</div>
                  <div className={cn('text-xs mt-0.5', grade === g.id ? 'opacity-80' : 'text-[#4D6E88]')}>{g.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Funder */}
          <div className="mb-6">
            <p className="text-[#4D6E88] text-xs font-semibold mb-3 text-center">גורם מממן</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'bank'    as Funder, label: 'בנקאי',      desc: `ריבית ~${RATES.bank}%` },
                { id: 'nonBank' as Funder, label: 'חוץ בנקאי',  desc: `ריבית ~${RATES.nonBank}%` },
              ]).map(f => (
                <button key={f.id} onClick={() => setFunder(f.id)}
                  className={cn(
                    'rounded-2xl p-4 text-center transition-all duration-200',
                    funder === f.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'card-premium text-[#1A2C3D] hover:border-blue-400'
                  )}>
                  <div className="font-bold text-sm">{f.label}</div>
                  <div className={cn('text-xs mt-0.5', funder === f.id ? 'opacity-80' : 'text-[#4D6E88]')}>{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Purpose */}
          <div className="mb-8">
            <p className="text-[#4D6E88] text-xs font-semibold mb-3 text-center">מטרת ההלוואה</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { id: 'general'    as Purpose, label: 'כל מטרה',  desc: 'נזילות, השקעה ועוד' },
                { id: 'renovation' as Purpose, label: 'שיפוצים',   desc: 'שיפוץ הנכס הקיים' },
              ]).map(p => (
                <button key={p.id} onClick={() => setPurpose(p.id)}
                  className={cn(
                    'rounded-2xl p-4 text-center transition-all duration-200',
                    purpose === p.id
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'card-premium text-[#1A2C3D] hover:border-emerald-400'
                  )}>
                  <div className="font-bold text-sm">{p.label}</div>
                  <div className={cn('text-xs mt-0.5', purpose === p.id ? 'opacity-80' : 'text-[#4D6E88]')}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setPStep('term')}
            className="btn-gold w-full py-4 rounded-2xl font-bold text-lg">
            המשך
          </button>
        </motion.div>
      )}

      {/* ── Step 2: Term ── */}
      {pStep === 'term' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p className="text-center text-[#4D6E88] text-xs mb-1">שלב 2 מתוך 3</p>
          <h3 className="text-center text-2xl font-bold text-[#1A2C3D] mb-2">תקופת ההלוואה</h3>
          <p className="text-center text-[#4D6E88] text-sm mb-8">כמה שנים תרצו להחזיר?</p>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {LOAN_YEARS.map(y => (
              <button key={y} onClick={() => { setYears(y); setPStep('input'); }}
                className={cn(
                  'w-[88px] py-5 rounded-2xl font-bold text-xl transition-all duration-200',
                  years === y
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
            {Math.round(calcMonthlyPayment(100_000, rate, years))} ₪ לכל 100,000 ₪ &bull; ריבית משוערת {rate}%
          </div>
        </motion.div>
      )}

      {/* ── Step 3: Amount + property ── */}
      {pStep === 'input' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <p className="text-center text-[#4D6E88] text-xs mb-1">שלב 3 מתוך 3</p>
          <h3 className="text-center text-2xl font-bold text-[#1A2C3D] mb-1">סכום ההלוואה המבוקש</h3>
          <p className="text-center text-[#4D6E88] text-sm mb-6">150K – 10M ₪</p>

          {/* Loan amount */}
          <div className="relative mb-4">
            <span className="absolute inset-y-0 right-5 flex items-center text-[#C9A84C] font-bold text-2xl pointer-events-none">₪</span>
            <input type="text" inputMode="numeric"
              value={loanAmt} onChange={handleLoanInput}
              placeholder="500,000" autoFocus
              className="input-dark w-full rounded-2xl py-5 pr-14 pl-5 text-2xl font-bold text-center tracking-wide" />
          </div>

          <div className="px-1 mb-6">
            <input type="range" min={MIN} max={MAX} step={STEP}
              value={sliderVal || MIN} onChange={handleSlider}
              className="range-track w-full"
              style={{ background: `linear-gradient(to left, #C9A84C ${sliderPct}%, #BDD8EE ${sliderPct}%)` }} />
            <div className="flex justify-between text-xs text-[#4D6E88] mt-1.5 px-0.5">
              <span>{formatCurrency(MIN)}</span>
              <span>{formatCurrency(MAX)}</span>
            </div>
          </div>

          {/* Property value (optional) */}
          <div className="mb-6">
            <label className="text-[#4D6E88] text-xs font-semibold mb-2 block">
              שווי הנכס <span className="font-normal">(אופציונלי — לחישוב LTV)</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 right-4 flex items-center text-[#C9A84C] font-bold pointer-events-none">₪</span>
              <input type="text" inputMode="numeric"
                value={propVal}
                onChange={e => setPropVal(fmt(e.target.value.replace(/[^0-9]/g, '')))}
                placeholder="2,000,000"
                className="input-dark w-full rounded-xl py-3 pr-10 pl-4 text-sm" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 glass-gold rounded-xl px-4 py-2.5 mb-6 text-center text-xs text-[#4D6E88]">
            <Lightbulb size={13} className="shrink-0" />
            ריבית משוערת {rate}% &bull; {years} שנה &bull; {funder === 'bank' ? 'בנקאי' : 'חוץ בנקאי'}
          </div>

          <button onClick={calculate} disabled={!loanAmt}
            className="btn-gold w-full py-4 rounded-2xl font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed">
            חשב הלוואה
          </button>
        </motion.div>
      )}

      {/* ── Results ── */}
      {results && (
        <motion.div id="purpose-results"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-6 border-t border-[#BDD8EE]">

          {/* Header */}
          <h4 className="text-center text-lg font-bold text-[#1A2C3D]">תוצאות החישוב</h4>
          <p className="text-center text-xs text-[#4D6E88]">
            {purpose === 'general' ? 'כל מטרה' : 'שיפוצים'} &bull;{' '}
            {funder === 'bank' ? 'בנקאי' : 'חוץ בנקאי'} &bull;{' '}
            {grade === 'first' ? 'דרגה ראשונה' : 'דרגה שניה'} &bull;{' '}
            {years} שנה &bull; ריבית {rate}%
          </p>

          {/* Loan amount summary */}
          <div className="card-premium rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#4D6E88] mb-1"><Key size={13} />סכום הלוואה</div>
              <div className="text-2xl font-black text-[#1A2C3D]">
                <AnimatedCurrency value={results.loanNum} duration={0.8} />
              </div>
            </div>
            {results.ltv !== null && (
              <div className="text-center">
                <div className="flex items-center gap-1.5 text-xs text-[#4D6E88] mb-1"><Percent size={13} />LTV</div>
                <div className={cn(
                  'text-2xl font-black',
                  results.ltv > 50 ? 'text-red-600' : 'text-emerald-600'
                )}>{results.ltv}%</div>
              </div>
            )}
          </div>

          {/* 3 tracks */}
          <div>
            <h5 className="text-center text-sm font-bold text-[#1A2C3D] mb-3">השוואת מסלולים</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {results.tracks.map((track, i) => {
                const c = COLOR[track.color];
                return (
                  <motion.div key={track.label}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    className={cn('rounded-2xl p-5 border', c.bg, c.border)}>
                    <div className={cn('inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-3', c.badge)}>
                      {track.label}
                    </div>
                    <div className="text-xs text-[#4D6E88] mb-2 leading-snug">{track.sub}</div>
                    <div className={cn('text-2xl font-black mb-0.5', c.text)}>
                      <AnimatedCurrency value={track.pmt} duration={1.2 + i * 0.08} />
                    </div>
                    <div className="text-xs text-[#4D6E88]">לחודש</div>
                    {track.note && (
                      <div className="mt-2 text-xs text-[#4D6E88] bg-white/70 rounded-lg px-2 py-1">{track.note}</div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Income */}
          <div className="card-premium rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#4D6E88] mb-1"><Wallet size={13} />הכנסה פנויה נדרשת</div>
              <div className="text-2xl font-black text-purple-700">
                <AnimatedCurrency value={results.income} duration={1.4} />
              </div>
            </div>
            <div className="text-xs text-[#4D6E88] text-left">החזר ÷ 40%<br/>(PTI בנקאי)</div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>החישוב מבוסס על ריביות משוערות בלבד. הריבית בפועל משתנה בהתאם לתיק האישי, גורם המימון ותנאי השוק.</span>
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
            <div className="flex flex-wrap gap-3 justify-center">
              <a href={whatsappUrl(`היי ליאור, חישבתי הלוואה לכל מטרה של ${formatCurrency(results.loanNum)} ואשמח לדון בכך.`)}
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
