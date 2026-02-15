import client from './client';
import type { Vendor, VendorCreate } from '../types/vendor';
import type { PaginatedResponse } from '../types/common';

export const getVendors = (params?: Record<string, any>): Promise<PaginatedResponse<Vendor>> =>
  client.get('/vendors', { params }).then((r) => r.data);

export const getVendor = (id: string): Promise<Vendor> =>
  client.get(`/vendors/${id}`).then((r) => r.data);

export const createVendor = (data: VendorCreate): Promise<Vendor> =>
  client.post('/vendors', data).then((r) => r.data);

export const updateVendor = (id: string, data: Partial<VendorCreate>): Promise<Vendor> =>
  client.put(`/vendors/${id}`, data).then((r) => r.data);

export const deleteVendor = (id: string): Promise<Vendor> =>
  client.delete(`/vendors/${id}`).then((r) => r.data);

export const getVendorProducts = (vendorId: string) =>
  client.get(`/vendors/${vendorId}/products`).then((r) => r.data);

export const linkProductToVendor = (vendorId: string, data: any) =>
  client.post(`/vendors/${vendorId}/products`, data).then((r) => r.data);
