import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Typography, Spin } from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/StatCard';
import { getDashboardKpis, getRecentActivity } from '../../api/reporting';
import { getReorderAlerts } from '../../api/inventory';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [k, a, al] = await Promise.all([
          getDashboardKpis(),
          getRecentActivity(10),
          getReorderAlerts(),
        ]);
        setKpis(k);
        setActivity(a);
        setAlerts(al);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const activityColumns = [
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Product', dataIndex: 'product_name', key: 'product_name' },
    { title: 'SKU', dataIndex: 'product_sku', key: 'product_sku' },
    { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Time', dataIndex: 'created_at', key: 'created_at', render: formatDateTime },
  ];

  const alertColumns = [
    { title: 'SKU', dataIndex: 'product_sku', key: 'product_sku' },
    { title: 'Product', dataIndex: 'product_name', key: 'product_name' },
    {
      title: 'On Hand',
      dataIndex: 'total_on_hand',
      key: 'total_on_hand',
      render: (v: number, r: any) => (
        <span style={{ color: v < r.reorder_point ? '#ff4d4f' : undefined }}>{v}</span>
      ),
    },
    { title: 'Reorder Point', dataIndex: 'reorder_point', key: 'reorder_point' },
    { title: 'Deficit', dataIndex: 'deficit', key: 'deficit', render: (v: number) => <Tag color="red">-{v}</Tag> },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Dashboard</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Stock Value"
            value={formatCurrency(kpis?.total_stock_value ?? 0)}
            prefix={<DollarOutlined />}
            valueStyle={{ color: '#3f8600' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Pending POs"
            value={kpis?.pending_po_count ?? 0}
            prefix={<ShoppingCartOutlined />}
            onClick={() => navigate('/purchase-orders')}
            valueStyle={{ color: '#1677ff' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Low Stock Alerts"
            value={kpis?.low_stock_count ?? 0}
            prefix={<WarningOutlined />}
            onClick={() => navigate('/inventory/alerts')}
            valueStyle={{ color: kpis?.low_stock_count > 0 ? '#ff4d4f' : undefined }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Movements Today"
            value={kpis?.movements_today ?? 0}
            prefix={<SwapOutlined />}
            onClick={() => navigate('/inventory/movements')}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" size="small">
            <Table
              columns={activityColumns}
              dataSource={activity}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Reorder Alerts" size="small" extra={
            <a onClick={() => navigate('/inventory/alerts')}>View all</a>
          }>
            <Table
              columns={alertColumns}
              dataSource={alerts.slice(0, 8)}
              rowKey="product_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
