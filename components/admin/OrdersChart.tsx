"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';

const defaultData = [
  { name: 'Sen', orders: 12 },
  { name: 'Sel', orders: 19 },
  { name: 'Rab', orders: 15 },
  { name: 'Kam', orders: 22 },
  { name: 'Jum', orders: 28 },
  { name: 'Sab', orders: 35 },
  { name: 'Min', orders: 25 },
];

interface OrdersChartProps {
  data?: { name: string; orders: number }[];
}

export default function OrdersChart({ data = defaultData }: OrdersChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
      className="glass-card p-6 w-full h-full flex flex-col"
    >
      <div className="mb-6">
        <h3 className="heading-sm">Volume Pesanan</h3>
        <p className="text-surface-sub text-sm mt-1">Pesanan masuk 7 hari terakhir</p>
      </div>
      
      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            barSize={32}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <Tooltip
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              }}
              itemStyle={{ color: '#111827', fontWeight: 'bold' }}
              labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
              formatter={(value: any) => [`${value} Pesanan`, 'Total']}
            />
            <Bar 
              dataKey="orders" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#111827' : '#9CA3AF'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
