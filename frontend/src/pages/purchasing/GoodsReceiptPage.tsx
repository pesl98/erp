import React, { useEffect, useState } from 'react';
import { Form, Button, Card, message, Spin, Select, DatePicker, InputNumber, Table, Input, Space } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import PageHeader from '../../components/PageHeader';
import { getPurchaseOrder, receiveGoods } from '../../api/purchasing';
import { getWarehouses } from '../../api/warehouse';
import type { PurchaseOrder } from '../../types/purchasing';
import type { Warehouse, Location } from '../../types/warehouse';

const GoodsReceiptPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const poId = searchParams.get('po');
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [allLocations, setAllLocations] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receiptItems, setReceiptItems] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const whs = await getWarehouses();
        setWarehouses(whs);
        // Load all locations from warehouses
        const locs: { id: string; label: string }[] = [];
        for (const wh of whs) {
          // We need the detailed warehouse data with zones/locations
          const { getWarehouse: getWH } = await import('../../api/warehouse');
          const detail = await getWH(wh.id);
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
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [poId]);

  const handleSubmit = async () => {
    const incomplete = receiptItems.some((i) => !i.location_id || i.quantity_received <= 0);
    if (incomplete) { message.error('Select a location and quantity for all items'); return; }
    setSubmitting(true);
    try {
      await receiveGoods(poId!, {
        received_date: dayjs().format('YYYY-MM-DD'),
        items: receiptItems.map(({ outstanding, ...item }) => item),
      });
      message.success('Goods received successfully');
      navigate(`/purchase-orders/${poId}`);
    } catch (err: any) { message.error(err.response?.data?.detail || 'Error'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!po) return <div>Select a PO to receive against.</div>;

  const columns = [
    { title: 'Product', key: 'product', render: (_: any, r: any) => { const li = po.line_items.find((l) => l.id === r.po_line_item_id); return li?.product_id || '-'; } },
    { title: 'Ordered', key: 'ordered', render: (_: any, r: any) => po.line_items.find((l) => l.id === r.po_line_item_id)?.quantity_ordered },
    { title: 'Already Received', key: 'received', render: (_: any, r: any) => po.line_items.find((l) => l.id === r.po_line_item_id)?.quantity_received },
    { title: 'Outstanding', dataIndex: 'outstanding', key: 'outstanding' },
    {
      title: 'Receive Qty', key: 'qty',
      render: (_: any, r: any, i: number) => (
        <InputNumber value={r.quantity_received} min={1} max={r.outstanding}
          onChange={(v) => { const items = [...receiptItems]; items[i].quantity_received = v || 0; setReceiptItems(items); }} />
      ),
    },
    {
      title: 'Location', key: 'location',
      render: (_: any, r: any, i: number) => (
        <Select value={r.location_id || undefined} placeholder="Select" style={{ width: 250 }}
          showSearch optionFilterProp="label"
          options={allLocations.map((l) => ({ label: l.label, value: l.id }))}
          onChange={(v) => { const items = [...receiptItems]; items[i].location_id = v; setReceiptItems(items); }} />
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
