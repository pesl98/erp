import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, theme } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  TeamOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/products', icon: <ShoppingOutlined />, label: 'Products' },
  { key: '/vendors', icon: <TeamOutlined />, label: 'Vendors' },
  { key: '/warehouses', icon: <HomeOutlined />, label: 'Warehouses' },
  {
    key: 'purchasing',
    icon: <ShoppingCartOutlined />,
    label: 'Purchasing',
    children: [
      { key: '/purchase-orders', label: 'Purchase Orders' },
      { key: '/goods-receipts', label: 'Goods Receipts' },
    ],
  },
  {
    key: 'inventory',
    icon: <DatabaseOutlined />,
    label: 'Inventory',
    children: [
      { key: '/inventory/stock', label: 'Stock Levels' },
      { key: '/inventory/alerts', label: 'Reorder Alerts' },
      { key: '/inventory/adjustments', label: 'Adjustments' },
      { key: '/inventory/movements', label: 'Movements' },
    ],
  },
  { key: '/reports', icon: <BarChartOutlined />, label: 'Reports' },
];

const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { token } = theme.useToken();

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: () => {
          logout();
          navigate('/login');
        },
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        style={{ background: token.colorBgContainer }}
      >
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          justifyContent: 'center', borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}>
          <Text strong style={{ fontSize: collapsed ? 14 : 18, color: token.colorPrimary }}>
            {collapsed ? 'ERP' : 'Webshop ERP'}
          </Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['purchasing', 'inventory']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{
          padding: '0 24px', background: token.colorBgContainer,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}>
          <div
            style={{ cursor: 'pointer', fontSize: 18 }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} size="small" />
              <Text>{user?.full_name}</Text>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
