import client from './client';
import type { AggregatedStock, ReorderAlert, StockAdjustmentCreate, StockMovement, StockTransferCreate } from '../types/inventory';
import type { PaginatedResponse } from '../types/common';

export const getStockLevels = (params?: Record<string, string | number | undefined>): Promise<PaginatedResponse<AggregatedStock>> =>
  client.get('/inventory/stock-levels', { params }).then((r) => r.data);

export const getStockByLocation = (productId?: string) =>
  client.get('/inventory/stock-levels/by-location', { params: { product_id: productId } }).then((r) => r.data);

export const getProductStock = (productId: string) =>
  client.get(`/inventory/stock-levels/product/${productId}`).then((r) => r.data);

export const getStockValuation = () =>
  client.get('/inventory/valuation').then((r) => r.data);

export const getReorderAlerts = (): Promise<ReorderAlert[]> =>
  client.get('/inventory/reorder-alerts').then((r) => r.data);

export const createAdjustment = (data: StockAdjustmentCreate) =>
  client.post('/inventory/adjustments', data).then((r) => r.data);

export const getAdjustments = (params?: Record<string, string | number | undefined>) =>
  client.get('/inventory/adjustments', { params }).then((r) => r.data);

export const getMovements = (params?: Record<string, string | number | undefined>): Promise<PaginatedResponse<StockMovement>> =>
  client.get('/inventory/movements', { params }).then((r) => r.data);

export const createTransfer = (data: StockTransferCreate) =>
  client.post('/inventory/transfers', data).then((r) => r.data);
