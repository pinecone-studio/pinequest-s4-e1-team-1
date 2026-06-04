import { TaskPriority } from '../api';

export type Tab = 'today' | 'upcoming' | 'completed';

export const TABS: { key: Tab; label: string }[] = [
  { key: 'today',     label: 'Өнөөдөр' },
  { key: 'upcoming',  label: 'Удахгүй'  },
  { key: 'completed', label: 'Дууссан'  },
];

export const PRIO_COLOR: Record<TaskPriority, string> = {
  high:   '#EF4444',
  medium: '#F59E0B',
  low:    '#22C55E',
};

export const PRIO_LABEL: Record<TaskPriority, string> = {
  high: 'Өндөр', medium: 'Дунд', low: 'Бага',
};

export const CATEGORY_PALETTE: Record<string, { bg: string; text: string }> = {
  'Ажил':    { bg: '#EFF6FF', text: '#2563EB' },
  'Хувийн':  { bg: '#F0FDF4', text: '#16A34A' },
  'Сурлага': { bg: '#FFFBEB', text: '#D97706' },
};

export const FALLBACK_CAT = { bg: '#F3F4F6', text: '#6B7280' };

export const TODAY = new Date().toISOString().split('T')[0];
