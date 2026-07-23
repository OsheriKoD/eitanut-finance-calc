'use client';
import { useId } from 'react';

interface Props {
  min: number; max: number; step: number;
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
}

export default function RangeSlider({ min, max, step, value, onChange, className = '' }: Props) {
  const id = useId();
  const pct = ((parseFloat(String(value)) - min) / (max - min)) * 100;
  return (
    <div className={`relative w-full py-1 ${className}`} dir="ltr">
      <input
        id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="range-track w-full"
        style={{ background: `linear-gradient(to right, #C9A84C 0%, #E8C97A ${pct}%, rgba(201,168,76,0.18) ${pct}%, rgba(201,168,76,0.18) 100%)` }}
      />
    </div>
  );
}
