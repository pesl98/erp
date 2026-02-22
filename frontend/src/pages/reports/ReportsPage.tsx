import React, { useEffect, useState } from 'react';
import { Tabs, Table, Card, message, Rate, Tag } from 'antd';
import PageHeader from '../../components/PageHeader';
import { getStockSummary, getPurchaseHistory, getVendorPerformance } from '../../api/reporting';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PO_STATUS_COLORS, PO_STATUS_LABELS } from '../../utils/constants';

interface StockSummaryItem {
  product_id: string;
  sku: string;
  name: string;
  total_on_hand: number;
  total_reserved: number;
  total_available: number;
  cost_price: number | null;
  stock_value: number | null;
}

interface PurchaseHistoryItem {
  po_id: string;
  po_number: string;
  status: string;
  total_amount: number;
  order_date: string | null;
  created_at: string;
  vendor_code: string;
  vendor_name: string;
}

interface VendorPerformanceItem {
  vendor_id: string;
  vendor_code: string;
  vendor_name: string;
  rating: number | null;
  order_count: number;
  total_spend: number;
  avg_lead_time: number | null;
}

const ReportsPage: React.FC = () => {
  const [stockData, setStockData] = useState<StockSummaryItem[]>([]);
  const [purchaseData, setPurchaseData] = useState<PurchaseHistoryItem[]>([]);
  const [vendorData, setVendorData] = useState<VendorPerformanceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('stock');

  useEffect(() => {
    setLoading(true);
    const loadTab = async () => {
      try {
        if (activeTab === 'stock') setStockData(await getStockSummary());
        if (activeTab === 'purchases') setPurchaseData(await getPurchaseHistory(90));
        if (activeTab === 'vendors') setVendorData(await getVendorPerformance());
      } catch { message.error('Failed to load report'); }
      finally { setLoading(false); }
    };
    loadTab();
  }, [activeTab]);

  const stockColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: 'Product', dataIndex: 'name', key: 'name' },
    { title: 'On Hand', dataIndex: 'total_on_hand', key: 'on_hand' },
    { title: 'Reserved', dataIndex: 'total_reserved', key: 'reserved' },
    { title: 'Available', dataIndex: 'total_available', key: 'available' },
    { title: 'Cost Price', dataIndex: 'cost_price', key: 'cost', render: (v: number | null) => v != null ? formatCurrency(v) : '-' },
    { title: 'Stock Value', dataIndex: 'stock_value', key: 'value', render: (v: number | null) => v != null ? formatCurrency(v) : '-' },
  ];

  const purchaseColumns = [
    { title: 'PO Number', dataIndex: 'po_number', key: 'po' },
    { title: 'Vendor', dataIndex: 'vendor_name', key: 'vendor' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={PO_STATUS_COLORS[s]}>{PO_STATUS_LABELS[s] || s}</Tag> },
    { title: 'Total', dataIndex: 'total_amount', key: 'total', render: formatCurrency },
    { title: 'Order Date', dataIndex: 'order_date', key: 'date', render: formatDate },
  ];

  const vendorColumns = [
    { title: 'Code', dataIndex: 'vendor_code', key: 'code' },
    { title: 'Name', dataIndex: 'vendor_name', key: 'name' },
    { title: 'Rating', dataIndex: 'rating', key: 'rating', render: (r: number | null) => r != null ? <Rate disabled value={r} allowHalf style={{ fontSize: 14 }} /> : '-' },
    { title: 'Orders', dataIndex: 'order_count', key: 'orders' },
    { title: 'Total Spend', dataIndex: 'total_spend', key: 'spend', render: formatCurrency },
    { title: 'Avg Lead Time', dataIndex: 'avg_lead_time', key: 'lead', render: (v: number | null) => v != null ? `${Math.round(v)} days` : '-' },
  ];

  const tabs = [
    { key: 'stock', label: 'Stock Summary', children: <Table columns={stockColumns} dataSource={stockData} rowKey="product_id" loading={loading} pagination={{ pageSize: 50 }} /> },
    { key: 'purchases', label: 'Purchase History', children: <Table columns={purchaseColumns} dataSource={purchaseData} rowKey="po_id" loading={loading} pagination={{ pageSize: 50 }} /> },
    { key: 'vendors', label: 'Vendor Performance', children: <Table columns={vendorColumns} dataSource={vendorData} rowKey="vendor_id" loading={loading} pagination={{ pageSize: 50 }} /> },
  ];

  return (
    <div>
      <PageHeader title="Reports" />
      <Card>
        <Tabs items={tabs} activeKey={activeTab} onChange={setActiveTab} />
      </Card>
    </div>
  );
};

export default ReportsPage;
