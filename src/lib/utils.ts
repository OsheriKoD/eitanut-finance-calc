import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  if (!isFinite(value) || isNaN(value)) return '₪0';
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(value);
}

export const PHONE = '+972525076504';
export const EMAIL = 'eitanut.finance@gmail.com';
export const WA_MSG = 'היי ליאור, אשמח לקבל מידע נוסף על משכנתא.';

export function whatsappUrl(msg = WA_MSG): string {
  return `https://wa.me/${PHONE.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
}
