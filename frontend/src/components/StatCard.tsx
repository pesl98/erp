import React from 'react';
import { Card, Statistic } from 'antd';

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  precision?: number;
  onClick?: () => void;
  valueStyle?: React.CSSProperties;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, prefix, suffix, precision, onClick, valueStyle }) => {
  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        precision={precision}
        valueStyle={valueStyle}
      />
    </Card>
  );
};

export default StatCard;
