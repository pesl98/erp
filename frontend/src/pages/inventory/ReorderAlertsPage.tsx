import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { getReorderAlerts } from '../../api/inventory';
import type { ReorderAlert } from '../../types/inventory';

const ReorderAlertsPage: React.FC = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReorderAlerts().then(setAlerts).catch(() => message.error('Failed')).finally(() => setLoading(false));
  }, []);

  const columns = [
    { title: 'SKU', dataIndex: 'product_sku', key: 'sku' },
    { title: 'Product', dataIndex: 'product_name', key: 'name' },
    { title: 'On Hand', dataIndex: 'total_on_hand', key: 'on_hand' },
    { title: 'Reorder Point', dataIndex: 'reorder_point', key: 'rp' },
    { title: 'Reorder Qty', dataIndex: 'reorder_quantity', key: 'rq' },
    { title: 'Deficit', dataIndex: 'deficit', key: 'deficit', render: (v: number) => <Tag color="red">-{v}</Tag> },
    {
      title: 'Action', key: 'action',
      render: () => <Button size="small" type="primary" onClick={() => navigate('/purchase-orders/new')}>Create PO</Button>,
    },
  ];

  return (
    <div>
      <PageHeader title="Reorder Alerts" />
      {loading ? <Spin /> : (
        <Table columns={columns} dataSource={alerts} rowKey="product_id" pagination={{ pageSize: 50 }} />
      )}
    </div>
  );
};

export default ReorderAlertsPage;
