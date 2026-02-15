import React from 'react';
import { Typography, Button, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

interface PageHeaderProps {
  title: string;
  backPath?: string;
  extra?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, backPath, extra }) => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
      <Space>
        {backPath && (
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(backPath)} />
        )}
        <Title level={4} style={{ margin: 0 }}>{title}</Title>
      </Space>
      {extra && <Space>{extra}</Space>}
    </div>
  );
};

export default PageHeader;
