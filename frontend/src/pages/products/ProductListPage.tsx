import React, { useEffect, useState } from 'react';
import { Table, Tag, Input, Select, Button, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { useProducts, useCategories, useDeleteProduct } from '../../hooks/useProducts';
import type { Product } from '../../types/product';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ProductListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: productsData, isLoading: loading } = useProducts({
    skip: (page - 1) * pageSize,
    limit: pageSize,
    search: search || undefined,
    status,
    category_id: categoryId,
  });

  const { data: categories = [] } = useCategories();
  const deleteMutation = useDeleteProduct();

  const products = productsData?.items || [];
  const total = productsData?.total || 0;

  const handleSearch = () => { setPage(1); };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const columns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{s}</Tag>,
    },
    { title: 'Cost Price', dataIndex: 'cost_price', key: 'cost_price', width: 110, render: formatCurrency },
    { title: 'Reorder Pt', dataIndex: 'reorder_point', key: 'reorder_point', width: 100 },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', width: 110, render: formatDate },
    {
      title: 'Actions', key: 'actions', width: 150,
      render: (_: unknown, record: Product) => (
        <Space size="small">
          <a onClick={() => navigate(`/products/${record.id}/edit`)}>Edit</a>
          <Popconfirm title="Deactivate this product?" onConfirm={() => handleDelete(record.id)}>
            <a style={{ color: '#ff4d4f' }}>Deactivate</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>
            Add Product
          </Button>
        }
      />
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Search by name or SKU"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 250 }}
          allowClear
        />
        <Select
          placeholder="Status"
          allowClear
          style={{ width: 130 }}
          value={status}
          onChange={setStatus}
          options={[
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ]}
        />
        <Select
          placeholder="Category"
          allowClear
          style={{ width: 180 }}
          value={categoryId}
          onChange={setCategoryId}
          options={categories.map((c) => ({ label: c.name, value: c.id }))}
        />
      </Space>
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: setPage,
          showSizeChanger: false,
          showTotal: (t) => `${t} products`,
        }}
      />
    </div>
  );
};

export default ProductListPage;
