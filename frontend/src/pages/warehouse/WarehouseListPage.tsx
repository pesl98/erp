import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Tag, Button, message, Empty, Spin } from 'antd';
import { PlusOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { getWarehouses } from '../../api/warehouse';
import type { Warehouse } from '../../types/warehouse';

const WarehouseListPage: React.FC = () => {
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWarehouses()
      .then(setWarehouses)
      .catch(() => message.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <PageHeader title="Warehouses" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/warehouses/new')}>Add Warehouse</Button>} />
      {warehouses.length === 0 ? <Empty description="No warehouses yet" /> : (
        <Row gutter={[16, 16]}>
          {warehouses.map((w) => (
            <Col key={w.id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                onClick={() => navigate(`/warehouses/${w.id}/edit`)}
                title={<><HomeOutlined style={{ marginRight: 8 }} />{w.name}</>}
                extra={<Tag color={w.is_active ? 'green' : 'default'}>{w.is_active ? 'Active' : 'Inactive'}</Tag>}
              >
                <p><strong>Code:</strong> {w.code}</p>
                <p><strong>Address:</strong> {w.address || '-'}</p>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default WarehouseListPage;
