import React, { useEffect, useState } from 'react';
import { Form, Select, InputNumber, Input, Button, Card, Row, Col, message, Table, Tag } from 'antd';
import PageHeader from '../../components/PageHeader';
import { createAdjustment, getAdjustments } from '../../api/inventory';
import { getProducts } from '../../api/products';
import { getWarehouses, getWarehouse } from '../../api/warehouse';
import { ADJUSTMENT_TYPES } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';
import type { Product } from '../../types/product';

const StockAdjustmentPage: React.FC = () => {
  const [form] = Form.useForm();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<{ id: string; label: string }[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [prods, whs, adjRes] = await Promise.all([
        getProducts({ limit: 100 }),
        getWarehouses(),
        getAdjustments({ limit: 20 }),
      ]);
      setProducts(prods.items);
      setAdjustments(adjRes.items);

      const locs: { id: string; label: string }[] = [];
      for (const wh of whs) {
        const detail = await getWarehouse(wh.id);
        detail.zones?.forEach((z) => z.locations.forEach((l) => {
          locs.push({ id: l.id, label: `${wh.code} > ${z.code} > ${l.code}` });
        }));
      }
      setLocations(locs);
    } catch { message.error('Failed to load data'); }
  };

  useEffect(() => { loadData(); }, []);

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      await createAdjustment(values);
      message.success('Adjustment created');
      form.resetFields();
      loadData();
    } catch (err: any) { message.error(err.response?.data?.detail || 'Error'); }
    finally { setSubmitting(false); }
  };

  const columns = [
    { title: 'Product', dataIndex: 'product_id', key: 'product', render: (id: string) => { const p = products.find((pr) => pr.id === id); return p ? `${p.sku} - ${p.name}` : id; } },
    { title: 'Type', dataIndex: 'adjustment_type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Qty Change', dataIndex: 'quantity_change', key: 'qty', render: (v: number) => <span style={{ color: v > 0 ? '#3f8600' : '#cf1322' }}>{v > 0 ? '+' : ''}{v}</span> },
    { title: 'Reason', dataIndex: 'reason', key: 'reason' },
    { title: 'Date', dataIndex: 'created_at', key: 'date', render: formatDateTime },
  ];

  return (
    <div>
      <PageHeader title="Stock Adjustments" />
      <Card title="New Adjustment" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="product_id" label="Product" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="label" placeholder="Select" options={products.map((p) => ({ label: `${p.sku} - ${p.name}`, value: p.id }))} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="location_id" label="Location" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="label" placeholder="Select" options={locations.map((l) => ({ label: l.label, value: l.id }))} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="adjustment_type" label="Type" rules={[{ required: true }]}>
                <Select options={ADJUSTMENT_TYPES} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="quantity_change" label="Qty Change" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>Submit Adjustment</Button>
        </Form>
      </Card>
      <Card title="Recent Adjustments">
        <Table columns={columns} dataSource={adjustments} rowKey="id" pagination={false} size="small" />
      </Card>
    </div>
  );
};

export default StockAdjustmentPage;
