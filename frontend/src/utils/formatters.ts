import dayjs from 'dayjs';

export const formatCurrency = (value: number | null | undefined): string => {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const formatNumber = (value: number | null | undefined): string => {
  if (value == null) return '-';
  return new Intl.NumberFormat('en-US').format(value);
};
