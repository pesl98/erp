import React, { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Input, Select, Button, Space, message, Popconfirm, Rate } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { getVendors, deleteVendor } from '../../api/vendors';
import type { Vendor } from '../../types/vendor';

const VendorListPage: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVendors({ skip: (page - 1) * pageSize, limit: pageSize, search: search || undefined, status });
      setVendors(res.items);
      setTotal(res.total);
    } catch {
      message.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = () => {
    setPage(1);
    load();
  };

  const columns = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 100 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Contact', dataIndex: 'contact_name', key: 'contact_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Lead Time', dataIndex: 'lead_time_days', key: 'lead_time_days', width: 100, render: (d: number) => `${d} days` },
    { title: 'Rating', dataIndex: 'rating', key: 'rating', width: 140, render: (r: number | null) => r != null ? <Rate disabled value={r} allowHalf style={{ fontSize: 14 }} /> : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 90, render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{s}</Tag> },
    {
      title: 'Actions', key: 'actions', width: 150,
      render: (_: unknown, record: Vendor) => (
        <Space size="small">
          <a onClick={() => navigate(`/vendors/${record.id}/edit`)}>Edit</a>
          <Popconfirm title="Deactivate this vendor?" onConfirm={async () => { await deleteVendor(record.id); message.success('Vendor deactivated'); load(); }}>
            <a style={{ color: '#ff4d4f' }}>Deactivate</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Vendors" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/vendors/new')}>Add Vendor</Button>} />
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Search vendors"
          aria-label="Search vendors"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={handleSearch}
          style={{ width: 250 }}
          allowClear
        />
        <Select
          placeholder="Status"
          aria-label="Filter by status"
          allowClear
          style={{ width: 130 }}
          value={status}
          onChange={setStatus}
          options={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]}
        />
      </Space>
      <Table columns={columns} dataSource={vendors} rowKey="id" loading={loading} pagination={{ current: page, pageSize, total, onChange: setPage, showTotal: (t) => `${t} vendors` }} />
    </div>
  );
};

export default VendorListPage;
