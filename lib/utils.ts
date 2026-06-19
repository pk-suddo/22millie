import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'NPR'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NPR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

export function formatCompact(amount: number, currency = 'NPR'): string {
  if (amount >= 1_000_000) return `${currency} ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 100_000) return `${currency} ${(amount / 1_000).toFixed(0)}K`;
  if (amount >= 1_000) return `${currency} ${(amount / 1_000).toFixed(1)}K`;
  return formatCurrency(amount, currency);
}

export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateShort(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function getMonthShort(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: '2-digit',
  });
}

export function monthsUntil(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate);
  return Math.max(0, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
}

export function monthlySavingsNeeded(targetAmount: number, currentSaved: number, targetDate: string): number {
  const months = monthsUntil(targetDate);
  if (months <= 0) return 0;
  return Math.ceil((targetAmount - currentSaved) / months);
}

export const EXPENSE_CATEGORIES = [
  { label: 'Food & Dining', value: 'Food', icon: '🍜' },
  { label: 'Transport', value: 'Transport', icon: '🚌' },
  { label: 'Rent & Housing', value: 'Rent', icon: '🏠' },
  { label: 'Subscriptions', value: 'Subscriptions', icon: '📱' },
  { label: 'Entertainment', value: 'Entertainment', icon: '🎬' },
  { label: 'Health & Wellness', value: 'Health', icon: '💊' },
  { label: 'Shopping', value: 'Shopping', icon: '🛍️' },
  { label: 'Education', value: 'Education', icon: '📚' },
  { label: 'Utilities', value: 'Utilities', icon: '💡' },
  { label: 'Travel', value: 'Travel', icon: '✈️' },
  { label: 'Gifts', value: 'Gifts', icon: '🎁' },
  { label: 'Other', value: 'Other', icon: '📦' },
];

export const INCOME_SOURCES = [
  'Primary Job', 'Freelance', 'Investments', 'Side Hustle', 'Gifts', 'Rental Income', 'Other',
];

export function getLocalToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kathmandu' });
}

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#FF6152',
  Transport: '#4A9EFF',
  Rent: '#7B61FF',
  Subscriptions: '#FFB547',
  Entertainment: '#FF79A8',
  Health: '#00C896',
  Shopping: '#FF9F47',
  Education: '#5CC8FF',
  Utilities: '#A78BFA',
  Travel: '#34D399',
  Gifts: '#F472B6',
  Other: '#9096B4',
};
