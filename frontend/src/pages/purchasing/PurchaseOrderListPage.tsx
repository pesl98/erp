import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Select, Space, message, Tabs } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { getPurchaseOrders } from '../../api/purchasing';
import type { PurchaseOrder } from '../../types/purchasing';
import { PO_STATUS_COLORS, PO_STATUS_LABELS } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PurchaseOrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPurchaseOrders({ skip: (page - 1) * pageSize, limit: pageSize, status });
      setOrders(res.items);
      setTotal(res.total);
    } catch { message.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page, status]);

  const columns = [
    { title: 'PO Number', dataIndex: 'po_number', key: 'po_number', render: (v: string, r: PurchaseOrder) => <a onClick={() => navigate(`/purchase-orders/${r.id}`)}>{v}</a> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={PO_STATUS_COLORS[s]}>{PO_STATUS_LABELS[s] || s}</Tag> },
    { title: 'Order Date', dataIndex: 'order_date', key: 'order_date', render: formatDate },
    { title: 'Expected Delivery', dataIndex: 'expected_delivery_date', key: 'expected_delivery_date', render: formatDate },
    { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal', render: formatCurrency },
    { title: 'Total', dataIndex: 'total_amount', key: 'total_amount', render: formatCurrency },
    { title: 'Items', key: 'items', render: (_: any, r: PurchaseOrder) => r.line_items?.length || 0 },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', render: formatDate },
  ];

  const statusTabs = [
    { key: '', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'pending_approval', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'sent', label: 'Sent' },
    { key: 'partially_received', label: 'Partial' },
    { key: 'received', label: 'Received' },
  ];

  return (
    <div>
      <PageHeader title="Purchase Orders" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/purchase-orders/new')}>New PO</Button>} />
      <Tabs
        items={statusTabs.map((t) => ({ key: t.key, label: t.label }))}
        activeKey={status || ''}
        onChange={(key) => { setStatus(key || undefined); setPage(1); }}
        style={{ marginBottom: 16 }}
      />
      <Table columns={columns} dataSource={orders} rowKey="id" loading={loading} pagination={{ current: page, pageSize, total, onChange: setPage, showTotal: (t) => `${t} orders` }} />
    </div>
  );
};

export default PurchaseOrderListPage;
