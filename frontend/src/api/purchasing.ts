import client from './client';
import type { PurchaseOrder, PurchaseOrderCreate, GoodsReceipt } from '../types/purchasing';
import type { PaginatedResponse } from '../types/common';

export const getPurchaseOrders = (params?: Record<string, any>): Promise<PaginatedResponse<PurchaseOrder>> =>
  client.get('/purchase-orders', { params }).then((r) => r.data);

export const getPurchaseOrder = (id: string): Promise<PurchaseOrder> =>
  client.get(`/purchase-orders/${id}`).then((r) => r.data);

export const createPurchaseOrder = (data: PurchaseOrderCreate): Promise<PurchaseOrder> =>
  client.post('/purchase-orders', data).then((r) => r.data);

export const updatePurchaseOrder = (id: string, data: any): Promise<PurchaseOrder> =>
  client.put(`/purchase-orders/${id}`, data).then((r) => r.data);

export const submitPO = (id: string): Promise<PurchaseOrder> =>
  client.post(`/purchase-orders/${id}/submit`).then((r) => r.data);

export const approvePO = (id: string): Promise<PurchaseOrder> =>
  client.post(`/purchase-orders/${id}/approve`).then((r) => r.data);

export const sendPO = (id: string): Promise<PurchaseOrder> =>
  client.post(`/purchase-orders/${id}/send`).then((r) => r.data);

export const cancelPO = (id: string): Promise<PurchaseOrder> =>
  client.post(`/purchase-orders/${id}/cancel`).then((r) => r.data);

export const receiveGoods = (poId: string, data: any): Promise<GoodsReceipt> =>
  client.post(`/purchase-orders/${poId}/receive`, data).then((r) => r.data);
