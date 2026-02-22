import client from './client';
import type { Product, ProductCreate, ProductCategory } from '../types/product';
import type { PaginatedResponse } from '../types/common';

export const getProducts = (params?: Record<string, string | number | undefined>): Promise<PaginatedResponse<Product>> =>
  client.get('/products', { params }).then((r) => r.data);

export const getProduct = (id: string): Promise<Product> =>
  client.get(`/products/${id}`).then((r) => r.data);

export const createProduct = (data: ProductCreate): Promise<Product> =>
  client.post('/products', data).then((r) => r.data);

export const updateProduct = (id: string, data: Partial<ProductCreate>): Promise<Product> =>
  client.put(`/products/${id}`, data).then((r) => r.data);

export const deleteProduct = (id: string): Promise<Product> =>
  client.delete(`/products/${id}`).then((r) => r.data);

export const getCategories = (): Promise<ProductCategory[]> =>
  client.get('/product-categories').then((r) => r.data);

export const createCategory = (data: { name: string; parent_id?: string }): Promise<ProductCategory> =>
  client.post('/product-categories', data).then((r) => r.data);

export const updateCategory = (id: string, data: { name?: string }): Promise<ProductCategory> =>
  client.put(`/product-categories/${id}`, data).then((r) => r.data);

export const deleteCategory = (id: string): Promise<void> =>
  client.delete(`/product-categories/${id}`);
