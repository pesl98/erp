import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Card, Row, Col, message, Spin, Rate } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { createVendor, getVendor, updateVendor } from '../../api/vendors';
import type { VendorCreate } from '../../types/vendor';

const VendorFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      getVendor(id!).then((v) => form.setFieldsValue(v)).catch(() => { message.error('Vendor not found'); navigate('/vendors'); }).finally(() => setLoading(false));
    }
  }, [id]);

  const onFinish = async (values: VendorCreate) => {
    setSubmitting(true);
    try {
      if (isEdit) { await updateVendor(id!, values); message.success('Vendor updated'); }
      else { await createVendor(values); message.success('Vendor created'); }
      navigate('/vendors');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      message.error(axiosErr.response?.data?.detail || 'Error saving vendor');
    }
    finally { setSubmitting(false); }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Vendor' : 'New Vendor'} backPath="/vendors" />
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ payment_terms_days: 30, lead_time_days: 7, status: 'active' }}>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="code" label="Vendor Code" rules={[{ required: true }]}><Input disabled={isEdit} /></Form.Item></Col>
            <Col span={10}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="contact_name" label="Contact Name"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="email" label="Email"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="phone" label="Phone"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="status" label="Status"><Select options={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="address_line1" label="Address Line 1"><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="address_line2" label="Address Line 2"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="city" label="City"><Input /></Form.Item></Col>
            <Col span={6}><Form.Item name="state" label="State"><Input /></Form.Item></Col>
            <Col span={6}><Form.Item name="postal_code" label="Postal Code"><Input /></Form.Item></Col>
            <Col span={6}><Form.Item name="country" label="Country"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}><Form.Item name="payment_terms_days" label="Payment Terms (days)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="lead_time_days" label="Lead Time (days)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={6}><Form.Item name="rating" label="Rating"><Rate allowHalf /></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" loading={submitting}>{isEdit ? 'Update' : 'Create'} Vendor</Button></Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default VendorFormPage;
