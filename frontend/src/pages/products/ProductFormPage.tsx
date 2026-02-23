import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Card, Row, Col, message, Spin } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { createProduct, getProduct, updateProduct, getCategories } from '../../api/products';
import type { ProductCategory, ProductCreate } from '../../types/product';
import { UOM_OPTIONS } from '../../utils/constants';
import { extractErrorMessage } from '../../utils/formatters';

const ProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    if (isEdit) {
      setLoading(true);
      getProduct(id!).then((p) => {
        form.setFieldsValue(p);
      }).catch(() => {
        message.error('Product not found');
        navigate('/products');
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const onFinish = async (values: ProductCreate) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateProduct(id!, values);
        message.success('Product updated');
      } else {
        await createProduct(values);
        message.success('Product created');
      }
      navigate('/products');
    } catch (err: unknown) {
      message.error(extractErrorMessage(err, 'Error saving product'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Product' : 'New Product'} backPath="/products" />
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ unit_of_measure: 'each', status: 'active', reorder_point: 0, reorder_quantity: 0 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="sku" label="SKU" rules={[{ required: true }]}>
                <Input disabled={isEdit} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="category_id" label="Category">
                <Select allowClear placeholder="Select category" options={categories.map((c) => ({ label: c.name, value: c.id }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="unit_of_measure" label="Unit of Measure">
                <Select options={UOM_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="barcode" label="Barcode">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="cost_price" label="Cost Price">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="$" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="Status">
                <Select options={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="weight_kg" label="Weight (kg)">
                <InputNumber min={0} precision={3} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="length_cm" label="Length (cm)">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="width_cm" label="Width (cm)">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="height_cm" label="Height (cm)">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="reorder_point" label="Reorder Point">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="reorder_quantity" label="Reorder Quantity">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {isEdit ? 'Update Product' : 'Create Product'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProductFormPage;
