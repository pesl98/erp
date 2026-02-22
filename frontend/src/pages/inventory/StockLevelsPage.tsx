import React, { useEffect, useState, useCallback } from 'react';
import { Table, Input, Tag, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import PageHeader from '../../components/PageHeader';
import { getStockLevels } from '../../api/inventory';
import type { AggregatedStock } from '../../types/inventory';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const StockLevelsPage: React.FC = () => {
  const [items, setItems] = useState<AggregatedStock[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStockLevels({ skip: (page - 1) * pageSize, limit: pageSize, search: search || undefined });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      message.error('Failed to load stock levels');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { title: 'SKU', dataIndex: 'product_sku', key: 'sku', width: 120 },
    { title: 'Product', dataIndex: 'product_name', key: 'name' },
    { title: 'On Hand', dataIndex: 'total_on_hand', key: 'on_hand', render: formatNumber },
    { title: 'Reserved', dataIndex: 'total_reserved', key: 'reserved', render: formatNumber },
    { title: 'Available', dataIndex: 'total_available', key: 'available', render: formatNumber },
    {
      title: 'Status', key: 'status',
      render: (_: unknown, r: AggregatedStock) => {
        const isLow = r.reorder_point > 0 && r.total_on_hand < r.reorder_point;
        return isLow
          ? <Tag color="red">Low Stock</Tag>
          : <Tag color="green">OK</Tag>;
      },
    },
    { title: 'Reorder Point', dataIndex: 'reorder_point', key: 'rp' },
    { title: 'Stock Value', dataIndex: 'stock_value', key: 'value', render: (v: number | null) => v != null ? formatCurrency(v) : '-' },
  ];

  return (
    <div>
      <PageHeader title="Stock Levels" />
      <Input
        placeholder="Search by name or SKU"
        aria-label="Search stock levels"
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onPressEnter={() => { setPage(1); }}
        style={{ width: 300, marginBottom: 16 }}
        allowClear
      />
      <Table columns={columns} dataSource={items} rowKey="product_id" loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage, showTotal: (t) => `${t} products` }}
      />
    </div>
  );
};

export default StockLevelsPage;
