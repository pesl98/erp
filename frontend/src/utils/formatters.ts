import dayjs from 'dayjs';

/** Safely extracts a human-readable string from an Axios/API error.
 *  Handles Pydantic v2 validation error arrays, plain string details, and unknown shapes. */
export const extractErrorMessage = (err: unknown, fallback = 'An error occurred'): string => {
  const detail = (err as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: unknown) => {
        if (typeof d === 'string') return d;
        if (d !== null && typeof d === 'object' && 'msg' in d)
          return String((d as Record<string, unknown>).msg);
        return String(d);
      })
      .join(', ');
  }
  if (detail != null) return String(detail);
  return fallback;
};

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
