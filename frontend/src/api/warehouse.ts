import client from './client';
import type { Warehouse, WarehouseCreate } from '../types/warehouse';

export const getWarehouses = (): Promise<Warehouse[]> =>
  client.get('/warehouses').then((r) => r.data);

export const getWarehouse = (id: string): Promise<Warehouse> =>
  client.get(`/warehouses/${id}`).then((r) => r.data);

export const createWarehouse = (data: WarehouseCreate): Promise<Warehouse> =>
  client.post('/warehouses', data).then((r) => r.data);

export const updateWarehouse = (id: string, data: Partial<WarehouseCreate>): Promise<Warehouse> =>
  client.put(`/warehouses/${id}`, data).then((r) => r.data);

export const createZone = (warehouseId: string, data: { code: string; name: string; zone_type?: string }) =>
  client.post(`/warehouses/${warehouseId}/zones`, data).then((r) => r.data);

export const updateZone = (zoneId: string, data: { name?: string; zone_type?: string }) =>
  client.put(`/zones/${zoneId}`, data).then((r) => r.data);

export const deleteZone = (zoneId: string): Promise<void> =>
  client.delete(`/zones/${zoneId}`);

export const createLocation = (zoneId: string, data: { code: string; label?: string; max_capacity?: number }) =>
  client.post(`/zones/${zoneId}/locations`, data).then((r) => r.data);

export const updateLocation = (locationId: string, data: any) =>
  client.put(`/locations/${locationId}`, data).then((r) => r.data);

export const deleteLocation = (locationId: string): Promise<void> =>
  client.delete(`/locations/${locationId}`);
