import React, { useEffect, useState, useCallback } from 'react';
import { Form, Input, Button, Card, Row, Col, message, Spin, Select, DatePicker, InputNumber, Table, Space, Tag, Popconfirm, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import PageHeader from '../../components/PageHeader';
import { createPurchaseOrder, getPurchaseOrder, updatePurchaseOrder, submitPO, approvePO, sendPO, cancelPO } from '../../api/purchasing';
import { getVendors } from '../../api/vendors';
import { getProducts } from '../../api/products';
import { PO_STATUS_COLORS, PO_STATUS_LABELS } from '../../utils/constants';
import { formatCurrency, extractErrorMessage } from '../../utils/formatters';
import type { PurchaseOrder, POLineItemCreate } from '../../types/purchasing';
import type { Vendor } from '../../types/vendor';
import type { Product } from '../../types/product';

interface LineItemWithKey extends POLineItemCreate {
  key: number;
}

interface POFormValues {
  vendor_id: string;
  order_date?: ReturnType<typeof dayjs>;
  expected_delivery_date?: ReturnType<typeof dayjs>;
  tax_amount?: number;
  notes?: string;
}

const PurchaseOrderFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lineItems, setLineItems] = useState<LineItemWithKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [counter, setCounter] = useState(0);
  const isEdit = !!id;
  const isDraft = !po || po.status === 'draft';

  const loadReferenceData = useCallback(async () => {
    try {
      const [vendorRes, productRes] = await Promise.all([
        getVendors({ limit: 100 }),
        getProducts({ limit: 100 }),
      ]);
      setVendors(vendorRes.items);
      setProducts(productRes.items);
    } catch {
      // Reference data load failure is non-critical
    }
  }, []);

  useEffect(() => {
    loadReferenceData();

    if (isEdit && id) {
      setLoading(true);
      getPurchaseOrder(id).then((p) => {
        setPo(p);
        form.setFieldsValue({
          vendor_id: p.vendor_id,
          order_date: p.order_date ? dayjs(p.order_date) : null,
          expected_delivery_date: p.expected_delivery_date ? dayjs(p.expected_delivery_date) : null,
          tax_amount: p.tax_amount,
          notes: p.notes,
        });
        setLineItems(p.line_items.map((li, i) => ({
          key: i,
          product_id: li.product_id,
          quantity_ordered: li.quantity_ordered,
          unit_price: li.unit_price,
          sort_order: li.sort_order,
        })));
        setCounter(p.line_items.length);
      }).catch(() => { message.error('Purchase order not found'); navigate('/purchase-orders'); })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, form, navigate, loadReferenceData]);

  const addLine = () => {
    setLineItems([...lineItems, { key: counter, product_id: '', quantity_ordered: 1, unit_price: 0, sort_order: lineItems.length }]);
    setCounter(counter + 1);
  };

  const removeLine = (key: number) => setLineItems(lineItems.filter((l) => l.key !== key));

  const updateLine = (key: number, field: string, value: string | number) => {
    setLineItems(lineItems.map((l) => l.key === key ? { ...l, [field]: value } : l));
  };

  const subtotal = lineItems.reduce((s, l) => s + l.quantity_ordered * l.unit_price, 0);
  const taxAmount = form.getFieldValue('tax_amount') || 0;

  const onFinish = async (values: POFormValues) => {
    if (lineItems.length === 0) {
      message.error('Add at least one line item');
      return;
    }

    // Validate that all line items have a product selected
    const incompleteItems = lineItems.some(li => !li.product_id);
    if (incompleteItems) {
      message.error('Please select a product for all line items');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        vendor_id: values.vendor_id,
        order_date: values.order_date?.format('YYYY-MM-DD'),
        expected_delivery_date: values.expected_delivery_date?.format('YYYY-MM-DD'),
        tax_amount: values.tax_amount || 0,
        notes: values.notes,
        line_items: lineItems.map(({ key: _, ...rest }) => ({
          ...rest,
          quantity_ordered: Number(rest.quantity_ordered),
          unit_price: Number(rest.unit_price),
        })),
      };

      if (isEdit) {
        await updatePurchaseOrder(id!, data);
        message.success('Purchase order updated');
      } else {
        const created = await createPurchaseOrder(data);
        message.success('Purchase order created');
        navigate(`/purchase-orders/${created.id}`);
        return;
      }
      navigate(`/purchase-orders/${id}`);
    } catch (err: unknown) {
      message.error(extractErrorMessage(err, 'Error saving purchase order'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (action: () => Promise<unknown>, label: string) => {
    try { await action(); message.success(label); navigate(0); }
    catch (err: unknown) {
      message.error(extractErrorMessage(err, 'Action failed'));
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const lineColumns = [
    {
      title: 'Product', dataIndex: 'product_id', width: 250,
      render: (v: string, _: LineItemWithKey, i: number) => (
        <Select value={v || undefined} placeholder="Select product" style={{ width: '100%' }} showSearch optionFilterProp="label"
          aria-label={`Product for line ${i + 1}`}
          disabled={!isDraft}
          options={products.map((p) => ({ label: `${p.sku} - ${p.name}`, value: p.id }))}
          onChange={(val) => {
            const prod = products.find((p) => p.id === val);
            const key = lineItems[i].key;
            setLineItems((prev) =>
              prev.map((l) =>
                l.key === key
                  ? { ...l, product_id: val, unit_price: prod?.cost_price ?? l.unit_price }
                  : l
              )
            );
          }}
        />
      ),
    },
    {
      title: 'Qty', dataIndex: 'quantity_ordered', width: 100,
      render: (v: number, _: LineItemWithKey, i: number) => (
        <InputNumber value={v} min={1} disabled={!isDraft} aria-label={`Quantity for line ${i + 1}`} onChange={(val) => updateLine(lineItems[i].key, 'quantity_ordered', val || 1)} />
      ),
    },
    {
      title: 'Unit Price', dataIndex: 'unit_price', width: 120,
      render: (v: number, _: LineItemWithKey, i: number) => (
        <InputNumber value={v} min={0} precision={2} disabled={!isDraft} prefix="$" aria-label={`Unit price for line ${i + 1}`} onChange={(val) => updateLine(lineItems[i].key, 'unit_price', val || 0)} />
      ),
    },
    { title: 'Line Total', key: 'total', width: 110, render: (_: unknown, r: LineItemWithKey) => formatCurrency(r.quantity_ordered * r.unit_price) },
    ...(isDraft ? [{
      title: '', key: 'action', width: 50,
      render: (_: unknown, __: LineItemWithKey, i: number) => (
        <Button size="small" danger icon={<DeleteOutlined />} aria-label={`Remove line ${i + 1}`} onClick={() => removeLine(lineItems[i].key)} />
      ),
    }] : []),
  ];

  return (
    <div>
      <PageHeader
        title={isEdit ? `PO ${po?.po_number || ''}` : 'New Purchase Order'}
        backPath="/purchase-orders"
        extra={po && (
          <Space>
            <Tag color={PO_STATUS_COLORS[po.status]}>{PO_STATUS_LABELS[po.status]}</Tag>
            {po.status === 'draft' && <Button onClick={() => handleAction(() => submitPO(po.id), 'Submitted for approval')}>Submit</Button>}
            {po.status === 'pending_approval' && <Button type="primary" onClick={() => handleAction(() => approvePO(po.id), 'Approved')}>Approve</Button>}
            {po.status === 'approved' && <Button type="primary" onClick={() => handleAction(() => sendPO(po.id), 'Marked as sent')}>Mark Sent</Button>}
            {['sent', 'partially_received'].includes(po.status) && <Button type="primary" onClick={() => navigate(`/goods-receipts?po=${po.id}`)}>Receive Goods</Button>}
            {!['received', 'cancelled'].includes(po.status) && (
              <Popconfirm title="Cancel this PO?" onConfirm={() => handleAction(() => cancelPO(po.id), 'Cancelled')}>
                <Button danger>Cancel PO</Button>
              </Popconfirm>
            )}
          </Space>
        )}
      />

      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="vendor_id" label="Vendor" rules={[{ required: true }]}>
                <Select placeholder="Select vendor" showSearch optionFilterProp="label" disabled={!isDraft} aria-label="Vendor"
                  options={vendors.map((v) => ({ label: `${v.code} - ${v.name}`, value: v.id }))} />
              </Form.Item>
            </Col>
            <Col span={4}><Form.Item name="order_date" label="Order Date"><DatePicker style={{ width: '100%' }} disabled={!isDraft} /></Form.Item></Col>
            <Col span={4}><Form.Item name="expected_delivery_date" label="Expected Delivery"><DatePicker style={{ width: '100%' }} disabled={!isDraft} /></Form.Item></Col>
            <Col span={4}><Form.Item name="tax_amount" label="Tax"><InputNumber min={0} precision={2} prefix="$" style={{ width: '100%' }} disabled={!isDraft} aria-label="Tax amount" /></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} disabled={!isDraft} /></Form.Item>

          <Divider>Line Items</Divider>
          <Table columns={lineColumns} dataSource={lineItems} rowKey="key" pagination={false} size="small" />
          {isDraft && <Button type="dashed" onClick={addLine} icon={<PlusOutlined />} style={{ width: '100%', marginTop: 8 }}>Add Item</Button>}

          <Row style={{ marginTop: 16, textAlign: 'right' }}>
            <Col span={24}>
              <Space direction="vertical" align="end">
                <span>Subtotal: {formatCurrency(subtotal)}</span>
                <span>Tax: {formatCurrency(taxAmount)}</span>
                <strong>Total: {formatCurrency(subtotal + taxAmount)}</strong>
              </Space>
            </Col>
          </Row>

          {isDraft && (
            <Form.Item style={{ marginTop: 16 }}>
              <Button type="primary" htmlType="submit" loading={submitting}>{isEdit ? 'Update PO' : 'Create PO'}</Button>
            </Form.Item>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default PurchaseOrderFormPage;
