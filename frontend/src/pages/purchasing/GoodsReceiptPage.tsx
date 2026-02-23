import React, { useEffect, useState, useCallback } from 'react';
import { Button, Card, message, Spin, Select, InputNumber, Table } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import PageHeader from '../../components/PageHeader';
import { getPurchaseOrder, receiveGoods } from '../../api/purchasing';
import { getWarehouses, getWarehouse } from '../../api/warehouse';
import { extractErrorMessage } from '../../utils/formatters';
import type { PurchaseOrder, POLineItem } from '../../types/purchasing';

interface ReceiptItem {
  po_line_item_id: string;
  product_id: string;
  outstanding: number;
  quantity_received: number;
  location_id: string;
}

interface LocationOption {
  id: string;
  label: string;
}

const GoodsReceiptPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const poId = searchParams.get('po');
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [allLocations, setAllLocations] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      const whs = await getWarehouses();
      const locs: LocationOption[] = [];
      for (const wh of whs) {
        const detail = await getWarehouse(wh.id);
        detail.zones?.forEach((z) => {
          z.locations.forEach((l) => {
            locs.push({ id: l.id, label: `${wh.code} > ${z.code} > ${l.code}` });
          });
        });
      }
      setAllLocations(locs);

      if (poId) {
        const order = await getPurchaseOrder(poId);
        setPo(order);
        setReceiptItems(
          order.line_items
            .filter((li) => li.quantity_received < li.quantity_ordered)
            .map((li) => ({
              po_line_item_id: li.id,
              product_id: li.product_id,
              outstanding: li.quantity_ordered - li.quantity_received,
              quantity_received: li.quantity_ordered - li.quantity_received,
              location_id: '',
            }))
        );
      }
    } catch (e) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [poId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async () => {
    const incomplete = receiptItems.some((i) => !i.location_id || i.quantity_received <= 0);
    if (incomplete) { message.error('Select a location and quantity for all items'); return; }
    setSubmitting(true);
    try {
      await receiveGoods(poId!, {
        received_date: dayjs().format('YYYY-MM-DD'),
        items: receiptItems.map(({ outstanding: _, ...item }) => item),
      });
      message.success('Goods received successfully');
      navigate(`/purchase-orders/${poId}`);
    } catch (err: unknown) {
      message.error(extractErrorMessage(err, 'Failed to receive goods'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!po) return <div>Select a PO to receive against.</div>;

  const findLineItem = (poLineItemId: string): POLineItem | undefined =>
    po.line_items.find((l) => l.id === poLineItemId);

  const columns = [
    {
      title: 'Product', key: 'product',
      render: (_: unknown, r: ReceiptItem) => findLineItem(r.po_line_item_id)?.product_id || '-',
    },
    {
      title: 'Ordered', key: 'ordered',
      render: (_: unknown, r: ReceiptItem) => findLineItem(r.po_line_item_id)?.quantity_ordered,
    },
    {
      title: 'Already Received', key: 'received',
      render: (_: unknown, r: ReceiptItem) => findLineItem(r.po_line_item_id)?.quantity_received,
    },
    { title: 'Outstanding', dataIndex: 'outstanding', key: 'outstanding' },
    {
      title: 'Receive Qty', key: 'qty',
      render: (_: unknown, r: ReceiptItem, i: number) => (
        <InputNumber
          aria-label={`Receive quantity for item ${i + 1}`}
          value={r.quantity_received} min={1} max={r.outstanding}
          onChange={(v) => { const items = [...receiptItems]; items[i].quantity_received = v || 0; setReceiptItems(items); }}
        />
      ),
    },
    {
      title: 'Location', key: 'location',
      render: (_: unknown, r: ReceiptItem, i: number) => (
        <Select
          aria-label={`Location for item ${i + 1}`}
          value={r.location_id || undefined} placeholder="Select location" style={{ width: 250 }}
          showSearch optionFilterProp="label"
          options={allLocations.map((l) => ({ label: l.label, value: l.id }))}
          onChange={(v) => { const items = [...receiptItems]; items[i].location_id = v; setReceiptItems(items); }}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title={`Receive Goods - ${po.po_number}`} backPath={`/purchase-orders/${po.id}`} />
      <Card>
        <Table columns={columns} dataSource={receiptItems} rowKey="po_line_item_id" pagination={false} size="small" />
        <Button type="primary" onClick={handleSubmit} loading={submitting} style={{ marginTop: 16 }}>
          Confirm Receipt
        </Button>
      </Card>
    </div>
  );
};

export default GoodsReceiptPage;
