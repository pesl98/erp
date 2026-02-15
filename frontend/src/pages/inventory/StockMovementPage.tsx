import React, { useEffect, useState } from 'react';
import { Table, Tag, Select, Space, message } from 'antd';
import PageHeader from '../../components/PageHeader';
import { getMovements } from '../../api/inventory';
import type { StockMovement } from '../../types/inventory';
import { formatDateTime } from '../../utils/formatters';

const MOVEMENT_TYPE_COLORS: Record<string, string> = {
  in: 'green',
  out: 'red',
  transfer: 'blue',
  adjustment: 'orange',
};

const StockMovementPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [movementType, setMovementType] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await getMovements({ skip: (page - 1) * pageSize, limit: pageSize, movement_type: movementType });
      setMovements(res.items);
      setTotal(res.total);
    } catch { message.error('Failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, movementType]);

  const columns = [
    { title: 'Type', dataIndex: 'movement_type', key: 'type', render: (t: string) => <Tag color={MOVEMENT_TYPE_COLORS[t]}>{t}</Tag> },
    { title: 'Product', dataIndex: 'product_id', key: 'product', ellipsis: true },
    { title: 'Quantity', dataIndex: 'quantity', key: 'qty' },
    { title: 'Reference', dataIndex: 'reference_type', key: 'ref', render: (t: string | null) => t || '-' },
    { title: 'Notes', dataIndex: 'notes', key: 'notes', render: (n: string | null) => n || '-' },
    { title: 'Date', dataIndex: 'created_at', key: 'date', render: formatDateTime },
  ];

  return (
    <div>
      <PageHeader title="Stock Movements" />
      <Space style={{ marginBottom: 16 }}>
        <Select placeholder="Movement type" allowClear style={{ width: 180 }} value={movementType} onChange={(v) => { setMovementType(v); setPage(1); }}
          options={[{ label: 'In', value: 'in' }, { label: 'Out', value: 'out' }, { label: 'Transfer', value: 'transfer' }, { label: 'Adjustment', value: 'adjustment' }]}
        />
      </Space>
      <Table columns={columns} dataSource={movements} rowKey="id" loading={loading}
        pagination={{ current: page, pageSize, total, onChange: setPage, showTotal: (t) => `${t} movements` }}
      />
    </div>
  );
};

export default StockMovementPage;
