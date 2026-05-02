import type { SpendingCategory } from '../data/types';

export const formatCurrency = (amount: number, currency = 'NZD') =>
  new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);

export const formatCategory = (category?: SpendingCategory) => {
  if (!category) return 'Uncategorised';

  return category
    .split('_')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
};

export const formatRelativeTime = (isoTimestamp: string) => {
  const date = new Date(isoTimestamp);
  const now = new Date('2026-05-02T12:00:00.000Z');
  const minutes = Math.max(1, Math.round((now.getTime() - date.getTime()) / 60000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

export const shortDate = (isoDate: string) =>
  new Intl.DateTimeFormat('en-NZ', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${isoDate}T00:00:00.000Z`));
