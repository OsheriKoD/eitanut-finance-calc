'use client';

import { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '@/lib/utils';

interface Props {
  value: number;
  duration?: number;
  className?: string;
}

export default function AnimatedCurrency({ value, duration = 1.4, className }: Props) {
  const [display, setDisplay] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const steps = 40;
    const ms = (duration * 1000) / steps;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    let step = 0;
    const tick = () => {
      step++;
      const t = Math.min(step / steps, 1);
      setDisplay(Math.round(value * ease(t)));
      if (t < 1) timerRef.current = setTimeout(tick, ms);
    };
    timerRef.current = setTimeout(tick, ms);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value, duration]);

  return <span className={className}>{formatCurrency(display)}</span>;
}
