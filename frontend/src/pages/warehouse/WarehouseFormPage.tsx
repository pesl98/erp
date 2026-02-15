import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Row, Col, message, Spin, Collapse, List, Space, Modal, Select, InputNumber, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { createWarehouse, getWarehouse, updateWarehouse, createZone, deleteZone, createLocation, deleteLocation } from '../../api/warehouse';
import { ZONE_TYPES } from '../../utils/constants';
import type { Warehouse, Zone } from '../../types/warehouse';

const WarehouseFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [zoneModal, setZoneModal] = useState(false);
  const [locModal, setLocModal] = useState<string | null>(null);
  const [zoneForm] = Form.useForm();
  const [locForm] = Form.useForm();
  const isEdit = !!id;

  const loadWarehouse = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const w = await getWarehouse(id);
      setWarehouse(w);
      form.setFieldsValue(w);
    } catch { message.error('Not found'); navigate('/warehouses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadWarehouse(); }, [id]);

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      if (isEdit) { await updateWarehouse(id!, values); message.success('Updated'); }
      else { const w = await createWarehouse(values); message.success('Created'); navigate(`/warehouses/${w.id}/edit`); return; }
      loadWarehouse();
    } catch (err: any) { message.error(err.response?.data?.detail || 'Error'); }
    finally { setSubmitting(false); }
  };

  const handleAddZone = async (values: any) => {
    try { await createZone(id!, values); message.success('Zone added'); setZoneModal(false); zoneForm.resetFields(); loadWarehouse(); }
    catch (err: any) { message.error(err.response?.data?.detail || 'Error'); }
  };

  const handleAddLocation = async (values: any) => {
    try { await createLocation(locModal!, values); message.success('Location added'); setLocModal(null); locForm.resetFields(); loadWarehouse(); }
    catch (err: any) { message.error(err.response?.data?.detail || 'Error'); }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Warehouse' : 'New Warehouse'} backPath="/warehouses" />
      <Card title="Warehouse Details" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_active: true }}>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="code" label="Code" rules={[{ required: true }]}><Input disabled={isEdit} /></Form.Item></Col>
            <Col span={10}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="address" label="Address"><Input /></Form.Item></Col>
          </Row>
          <Form.Item><Button type="primary" htmlType="submit" loading={submitting}>{isEdit ? 'Update' : 'Create'}</Button></Form.Item>
        </Form>
      </Card>

      {isEdit && warehouse?.zones && (
        <Card title="Zones & Locations" extra={<Button icon={<PlusOutlined />} onClick={() => setZoneModal(true)}>Add Zone</Button>}>
          {warehouse.zones.length === 0 ? <p>No zones yet</p> : (
            <Collapse>
              {warehouse.zones.map((zone) => (
                <Collapse.Panel
                  key={zone.id}
                  header={`${zone.code} - ${zone.name} ${zone.zone_type ? `(${zone.zone_type})` : ''}`}
                  extra={
                    <Space>
                      <Button size="small" icon={<PlusOutlined />} onClick={(e) => { e.stopPropagation(); setLocModal(zone.id); }}>Location</Button>
                      <Button size="small" danger icon={<DeleteOutlined />} onClick={async (e) => { e.stopPropagation(); await deleteZone(zone.id); message.success('Deleted'); loadWarehouse(); }} />
                    </Space>
                  }
                >
                  <List
                    size="small"
                    dataSource={zone.locations}
                    renderItem={(loc) => (
                      <List.Item actions={[
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={async () => { await deleteLocation(loc.id); message.success('Deleted'); loadWarehouse(); }} />,
                      ]}>
                        <strong>{loc.code}</strong> {loc.label ? `- ${loc.label}` : ''} {loc.max_capacity ? `(cap: ${loc.max_capacity})` : ''}
                      </List.Item>
                    )}
                    locale={{ emptyText: 'No locations' }}
                  />
                </Collapse.Panel>
              ))}
            </Collapse>
          )}
        </Card>
      )}

      <Modal title="Add Zone" open={zoneModal} onCancel={() => setZoneModal(false)} onOk={() => zoneForm.submit()} okText="Add">
        <Form form={zoneForm} layout="vertical" onFinish={handleAddZone}>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="zone_type" label="Type"><Select allowClear options={ZONE_TYPES} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Add Location" open={!!locModal} onCancel={() => setLocModal(null)} onOk={() => locForm.submit()} okText="Add">
        <Form form={locForm} layout="vertical" onFinish={handleAddLocation}>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="label" label="Label"><Input /></Form.Item>
          <Form.Item name="max_capacity" label="Max Capacity"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WarehouseFormPage;
