import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, getCategories, deleteProduct } from '../api/products';
import { message } from 'antd';

export function useProducts(params: any) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
    placeholderData: (previousData) => previousData,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      message.success('Product deactivated');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => {
      message.error('Failed to deactivate product');
    }
  });
}
