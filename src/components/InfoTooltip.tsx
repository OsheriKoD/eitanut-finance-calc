'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function InfoTooltip({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition(rect.top < 160 ? 'bottom' : 'top');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Field description"
        className="flex items-center justify-center w-4 h-4 rounded-full text-gold/60 hover:text-gold transition-colors"
      >
        <Info size={13} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: position === 'top' ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: position === 'top' ? 6 : -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute z-50 w-64 rounded-xl p-3.5 text-xs leading-relaxed pointer-events-none',
              'bg-white border border-[rgba(201,168,76,0.3)] shadow-lg text-stone-600',
              'left-1/2 -translate-x-1/2',
              position === 'top' ? 'bottom-full mb-2.5' : 'top-full mt-2.5',
            )}
            style={{ backdropFilter: 'blur(12px)' }}
          >
            <span
              className={cn(
                'absolute left-1/2 -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent',
                position === 'top' ? 'top-full border-t-[6px] border-t-white' : 'bottom-full border-b-[6px] border-b-white',
              )}
            />
            <span className="block h-px w-8 bg-gradient-to-r from-transparent via-gold to-transparent rounded mb-2 opacity-70" />
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
