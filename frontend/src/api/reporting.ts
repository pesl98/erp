import client from './client';

export const getDashboardKpis = () =>
  client.get('/dashboard/kpis').then((r) => r.data);

export const getRecentActivity = (limit = 20) =>
  client.get('/dashboard/recent-activity', { params: { limit } }).then((r) => r.data);

export const getStockSummary = () =>
  client.get('/reports/stock-summary').then((r) => r.data);

export const getPurchaseHistory = (days = 90) =>
  client.get('/reports/purchase-history', { params: { days } }).then((r) => r.data);

export const getVendorPerformance = () =>
  client.get('/reports/vendor-performance').then((r) => r.data);
